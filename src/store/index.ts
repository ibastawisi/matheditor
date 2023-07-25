import { appSlice, deleteDocumentAsync, getDocumentAsync, loadDocumentsAsync, createDocumentAsync, updateDocumentAsync, loadAsync } from "./app";
import { loadingBarReducer, showLoading, hideLoading } from 'react-redux-loading-bar'
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';

export const actions = {
  ...appSlice.actions,
  loadAsync,
  loadDocumentsAsync,
  getDocumentAsync,
  createDocumentAsync,
  updateDocumentAsync,
  deleteDocumentAsync,
  showLoading,
  hideLoading
};

export const reducers = {
  app: appSlice.reducer,
  loadingBar: loadingBarReducer,
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
