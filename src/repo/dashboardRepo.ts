import { getDB, isDBReady } from '../db';

export const getTodaySalesSummary = () => {
  if (!isDBReady()) return { total: 0, count: 0 };

  const db = getDB();
  const since = startOfToday();

  const res = db.execute(
    `
    SELECT
      COUNT(DISTINCT s.id) as count,
      COALESCE(SUM(
        si.price * (si.quantity - si.returned_qty)
      ), 0) as total
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    WHERE s.created_at >= ?
    `,
    [since]
  );

  const row = firstRow(res);
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

const firstRow = (res: any) => {
  if (!res || !res.rows || !res.rows._array || res.rows._array.length === 0) {
    return null;
  }
  return res.rows._array[0];
};

export const getLast7DaysSales = () => {
  const db = getDB();
  const now = new Date();
  const days: { day: string; total: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const start = new Date(d.setHours(0, 0, 0, 0)).getTime();
    const end = new Date(d.setHours(23, 59, 59, 999)).getTime();

    const result = db.execute(
      `SELECT COALESCE(SUM(
          si.price * (si.quantity - si.returned_qty)
        ), 0) as total
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        WHERE s.created_at BETWEEN ? AND ?
`,
      [start, end]
    );

    days.push({
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      total: result.rows?._array?.[0]?.total ?? 0,
    });
  }

  return days;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Mon start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/* ---------------- TODAY ---------------- */

export const getTodayStats = () => {
  if (!isDBReady()) return { total: 0, count: 0, itemsSold: 0 };

  const db = getDB();
  const since = startOfToday();

  const res = db.execute(
    `
    SELECT
      COUNT(DISTINCT s.id) as count,
      COALESCE(SUM(
        si.price * (si.quantity - si.returned_qty)
      ), 0) as total,
      COALESCE(SUM(
        si.quantity - si.returned_qty
      ), 0) as itemsSold
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    WHERE s.created_at >= ?
    `,
    [since]
  );

  const row = firstRow(res);
  return {
    count: row?.count ?? 0,
    total: row?.total ?? 0,
    itemsSold: row?.itemsSold ?? 0,
  };
};

/* ---------------- WEEK ---------------- */

export const getWeeklyStats = () => {
  if (!isDBReady()) return { total: 0, avgPerDay: 0 };

  const db = getDB();
  const since = startOfWeek();

  const res = db.execute(
    `
    SELECT COALESCE(SUM(
      si.price * (si.quantity - si.returned_qty)
    ), 0) as total
    FROM sales s
    JOIN sale_items si ON si.sale_id = s.id
    WHERE s.created_at >= ?
    `,
    [since]
  );


  const row = firstRow(res);
  const total = row ? row.total : 0;

  return {
    total,
    avgPerDay: Math.round(total / 7),
  };
};

/* ---------------- INVENTORY ---------------- */

export const getInventoryHealth = () => {
  if (!isDBReady()) return { totalItems: 0, lowStock: 0, outOfStock: 0 };

  const db = getDB();

  const totalRes = db.execute(
    `SELECT COUNT(*) as count
     FROM items
     WHERE is_deleted = 0`
  );

  const lowRes = db.execute(
    `SELECT COUNT(*) as count
     FROM items
     WHERE is_deleted = 0
       AND quantity_left <= low_stock_threshold
       AND quantity_left > 0`
  );

  const outRes = db.execute(
    `SELECT COUNT(*) as count
     FROM items
     WHERE is_deleted = 0
       AND quantity_left = 0`
  );

  const totalRow = firstRow(totalRes);
  const lowRow = firstRow(lowRes);
  const outRow = firstRow(outRes);

  return {
    totalItems: totalRow ? totalRow.count : 0,
    lowStock: lowRow ? lowRow.count : 0,
    outOfStock: outRow ? outRow.count : 0,
  };
};

/* ---------------- LAST SALE ---------------- */

export const getLastSale = () => {
  if (!isDBReady()) return null;

  const db = getDB();
  const res = db.execute(
    `SELECT id, created_at, total
     FROM sales
     ORDER BY created_at DESC
     LIMIT 1`
  );

  const row = firstRow(res);

  if (!row) return null;

  return {
    id: row.id,
    createdAt: row.created_at,
    total: row.total,
  };
};

export const getBestSellerToday = () => {
  if (!isDBReady()) return null;

  const db = getDB();
  const since = startOfToday();

  const res = db.execute(
    `
    SELECT 
      i.id,
      i.name,
      SUM(si.quantity - si.returned_qty) as qty
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN items i ON i.id = si.item_id
    WHERE s.created_at >= ?
    GROUP BY i.id
    ORDER BY qty DESC
    LIMIT 1
    `,
    [since]
  );

  const row = firstRow(res);
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    quantity: row.qty,
  };
};

export const getTopItemsThisWeek = () => {
  if (!isDBReady()) return [];

  const db = getDB();
  const since = startOfWeek();

  const res = db.execute(
    `
    SELECT 
      i.id,
      i.name,
      SUM(si.quantity) as qty
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN items i ON i.id = si.item_id
    WHERE s.created_at >= ?
    GROUP BY i.id
    ORDER BY qty DESC
    LIMIT 3
    `,
    [since]
  );

  return (
    res.rows?._array.map((row: any) => ({
      id: row.id,
      name: row.name,
      quantity: row.qty,
    })) ?? []
  );
};
