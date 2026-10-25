import type { EverlyTheme } from '@/lib/theme/buildTheme';
import { LEGEND_SURFACE } from '@/lib/theme/tokens';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useThemedStyles } from '@/lib/theme/useThemedStyles';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { palette } from '@/constants/Colors';
import { formatTimeDisplay } from '@/lib/schedule';
import type { ReminderTask, TaskCategory } from '@/lib/types';
import { CATEGORY_LABELS, SUBCATEGORY_LABELS } from '@/lib/types';

type Props = {
  category: TaskCategory;
  accent: string;
  /** Tinted fill for this category's card */
  container?: string;
  tasks: ReminderTask[];
  onToggle: (id: string, completed: boolean) => void;
};

const TOP_N = 2;

export function CategoryQuadrant({ category, accent, container, tasks, onToggle }: Props) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [sheetOpen, setSheetOpen] = useState(false);
  const active = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed).length;
  const top = active.slice(0, TOP_N);
  const overflow = Math.max(0, active.length - TOP_N);

  return (
    <View
      style={[
        styles.panel,
        { borderTopColor: accent, backgroundColor: container ?? LEGEND_SURFACE[theme.mode] },
      ]}
    >
      <View style={styles.panelHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={styles.panelTitle}>{CATEGORY_LABELS[category]}</Text>
        </View>
        <Text style={styles.counts}>
          {active.length} active · {done} done
        </Text>
      </View>

      {top.length === 0 ? (
        <Text style={styles.empty}>Clear — nothing queued</Text>
      ) : (
        top.map((task) => (
          <Pressable
            key={task.id}
            style={styles.row}
            onPress={() => onToggle(task.id, !task.completed)}
          >
            <View
              style={[
                styles.ring,
                { borderColor: accent },
                task.completed && { backgroundColor: accent },
              ]}
            >
              {task.completed ? <Text style={styles.tick}>✓</Text> : null}
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.time}>{formatTimeDisplay(task.schedule.time)}</Text>
              <Text style={styles.title} numberOfLines={1}>
                {task.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {SUBCATEGORY_LABELS[task.subCategory]} · {task.priority.toUpperCase()}
                {task.contextTrigger ? ` · ${task.contextTrigger}` : ''}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {overflow > 0 ? (
        <Pressable onPress={() => setSheetOpen(true)} style={styles.moreBtn}>
          <Text style={[styles.moreText, { color: accent }]}>+{overflow} more</Text>
        </Pressable>
      ) : null}

      <Modal visible={sheetOpen} animationType="slide" transparent onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{CATEGORY_LABELS[category]} queue</Text>
            {active.map((task) => (
              <Pressable
                key={task.id}
                style={styles.row}
                onPress={() => onToggle(task.id, true)}
              >
                <View style={[styles.ring, { borderColor: accent }]} />
                <View style={styles.rowBody}>
                  <Text style={styles.time}>{formatTimeDisplay(task.schedule.time)}</Text>
                  <Text style={styles.title}>{task.title}</Text>
                </View>
              </Pressable>
            ))}
            <Pressable style={styles.closeBtn} onPress={() => setSheetOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (t: EverlyTheme) =>
  StyleSheet.create({
  panel: {
    flex: 1,
    minHeight: 0,
    backgroundColor: t.surfaces.base,
    borderRadius: 16,
    borderTopWidth: 3,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.border,
    shadowColor: '#1C1C1E',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  panelTitle: { fontSize: 13, fontWeight: '800', color: t.ink },
  counts: { fontSize: 10, color: t.muted, fontWeight: '600' },
  empty: { fontSize: 12, color: t.muted, fontStyle: 'italic', paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  ring: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { color: t.onAccent, fontSize: 11, fontWeight: '800' },
  rowBody: { flex: 1, minWidth: 0 },
  time: { fontSize: 13, fontWeight: '800', color: t.ink },
  title: { fontSize: 12, fontWeight: '600', color: t.ink },
  meta: { fontSize: 10, color: t.muted },
  moreBtn: { alignSelf: 'flex-start', paddingTop: 2 },
  moreText: { fontSize: 11, fontWeight: '700' },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: t.surfaces.base,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
    gap: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, color: t.ink },
  closeBtn: {
    marginTop: 12,
    backgroundColor: t.soft,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: { fontWeight: '700', color: t.ink },
});
