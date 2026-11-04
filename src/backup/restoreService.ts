import { resetAndRestoreDB } from './restoreLocalDB';
import { authedFetch, getVerifiedEmail } from './authSession';

export const restoreLatestBackup = async () => {
  if (!getVerifiedEmail()) {
    throw new Error('Verify your email to restore');
  }
  const { payload } = await authedFetch('/restore', { method: 'POST' }, 'Restore failed');
  await resetAndRestoreDB(payload);
};
