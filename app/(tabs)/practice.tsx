import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhoneShell } from '@/components/PhoneShell';
import { useDockInset } from '@/components/glass/GlassDock';
import { CueCard } from '@/components/practice/CueCard';
import { ScoreboardView } from '@/components/practice/Scoreboard';
import { SetbackFlow } from '@/components/practice/SetbackFlow';
import { emitPracticeEvent, onPracticeEvent } from '@/lib/practice/events';
import {
  getCurrentWeek,
  getSixMonthTotals,
  incrementMetric,
} from '@/lib/practice/scoreboard';
import {
  ensurePracticeSeeded,
  getStatementByCode,
} from '@/lib/practice/storage';
import type { PracticeStatement, ScoreboardMetric, ScoreboardWeek } from '@/lib/practice/types';
import { addWin } from '@/lib/practice/wins';
import { appendRep } from '@/lib/practice/storage';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function PracticeHomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const dock = useDockInset();
  const params = useLocalSearchParams<{ cue?: string }>();
  const [ifThens, setIfThens] = useState<PracticeStatement[]>([]);
  const [reactives, setReactives] = useState<PracticeStatement[]>([]);
  const [week, setWeek] = useState<ScoreboardWeek | null>(null);
  const [totals, setTotals] = useState<Record<ScoreboardMetric, number> | null>(null);
  const [setbackOpen, setSetbackOpen] = useState(false);
  const [m4Body, setM4Body] = useState('');
  const [winsOpen, setWinsOpen] = useState(false);
  const [winsText, setWinsText] = useState('');
  const [timer, setTimer] = useState<{ code: string; endsAt: number; label: string } | null>(
    null
  );
  const [behindPace, setBehindPace] = useState(false);

  const refresh = useCallback(async () => {
    const list = await ensurePracticeSeeded();
    setIfThens(list.filter((s) => s.active && s.type === 'if-then'));
    setReactives(list.filter((s) => s.active && s.type === 'reactive'));
    setWeek(await getCurrentWeek());
    setTotals(await getSixMonthTotals());
    const m4 = await getStatementByCode('M4');
    setM4Body(m4?.body ?? '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    return onPracticeEvent('behind_pace', () => setBehindPace(true));
  }, []);

  useEffect(() => {
    if (!params.cue) return;
    const hit = ifThens.find((s) => s.code === params.cue);
    if (hit) void startCue(hit);
  }, [params.cue, ifThens]);

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => {
      if (Date.now() >= timer.endsAt) {
        clearInterval(id);
        emitPracticeEvent('timer_ended', { code: timer.code });
        if (timer.code === 'H1') {
          Alert.alert('Block complete', 'Start H2 — send five applications.', [
            {
              text: 'Open H2',
              onPress: () => {
                const h2 = ifThens.find((s) => s.code === 'H2');
                if (h2) void startCue(h2);
              },
            },
          ]);
        }
        setTimer(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [timer, ifThens]);

  const daily = useMemo(
    () => ifThens.filter((s) => s.cadence !== 'weekly'),
    [ifThens]
  );
  const weekly = useMemo(
    () => ifThens.filter((s) => s.cadence === 'weekly'),
    [ifThens]
  );

  async function startCue(stmt: PracticeStatement) {
    await appendRep({ statementId: stmt.id, kind: 'cue_start' });
    emitPracticeEvent('cue_started', { code: stmt.code });

    if (stmt.scoreMetric) {
      setWeek(await incrementMetric(stmt.scoreMetric));
      setTotals(await getSixMonthTotals());
    }

    if (stmt.code === 'H5') {
      setWinsOpen(true);
      return;
    }
    if (stmt.code === 'H10') {
      router.push('/practice-woop');
      return;
    }
    if (stmt.timerMinutes) {
      setTimer({
        code: stmt.code,
        label: stmt.code,
        endsAt: Date.now() + stmt.timerMinutes * 60_000,
      });
      return;
    }
    if (stmt.code === 'H2') {
      Alert.alert('Applications', 'Send five. Then Start H3 to log and close the tab.');
    }
    if (stmt.code === 'H3') {
      emitPracticeEvent('apps_sent_5');
      Alert.alert('Logged', 'Close the tab. Done for this block.');
    }
  }

  const timerLeft = timer
    ? Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000))
    : 0;
  const mm = String(Math.floor(timerLeft / 60)).padStart(2, '0');
  const ss = String(timerLeft % 60).padStart(2, '0');

  return (
    <PhoneShell>
      <View style={[styles.root, { backgroundColor: theme.canvas, paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: theme.accent }]}>Practice</Text>
            <Text style={[styles.title, { color: theme.ink }]}>Cue cards</Text>
          </View>
          <Pressable onPress={() => router.push('/practice-review')}>
            <Text style={{ color: theme.accent, fontWeight: '800' }}>Review</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: dock + 24, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.accent }]}
              onPress={() => router.push('/practice-session')}
            >
              <Text style={{ color: theme.onAccent, fontWeight: '900' }}>Evening session</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtnOutline, { borderColor: theme.border }]}
              onPress={() => setSetbackOpen(true)}
            >
              <Text style={{ color: theme.ink, fontWeight: '800' }}>Log a rejection</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtnOutline, { borderColor: theme.border }]}
              onPress={() => {
                const r1 = reactives.find((s) => s.code === 'R1');
                if (r1) {
                  Alert.alert(r1.code, r1.thenText ?? r1.body);
                }
              }}
            >
              <Text style={{ color: theme.ink, fontWeight: '800' }}>I&apos;m stuck</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtnOutline, { borderColor: theme.border }]}
              onPress={() => router.push('/practice-anxious')}
            >
              <Text style={{ color: theme.ink, fontWeight: '800' }}>I&apos;m anxious</Text>
            </Pressable>
          </View>

          {behindPace ? (
            <Pressable
              style={[styles.banner, { backgroundColor: theme.soft }]}
              onPress={() => {
                setBehindPace(false);
                const h2 = ifThens.find((s) => s.code === 'H2');
                if (h2) void startCue(h2);
              }}
            >
              <Text style={{ color: theme.ink, fontWeight: '800' }}>
                Behind pace — applications under 15 this week. Open H2.
              </Text>
            </Pressable>
          ) : null}

          {timer ? (
            <View style={[styles.timer, { backgroundColor: '#05080F' }]}>
              <Text style={{ color: '#5EEAD4', fontWeight: '900' }}>{timer.label} timer</Text>
              <Text style={{ color: '#F8FAFC', fontSize: 40, fontWeight: '900' }}>
                {mm}:{ss}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.section, { color: theme.ink }]}>Daily</Text>
          <View style={{ paddingHorizontal: 14 }}>
            {daily.map((s) => (
              <CueCard
                key={s.id}
                statement={s}
                accent={theme.accent}
                ink={theme.ink}
                muted={theme.muted}
                onAccent={theme.onAccent}
                onStart={() => void startCue(s)}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: theme.ink }]}>Weekly</Text>
          <View style={{ paddingHorizontal: 14 }}>
            {weekly.map((s) => (
              <CueCard
                key={s.id}
                statement={s}
                accent={theme.accent}
                ink={theme.ink}
                muted={theme.muted}
                onAccent={theme.onAccent}
                onStart={() => void startCue(s)}
              />
            ))}
          </View>

          {week && totals ? (
            <ScoreboardView
              week={week}
              totals={totals}
              accent={theme.accent}
              ink={theme.ink}
              muted={theme.muted}
              soft={theme.soft}
              onAccent={theme.onAccent}
              onIncrement={async (m) => {
                setWeek(await incrementMetric(m));
                setTotals(await getSixMonthTotals());
              }}
            />
          ) : null}
        </ScrollView>
      </View>

      <Modal visible={setbackOpen} animationType="slide">
        <SetbackFlow
          m4Body={m4Body}
          accent={theme.accent}
          ink={theme.ink}
          muted={theme.muted}
          onAccent={theme.onAccent}
          soft={theme.soft}
          onLogged={async () => {
            setWeek(await incrementMetric('rejections'));
            setTotals(await getSixMonthTotals());
            emitPracticeEvent('rejection_logged');
          }}
          onM4Done={() => undefined}
          onOpenApplications={() => {
            setSetbackOpen(false);
            const h2 = ifThens.find((s) => s.code === 'H2');
            if (h2) void startCue(h2);
          }}
          onClose={() => setSetbackOpen(false)}
        />
      </Modal>

      <Modal visible={winsOpen} animationType="slide" transparent>
        <View style={styles.winsWrap}>
          <View style={[styles.winsCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: theme.ink }]}>One wins line</Text>
            <TextInput
              value={winsText}
              onChangeText={setWinsText}
              placeholder="What you shipped or learned"
              placeholderTextColor={theme.muted}
              style={[
                styles.winsInput,
                { color: theme.ink, borderColor: theme.border, backgroundColor: theme.soft },
              ]}
              multiline
            />
            <Pressable
              style={[styles.actionBtn, { backgroundColor: theme.accent }]}
              onPress={async () => {
                if (!winsText.trim()) return;
                await addWin(winsText.trim());
                emitPracticeEvent('wins_written');
                setWinsText('');
                setWinsOpen(false);
              }}
            >
              <Text style={{ color: theme.onAccent, fontWeight: '900', textAlign: 'center' }}>
                Save
              </Text>
            </Pressable>
            <Pressable onPress={() => setWinsOpen(false)}>
              <Text style={{ color: theme.muted, fontWeight: '800', textAlign: 'center' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </PhoneShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  kicker: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: '900' },
  section: { fontSize: 16, fontWeight: '900', paddingHorizontal: 16, marginTop: 4 },
  actions: { paddingHorizontal: 14, gap: 8 },
  actionBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  actionBtnOutline: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  banner: { marginHorizontal: 14, padding: 12, borderRadius: 12 },
  timer: {
    marginHorizontal: 14,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  winsWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  winsCard: { borderRadius: 18, padding: 16, gap: 12 },
  winsInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
  },
});
