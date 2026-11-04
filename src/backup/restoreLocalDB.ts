import { getDB } from '../db';
// import { initDB } from '../db';

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

// Only insert columns that exist in this app version's table. Backups from an
// older or newer version may have extra or missing columns.
const tableColumns = (db: any, table: string): Set<string> => {
  const res = db.execute(`PRAGMA table_info(${table})`);
  const rows: any[] = res.rows?._array ?? [];
  return new Set(rows.map(r => r.name));
};

const insertMany = (db: any, table: string, rows: any[]) => {
  if (!Array.isArray(rows) || !rows.length) return;

  const known = tableColumns(db, table);
  const keys = Object.keys(rows[0]).filter(k => known.has(k));
  if (!keys.length) return;

  const placeholders = keys.map(() => '?').join(',');
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;

  rows.forEach(row => {
    db.execute(sql, keys.map(k => row[k] ?? null));
  });
};
