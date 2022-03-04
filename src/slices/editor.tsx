import { OutputData } from '@editorjs/editorjs';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: OutputData = {
  "time": new Date().getTime(),
  "blocks": [
    {
      "type": "header",
      "data": {
        "text": "Untitled Document",
        "level": 1
      }
    },
  ]
};

export const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    save: (state, action: PayloadAction<OutputData>) => action.payload,
  },

});


export default editorSlice.reducer;
