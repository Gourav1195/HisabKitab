export const CREATE_ITEMS_TABLE = `
 CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  barcode TEXT,
  sku TEXT,
  sell_price REAL,
  buy_price REAL,
  quantity INTEGER NOT NULL DEFAULT 0,
  quantity_left INTEGER NOT NULL DEFAULT 0,    
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
    total REAL NOT NULL,
    is_credit INTEGER NOT NULL DEFAULT 0,
    customer_id INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
)`;

export const CREATE_SALE_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    returned_qty INTEGER NOT NULL DEFAULT 0,
    returned_at INTEGER,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );
`;

export const CREATE_PROFILE_TABLE = `
  CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY,
    shop_name TEXT,
    phone TEXT,
    email TEXT UNIQUE,
    last_auto_backup_at INTEGER,
    created_at INTEGER,
    is_pro BOOLEAN DEFAULT 0
  );
`;

export const CREATE_CUSTOMER_TABLE = `
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    created_at INTEGER NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_LEDGER_TABLE = `
 CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  type TEXT NOT NULL,            -- 'SALE' | 'PAYMENT'
  direction TEXT NOT NULL,       -- 'DEBIT' | 'CREDIT'
  amount REAL NOT NULL,          -- positive number
  sale_id INTEGER,               -- nullable
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);`;

export const CREATE_STOCK_MOVEMENTS_TABLE = `
 CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  action TEXT NOT NULL,         -- RESTOCK | SALE | SET
  quantity INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL
);`;

export const CREATE_BACKUP_TABLE = `
 CREATE TABLE IF NOT EXSITS backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  app_version text NOT NULL,
  type text NOT NULL CHECK (type IN ('AUTO', 'MANUAL'))
);
`;  