import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

type IconName = Extract<SymbolViewProps['name'], { ios?: unknown }>;

/** Cross-platform icon names: SF Symbols on iOS, Material Symbols on Android and web. */
const ICONS = {
  call: { ios: 'phone.fill', android: 'call', web: 'call' },
  backspace: { ios: 'delete.left', android: 'backspace', web: 'backspace' },
  outgoing: { ios: 'arrow.up.right', android: 'call_made', web: 'call_made' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  person: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  close: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
} satisfies Record<string, IconName>;

export type AppIconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 20,
  color,
}: {
  name: AppIconName;
  size?: number;
  color: ColorValue;
}) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
