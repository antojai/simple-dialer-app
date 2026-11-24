import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

const PALETTE = ['#E76F51', '#2A9D8F', '#8E6CEF', '#F4A261', '#3A86FF', '#D63384', '#43AA8B', '#6C757D'];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsOf(name: string | null) {
  if (!name) return '#';
  const words = name.trim().split(/\s+/).filter((w) => /\p{L}/u.test(w[0] ?? ''));
  if (words.length === 0) return '#';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function Avatar({
  name,
  seed,
  uri,
  size = 44,
}: {
  name: string | null;
  /** Keeps the color stable for unnamed numbers. */
  seed: string;
  uri?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={style} contentFit="cover" />;
  }

  return (
    <View style={[styles.circle, style, { backgroundColor: colorFor(name ?? seed) }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
