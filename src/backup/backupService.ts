import { buildBackupPayload } from './buildBackupPayload';
import { authedFetch, getVerifiedEmail } from './authSession';
import { getDB } from '../db';

export const APP_VERSION = '1.0.1';

export const triggerBackup = async (type: 'AUTO' | 'MANUAL') => {
  if (!getVerifiedEmail()) {
    throw new Error('Verify your email to enable backup');
  }

  await authedFetch(
    '/backup',
    { method: 'POST', body: { payload: buildBackupPayload(), appVersion: APP_VERSION, type } },
    'Backup failed',
  );

  const now = Date.now();
  getDB().execute(
    `UPDATE profile
     SET last_backup_at = ?, last_backup_type = ?,
         last_auto_backup_at = CASE WHEN ? = 'AUTO' THEN ? ELSE last_auto_backup_at END
     WHERE id = (SELECT id FROM profile LIMIT 1)`,
    [now, type, type, now],
  );

  return true;
};

export const deleteCloudBackups = () =>
  authedFetch('/backup', { method: 'DELETE' }, 'Could not delete backups');
