export interface IndexedDBColumn {
  name: string;
  keyPath: string;
  options?: IDBIndexParameters;
}

export interface IndexedDBStore {
  name: string;
  id: IDBObjectStoreParameters;
  indices: IndexedDBColumn[];
}

export interface IndexedDBConfig {
  databaseName: string;
  version: number;
  stores: IndexedDBStore[];
}

export interface TransactionOptions {
  storeName: string;
  dbMode: IDBTransactionMode;
  error: (e: Event) => any;
  complete: (e: Event) => any;
  abort?: any;
}
