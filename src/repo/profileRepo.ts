import { getDB } from '../db';

export const getProfile = () => {
  const db = getDB();
  const res = db.execute(`SELECT * FROM profile LIMIT 1`);
  return res.rows?.item(0) ?? null;
};

export const updateProfile = (data: {
  shop_name?: string;
  phone?: string;
}) => {
  const db = getDB();
  db.execute(
    `UPDATE profile
     SET shop_name = ?, phone = ?
     WHERE id = (SELECT id FROM profile LIMIT 1)`,
    [data.shop_name ?? null, data.phone ?? null]
  );
};
