import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'GenerativeOSDB';
const DB_VERSION = 2;
const STORE_NAME = 'KeyValueStore';

interface MyDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: any;
  };
}

class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<MyDB>>;

  constructor() {
    this.dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    return (await this.dbPromise).get(STORE_NAME, key);
  }

  async set(key: string, value: any): Promise<void> {
    await (await this.dbPromise).put(STORE_NAME, value, key);
  }

  async delete(key: string): Promise<void> {
    await (await this.dbPromise).delete(STORE_NAME, key);
  }

  async clear(): Promise<void> {
    await (await this.dbPromise).clear(STORE_NAME);
  }

  async keys(): Promise<string[]> {
    return (await this.dbPromise).getAllKeys(STORE_NAME);
  }
}

export const dbService = new DatabaseService();
