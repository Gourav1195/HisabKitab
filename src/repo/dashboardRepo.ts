import { getDB, isDBReady } from '../db';

const firstRow = (res: any) => {
  if (!res || !res.rows || !res.rows._array || res.rows._array.length === 0) return null;
  return res.rows._array[0];
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/* ═══════════════════════════════════════════════════════════════
   TIME RANGE TYPE
   ═══════════════════════════════════════════════════════════════ */
export type TimeRange = 'today' | 'week' | 'month';

/* ═══════════════════════════════════════════════════════════════
   THE BIG 3 NUMBERS (with time range)
   ═══════════════════════════════════════════════════════════════ */
export const getBigThree = (range: TimeRange = 'today') => {
  if (!isDBReady()) {
    return { todayCash: 0, todayCredit: 0, itemsSold: 0, totalSales: 0 };
  }

  const db = getDB();
  const since = range === 'today' ? startOfToday() : range === 'week' ? startOfWeek() : startOfMonth();

  const res = db.execute(
    `
    SELECT 
      COALESCE(SUM(CASE WHEN s.is_credit = 0 THEN s.total ELSE 0 END), 0) as cash,
      COALESCE(SUM(CASE WHEN s.is_credit = 1 THEN s.total ELSE 0 END), 0) as credit,
      COALESCE(SUM(si.quantity - si.returned_qty), 0) as items,
      COALESCE(SUM(s.total), 0) as total
    FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
    WHERE s.created_at >= ?
    `,
    [since]
  );

  const row = firstRow(res);

  return {
    todayCash: Math.round(row?.cash ?? 0),
    todayCredit: Math.round(row?.credit ?? 0),
    itemsSold: Math.round(row?.items ?? 0),
    totalSales: Math.round(row?.total ?? 0),
  };
};

/* ═══════════════════════════════════════════════════════════════
   SALES TREND (for LineChart - changes based on range)
   ═══════════════════════════════════════════════════════════════ */
export const getSalesTrend = (range: TimeRange = 'week') => {
  const db = getDB();
  const data: { label: string; value: number; time: number }[] = [];

  if (range === 'today') {
    // Hourly breakdown for today
    for (let i = 0; i < 12; i++) {
      const start = new Date();
      start.setHours(i * 2, 0, 0, 0);
      const end = new Date();
      end.setHours(i * 2 + 2, 0, 0, 0);

      const result = db.execute(
        `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE created_at BETWEEN ? AND ?`,
        [start.getTime(), end.getTime()]
      );

      data.push({
        label: `${i * 2}:00`,
        value: result.rows?._array?.[0]?.total ?? 0,
        time: start.getTime(),
      });
    }
  } else if (range === 'week') {
    // Daily breakdown for 7 days
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const start = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const end = new Date(d.setHours(23, 59, 59, 999)).getTime();

      const result = db.execute(
        `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE created_at BETWEEN ? AND ?`,
        [start, end]
      );

      data.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        value: result.rows?._array?.[0]?.total ?? 0,
        time: start,
      });
    }
  } else {
    // Daily breakdown for 30 days (month)
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const start = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const end = new Date(d.setHours(23, 59, 59, 999)).getTime();

      const result = db.execute(
        `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE created_at BETWEEN ? AND ?`,
        [start, end]
      );

      // Show date every 5 days to avoid clutter
      data.push({
        label: i % 5 === 0 ? d.getDate().toString() : '',
        value: result.rows?._array?.[0]?.total ?? 0,
        time: start,
      });
    }
  }

  return data;
};

/* ═══════════════════════════════════════════════════════════════
   CASH VS CREDIT (for Bar Comparison Chart)
   ═══════════════════════════════════════════════════════════════ */
