import { IDB_KEY } from "./constants";
import { IndexedDBConfig } from "./interfaces";
import { waitUntil } from "./utils";

declare global {
  interface Window {
    [IDB_KEY]: {
      config: IndexedDBConfig;
      init: number;
    };
  }
}

function validateStore(db: IDBDatabase, storeName: string) {
  return db.objectStoreNames.contains(storeName);
}

export function validateBeforeTransaction(db: IDBDatabase | undefined, storeName: string, reject: Function) {
  if (!db) {
    return reject("Queried before opening connection");
  }
  if (!validateStore(db, storeName)) {
    reject(`Store ${storeName} not found`);
  }
}

export function createTransaction(
  db: IDBDatabase,
  dbMode: IDBTransactionMode,
  currentStore: string,
  resolve: ((this: IDBTransaction, ev: any) => any) | null,
  reject?: ((this: IDBTransaction, ev: any) => any) | null,
  abort?: ((this: IDBTransaction, ev: any) => any) | null
): IDBTransaction {
  let tx: IDBTransaction = db.transaction(currentStore, dbMode);
  tx.onerror = reject!;
  tx.oncomplete = resolve;
  tx.onabort = abort!;
  return tx;
}

export async function getConnection(config?: IndexedDBConfig): Promise<IDBDatabase> {
  const idbInstance = typeof window !== "undefined" ? window.indexedDB : null;
  let _config: IndexedDBConfig = config!;

  if (!config && idbInstance) {
    await waitUntil(() => window?.[IDB_KEY]?.["init"] === 1);
    _config = window[IDB_KEY]?.["config"];
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    if (idbInstance) {
      const request: IDBOpenDBRequest = idbInstance.open(_config.databaseName, _config.version);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (e: any) => {
        reject(e.target.error.name);
      };

      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        _config.stores.forEach(s => {
          if (!db.objectStoreNames.contains(s.name)) {
            const store = db.createObjectStore(s.name, s.id);
            s.indices.forEach(c => {
              store.createIndex(c.name, c.keyPath, c.options);
            });
          }
        });
        db.close();
        resolve(db);
      };
    } else {
      reject("Failed to connect");
    }
  });
}

export function getActions<T>(currentStore: string) {
  return {
    getByID(id: string | number) {
      return new Promise<T>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readonly", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let request = objectStore.get(id);
            request.onsuccess = (e: any) => {
              resolve(e.target.result as T);
            };
          })
          .catch(reject);
      });
    },
    getOneByKey(keyPath: string, value: string | number) {
      return new Promise<T | undefined>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readonly", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let index = objectStore.index(keyPath);
            let request = index.get(value);
            request.onsuccess = (e: any) => {
              resolve(e.target.result);
            };
          })
          .catch(reject);
      });
    },
    getManyByKey(keyPath: string, value: string | number) {
      return new Promise<T[]>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readonly", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let index = objectStore.index(keyPath);
            let request = index.getAll(value);
            request.onsuccess = (e: any) => {
              resolve(e.target.result);
            };
          })
          .catch(reject);
      });
    },
    getAll() {
      return new Promise<T[]>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readonly", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let request = objectStore.getAll();
            request.onsuccess = (e: any) => {
              resolve(e.target.result as T[]);
            };
          })
          .catch(reject);
      });
    },

    add(value: T, key?: any) {
      return new Promise<number>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readwrite", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let request = objectStore.add(value, key);
            request.onsuccess = (e: any) => {
              (tx as any)?.commit?.();
              resolve(e.target.result);
            };
          })
          .catch(reject);
      });
    },

    update(value: T, key?: any) {
      return new Promise<any>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readwrite", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let request = objectStore.put(value, key);
            request.onsuccess = (e: any) => {
              (tx as any)?.commit?.();
              resolve(e.target.result);
            };
          })
          .catch(reject);
      });
    },

    patch(id: string | number, value: Partial<T>) {
      return new Promise<any>((resolve, reject) => {
        this.getByID(id).then((data) => {
          if (data) {
            const updatedData = { ...data, ...value };
            this.update(updatedData).then(resolve).catch(reject);
          } else {
            reject("Not found");
          }
        }).catch(reject);
      });
    },

    deleteByID(id: any) {
      return new Promise<any>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readwrite", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let request = objectStore.delete(id);
            request.onsuccess = (e: any) => {
              (tx as any)?.commit?.();
              resolve(e);
            };
          })
          .catch(reject);
      });
    },
    deleteAll() {
      return new Promise<any>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readwrite", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let request = objectStore.clear();
            request.onsuccess = (e: any) => {
              (tx as any)?.commit?.();
              resolve(e);
            };
          })
          .catch(reject);
      });
    },

    openCursor(cursorCallback: (e: Event) => void, keyRange?: IDBKeyRange) {
      return new Promise<IDBCursorWithValue | void>((resolve, reject) => {
        getConnection()
          .then(db => {
            validateBeforeTransaction(db, currentStore, reject);
            let tx = createTransaction(db, "readonly", currentStore, resolve, reject);
            let objectStore = tx.objectStore(currentStore);
            let request = objectStore.openCursor(keyRange);
            request.onsuccess = e => {
              cursorCallback(e);
              resolve();
            };
          })
          .catch(reject);
      });
    },
  };
}
