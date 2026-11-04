import { authedFetch, getVerifiedEmail } from './authSession';

export const getLastBackup = async (): Promise<{
  lastBackupAt: string | null;
  type: 'AUTO' | 'MANUAL' | null;
} | null> => {
  if (!getVerifiedEmail()) return null;
  try {
    return await authedFetch('/backup/last');
  } catch {
    return null;
  }
};
