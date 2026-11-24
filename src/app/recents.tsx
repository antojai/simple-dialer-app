import { Alert, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { placeCall } from '@/lib/call';
import { formatPhone } from '@/lib/phone';
import { clearRecents, removeRecent, useRecents, type CallEntry } from '@/state/recents';

function dayLabel(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(entries: CallEntry[]) {
  const sections: { title: string; data: CallEntry[] }[] = [];
  for (const entry of entries) {
    const title = dayLabel(entry.timestamp);
    const last = sections[sections.length - 1];
    if (last?.title === title) last.data.push(entry);
    else sections.push({ title, data: [entry] });
  }
  return sections;
}

export default function RecentsScreen() {
  const theme = useTheme();
  const recents = useRecents();

  const confirmClear = () =>
    Alert.alert('Clear call history?', 'This removes every call from Recents.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearRecents },
    ]);

  const confirmRemove = (entry: CallEntry) =>
    Alert.alert(entry.name ?? formatPhone(entry.number), 'Remove this call from Recents?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeRecent(entry.id) },
    ]);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ScreenHeader
          title="Recents"
          subtitle={recents.length ? `${recents.length} call${recents.length === 1 ? '' : 's'}` : undefined}
          right={
            recents.length ? (
              <Pressable onPress={confirmClear} hitSlop={12} accessibilityRole="button">
                <ThemedText type="smallBold" themeColor="danger">
                  Clear
                </ThemedText>
              </Pressable>
            ) : null
          }
        />

        <SectionList
          sections={groupByDay(recents)}
          keyExtractor={(e) => e.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={[styles.list, recents.length === 0 && styles.emptyList]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="clock" size={44} color={theme.textSecondary} />
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No recent calls.{'\n'}Calls you make from the keypad or contacts show up here.
              </ThemedText>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
              {section.title}
            </ThemedText>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => placeCall(item.number, item.name)}
              onLongPress={() => confirmRemove(item)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${item.name ?? item.number}`}
              accessibilityHint="Long press to remove"
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.backgroundElement }]}>
              <Avatar name={item.name} seed={item.number} />
              <View style={styles.rowText}>
                <ThemedText numberOfLines={1}>{item.name ?? formatPhone(item.number)}</ThemedText>
                <View style={styles.meta}>
                  <Icon name="outgoing" size={13} color={theme.call} />
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {item.name ? `${formatPhone(item.number)} · ` : ''}
                    {new Date(item.timestamp).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </ThemedText>
                </View>
              </View>
              <Icon name="call" size={20} color={theme.call} />
            </Pressable>
          )}
        />
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
  },
  list: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  emptyList: {
    flexGrow: 1,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three + Spacing.one,
    paddingVertical: Spacing.two + Spacing.half,
  },
  rowText: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
  },
  emptyText: {
    textAlign: 'center',
  },
});
