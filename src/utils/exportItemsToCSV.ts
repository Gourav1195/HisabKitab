import RNFS from 'react-native-fs';
import { getDB } from '../db';

export const exportItemsToCSV = async () => {
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
      updated_at,
      is_deleted
     FROM items
     `
  );
//WHERE is_deleted = 0
  const rows = result.rows?._array || [];
  if (rows.length === 0) {
    throw new Error('No data to export');
  }

  const header = [
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

  const csvRows = [
    header.join(','),
    ...rows.map(row =>
      header.map(key => {
        const value = row[key];
        if (value == null) return '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');
  const filePath = `${RNFS.DownloadDirectoryPath}/hisabkitab_items_${Date.now()}.csv`;

  // 🔑 THIS IS THE IMPORTANT PART
  const exists = await RNFS.exists(filePath);
  if (exists) {
    await RNFS.unlink(filePath);
  }

  await RNFS.writeFile(filePath, csvContent, 'utf8');
  return filePath;
};