export const getCashVsCredit = (range: TimeRange = 'week') => {
  if (!isDBReady()) return { cash: 0, credit: 0, cashPercent: 50, creditPercent: 50 };

  const db = getDB();
  const since = range === 'today' ? startOfToday() : range === 'week' ? startOfWeek() : startOfMonth();

  const res = db.execute(
    `
    SELECT 
      COALESCE(SUM(CASE WHEN is_credit = 0 THEN total ELSE 0 END), 0) as cash,
      COALESCE(SUM(CASE WHEN is_credit = 1 THEN total ELSE 0 END), 0) as credit
    FROM sales
    WHERE created_at >= ?
    `,
    [since]
  );

  const row = firstRow(res);
  const cash = Math.round(row?.cash ?? 0);
  const credit = Math.round(row?.credit ?? 0);
  const total = cash + credit;

  return {
    cash,
    credit,
    cashPercent: total > 0 ? Math.round((cash / total) * 100) : 50,
    creditPercent: total > 0 ? Math.round((credit / total) * 100) : 50,
  };
};

/* ═══════════════════════════════════════════════════════════════
   INVENTORY ALERTS
   ═══════════════════════════════════════════════════════════════ */
export const getInventoryAlerts = () => {
  if (!isDBReady()) return { lowStock: 0, outOfStock: 0 };

  const db = getDB();

  const lowRes = db.execute(
    `SELECT COUNT(*) as count FROM items
     WHERE is_deleted = 0 AND quantity_left <= low_stock_threshold AND quantity_left > 0`
  );

  const outRes = db.execute(
    `SELECT COUNT(*) as count FROM items
     WHERE is_deleted = 0 AND quantity_left = 0`
  );

  return {
    lowStock: firstRow(lowRes)?.count ?? 0,
    outOfStock: firstRow(outRes)?.count ?? 0,
  };
};

/* ═══════════════════════════════════════════════════════════════
   TOP SELLERS (with time range)
   ═══════════════════════════════════════════════════════════════ */
export const getTopSellers = (range: TimeRange = 'week', limit: number = 3) => {
  if (!isDBReady()) return [];

  const db = getDB();
  const since = range === 'today' ? startOfToday() : range === 'week' ? startOfWeek() : startOfMonth();

  const res = db.execute(
    `SELECT i.id, i.name, SUM(si.quantity - si.returned_qty) as qty
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN items i ON i.id = si.item_id
     WHERE s.created_at >= ?
     GROUP BY i.id
     ORDER BY qty DESC
     LIMIT ?`,
    [since, limit]
  );

  return (
    res.rows?._array?.map((row: any) => ({
      id: row.id,
      name: row.name,
      quantity: row.qty,
    })) ?? []
  );
};

/* ═══════════════════════════════════════════════════════════════
   CREDIT TO COLLECT (total outstanding)
   ═══════════════════════════════════════════════════════════════ */
export const getCreditToCollect = () => {
  if (!isDBReady()) return 0;

  const db = getDB();

  const res = db.execute(
    `SELECT COALESCE(SUM(
       CASE WHEN direction = 'DEBIT' THEN amount
            WHEN direction = 'CREDIT' THEN -amount
            ELSE 0 END
     ), 0) as outstanding
     FROM ledger WHERE customer_id IS NOT NULL`
  );

  return Math.round(firstRow(res)?.outstanding ?? 0);
};


// const firstRow = (res: any) => {
//   if (!res || !res.rows || !res.rows._array || res.rows._array.length === 0) {
//     return null;
//   }
//   return res.rows._array[0];
// };

// const startOfToday = () => {
//   const d = new Date();
//   d.setHours(0, 0, 0, 0);
//   return d.getTime();
// };

// // 1. ONE HONEST HEADLINE
// export const getHonestHeadline = (): { amount: number; type: 'cash' | 'owed' | 'quiet' } => {
//   if (!isDBReady()) return { amount: 0, type: 'quiet' };

//   const db = getDB();
//   const todayStart = startOfToday();
  
//   // Cash collected today
//   const cashTodayRes = db.execute(`
//     SELECT COALESCE(SUM(s.total), 0) as cash
//     FROM sales s
//     WHERE s.created_at >= ? AND s.is_credit = 0
//   `, [todayStart]);
  
//   const cashToday = firstRow(cashTodayRes)?.cash || 0;
  
//   // If there's cash collected today, show that
//   if (cashToday > 0) {
//     return { amount: Math.round(cashToday), type: 'cash' };
//   }
  
