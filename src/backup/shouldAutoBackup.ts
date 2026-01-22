import { getProfile } from '../profile/getProfile';

export const shouldAutoBackup = () => {
  const profile = getProfile();
  if (!profile) return false;

  const last = profile.last_auto_backup_at;
  if (!last) return true;

  const lastDate = new Date(last);
  const now = new Date();

  return (
    lastDate.getFullYear() !== now.getFullYear() ||
    lastDate.getMonth() !== now.getMonth() ||
    lastDate.getDate() !== now.getDate()
  );
};
