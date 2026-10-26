import { NativeModulesProxy, requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type ReliabilityStatus = {
  notifications: boolean;
  exactAlarms: boolean;
  nativeModule: boolean;
  batteryHint: string;
  lastTestAt?: string | null;
  message: string;
};

type NativeSchedule = { id: string; nextFireAt: number | null; enabled: boolean };
type NativeOutcome = { alarmId: string; reason: string; at: number };

type EverlyAlarmNative = {
  canScheduleExactAlarms(): Promise<boolean>;
  schedule(payload: string): Promise<{ nextFireAt: number | null }>;
  cancel(id: string): Promise<void>;
  rescheduleAll(payload: string): Promise<void>;
  getSchedules(): Promise<NativeSchedule[]>;
  drainOutcomes(): Promise<NativeOutcome[]>;
  testFire(id: string): Promise<void>;
  stopAlarm(): Promise<void>;
  snoozeAlarm(minutes: number): Promise<void>;
  openExactAlarmSettings(): Promise<void>;
  openBatterySettings(): Promise<void>;
  getReliabilityStatus(): Promise<ReliabilityStatus>;
};

function load(): EverlyAlarmNative | null {
  if (Platform.OS !== 'android') return null;
  try {
    return requireNativeModule<EverlyAlarmNative>('EverlyAlarm');
  } catch {
    try {
      return (NativeModulesProxy as Record<string, EverlyAlarmNative>).EverlyAlarm ?? null;
    } catch {
      return null;
    }
  }
}

const native = load();

/** True only when the Kotlin EverlyAlarm module is linked in this binary. */
export const isNativeAvailable = native != null;

async function missing(): Promise<never> {
  throw new Error('EverlyAlarm native module unavailable — build a custom Android APK.');
}

const api: EverlyAlarmNative = {
  canScheduleExactAlarms: () => native?.canScheduleExactAlarms() ?? Promise.resolve(false),
  schedule: (payload) => native?.schedule(payload) ?? missing(),
  cancel: (id) => native?.cancel(id) ?? Promise.resolve(),
  rescheduleAll: (payload) => native?.rescheduleAll(payload) ?? Promise.resolve(),
  getSchedules: () => native?.getSchedules() ?? Promise.resolve([]),
  drainOutcomes: () => native?.drainOutcomes() ?? Promise.resolve([]),
  testFire: (id) => native?.testFire(id) ?? missing(),
  stopAlarm: () => native?.stopAlarm() ?? Promise.resolve(),
  snoozeAlarm: (m) => native?.snoozeAlarm(m) ?? Promise.resolve(),
  openExactAlarmSettings: () => native?.openExactAlarmSettings() ?? Promise.resolve(),
  openBatterySettings: () => native?.openBatterySettings() ?? Promise.resolve(),
  getReliabilityStatus: () =>
    native?.getReliabilityStatus() ??
    Promise.resolve({
      notifications: false,
      exactAlarms: false,
      nativeModule: false,
      batteryHint: 'Build the Android APK with this module linked.',
      lastTestAt: null,
      message: 'Native module not linked in this binary.',
    }),
};

export default api;
