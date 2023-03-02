import { appSlice, deleteDocumentAsync, getDocumentAsync, loadUserAsync, loadDocumentsAsync, logoutAsync, uploadDocumentAsync, loadAdminAsync } from "./app";
import { loadingBarReducer, showLoading, hideLoading } from 'react-redux-loading-bar'

export const actions = {
  app: {
    ...appSlice.actions,
    loadUserAsync,
    loadDocumentsAsync,
    logoutAsync,
    getDocumentAsync,
    uploadDocumentAsync,
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

export default reducers;