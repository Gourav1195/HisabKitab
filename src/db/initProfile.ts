import { getDB } from './index';
import { v4 as uuidv4 } from 'uuid';

export const initProfile = () => {
  const db = getDB();

  const result = db.execute(`SELECT id FROM profile LIMIT 1`);

  if (!result.rows || result.rows.length === 0) {
    const userId = uuidv4();

    db.execute(
      `INSERT INTO profile (id, created_at, is_pro)
       VALUES (?, ?, ?)`,
      [userId, Date.now(), 0]
    );
  }
};
