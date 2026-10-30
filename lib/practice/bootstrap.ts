import { AppState, type AppStateStatus } from 'react-native';

import { emitPracticeEvent } from './events';
import { schedulePracticeJobs } from './notifications';
import { isBehindPaceApplications } from './scoreboard';
import { ensurePracticeSeeded } from './storage';
import { ensureAllActiveManifestDueIfNull } from './rotation';

let attached = false;

export async function syncPracticeOnLaunch(): Promise<void> {
  await ensurePracticeSeeded();
  await ensureAllActiveManifestDueIfNull();
  await schedulePracticeJobs();
  if (await isBehindPaceApplications()) {
    emitPracticeEvent('behind_pace', { metric: 'applications' });
  }
}

export function attachPracticeBootstrap(): () => void {
  if (attached) return () => undefined;
  attached = true;
  void syncPracticeOnLaunch();
  const onChange = (state: AppStateStatus) => {
    if (state === 'active') void syncPracticeOnLaunch();
  };
  const sub = AppState.addEventListener('change', onChange);
  return () => {
    attached = false;
    sub.remove();
  };
}