//   // Otherwise check total outstanding credit
//   const owedRes = db.execute(`
//     SELECT COALESCE(SUM(
//       CASE 
//         WHEN direction = 'DEBIT' THEN amount
//         WHEN direction = 'CREDIT' THEN -amount
//         ELSE 0
//       END
//     ), 0) as outstanding
//     FROM ledger
//     WHERE customer_id IS NOT NULL
//   `);
  
//   const owed = firstRow(owedRes)?.outstanding || 0;
  
//   if (owed > 0) {
//     return { amount: Math.round(owed), type: 'owed' };
//   }
  
//   // Nothing today, nothing owed
//   return { amount: 0, type: 'quiet' };
// };

// // 2. TODAY SNAPSHOT (cash & credit only)
// export const getTodaySnapshot = () => {
//   if (!isDBReady()) return { cash: 0, credit: 0 };
  
//   const db = getDB();
//   const since = startOfToday();
  
//   const res = db.execute(`
//     SELECT 
//       SUM(CASE WHEN s.is_credit = 0 THEN s.total ELSE 0 END) as cash,
//       SUM(CASE WHEN s.is_credit = 1 THEN s.total ELSE 0 END) as credit
//     FROM sales s
//     WHERE s.created_at >= ?
//   `, [since]);
  
//   const row = firstRow(res);
  
//   return {
//     cash: row?.cash || 0,
//     credit: row?.credit || 0,
//   };
// };

// // 3. SILENT RISKS (only when they exist)
// export const getSilentRisks = (): { 
//   lowStock: number; 
//   outOfStock: number; 
//   backupStatus: 'none' | 'recent' | 'warning' | 'danger';
//   backupDays?: number;
// } => {
//   if (!isDBReady()) return { 
//     lowStock: 0, 
//     outOfStock: 0, 
//     backupStatus: 'none'
//   };

//   const db = getDB();

//   // Low stock
//   const lowRes = db.execute(`
//     SELECT COUNT(*) as count
//     FROM items
//     WHERE is_deleted = 0
//       AND quantity_left <= low_stock_threshold
//       AND quantity_left > 0
//   `);

//   // Out of stock
//   const outRes = db.execute(`
//     SELECT COUNT(*) as count
//     FROM items
//     WHERE is_deleted = 0
//       AND quantity_left = 0
//   `);

//   // Backup status
//   const backupRes = db.execute(`
//     SELECT last_backup_at 
//     FROM profile 
//     LIMIT 1
//   `);

//   const lowStock = firstRow(lowRes)?.count || 0;
//   const outOfStock = firstRow(outRes)?.count || 0;
//   const backupAt = firstRow(backupRes)?.last_backup_at;

//   let backupStatus: 'none' | 'recent' | 'warning' | 'danger' = 'none';
//   let backupDays: number | undefined;

//   if (!backupAt) {
//     backupStatus = 'none';
//   } else {
//     const diffMs = Date.now() - backupAt;
//     backupDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
//     if (backupDays <= 3) {
//       backupStatus = 'recent';
//     } else if (backupDays <= 7) {
//       backupStatus = 'warning';
//     } else {
//       backupStatus = 'danger';
//     }
//   }

//   return {
//     lowStock,
//     outOfStock,
//     backupStatus,
//     backupDays: backupDays
//   };
// };

// // 4. CREDIT HINT (not dashboard)
// export const getCreditHint = () => {
//   if (!isDBReady()) return { 
//     totalOutstanding: 0, 
//     oldestOverdue: null,
//     hasOverdue: false
//   };

//   const db = getDB();

//   // Total outstanding
//   const totalRes = db.execute(`
//     SELECT 
//       COALESCE(SUM(
//         CASE 
//           WHEN direction = 'DEBIT' THEN amount
//           WHEN direction = 'CREDIT' THEN -amount
//           ELSE 0
//         END
//       ), 0) as outstanding
//     FROM ledger
//     WHERE customer_id IS NOT NULL
//   `);
  
//   const totalOutstanding = firstRow(totalRes)?.outstanding || 0;
  
