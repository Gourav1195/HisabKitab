import { getDB } from '../db';
import { Item } from '../types/inventory';

const now = () => Date.now();

export const getAllItems = (): Item[] => {
  const db = getDB();
  const result = db.execute(`
    SELECT
  id,
  name,
  barcode,
  sku,
  sell_price,
  buy_price,
  quantity,
  low_stock_threshold,
  created_at,
  updated_at
FROM items
WHERE is_deleted = 0
ORDER BY name
`);
  // const result = db.execute(`SELECT * FROM items  where is_deleted = 0 ORDER BY name`);

  return result.rows?._array.map((row: any) => ({
    id: row.id,
    name: row.name,
    sku: row.sku ?? 0,
    barcode: row.barcode ?? '',
    sell_price: row.sell_price,
    buy_price: row.buy_price ?? 0,
    quantity: row.quantity,
    low_stock_threshold: row.low_stock_threshold,
    isDeleted: row.is_deleted,
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

export const getArchivedItems = (): Item[] => {
  const db = getDB();
  const result = db.execute(
    `SELECT
      id,
      name,
      barcode,
      sku,
      sell_price,
      buy_price,
      quantity,
      created_at,
      updated_at
     FROM items
     WHERE is_deleted = 1
     ORDER BY updated_at DESC`
  );

  return (
    result.rows?._array.map((row: any) => ({
      id: row.id,
      name: row.name,
      barcode: row.barcode,
      sku: row.sku,
      sell_price: row.sell_price,
      buy_price: row.buy_price,
      quantity: row.quantity,
      low_stock_threshold: row.low_stock_threshold,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) ?? []
  );
};

export const restoreItem = (itemId: number) => {
  const db = getDB();
  db.execute(
    `UPDATE items
     SET is_deleted = 0, updated_at = ?
     WHERE id = ?`,
    [Date.now(), itemId]
  );
};

export const adjustItemQty = (itemId: number, delta: number) => {
  const db = getDB();
  const now = Date.now();

  db.execute(
    `UPDATE items
     SET
       quantity = quantity + ?,
       quantity_left = quantity_left + ?,
       updated_at = ?
     WHERE id = ? AND is_deleted = 0`,
    [delta, delta, now, itemId]
  );
};


export const getLowStockItems = (): Item[] => {
  const db = getDB();
  const result = db.execute(
    `SELECT
      id,
      name,
      barcode,
      sku,
      sell_price,
      buy_price,
      quantity,
      low_stock_threshold,
      created_at,
      updated_at
     FROM items
     WHERE is_deleted = 0
       AND quantity <= low_stock_threshold
     ORDER BY quantity ASC`
  );

  return (
    result.rows?._array.map((row: any) => ({
      id: row.id,
      name: row.name,
      barcode: row.barcode,
      sku: row.sku,
      sell_price: row.sell_price,
      buy_price: row.buy_price,
      quantity: row.quantity,
      low_stock_threshold: row.low_stock_threshold,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) ?? []
  );
};
