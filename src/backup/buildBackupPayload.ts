import { getDB } from '../db';

export const buildBackupPayload = () => {
  const db = getDB();

  const readTable = (table: string) => {
    const res = db.execute(`SELECT * FROM ${table}`);
    return res.rows?._array ?? [];
  };

  return {
    profile: readTable('profile'),
    items: readTable('items'),
    customers: readTable('customers'),
    sales: readTable('sales'),
    sale_items: readTable('sale_items'),
    ledger: readTable('ledger'),
    stock_movements: readTable('stock_movements'),
  };
};