//   // Oldest unpaid over 30 days
//   const oldestRes = db.execute(`
//     SELECT 
//       c.name,
//       l.created_at,
//       (strftime('%s', 'now') * 1000 - l.created_at) / (1000 * 60 * 60 * 24) as days_ago
//     FROM ledger l
//     JOIN customers c ON c.id = l.customer_id
//     WHERE l.direction = 'DEBIT'
//     AND l.created_at <= (strftime('%s', 'now') * 1000 - 30 * 24 * 60 * 60 * 1000)
//     ORDER BY l.created_at ASC
//     LIMIT 1
//   `);
  
//   const oldestRow = firstRow(oldestRes);
//   const hasOverdue = oldestRow?.days_ago >= 30;
  
//   return {
//     totalOutstanding: Math.round(totalOutstanding),
//     oldestOverdue: hasOverdue ? {
//       days: Math.round(oldestRow.days_ago),
//       name: oldestRow.name
//     } : null,
//     hasOverdue
//   };
// };

// // 5. SIMPLE WEEK COMPARISON (no chart spam)
// export const getWeekComparison = () => {
//   if (!isDBReady()) return null;

//   const db = getDB();
//   const now = new Date();
  
//   // This week (Mon-Sun)
//   const thisMonday = new Date(now);
//   const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
//   const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
//   thisMonday.setDate(now.getDate() + diffToMonday);
//   thisMonday.setHours(0, 0, 0, 0);
  
//   // Last week
//   const lastMonday = new Date(thisMonday);
//   lastMonday.setDate(lastMonday.getDate() - 7);
  
//   const thisWeekStart = thisMonday.getTime();
//   const lastWeekStart = lastMonday.getTime();
  
//   // This week total
//   const thisWeekRes = db.execute(`
//     SELECT COALESCE(SUM(
//       si.price * (si.quantity - si.returned_qty)
//     ), 0) as total
//     FROM sales s
//     JOIN sale_items si ON si.sale_id = s.id
//     WHERE s.created_at >= ?
//   `, [thisWeekStart]);
  
//   // Last week total
//   const lastWeekRes = db.execute(`
//     SELECT COALESCE(SUM(
//       si.price * (si.quantity - si.returned_qty)
//     ), 0) as total
//     FROM sales s
//     JOIN sale_items si ON si.sale_id = s.id
//     WHERE s.created_at >= ? AND s.created_at < ?
//   `, [lastWeekStart, thisWeekStart]);
  
//   const thisWeekTotal = firstRow(thisWeekRes)?.total || 0;
//   const lastWeekTotal = firstRow(lastWeekRes)?.total || 0;
  
//   return {
//     thisWeek: Math.round(thisWeekTotal),
//     lastWeek: Math.round(lastWeekTotal),
//     comparison: lastWeekTotal > 0 
//       ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
//       : 0
//   };
// };

// // 6. ONE NUDGE (only when needed)
// export const getOneNudge = (): { message: string; type: 'none' | 'reminder' | 'action' } => {
//   if (!isDBReady()) return { message: 'Everything looks good', type: 'none' };

//   const db = getDB();
//   const todayStart = startOfToday();
  
//   // No sales today?
//   const salesRes = db.execute(`
//     SELECT COUNT(*) as count
//     FROM sales
//     WHERE created_at >= ?
//   `, [todayStart]);
  
//   const salesCount = firstRow(salesRes)?.count || 0;
  
//   if (salesCount === 0) {
//     return { 
//       message: 'No sales recorded today', 
//       type: 'reminder' 
//     };
//   }
  
//   // Check for unentered credit payments
//   const pendingRes = db.execute(`
//     SELECT COUNT(DISTINCT customer_id) as count
//     FROM ledger
//     WHERE direction = 'DEBIT'
//     GROUP BY customer_id
//     HAVING SUM(CASE 
//       WHEN direction = 'DEBIT' THEN amount
//       WHEN direction = 'CREDIT' THEN -amount
//     END) > 0
//   `);
  
//   const pendingCount = firstRow(pendingRes)?.count || 0;
  
//   if (pendingCount > 0) {
//     return { 
//       message: `${pendingCount} credit payments pending entry`, 
//       type: 'action' 
//     };
//   }
  
