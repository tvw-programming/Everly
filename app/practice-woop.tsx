import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getCurrentWeek,
  getSixMonthTotals,
  SCOREBOARD_LABELS,
  targetFor,
} from '@/lib/practice/scoreboard';
import { WEEKLY_TARGETS, type ScoreboardMetric, type ScoreboardWeek } from '@/lib/practice/types';
import { saveWoop } from '@/lib/practice/woop';
import { activateStatement, ensurePracticeSeeded, upsertStatement } from '@/lib/practice/storage';
import { buildSeedStatements } from '@/lib/practice/seeds';
import type { PracticeStatement } from '@/lib/practice/types';
import { useTheme } from '@/lib/theme/ThemeContext';

type Step = 'numbers' | 'wish' | 'outcome' | 'obstacle' | 'plan' | 'done';

const INPUTS = Object.keys(WEEKLY_TARGETS) as Exclude<ScoreboardMetric, 'rejections'>[];

export default function PracticeWoopScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('numbers');
  const [week, setWeek] = useState<ScoreboardWeek | null>(null);
  const [totals, setTotals] = useState<Record<ScoreboardMetric, number> | null>(null);
  const [wish, setWish] = useState('');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [obstacle, setObstacle] = useState('');
  const [planIf, setPlanIf] = useState('');
  const [planThen, setPlanThen] = useState('');
  const [outcomeLeft, setOutcomeLeft] = useState(120);

  useEffect(() => {
    void (async () => {
      setWeek(await getCurrentWeek());
      setTotals(await getSixMonthTotals());
    })();
  }, []);

  useEffect(() => {
    if (step !== 'outcome') return;
    setOutcomeLeft(120);
    const id = setInterval(() => {
      setOutcomeLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  async function finish(addToActive: boolean) {
    await saveWoop({
      wish,
      outcome: outcomeNote || '(imagined)',
      obstacle,
      planIf,
      planThen,
      addedToActive: addToActive,
    });
    if (addToActive) {
      const stmt: PracticeStatement = {
        ...buildSeedStatements()[0],
        id: `stmt_woop_${Date.now().toString(36)}`,
        code: `W${Date.now().toString(36).slice(-3).toUpperCase()}`,
        language: 'en',
        type: 'if-then',
        body: `When ${planIf}, then ${planThen}.`,
        cueText: `When ${planIf}`,
        thenText: planThen,
        sourcePath: 'practice-plan/woop',
        active: false,
        onBench: false,
        rotationBox: 1,
        nextDueAt: null,
        cadence: 'reactive',
        repCount: 0,
        didntLandCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await ensurePracticeSeeded();
      await upsertStatement(stmt);
      const result = await activateStatement(stmt.id);
      if (!result.ok) {
        Alert.alert(
          'Active set full',
          `Retire an if-then first (cap ${result.cap}). Plan saved to WOOP history.`
        );
      }
    }
    setStep('done');
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: step === 'outcome' ? '#05080F' : theme.canvas,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: theme.accent, fontWeight: '800' }}>← Back</Text>
      </Pressable>

      {step === 'numbers' && week && totals ? (
        <View style={styles.block}>
          <Text style={[styles.title, { color: theme.ink }]}>Sunday numbers</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>
            Count the six inputs before anything else.
          </Text>
          {INPUTS.map((m) => (
            <Text key={m} style={{ color: theme.ink, fontWeight: '700' }}>
              {SCOREBOARD_LABELS[m]}: {week[m]} / {targetFor(m)} · 6mo {totals[m]}
            </Text>
          ))}
          <Pressable
            style={[styles.btn, { backgroundColor: theme.accent }]}
            onPress={() => setStep('wish')}
          >
            <Text style={{ color: theme.onAccent, fontWeight: '900' }}>Begin WOOP</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'wish' ? (
        <View style={styles.block}>
          <Text style={[styles.title, { color: theme.ink }]}>1 · Wish</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>
            One thing for the next four weeks, specific enough to picture.
          </Text>
          <TextInput
            value={wish}
            onChangeText={setWish}
            placeholder='e.g. Two paid discovery calls for AI agent work'
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.ink, borderColor: theme.border, backgroundColor: theme.soft }]}
            multiline
          />
          <Pressable
            style={[styles.btn, { backgroundColor: theme.accent, opacity: wish.trim() ? 1 : 0.4 }]}
            disabled={!wish.trim()}
            onPress={() => setStep('outcome')}
          >
            <Text style={{ color: theme.onAccent, fontWeight: '900' }}>Next</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'outcome' ? (
        <View style={styles.block}>
          <Text style={styles.darkTitle}>2 · Outcome</Text>
          <Text style={styles.darkSub}>
            Imagine it. No typing for two minutes. Screen stays dim on purpose.
          </Text>
          <Text style={styles.timer}>{outcomeLeft}s</Text>
          <TextInput
            value={outcomeNote}
            onChangeText={setOutcomeNote}
            editable={outcomeLeft === 0}
            placeholder={outcomeLeft === 0 ? 'Optional note after the timer' : ''}
            placeholderTextColor="#64748B"
            style={[styles.input, { color: '#F8FAFC', borderColor: '#334155', backgroundColor: '#0F172A' }]}
            multiline
          />
          <Pressable
            style={[styles.btn, { backgroundColor: theme.accent, opacity: outcomeLeft === 0 ? 1 : 0.35 }]}
            disabled={outcomeLeft > 0}
            onPress={() => setStep('obstacle')}
          >
            <Text style={{ color: theme.onAccent, fontWeight: '900' }}>Next</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'obstacle' ? (
        <View style={styles.block}>
          <Text style={[styles.title, { color: theme.ink }]}>3 · Obstacle</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>
            The real internal one — not “no leads”.
          </Text>
          <TextInput
            value={obstacle}
            onChangeText={setObstacle}
            placeholder='e.g. I rewrite the demo instead of sending it'
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.ink, borderColor: theme.border, backgroundColor: theme.soft }]}
            multiline
          />
          <Pressable
            style={[styles.btn, { backgroundColor: theme.accent, opacity: obstacle.trim() ? 1 : 0.4 }]}
            disabled={!obstacle.trim()}
            onPress={() => setStep('plan')}
          >
            <Text style={{ color: theme.onAccent, fontWeight: '900' }}>Next</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'plan' ? (
        <View style={styles.block}>
          <Text style={[styles.title, { color: theme.ink }]}>4 · Plan</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>If-then for exactly that obstacle.</Text>
          <Text style={{ color: theme.muted, fontWeight: '700' }}>When</Text>
          <TextInput
            value={planIf}
            onChangeText={setPlanIf}
            placeholder="I catch myself rewriting the demo a third time"
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.ink, borderColor: theme.border, backgroundColor: theme.soft }]}
          />
          <Text style={{ color: theme.muted, fontWeight: '700' }}>Then</Text>
          <TextInput
            value={planThen}
            onChangeText={setPlanThen}
            placeholder="I send it as it is"
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.ink, borderColor: theme.border, backgroundColor: theme.soft }]}
          />
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: theme.accent,
                opacity: planIf.trim() && planThen.trim() ? 1 : 0.4,
              },
            ]}
            disabled={!planIf.trim() || !planThen.trim()}
            onPress={() => void finish(true)}
          >
            <Text style={{ color: theme.onAccent, fontWeight: '900' }}>Save and add to active set</Text>
          </Pressable>
          <Pressable onPress={() => void finish(false)}>
            <Text style={{ color: theme.muted, fontWeight: '800', textAlign: 'center' }}>
              Save without adding
            </Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'done' ? (
        <View style={styles.block}>
          <Text style={[styles.title, { color: theme.ink }]}>WOOP saved</Text>
          <Pressable
            style={[styles.btn, { backgroundColor: theme.accent }]}
            onPress={() => router.replace('/practice')}
          >
            <Text style={{ color: theme.onAccent, fontWeight: '900' }}>Back to Practice</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16, gap: 12 },
  block: { gap: 12, marginTop: 12 },
  title: { fontSize: 24, fontWeight: '900' },
  sub: { fontSize: 13, lineHeight: 19 },
  darkTitle: { color: '#F8FAFC', fontSize: 24, fontWeight: '900' },
  darkSub: { color: '#94A3B8', fontSize: 13, lineHeight: 19 },
  timer: { color: '#5EEAD4', fontSize: 48, fontWeight: '900', textAlign: 'center', marginVertical: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  btn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
});
