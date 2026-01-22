import { getProfile } from '../profile/getProfile';
import { resetAndRestoreDB } from './restoreLocalDB';

const RESTORE_URL = 'https://hisab-kitab-backend-orcin.vercel.app/restore';

export const restoreBackupByEmail = async (email: string) => {
  const res = await fetch(`${RESTORE_URL}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error || 'Restore failed');
  }
  // return res.json(); // { ok, payload, createdAt }
  const { payload } = await res.json();
  await resetAndRestoreDB(payload);
};

// export const restoreFromBackup = async () => {
//   const profile = getProfile();
//   if (!profile?.id) {
//     throw new Error('Profile not initialized');
//   }
//   const res = await fetch(RESTORE_URL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ userId: profile.id }),
//   });
//   if (!res.ok) {
//     const err = await res.json();
//     throw new Error(err?.error || 'Restore failed');
//   }
//   const { payload } = await res.json();

//   await resetAndRestoreDB(payload);
// };
