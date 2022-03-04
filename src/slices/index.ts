import { editorSlice } from "./editor";

export const actions = {
  editor: editorSlice.actions,
};

export const reducers = {
  editor: editorSlice.reducer,
}

export default reducers;
