import { buildBackupPayload } from './buildBackupPayload';
import { getProfile } from '../profile/getProfile';

const BACKUP_URL = 'https://hisab-kitab-backend-orcin.vercel.app/backup';
// const BACKUP_URL = 'http://10.0.2.2:3000/backup'; //dev only

export const triggerBackup = async (type: 'AUTO' | 'MANUAL') => {
  const profile = getProfile();
  if (!profile?.email) {
    throw new Error('Error: Set Email for Backup');
  }

  const payload = buildBackupPayload();

  const res = await fetch(BACKUP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

  return true;
};
