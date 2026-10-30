import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getReviewFlags } from '@/lib/practice/rotation';
import {
  activateStatement,
  ensurePracticeSeeded,
  exportPracticeBundle,
  moveToBench,
  retireStatement,
  searchStatements,
  swapStatements,
} from '@/lib/practice/storage';
import type { PracticeStatement } from '@/lib/practice/types';
import { exportWinsText, readThreeRandom } from '@/lib/practice/wins';
import { useTheme } from '@/lib/theme/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Share } from 'react-native';

export default function PracticeReviewScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [list, setList] = useState<PracticeStatement[]>([]);
  const [flags, setFlags] = useState<Awaited<ReturnType<typeof getReviewFlags>> | null>(null);
  const [bench, setBench] = useState<PracticeStatement[]>([]);

  const refresh = useCallback(async () => {
    await ensurePracticeSeeded();
    setList(await searchStatements(query));
    setFlags(await getReviewFlags());
    const all = await searchStatements('');
    setBench(all.filter((s) => s.onBench && !s.active));
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  async function exportAll() {
    const json = await exportPracticeBundle();
    if (Platform.OS === 'web') {
      Alert.alert('Export ready', `Bundle length ${json.length} chars — copy from console.`);
      console.log(json);
      return;
    }
    const path = `${FileSystem.cacheDirectory}everly-practice-export.json`;
    await FileSystem.writeAsStringAsync(path, json);
    await Share.share({ url: path, message: 'Everly practice export' });
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.canvas,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: theme.accent, fontWeight: '800' }}>← Back</Text>
      </Pressable>
      <Text style={[styles.title, { color: theme.ink }]}>Library and review</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => void refresh()}
        placeholder="Search statements"
        placeholderTextColor={theme.muted}
        style={[
          styles.search,
          { color: theme.ink, borderColor: theme.border, backgroundColor: theme.soft },
        ]}
      />

      {flags ? (
        <View style={styles.flags}>
          <Text style={[styles.flagTitle, { color: theme.ink }]}>Monthly flags</Text>
          <Text style={{ color: theme.muted, fontSize: 12 }}>
            Box 5 (automatic): {flags.automatic.map((s) => s.code).join(', ') || 'none'}
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12 }}>
            Didn&apos;t land ×2+: {flags.notBelievable.map((s) => s.code).join(', ') || 'none'}
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12 }}>
            Ladder: {flags.ladder.map((s) => `${s.code} (rung ${s.ladderRung})`).join(', ') || 'none'}
          </Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable onPress={() => void exportAll()}>
          <Text style={{ color: theme.accent, fontWeight: '800' }}>Export all</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            const wins = await readThreeRandom();
            Alert.alert(
              'Read three',
              wins.length ? wins.map((w) => `• ${w.text}`).join('\n') : 'No wins yet'
            );
          }}
        >
          <Text style={{ color: theme.accent, fontWeight: '800' }}>Read three wins</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            const text = await exportWinsText();
            Alert.alert('Wins export', text || 'Empty');
          }}
        >
          <Text style={{ color: theme.accent, fontWeight: '800' }}>Wins text</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/practice-voice')}>
        <Text style={{ color: theme.accent, fontWeight: '800', marginBottom: 8 }}>
          Record own voice →
        </Text>
      </Pressable>

      <Text style={[styles.section, { color: theme.ink }]}>Bench</Text>
      {bench.map((s) => (
        <View key={s.id} style={[styles.card, { backgroundColor: theme.soft }]}>
          <Text style={{ color: theme.accent, fontWeight: '800' }}>{s.code}</Text>
          <Text style={{ color: theme.ink }} numberOfLines={2}>
            {s.body}
          </Text>
          <Pressable
            onPress={async () => {
              const result = await activateStatement(s.id);
              if (!result.ok) {
                const active = list.filter((x) => x.active && x.type === result.type);
                Alert.alert(
                  'Cap reached',
                  `Pick a ${result.type} to retire first.`,
                  active.slice(0, 5).map((a) => ({
                    text: `Retire ${a.code}`,
                    onPress: () => void swapStatements(a.id, s.id).then(() => refresh()),
                  }))
                );
              } else {
                await refresh();
              }
            }}
          >
            <Text style={{ color: theme.accent, fontWeight: '800' }}>Add to active</Text>
          </Pressable>
        </View>
      ))}

      <Text style={[styles.section, { color: theme.ink }]}>All statements</Text>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 8, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.soft }]}>
            <Text style={{ color: theme.accent, fontWeight: '900' }}>
              {item.code} · {item.type}
              {item.active ? ' · ACTIVE' : item.onBench ? ' · BENCH' : ''}
              {item.retiredAt ? ' · RETIRED' : ''}
            </Text>
            <Text style={{ color: theme.ink, lineHeight: 20 }}>{item.body}</Text>
            <Text style={{ color: theme.muted, fontSize: 11 }}>
              box {item.rotationBox} · reps {item.repCount} · didn&apos;t land {item.didntLandCount}
            </Text>
            <View style={styles.row}>
              {item.active ? (
                <>
                  <Pressable onPress={() => void retireStatement(item.id).then(refresh)}>
                    <Text style={{ color: theme.danger, fontWeight: '800' }}>Retire</Text>
                  </Pressable>
                  <Pressable onPress={() => void moveToBench(item.id).then(refresh)}>
                    <Text style={{ color: theme.muted, fontWeight: '800' }}>To bench</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={async () => {
                    const result = await activateStatement(item.id);
                    if (!result.ok) {
                      Alert.alert('Cap reached', `Retire a ${result.type} first (cap ${result.cap}).`);
                    }
                    await refresh();
                  }}
                >
                  <Text style={{ color: theme.accent, fontWeight: '800' }}>Activate</Text>
                </Pressable>
              )}
              <Pressable onPress={() => router.push({ pathname: '/practice-voice', params: { id: item.id } })}>
                <Text style={{ color: theme.accent, fontWeight: '800' }}>Voice</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 14, gap: 8 },
  title: { fontSize: 24, fontWeight: '900' },
  search: { borderWidth: 1, borderRadius: 12, padding: 10, fontWeight: '600' },
  flags: { gap: 2, marginBottom: 4 },
  flagTitle: { fontWeight: '900' },
  section: { fontWeight: '900', fontSize: 15, marginTop: 6 },
  card: { borderRadius: 12, padding: 12, gap: 6 },
  row: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
});
