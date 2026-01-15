import { getDB } from '../db';
import { Item } from '../types/inventory';

const now = () => Date.now();

export const getAllItems = (): Item[] => {
  const db = getDB();
  const result = db.execute(`SELECT * FROM items ORDER BY name`);

  return result.rows?._array.map((row: any) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })) ?? [];
};

export const addItem = (name: string, sku?: string) => {
  const db = getDB();
  db.execute(
    `INSERT INTO items (name, sku, quantity, created_at, updated_at)
     VALUES (?, ?, 0, ?, ?)`,
    [name, sku ?? null, now(), now()]
  );
};
