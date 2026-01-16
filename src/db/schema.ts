export const CREATE_ITEMS_TABLE = `
 CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  barcode TEXT,
  sku TEXT,
  sell_price REAL,
  buy_price REAL,
  quantity INTEGER NOT NULL DEFAULT 0,
  quantity_left INTEGER NOT NULL DEFAULT 0,     -- cached live stock
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  low_stock_threshold INTEGER NOT NULL DEFAULT 0,
  is_deleted INTEGER NOT NULL DEFAULT 0
  
    );
`;

export const CREATE_SALES_TABLE = `
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    total REAL NOT NULL
)`;

export const CREATE_SALE_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );
`;

