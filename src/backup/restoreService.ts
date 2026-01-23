import { getProfile } from '../profile/getProfile';
import { resetAndRestoreDB } from './restoreLocalDB';
import { BACKUP_API_URL } from '@env';

export const restoreBackupByEmail = async () => {
  const profile = getProfile();
  if (!profile?.email) {
    throw new Error('Profile not initialized');
  }
  const res = await fetch(`${BACKUP_API_URL}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: profile.email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error || 'Restore failed');
  }
  // return res.json(); // { ok, payload, createdAt }
  const { payload } = await res.json();
  await resetAndRestoreDB(payload);
};
