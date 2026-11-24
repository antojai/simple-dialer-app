import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type AppIconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="call">Keypad</TabButton>
          </TabTrigger>
          <TabTrigger name="recents" href="/recents" asChild>
            <TabButton icon="clock">Recents</TabButton>
          </TabTrigger>
          <TabTrigger name="contacts" href="/contacts" asChild>
            <TabButton icon="person">Contacts</TabButton>
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar({ children, ...props }: React.ComponentProps<typeof View>) {
  const theme = useTheme();
  return (
    <View
      {...props}
      style={[styles.bar, { backgroundColor: theme.background, borderTopColor: theme.separator }]}>
      {children}
    </View>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  onPress,
  onLongPress,
}: TabTriggerSlotProps & { icon: AppIconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      role="tab"
      aria-selected={isFocused}
      style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={22} color={color} />
      <ThemedText type="smallBold" style={{ color }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  slot: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
});
