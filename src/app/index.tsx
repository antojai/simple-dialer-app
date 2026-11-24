import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { Keypad, useKeySize } from '@/components/keypad';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { placeCall } from '@/lib/call';
import { formatPhone } from '@/lib/phone';
import { findContactByNumber, loadContacts, matchDialInput, useContacts } from '@/state/contacts';
import { useRecents } from '@/state/recents';

const MAX_LENGTH = 40;

export default function KeypadScreen() {
  const theme = useTheme();
  const keySize = useKeySize();
  const [number, setNumber] = useState('');
  const { contacts } = useContacts();
  const recents = useRecents();

  // Load contacts silently if access was already granted (no prompt here).
  useEffect(() => {
    loadContacts({ request: false });
  }, []);

  const matches = matchDialInput(contacts, number);
  const exactContact = findContactByNumber(contacts, number);

  const type = (key: string) => setNumber((n) => (n.length >= MAX_LENGTH ? n : n + key));

  const onCall = async () => {
    // Like most phone apps, pressing call with nothing typed recalls the last number.
    if (!number) {
      if (recents[0]) setNumber(recents[0].number);
      return;
    }
    if (await placeCall(number, exactContact?.name)) setNumber('');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Typed number and the contact it belongs to */}
        <View style={styles.display}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={[styles.number, { color: theme.text }]}
            accessibilityLiveRegion="polite">
            {formatPhone(number)}
          </Text>
          <ThemedText type="small" themeColor="accent" numberOfLines={1} style={styles.caption}>
            {exactContact?.name ?? ' '}
          </ThemedText>
        </View>

        {/* Contact suggestions (T9 name match or number match) */}
        <View style={styles.suggestions}>
          {number && !exactContact ? (
            <FlatList
              data={matches}
              keyExtractor={(m) => `${m.contact.id}:${m.phone.id}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setNumber(item.phone.number.replace(/[^\d+*#]/g, ''))}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && { backgroundColor: theme.backgroundElement },
                  ]}>
                  <Avatar name={item.contact.name} seed={item.contact.id} uri={item.contact.thumbnail} size={36} />
                  <View style={styles.suggestionText}>
                    <ThemedText numberOfLines={1}>{item.contact.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {item.phone.label ? `${item.phone.label} · ` : ''}
                      {item.phone.number}
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            />
          ) : null}
        </View>

        <Keypad
          onKey={type}
          onLongKey={(key) => (key === '0' ? type('+') : type(key))}
        />

        {/* Call button with backspace on its right */}
        <View style={[styles.actions, { marginTop: keySize * 0.22 }]}>
          <View style={{ width: keySize }} />
          <Pressable
            onPress={onCall}
            accessibilityRole="button"
            accessibilityLabel="Call"
            style={({ pressed }) => [
              styles.callButton,
              {
                width: keySize,
                height: keySize,
                borderRadius: keySize / 2,
                backgroundColor: theme.call,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Icon name="call" size={keySize * 0.4} color="#ffffff" />
          </Pressable>
          <View style={{ width: keySize, alignItems: 'center' }}>
            {number ? (
              <Pressable
                onPress={() => setNumber((n) => n.slice(0, -1))}
                onLongPress={() => setNumber('')}
                hitSlop={16}
                accessibilityRole="button"
                accessibilityLabel="Delete"
                accessibilityHint="Long press to clear"
                style={({ pressed }) => [styles.backspace, pressed && { opacity: 0.5 }]}>
                <Icon name="backspace" size={26} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </SafeAreaView>
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
    paddingBottom: BottomTabInset + Spacing.three,
  },
  display: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    alignItems: 'center',
    minHeight: 112,
  },
  number: {
    fontSize: 38,
    fontWeight: '400',
    letterSpacing: 1,
    minHeight: 48,
  },
  caption: {
    marginTop: Spacing.one,
  },
  suggestions: {
    flex: 1,
    marginBottom: Spacing.three,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  suggestionText: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  callButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backspace: {
    padding: Spacing.two,
  },
});
