import { getProfile } from '../profile/getProfile';
import { BACKUP_API_URL } from '@env';

export const getLastBackup = async () => {
  const profile = getProfile();
  if (!profile?.email) return null;

  const res = await fetch(
    `${BACKUP_API_URL}/backup/last?email=${encodeURIComponent(profile.email)}`);

  if (!res.ok) return null;

  return res.json();
};
