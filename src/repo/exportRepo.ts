import RNFS from 'react-native-fs';
import { getDB } from '../db';

export const exportItemsToCSV = async () => {
  const db = getDB();

  // Export items table
  const itemsResult = db.execute(
    `SELECT
      id,
      name,
      barcode,
      sku,
      sell_price,
      buy_price,
      quantity,
      created_at,
      updated_at,
      is_deleted
     FROM items`
  );
  const itemsRows = itemsResult.rows?._array || [];
  if (itemsRows.length === 0) {
    throw new Error('No data to export');
  }
  const itemsHeader = [
    'id',
    'name',
    'barcode',
    'sku',
    'sell_price',
    'buy_price',
    'quantity',
    'created_at',
    'updated_at',
    'is_deleted',
  ];
  const itemsCsvRows = [
    'Items Table',
    itemsHeader.join(','),
    ...itemsRows.map(row =>
      itemsHeader.map(key => {
        const value = row[key];
        if (value == null) return '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ),
    '', // Empty line after table
  ];

  // Export sales table
  const salesResult = db.execute(
    `SELECT id, created_at, total FROM sales`
  );
  const salesRows = salesResult.rows?._array || [];
  const salesHeader = ['id', 'created_at', 'total'];
  const salesCsvRows = [
    'Sales Table',
    salesHeader.join(','),
    ...salesRows.map(row =>
      salesHeader.map(key => {
        const value = row[key];
        if (value == null) return '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ),
    '',
  ];

  // Export sale_items table
  const saleItemsResult = db.execute(
    `SELECT id, sale_id, item_id, quantity, price FROM sale_items`
  );
  const saleItemsRows = saleItemsResult.rows?._array || [];
  const saleItemsHeader = ['id', 'sale_id', 'item_id', 'quantity', 'price'];
  const saleItemsCsvRows = [
    'Sale Items Table',
    saleItemsHeader.join(','),
    ...saleItemsRows.map(row =>
      saleItemsHeader.map(key => {
        const value = row[key];
        if (value == null) return '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ),
    '',
  ];

  // Combine all CSV rows
  const csvRows = [
    ...itemsCsvRows,
    ...salesCsvRows,
    ...saleItemsCsvRows,
  ];

  const csvContent = csvRows.join('\n');
  const filePath = `${RNFS.DownloadDirectoryPath}/hisabkitab_items_${Date.now()}.csv`;

  const exists = await RNFS.exists(filePath);
  if (exists) {
    await RNFS.unlink(filePath);
  }

  await RNFS.writeFile(filePath, csvContent, 'utf8');
  return filePath;
};


export const exportSalesCSV = async () => {
  const db = getDB();

  const res = db.execute(`
    SELECT 
      s.id,
      s.created_at,
      s.total,
      COUNT(si.id) as items_count
    FROM sales s
    LEFT JOIN sale_items si ON si.sale_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `);

  const rows = res.rows?._array || [];
  if (!rows.length) throw new Error('No sales to export');

  const header = ['id', 'created_at', 'total', 'items_count'];
  const csv = [
    header.join(','),
    ...rows.map(r =>
      header.map(k => `"${String(r[k] ?? '')}"`).join(',')
    ),
  ].join('\n');

  const path = `${RNFS.DownloadDirectoryPath}/hisabkitab_sales_${Date.now()}.csv`;
  await RNFS.writeFile(path, csv, 'utf8');
  return path;
};
