import { appSlice, deleteDocumentAsync, getDocumentAsync, loadUserAsync, loadDocumentsAsync, logoutAsync, createDocumentAsync, loadAdminAsync, updateDocumentAsync, loadAsync } from "./app";
import { loadingBarReducer, showLoading, hideLoading } from 'react-redux-loading-bar'
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
    showLoading,
    hideLoading
  },
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
