import { CREATE_ITEMS_TABLE } from './schema';
import { open } from 'react-native-quick-sqlite';

let db: ReturnType<typeof open> | null = null;

export const getDB = () => {
  if (!db) {
    db = open({ name: 'hisabkitab.db' });
  }
  return db;
};

export const initDB = () => {
  const database = getDB();
  database.execute(CREATE_ITEMS_TABLE);
};
