import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HoldConfirmButton } from '@/components/practice/HoldConfirmButton';
import { getStatementByCode } from '@/lib/practice/storage';
import { useTheme } from '@/lib/theme/ThemeContext';

/** MT8 — M9 then 60-second silent screen. */
export default function PracticeAnxiousScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState('मी सुरक्षित आहे.');
  const [phase, setPhase] = useState<'line' | 'silence'>('line');

  useEffect(() => {
    void getStatementByCode('M9').then((s) => {
      if (s) setBody(s.body);
    });
  }, []);

  useEffect(() => {
    if (phase !== 'silence') return;
    const t = setTimeout(() => router.back(), 60_000);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'silence') {
    return <View style={[styles.silence, { paddingTop: insets.top }]} />;
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.canvas,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: theme.accent, fontWeight: '800' }}>← Back</Text>
      </Pressable>
      <Text style={[styles.kicker, { color: theme.accent }]}>M9</Text>
      <Text style={[styles.line, { color: theme.ink, lineHeight: 42 }]}>{body}</Text>
      <HoldConfirmButton
        label="Said it"
        color={theme.accent}
        onAccent={theme.onAccent}
        onConfirm={() => setPhase('silence')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22, justifyContent: 'center', gap: 18 },
  silence: { flex: 1, backgroundColor: '#05080F' },
  kicker: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  line: { fontSize: 30, fontWeight: '800' },
});
