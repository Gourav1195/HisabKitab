import { getDB, isDBReady } from '../db';

export const getTodaySalesSummary = () => {
  if (!isDBReady()) {
    return { total: 0, count: 0 };
  }

  const db = getDB();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = db.execute(
    `SELECT
       COUNT(*) as count,
       COALESCE(SUM(total), 0) as total
     FROM sales
     WHERE created_at >= ?`,
    [startOfDay.getTime()]
  );

  const row = result.rows?._array?.[0];
  return {
    count: row?.count ?? 0,
    total: row?.total ?? 0,
  };
};

export const getInventorySummary = () => {
  if (!isDBReady()) {
    return { totalItems: 0, lowStock: 0 };
  }

  const db = getDB();

  const totalItemsResult = db.execute(
    `SELECT COUNT(*) as count
     FROM items
     WHERE is_deleted = 0`
  );

  const lowStockResult = db.execute(
    `SELECT COUNT(*) as count
     FROM items
     WHERE is_deleted = 0
       AND quantity_left <= low_stock_threshold`
  );

  return {
    totalItems: totalItemsResult.rows?._array?.[0]?.count ?? 0,
    lowStock: lowStockResult.rows?._array?.[0]?.count ?? 0,
  };
};
