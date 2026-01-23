import { shouldAutoBackup } from './shouldAutoBackup';
import { triggerBackup } from './backupService';

export const runAutoBackupIfNeeded = async () => {
  if (!shouldAutoBackup()) return;

  try {
    await triggerBackup('AUTO');
  } catch (e) {
    // swallow error
    console.log('Auto backup skipped:', e);
  }
};
