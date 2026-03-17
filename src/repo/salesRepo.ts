import { getDB, isDBReady } from '../db';

export type Sale = {
  // join sale_items → items in getSales(), add to Sale type:
items: Array<{ name: string; quantity: number; price: number }>
isCredit: boolean  // from sales.is_credit
};

export const getSales = (): Sale[] => {
   if (!isDBReady()) {
    return [];
  }
  const db = getDB();

  const result = db.execute(
    `SELECT
       s.id,
       s.created_at,
       s.total,
       s.is_credit,
       json_group_array(json_object('name', i.name, 'quantity', si.quantity, 'price', si.price)) as items
     FROM sales s
     LEFT JOIN sale_items si ON si.sale_id = s.id
     LEFT JOIN items i ON i.id = si.item_id
     GROUP BY s.id
     ORDER BY s.created_at DESC`
  );

  return (
    result.rows?._array.map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      total: row.total,
      isCredit: row.is_credit,
      items: row.items ? JSON.parse(row.items).filter((item: any) => item.name !== null) : [],
    })) ?? []
  );
};

export const getSaleItems = (saleId: number) => {
  if (!isDBReady()) {
    return [];
  }
  const db = getDB();

  const result = db.execute(
    `SELECT
       si.id,
       si.quantity,
       si.price,
       i.name
     FROM sale_items si
     JOIN items i ON i.id = si.item_id
     WHERE si.sale_id = ?`,
    [saleId]
  );

  return result.rows?._array ?? [];
};

export const returnSaleItem = (
  saleItemId: number,
  returnQty: number
) => {
  const db = getDB();
  const now = Date.now();

  db.execute('BEGIN TRANSACTION');

  try {
    // 1. Update sale_items
    db.execute(
      `
      UPDATE sale_items
      SET returned_qty = returned_qty + ?,
          returned_at = ?
      WHERE id = ?
        AND (quantity - returned_qty) >= ?
      `,
      [returnQty, now, saleItemId, returnQty]
    );

    // 2. Restore stock
    db.execute(
      `
      UPDATE items
      SET quantity_left = quantity_left + ?,
          updated_at = ?
      WHERE id = (
        SELECT item_id FROM sale_items WHERE id = ?
      )
      `,
      [returnQty, now, saleItemId]
    );

    db.execute('COMMIT');
  } catch (e) {
    db.execute('ROLLBACK');
    throw e;
  }
};
