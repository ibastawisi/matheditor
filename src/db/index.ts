import { IDB_KEY } from "./constants";
import { getActions, getConnection } from "./idb";
import { IndexedDBConfig } from "./interfaces";
import { EditorDocument } from '../types';

async function setupIndexedDB(config: IndexedDBConfig) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      await getConnection(config);
      window[IDB_KEY] = { init: 1, config };
      resolve();
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}

export function getStore<T>(storeName: string) {
  return getActions<T>(storeName);
}


const idbConfig = {
  databaseName: "matheditor",
  version: 1,
  stores: [
    {
      name: "documents",
      id: { keyPath: "id" },
      indices: [
        { name: "name", keyPath: "name" },
        { name: "data", keyPath: "data" },
        { name: "createdAt", keyPath: "createdAt" },
        { name: "updatedAt", keyPath: "updatedAt" },
      ],
    },
  ],
};

setupIndexedDB(idbConfig);
export const documentDB = getStore<EditorDocument>("documents");

export default documentDB;

