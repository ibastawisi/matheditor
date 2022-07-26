import { appSlice, deleteDocumentAsync, getDocumentAsync, loadUserAsync, logoutAsync, uploadDocumentAsync } from "./app";
import { loadingBarReducer, showLoading, hideLoading } from 'react-redux-loading-bar'

export const actions = {
  app: {
    ...appSlice.actions,
    loadUserAsync,
    logoutAsync,
    getDocumentAsync,
    uploadDocumentAsync,
    deleteDocumentAsync,
    showLoading,
    hideLoading
    },
};

export const reducers = {
  app: appSlice.reducer,
  loadingBar: loadingBarReducer,
}

export default reducers;