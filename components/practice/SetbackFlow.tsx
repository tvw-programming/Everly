import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HoldConfirmButton } from './HoldConfirmButton';

type Step = 'log' | 'm4' | 'apply';

type Props = {
  m4Body: string;
  accent: string;
  ink: string;
  muted: string;
  onAccent: string;
  soft: string;
  onLogged: () => void;
  onM4Done: () => void;
  onOpenApplications: () => void;
  onClose: () => void;
};

/** R2 / F10 — fixed three-step sequence. No encouragement copy. */
export function SetbackFlow({
  m4Body,
  accent,
  ink,
  muted,
  onAccent,
  soft,
  onLogged,
  onM4Done,
  onOpenApplications,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>('log');

  return (
    <View style={[styles.root, { backgroundColor: '#05080F' }]}>
      <Pressable onPress={onClose}>
        <Text style={{ color: muted, fontWeight: '800' }}>Close</Text>
      </Pressable>

      {step === 'log' ? (
        <View style={styles.center}>
          <Text style={styles.kicker}>Log a rejection</Text>
          <Text style={styles.title}>One tap. Then the next application.</Text>
          <Pressable
            style={[styles.primary, { backgroundColor: accent }]}
            onPress={() => {
              onLogged();
              setStep('m4');
            }}
          >
            <Text style={[styles.primaryText, { color: onAccent }]}>Log it</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 'm4' ? (
        <View style={styles.center}>
          <Text style={styles.kicker}>M4</Text>
          <Text style={[styles.line, { color: '#F8FAFC' }]}>{m4Body}</Text>
          <Text style={{ color: muted, marginTop: 8 }}>Say it once. Then hold.</Text>
          <HoldConfirmButton
            label="Said it"
            color={accent}
            onAccent={onAccent}
            onConfirm={() => {
              onM4Done();
              setStep('apply');
            }}
          />
        </View>
      ) : null}

      {step === 'apply' ? (
        <View style={styles.center}>
          <Text style={styles.kicker}>Next</Text>
          <Text style={styles.title}>Send the next application today.</Text>
          <Pressable
            style={[styles.primary, { backgroundColor: accent }]}
            onPress={onOpenApplications}
          >
            <Text style={[styles.primaryText, { color: onAccent }]}>Open applications cue</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  center: { gap: 14 },
  kicker: {
    color: '#5EEAD4',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '900', lineHeight: 32 },
  line: { fontSize: 26, fontWeight: '800', lineHeight: 38 },
  primary: { borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  primaryText: { fontSize: 18, fontWeight: '900' },
});
