import setupIndexedDB, { getStore } from "./hooks/use-indexeddb";
import { EditorDocument } from './types';

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
const documentDB = getStore<EditorDocument>("documents");

export default documentDB;