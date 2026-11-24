import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { KEY_LETTERS } from '@/lib/phone';

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

/** Secondary label under a key. "0" doubles as "+" on long press. */
const SUBLABEL: Record<string, string> = { ...KEY_LETTERS, '0': '+' };

/** Key diameter that fits both narrow and short screens. */
export function useKeySize() {
  const { width, height } = useWindowDimensions();
  return Math.round(Math.max(52, Math.min(78, (Math.min(width, 480) - 96) / 3, height * 0.088)));
}

export function Keypad({
  onKey,
  onLongKey,
}: {
  onKey: (key: string) => void;
  /** Long press: "0" types "+". */
  onLongKey: (key: string) => void;
}) {
  const theme = useTheme();
  const size = useKeySize();

  return (
    <View style={[styles.grid, { gap: size * 0.18 }]}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => onKey(key)}
              onLongPress={() => onLongKey(key)}
              delayLongPress={400}
              accessibilityRole="button"
              accessibilityLabel={key === '*' ? 'star' : key === '#' ? 'pound' : key}
              style={({ pressed }) => [
                styles.key,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                },
              ]}>
              <Text
                style={[
                  styles.digit,
                  { color: theme.text, fontSize: size * 0.4, lineHeight: size * 0.48 },
                  (key === '*' || key === '#') && { fontSize: size * 0.44 },
                ]}>
                {key}
              </Text>
              {SUBLABEL[key] ? (
                <Text style={[styles.letters, { color: theme.textSecondary }]}>{SUBLABEL[key]}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontWeight: '400',
  },
  letters: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: -2,
  },
});
