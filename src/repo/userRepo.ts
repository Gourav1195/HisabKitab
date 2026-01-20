//userRepo.ts
import { getDB, isDBReady } from "../db";

const firstRow = (res: any) => {
  if (!res || !res.rows || !res.rows._array || res.rows._array.length === 0) {
    return null;
  }
  return res.rows._array[0];
};

export const isProUser = () => {
    if (!isDBReady()) {
      return [];
    }
  const db = getDB();
   
  const res = db.execute(
    `SELECT is_pro FROM profile LIMIT 1`
  );
  return res.rows?._array?.[0]?.is_pro === 1;
};

export const initProfile = () => {
  const db = getDB();
  const res = db.execute(`SELECT COUNT(*) as count FROM profile`);
  const first = firstRow(res);
  if (first.count === 0) {
    db.execute(`INSERT INTO profile (is_pro) VALUES (0)`);
  }
};
