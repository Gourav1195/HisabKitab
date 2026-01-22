import { getDB } from '../db';

export const updateProfile = (data: {
  shop_name?: string;
  phone?: string;
  email?: string;
}) => {
  const db = getDB();

  db.execute(
    `UPDATE profile
     SET shop_name = ?, phone = ?, email = ?
     WHERE id = (SELECT id FROM profile LIMIT 1)`,
    [data.shop_name, data.phone, data.email]
  );
};