//   // Check if inventory hasn't been updated today
//   const inventoryRes = db.execute(`
//     SELECT COUNT(*) as count
//     FROM stock_movements
//     WHERE created_at >= ?
//   `, [todayStart]);
  
//   const inventoryCount = firstRow(inventoryRes)?.count || 0;
  
//   if (inventoryCount === 0) {
//     return { 
//       message: 'Inventory not updated today', 
//       type: 'reminder' 
//     };
//   }
  
//   return { message: 'Everything looks good', type: 'none' };
// };

//old code

// export const getTodaySalesSummary = () => {
//   if (!isDBReady()) return { total: 0, count: 0 };

//   const db = getDB();
//   const since = startOfToday();

//   const res = db.execute(
//     `
//     SELECT
//       COUNT(DISTINCT s.id) as count,
//       COALESCE(SUM(
//         si.price * (si.quantity - si.returned_qty)
//       ), 0) as total
//     FROM sales s
//     JOIN sale_items si ON si.sale_id = s.id
//     WHERE s.created_at >= ?
//     `,
//     [since]
//   );

//   const row = firstRow(res);
//   return {
//     count: row?.count ?? 0,
//     total: row?.total ?? 0,
//   };
// };


// export const getInventorySummary = () => {
//   if (!isDBReady()) {
//     return { totalItems: 0, lowStock: 0 };
//   }

//   const db = getDB();

//   const totalItemsResult = db.execute(
//     `SELECT COUNT(*) as count
//      FROM items
//      WHERE is_deleted = 0`
//   );

//   const lowStockResult = db.execute(
//     `SELECT COUNT(*) as count
//      FROM items
//      WHERE is_deleted = 0
//        AND quantity_left <= low_stock_threshold`
//   );

//   return {
//     totalItems: totalItemsResult.rows?._array?.[0]?.count ?? 0,
//     lowStock: lowStockResult.rows?._array?.[0]?.count ?? 0,
//   };
// };

// const firstRow = (res: any) => {
//   if (!res || !res.rows || !res.rows._array || res.rows._array.length === 0) {
//     return null;
//   }
//   return res.rows._array[0];
// };

// export const getLast7DaysSales = () => {
//   const db = getDB();
//   const now = new Date();
//   const days: { day: string; total: number }[] = [];

//   for (let i = 6; i >= 0; i--) {
//     const d = new Date(now);
//     d.setDate(now.getDate() - i);

//     const start = new Date(d.setHours(0, 0, 0, 0)).getTime();
//     const end = new Date(d.setHours(23, 59, 59, 999)).getTime();

//     const result = db.execute(
//       `SELECT COALESCE(SUM(
//           si.price * (si.quantity - si.returned_qty)
//         ), 0) as total
//         FROM sales s
//         JOIN sale_items si ON si.sale_id = s.id
//         WHERE s.created_at BETWEEN ? AND ?
// `,
//       [start, end]
//     );

//     days.push({
//       day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
//       total: result.rows?._array?.[0]?.total ?? 0,
//     });
//   }

//   return days;
// };

// const startOfToday = () => {
//   const d = new Date();
//   d.setHours(0, 0, 0, 0);
//   return d.getTime();
// };

// const startOfWeek = () => {
//   const d = new Date();
//   const day = d.getDay(); // 0 = Sun
//   const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Mon start
//   d.setDate(diff);
//   d.setHours(0, 0, 0, 0);
//   return d.getTime();
// };

// /* ---------------- TODAY ---------------- */

// export const getTodayStats = () => {
//   if (!isDBReady()) return { total: 0, count: 0, itemsSold: 0 };

//   const db = getDB();
//   const since = startOfToday();

//   const res = db.execute(
//     `
//     SELECT
//       COUNT(DISTINCT s.id) as count,
//       COALESCE(SUM(
//         si.price * (si.quantity - si.returned_qty)
//       ), 0) as total,
//       COALESCE(SUM(
//         si.quantity - si.returned_qty
//       ), 0) as itemsSold
//     FROM sales s
//     JOIN sale_items si ON si.sale_id = s.id
//     WHERE s.created_at >= ?
//     `,
//     [since]
//   );

