import { getDB, isDBReady } from '../db';
import { Item } from '../types/inventory';

const now = () => Date.now();

export const getAllItems = (): Item[] => {
  if (!isDBReady()) {
    return [];
  }
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
      quantity_left,
      low_stock_threshold,
      created_at,
      updated_at
    FROM items
    WHERE is_deleted = 0
    ORDER BY name
  `);

  return result.rows?._array.map((row: any) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    sell_price: row.sell_price,
    buy_price: row.buy_price,
    quantity: row.quantity,
    quantity_left: row.quantity_left,
    low_stock_threshold: row.low_stock_threshold,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) ?? [];
};

export const addItem = (name: string, sku?: string) => {
  if (!isDBReady()) {
    return [];
  }
  const db = getDB();
  const ts = now();
  db.execute(
    `INSERT INTO items (name, sku, quantity, quantity_left, created_at, updated_at)
     VALUES (?, ?, 0, 0, ?, ?)`,
    [name, sku ?? null, ts, ts]
  );
};

export const getArchivedItems = (): Item[] => {
  if (!isDBReady()) {
    return [];
  }

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
      quantity_left,
      low_stock_threshold,
      is_deleted,
      created_at,
      updated_at
    FROM items
    WHERE is_deleted = 1
    ORDER BY updated_at DESC
  `);

  return result.rows?._array.map((row: any) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    sell_price: row.sell_price,
    buy_price: row.buy_price,
    quantity: row.quantity,
    quantity_left: row.quantity_left,
    low_stock_threshold: row.low_stock_threshold,
    is_deleted: row.is_deleted,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) ?? [];
};

export const restoreItem = (itemId: number) => {
  if (!isDBReady()) {
    return [];
  }
  const db = getDB();
  db.execute(
    `UPDATE items
     SET is_deleted = 0, updated_at = ?
     WHERE id = ?`,
    [Date.now(), itemId]
  );
};

const logStockMovement = (
  itemId: number,
  action: QtyAction,
  quantity: number,
  note?: string
) => {
  if (!isDBReady()) {
    return [];
  }
  const db = getDB();
  db.execute(
    `INSERT INTO stock_movements (item_id, action, quantity, note, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [itemId, action, quantity, note ?? null, Date.now()]
  );
};


export type QtyAction = 'RESTOCK' | 'SALE' | 'SET';

export const adjustItemQty = (
  itemId: number,
  amount: number,
  action: QtyAction,
  note?: string
) => {
  if (!isDBReady()) return;

  const db = getDB();
  const ts = Date.now();

  if (action === 'RESTOCK') {
    db.execute(
      `UPDATE items
       SET quantity = quantity + ?,
           quantity_left = quantity_left + ?,
           updated_at = ?
       WHERE id = ?`,
      [amount, amount, ts, itemId]
    );
  }

  if (action === 'SALE') {
    db.execute(
      `UPDATE items
       SET quantity_left = MAX(quantity_left - ?, 0),
           updated_at = ?
       WHERE id = ?`,
      [amount, ts, itemId]
    );
  }

  if (action === 'SET') {
    db.execute(
      `UPDATE items
       SET quantity = ?,
           quantity_left = ?,
           updated_at = ?
       WHERE id = ?`,
      [amount, amount, ts, itemId]
    );
  }

  logStockMovement(itemId, action, amount, note);
};

export const getRecentStockHistory = (itemId: number, limit = 5) => {
  if (!isDBReady()) {
    return [];
  }
  const db = getDB();
  const result = db.execute(
    `SELECT *
     FROM stock_movements
     WHERE item_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [itemId, limit]
  );

  return result.rows?._array ?? [];
};


export const getLowStockItems = (): Item[] => {
  if (!isDBReady()) {
    return [];
  }
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
      quantity_left,
      low_stock_threshold,
      created_at,
      updated_at
     FROM items
     WHERE is_deleted = 0
        AND quantity_left <= low_stock_threshold
      ORDER BY quantity_left ASC
`
  );

  return (
    result.rows?._array.map((row: any) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      barcode: row.barcode,
      sell_price: row.sell_price,
      buy_price: row.buy_price,
      quantity: row.quantity,
      quantity_left: row.quantity_left,
      low_stock_threshold: row.low_stock_threshold,
      is_deleted: row.is_deleted,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) ?? []
  );
};
