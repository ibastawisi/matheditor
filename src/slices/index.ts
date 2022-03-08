import { appSlice } from "./app";

export const actions = {
  app: appSlice.actions,
};

export const reducers = {
  app: appSlice.reducer,
}

export default reducers;