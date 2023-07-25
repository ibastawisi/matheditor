import { appSlice, deleteDocumentAsync, getDocumentAsync, loadDocumentsAsync, createDocumentAsync, updateDocumentAsync, loadAsync } from "./app";
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

export const actions = {
  ...appSlice.actions,
  loadAsync,
  loadDocumentsAsync,
  getDocumentAsync,
  createDocumentAsync,
  updateDocumentAsync,
  deleteDocumentAsync,
};

export const store = configureStore({ reducer: appSlice.reducer });

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>; 	
