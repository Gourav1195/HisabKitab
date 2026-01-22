import { getProfile } from '../profile/getProfile';

const BACKUP_LAST_URL =
  'https://hisab-kitab-backend-orcin.vercel.app/backup/last';
// 'http://10.0.2.2:3000/backup'; //dev only

export const getLastBackup = async () => {
  const profile = getProfile();
  if (!profile?.id) return null;

  const res = await fetch(
    `${BACKUP_LAST_URL}?userId=${profile.id}`
  );

  if (!res.ok) return null;

  return res.json();
};
