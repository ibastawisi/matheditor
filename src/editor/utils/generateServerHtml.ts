import type { SerializedEditorState } from "lexical";
import { withServerDOM } from "./withServerDOM";
import { generateDocumentHtml, serializeDocumentHtml } from "./generateDocumentHtml";

export const generateServerHtml = (data: SerializedEditorState) => new Promise<string>((resolve, reject) => {
  try {
    resolve(serializeDocumentHtml(generateDocumentHtml(data, withServerDOM)));
  } catch (error) {
    reject(error);
  }
});
