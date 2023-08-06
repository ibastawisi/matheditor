import { appSlice, deleteCloudDocument, getCloudDocument, loadLocalDocuments, createCloudDocument, updateCloudDocument, load, getLocalDocument, createLocalDocument, deleteLocalDocument, loadCloudDocuments, updateLocalDocument } from "./app";
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

export const actions = {
  ...appSlice.actions,

  load,
  loadLocalDocuments,
  loadCloudDocuments,

  getLocalDocument,
  createLocalDocument,
  updateLocalDocument,
  deleteLocalDocument,

  getCloudDocument,
  createCloudDocument,
  updateCloudDocument,
  deleteCloudDocument,
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
