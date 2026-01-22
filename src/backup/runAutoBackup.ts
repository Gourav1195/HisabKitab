import { shouldAutoBackup } from './shouldAutoBackup';
import { triggerBackup } from './backupService';
import { getDB } from '../db';

export const runAutoBackupIfNeeded = async () => {
  if (!shouldAutoBackup()) return;

  try {
    await triggerBackup('AUTO');

    const db = getDB();
    db.execute(
      `UPDATE profile SET last_auto_backup_at = ?`,
      [Date.now()]
    );
  } catch (e) {
    // swallow error
    console.log('Auto backup skipped:', e);
  }
};
