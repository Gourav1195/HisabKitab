import { getProfile } from '../profile/getProfile';
import { getVerifiedEmail } from './authSession';

// One automatic backup per calendar day, only once the email is verified.
export const shouldAutoBackup = () => {
  if (!getVerifiedEmail()) return false;

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