//   const row = firstRow(res);
//   return {
//     count: row?.count ?? 0,
//     total: row?.total ?? 0,
//     itemsSold: row?.itemsSold ?? 0,
//   };
// };

// // /* ---------------- WEEK ---------------- */

// export const getWeeklyStats = () => {
//   if (!isDBReady()) return { total: 0, avgPerDay: 0 };

//   const db = getDB();
//   const since = startOfWeek();

//   const res = db.execute(
//     `
//     SELECT COALESCE(SUM(
//       si.price * (si.quantity - si.returned_qty)
//     ), 0) as total
//     FROM sales s
//     JOIN sale_items si ON si.sale_id = s.id
//     WHERE s.created_at >= ?
//     `,
//     [since]
//   );


//   const row = firstRow(res);
//   const total = row ? row.total : 0;

//   return {
//     total,
//     avgPerDay: Math.round(total / 7),
//   };
// };

// /* ---------------- INVENTORY ---------------- */

// export const getInventoryHealth = () => {
//   if (!isDBReady()) return { totalItems: 0, lowStock: 0, outOfStock: 0 };

//   const db = getDB();

//   const totalRes = db.execute(
//     `SELECT COUNT(*) as count
//      FROM items
//      WHERE is_deleted = 0`
//   );

//   const lowRes = db.execute(
//     `SELECT COUNT(*) as count
//      FROM items
//      WHERE is_deleted = 0
//        AND quantity_left <= low_stock_threshold
//        AND quantity_left > 0`
//   );

//   const outRes = db.execute(
//     `SELECT COUNT(*) as count
//      FROM items
//      WHERE is_deleted = 0
//        AND quantity_left = 0`
//   );

//   const totalRow = firstRow(totalRes);
//   const lowRow = firstRow(lowRes);
//   const outRow = firstRow(outRes);

//   return {
//     totalItems: totalRow ? totalRow.count : 0,
//     lowStock: lowRow ? lowRow.count : 0,
//     outOfStock: outRow ? outRow.count : 0,
//   };
// };

// /* ---------------- LAST SALE ---------------- */

// export const getLastSale = () => {
//   if (!isDBReady()) return null;

//   const db = getDB();
//   const res = db.execute(
//     `SELECT id, created_at, total
//      FROM sales
//      ORDER BY created_at DESC
//      LIMIT 1`
//   );

//   const row = firstRow(res);

//   if (!row) return null;

//   return {
//     id: row.id,
//     createdAt: row.created_at,
//     total: row.total,
//   };
// };

// export const getBestSellerToday = () => {
//   if (!isDBReady()) return null;

//   const db = getDB();
//   const since = startOfToday();

//   const res = db.execute(
//     `
//     SELECT 
//       i.id,
//       i.name,
//       SUM(si.quantity - si.returned_qty) as qty
//     FROM sale_items si
//     JOIN sales s ON s.id = si.sale_id
//     JOIN items i ON i.id = si.item_id
//     WHERE s.created_at >= ?
//     GROUP BY i.id
//     ORDER BY qty DESC
//     LIMIT 1
//     `,
//     [since]
//   );

//   const row = firstRow(res);
//   if (!row) return null;

//   return {
//     id: row.id,
//     name: row.name,
//     quantity: row.qty,
//   };
// };

// export const getTopItemsThisWeek = () => {
//   if (!isDBReady()) return [];

//   const db = getDB();
//   const since = startOfWeek();

//   const res = db.execute(
//     `
//     SELECT 
//       i.id,
//       i.name,
//       SUM(si.quantity) as qty
//     FROM sale_items si
//     JOIN sales s ON s.id = si.sale_id
//     JOIN items i ON i.id = si.item_id
//     WHERE s.created_at >= ?
//     GROUP BY i.id
//     ORDER BY qty DESC
//     LIMIT 3
//     `,
//     [since]
//   );

//   return (
//     res.rows?._array.map((row: any) => ({
//       id: row.id,
//       name: row.name,
//       quantity: row.qty,
//     })) ?? []
//   );
// };
