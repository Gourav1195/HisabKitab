import { buildBackupPayload } from './buildBackupPayload';
import { getProfile } from '../profile/getProfile';
import { getDB } from '../db';
import { BACKUP_API_URL } from '@env';

export const triggerBackup = async (type: 'AUTO' | 'MANUAL') => {
  const profile = getProfile();

  if (!profile?.email) {
    throw new Error('Set email to enable backup');
  }

  const payload = buildBackupPayload();

  const res = await fetch(`${BACKUP_API_URL}/backup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: profile.email,
      payload,
      appVersion: '1.0.0',
      type,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error || 'Backup failed');
  }

  // ✅ update local profile metadata
  const db = getDB();
  const now = Date.now();

  db.execute(
    `UPDATE profile
     SET last_backup_at = ?, last_backup_type = ?
     WHERE email = ?`,
    [now, type, profile.email]
  );

  return true;
};
