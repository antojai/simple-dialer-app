import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { placeCall } from '@/lib/call';
import { digitsOf } from '@/lib/phone';
import { loadContacts, useContacts, type DialerContact } from '@/state/contacts';

function filterContacts(contacts: DialerContact[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return contacts;
  const qDigits = digitsOf(q);
  return contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      (qDigits.length >= 2 && c.phones.some((p) => digitsOf(p.number).includes(qDigits)))
  );
}

function buildSections(contacts: DialerContact[], showFavourites: boolean) {
  const sections: { title: string; data: DialerContact[] }[] = [];
  const favourites = contacts.filter((c) => c.favourite);
  if (showFavourites && favourites.length) sections.push({ title: 'Favourites', data: favourites });

  for (const contact of contacts) {
    const first = contact.name[0]?.toUpperCase() ?? '#';
    const title = /\p{L}/u.test(first) ? first : '#';
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.data.push(contact);
    else sections.push({ title, data: [contact] });
  }
  return sections;
}

export default function ContactsScreen() {
  const theme = useTheme();
  const { status, contacts, canAskAgain } = useContacts();
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadContacts({ request: false });
  }, []);

  const filtered = filterContacts(contacts, query);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ScreenHeader
          title="Contacts"
          subtitle={status === 'ready' ? `${contacts.length} with phone numbers` : undefined}
        />

        {status === 'ready' ? (
          <>
            <View style={[styles.search, { backgroundColor: theme.backgroundElement }]}>
              <Icon name="search" size={16} color={theme.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search name or number"
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
                autoCorrect={false}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
            </View>

            <SectionList
              sections={buildSections(filtered, !query)}
              keyExtractor={(c, index) => `${c.id}:${index}`}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              stickySectionHeadersEnabled
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <ThemedText themeColor="textSecondary" style={styles.noResults}>
                  {query ? `No contacts match “${query}”.` : 'No contacts with phone numbers.'}
                </ThemedText>
              }
              renderSectionHeader={({ section }) => (
                <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                  {section.title === 'Favourites' ? <Icon name="star" size={13} color={theme.accent} /> : null}
                  <ThemedText type="smallBold" themeColor={section.title === 'Favourites' ? 'accent' : 'textSecondary'}>
                    {section.title}
                  </ThemedText>
                </View>
              )}
              renderItem={({ item, section }) => {
                const key = `${section.title}:${item.id}`;
                const expanded = expandedId === key;
                return (
                  <View style={expanded && { backgroundColor: theme.backgroundElement }}>
                    <Pressable
                      onPress={() => setExpandedId(expanded ? null : key)}
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      style={({ pressed }) => [
                        styles.row,
                        pressed && !expanded && { backgroundColor: theme.backgroundElement },
                      ]}>
                      <Avatar name={item.name} seed={item.id} uri={item.thumbnail} />
                      <ThemedText numberOfLines={1} style={styles.name}>
                        {item.name}
                      </ThemedText>
                    </Pressable>

                    {expanded
                      ? item.phones.map((phone) => (
                          <Pressable
                            key={phone.id}
                            onPress={() => placeCall(phone.number, item.name)}
                            accessibilityRole="button"
                            accessibilityLabel={`Call ${item.name}, ${phone.label ?? ''} ${phone.number}`}
                            style={({ pressed }) => [styles.phoneRow, pressed && { opacity: 0.6 }]}>
                            <View style={styles.phoneText}>
                              <ThemedText>{phone.number}</ThemedText>
                              {phone.label ? (
                                <ThemedText type="small" themeColor="textSecondary">
                                  {phone.label}
                                </ThemedText>
                              ) : null}
                            </View>
                            <View style={[styles.phoneCall, { backgroundColor: theme.call }]}>
                              <Icon name="call" size={18} color="#ffffff" />
                            </View>
                          </Pressable>
                        ))
                      : null}
                  </View>
                );
              }}
            />
          </>
        ) : (
          <PermissionState status={status} canAskAgain={canAskAgain} />
        )}
      </View>
    </SafeAreaView>
  );
}

function PermissionState({
  status,
  canAskAgain,
}: {
  status: ReturnType<typeof useContacts>['status'];
  canAskAgain: boolean;
}) {
  const theme = useTheme();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const copy = {
    idle: {
      text: 'Allow access to your contacts to search and call them from here and from the keypad.',
      action: 'Allow access',
    },
    denied: {
      text: 'Contacts access is turned off. You can turn it on in Settings.',
      action: canAskAgain ? 'Allow access' : 'Open Settings',
    },
    error: { text: "Couldn't load your contacts.", action: 'Try again' },
    unavailable: { text: 'Contacts are only available in the iOS and Android apps.', action: null },
  }[status as 'idle' | 'denied' | 'error' | 'unavailable'];

  const onAction = () => {
    if (status === 'denied' && !canAskAgain) Linking.openSettings();
    else loadContacts({ request: true });
  };

  return (
    <View style={styles.center}>
      <Icon name="person" size={52} color={theme.textSecondary} />
      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        {copy.text}
      </ThemedText>
      {copy.action ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 }]}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            {copy.action}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  list: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingVertical: Spacing.two,
  },
  name: {
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 44 + Spacing.three * 2 + Spacing.one,
    paddingRight: Spacing.three + Spacing.one,
    paddingVertical: Spacing.two,
  },
  phoneText: {
    flex: 1,
  },
  phoneCall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: {
    textAlign: 'center',
    paddingTop: Spacing.five,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + Spacing.half,
    borderRadius: 999,
  },
  buttonText: {
    color: '#ffffff',
  },
});
