//src/db/index.ts
import { CREATE_ITEMS_TABLE, CREATE_SALES_TABLE, CREATE_SALE_ITEMS_TABLE, CREATE_PROFILE_TABLE, CREATE_CUSTOMER_TABLE, CREATE_LEDGER_TABLE  } from './schema';
import { open } from 'react-native-quick-sqlite';

let db: ReturnType<typeof open> | null = null;
let initialized = false;

export const getDB = () => {
  if (!db) {
    db = open({ name: 'hisabkitab.db' });
  }
  return db;
};

export const initDB = () => {
  if (initialized) return;

  const database = getDB();
  database.execute(CREATE_ITEMS_TABLE);
  database.execute(CREATE_SALES_TABLE);
  database.execute(CREATE_SALE_ITEMS_TABLE);
  database.execute(CREATE_PROFILE_TABLE);
  database.execute(CREATE_CUSTOMER_TABLE);
  database.execute(CREATE_LEDGER_TABLE);

  // add other CREATE TABLE statements here later
  initialized = true;
};

export const isDBReady = () => initialized;
