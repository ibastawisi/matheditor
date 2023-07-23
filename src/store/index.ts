"use client"
import { appSlice, deleteDocumentAsync, getDocumentAsync, loadUserAsync, loadDocumentsAsync, logoutAsync, createDocumentAsync, loadAdminAsync, updateDocumentAsync, loadAsync } from "./app";
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

export const actions = {
  app: {
    ...appSlice.actions,
    loadAsync,
    loadUserAsync,
    loadDocumentsAsync,
    logoutAsync,
    getDocumentAsync,
    createDocumentAsync,
    updateDocumentAsync,
    deleteDocumentAsync,
    loadAdminAsync,
  },
};

export const reducers = {
  app: appSlice.reducer,
}
export const store = configureStore({ reducer: reducers });

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>; 	
