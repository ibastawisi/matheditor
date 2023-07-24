"use client"
import { appSlice, deleteDocumentAsync, getDocumentAsync,  createDocumentAsync, updateDocumentAsync } from "./app";
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

export const actions = {
  app: {
    ...appSlice.actions,
    getDocumentAsync,
    createDocumentAsync,
    updateDocumentAsync,
    deleteDocumentAsync,
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
