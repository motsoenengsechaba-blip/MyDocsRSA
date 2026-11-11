import { View, type StyleProp, type ViewStyle } from 'react-native';

type DotGridProps = {
  cols?: number;
  rows?: number;
  gap?: number;
  dot?: number;
  /** Brightest dot opacity. Dots fade in from left to right. */
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

/** A grid of tiny white dots that fades in from the left: the "graph paper" texture on dark headers. */
export function DotGrid({ cols = 12, rows = 6, gap = 18, dot = 3, opacity = 0.2, style }: DotGridProps) {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c });

  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: cols * gap, flexDirection: 'row', flexWrap: 'wrap' }, style]}>
      {cells.map(({ r, c }) => (
        <View key={`${r}-${c}`} style={{ width: gap, height: gap, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: '#FFFFFF',
              opacity: opacity * ((c + 1) / cols),
            }}
          />
        </View>
      ))}
    </View>
  );
}

type RingsProps = { count?: number; base?: number; step?: number; color?: string; top?: number; right?: number };

/** Concentric thin rings centred near the top-right: the same security-print pattern as the digital cards. */
export function Rings({ count = 6, base = 70, step = 38, color = 'rgba(201,162,75,0.2)', top = 24, right = 24 }: RingsProps) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top, right, width: 0, height: 0 }}>
      {Array.from({ length: count }).map((_, i) => {
        const size = base + i * step;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: -size / 2,
              top: -size / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: color,
            }}
          />
        );
      })}
    </View>
  );
}
