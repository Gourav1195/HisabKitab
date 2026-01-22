import { getDB } from '../db';
import { initDB } from '../db';

export const resetAndRestoreDB = async (payload: any) => {
  const db = getDB();

  db.execute('BEGIN');

  try {
    // 🔥 wipe
    db.execute('DELETE FROM items');
    db.execute('DELETE FROM customers');
    db.execute('DELETE FROM sales');
    db.execute('DELETE FROM sale_items');
    db.execute('DELETE FROM ledger');
    db.execute('DELETE FROM stock_movements');
    db.execute('DELETE FROM profile');

    // 🧱 restore order matters
    payload.profile && insertMany(db, 'profile', payload.profile);
    payload.items && insertMany(db, 'items', payload.items);
    payload.customers && insertMany(db, 'customers', payload.customers);
    payload.sales && insertMany(db, 'sales', payload.sales);
    payload.sale_items && insertMany(db, 'sale_items', payload.sale_items);
    payload.ledger && insertMany(db, 'ledger', payload.ledger);
    payload.stock_movements && insertMany(db, 'stock_movements', payload.stock_movements);

    db.execute('COMMIT');
  } catch (e) {
    db.execute('ROLLBACK');
    throw e;
  }
};

const insertMany = (db: any, table: string, rows: any[]) => {
  if (!rows.length) return;

  const keys = Object.keys(rows[0]);
  const placeholders = keys.map(() => '?').join(',');

  const sql = `
    INSERT INTO ${table} (${keys.join(',')})
    VALUES (${placeholders})
  `;

  rows.forEach(row => {
    db.execute(sql, keys.map(k => row[k]));
  });
};
