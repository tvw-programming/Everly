import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { categoryColors } from '@/lib/theme/categories';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  IDEA_CATEGORY_META,
  IDEA_STATUS_LABEL,
  type IdeaNote,
} from '@/lib/ideas/types';

type Props = {
  idea: IdeaNote;
  onPress: () => void;
  onPlay?: () => void;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  });
}

function formatDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function IdeaCard({ idea, onPress, onPlay }: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const meta = IDEA_CATEGORY_META[idea.category];
  const category = categoryColors(idea.category, theme.mode);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderLeftColor: category.accent }]}
      accessibilityLabel={`${meta.label} idea ${idea.title}`}
    >
      <View style={styles.top}>
        <Text style={[styles.cat, { color: category.accent }]}>
          {meta.icon} {meta.label} · {formatWhen(idea.createdAt)}
        </Text>
        <Text style={styles.status}>{IDEA_STATUS_LABEL[idea.status]}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {idea.title}
      </Text>
      <Text style={styles.summary} numberOfLines={2}>
        {idea.summary}
      </Text>
      <View style={styles.metaRow}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onPlay?.();
          }}
          style={styles.play}
        >
          <Text style={styles.playText}>▶ {formatDur(idea.durationSec)} voice</Text>
        </Pressable>
        <Text style={styles.tags} numberOfLines={1}>
          {idea.tags.map((t) => `#${t}`).join(' ')}
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  card: {
    backgroundColor: t.soft,
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: t.border,
    gap: 4,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cat: { fontSize: 11, fontWeight: '800' },
  status: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)' },
  title: { fontSize: 15, fontWeight: '800', color: t.ink },
  summary: { fontSize: 12, lineHeight: 17, color: 'rgba(248,250,252,0.72)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  play: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  playText: { fontSize: 11, fontWeight: '700', color: t.ink },
  tags: { flex: 1, fontSize: 10, color: 'rgba(148,163,184,0.95)', fontWeight: '600' },
});
