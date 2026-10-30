import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  holdMs?: number;
  color: string;
  onAccent: string;
  onConfirm: () => void;
};

/** Dismissal must cost something — 3-second hold. */
export function HoldConfirmButton({
  label,
  holdMs = 3000,
  color,
  onAccent,
  onConfirm,
}: Props) {
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useRef<number>(0);

  function clear() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setProgress(0);
  }

  function begin() {
    start.current = Date.now();
    clear();
    timer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - start.current) / holdMs);
      setProgress(p);
      if (p >= 1) {
        clear();
        onConfirm();
      }
    }, 50);
  }

  return (
    <Pressable
      onPressIn={begin}
      onPressOut={clear}
      style={[styles.btn, { backgroundColor: color }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Hold for three seconds.`}
    >
      <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: onAccent + '33' }]} />
      <Text style={[styles.label, { color: onAccent }]}>{label}</Text>
      <Text style={[styles.hint, { color: onAccent }]}>Hold 3 seconds</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  label: { fontSize: 20, fontWeight: '900', zIndex: 1 },
  hint: { fontSize: 11, fontWeight: '700', marginTop: 4, opacity: 0.85, zIndex: 1 },
});
