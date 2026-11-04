// Verified-email session for cloud backup. Stored in its own table, which is
// NOT included in backup payloads, so tokens never leave the device.
import { getDB } from '../db';
import { BACKUP_API_URL } from '@env';

type Session = {
  email: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

type ServerSession = {
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const readError = async (res: Response, fallback: string) => {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch {
    return fallback;
  }
};

const post = async (path: string, body: object, fallback: string) => {
  const res = await fetch(`${BACKUP_API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw Object.assign(new Error(await readError(res, fallback)), { status: res.status });
  }
  return res.json();
};

export const getSession = (): Session | null => {
  const res = getDB().execute('SELECT * FROM auth_session WHERE id = 1');
  return (res.rows?.item(0) as Session) ?? null;
};

export const getVerifiedEmail = () => getSession()?.email ?? null;

const saveSession = (s: ServerSession) => {
  getDB().execute(
    `INSERT OR REPLACE INTO auth_session (id, email, access_token, refresh_token, expires_at)
     VALUES (1, ?, ?, ?, ?)`,
    [s.email, s.accessToken, s.refreshToken, s.expiresAt],
  );
};

export const signOut = () => {
  getDB().execute('DELETE FROM auth_session');
};

export const sendCode = (email: string) =>
  post('/auth/otp', { email: email.trim() }, 'Could not send code');

export const verifyCode = async (email: string, code: string) => {
  const session: ServerSession = await post(
    '/auth/verify',
    { email: email.trim(), code: code.trim() },
    'Code is wrong or expired',
  );
  saveSession(session);

  // Fill the shop profile email if the user hasn't set one.
  getDB().execute(
    `UPDATE profile SET email = ? WHERE id = (SELECT id FROM profile LIMIT 1)
     AND (email IS NULL OR email = '')`,
    [session.email],
  );
  return session.email;
};

// Returns a valid access token, refreshing it if it is about to expire.
const getAccessToken = async () => {
  const s = getSession();
  if (!s) {
    throw new Error('Verify your email to use backup');
  }
  const now = Math.floor(Date.now() / 1000);
  if (s.expires_at - now > 60) {
    return s.access_token;
  }
  try {
    const fresh: ServerSession = await post(
      '/auth/refresh',
      { refreshToken: s.refresh_token },
      'Session expired. Verify your email again.',
    );
    saveSession(fresh);
    return fresh.accessToken;
  } catch (e: any) {
    if (e?.status === 401) {
      signOut();
    }
    throw e;
  }
};

// fetch() against the backup API with the user's access token.
export const authedFetch = async (
  path: string,
  init: { method?: string; body?: object } = {},
  fallbackError = 'Request failed',
) => {
  const token = await getAccessToken();
  const res = await fetch(`${BACKUP_API_URL}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 401) {
    signOut();
  }
  if (!res.ok) {
    throw new Error(await readError(res, fallbackError));
  }
  return res.json();
};
