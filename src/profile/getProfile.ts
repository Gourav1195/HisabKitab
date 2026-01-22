import { getDB } from '../db';

export const getProfile = () => {
  const db = getDB();
  const res = db.execute(`SELECT * FROM profile LIMIT 1`);
  return res.rows?.item(0) ?? null;
};
