import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (transcript: string) => Promise<void>;
};

const PLACEHOLDER =
  'I have an idea for LinkedIn… Also remind me to improve the PostgreSQL connection pool tomorrow.';

export function IdeaCaptureSheet({ visible, busy, onClose, onSubmit }: Props) {
  const [text, setText] = useState('');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Voice-first capture</Text>
          <Text style={styles.hint}>
            {Platform.OS === 'web'
              ? 'Paste or type freely. Device builds will stream mic audio. I will split intents into Personal, Social, and Professional ideas.'
              : 'Dictate or type. Multi-intent thoughts become separate organized ideas.'}
          </Text>
          <TextInput
            style={styles.input}
            multiline
            value={text}
            onChangeText={setText}
            placeholder={PLACEHOLDER}
            placeholderTextColor="#64748B"
            textAlignVertical="top"
            editable={!busy}
          />
          <View style={styles.row}>
            <Pressable style={styles.secondary} onPress={onClose} disabled={busy}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.primary}
              disabled={busy || !text.trim()}
              onPress={async () => {
                await onSubmit(text.trim());
                setText('');
              }}
            >
              {busy ? (
                <ActivityIndicator color="#042F2E" />
              ) : (
                <Text style={styles.primaryText}>Organize</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '900', color: '#F8FAFC' },
  hint: { fontSize: 12, color: '#94A3B8', lineHeight: 17 },
  input: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    color: '#F8FAFC',
    backgroundColor: 'rgba(255,255,255,0.04)',
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: 10 },
  secondary: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { color: '#E2E8F0', fontWeight: '700' },
  primary: {
    flex: 1.2,
    borderRadius: 12,
    backgroundColor: '#2DD4BF',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryText: { color: '#042F2E', fontWeight: '900' },
});
