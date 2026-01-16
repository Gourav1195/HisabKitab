import { getDB, isDBReady } from '../db';

export type Sale = {
  id: number;
  createdAt: number;
  total: number;
};

export const getSales = (): Sale[] => {
   if (!isDBReady()) {
    return [];
  }
  const db = getDB();

  const result = db.execute(
    `SELECT
       id,
       created_at,
       total
     FROM sales
     ORDER BY created_at DESC`
  );

  return (
    result.rows?._array.map((row: any) => ({
      id: row.id,
      createdAt: row.created_at,
      total: row.total,
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

