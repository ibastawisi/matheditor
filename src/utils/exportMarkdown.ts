import { generateMarkdown } from "../editor/utils/generateMarkdown";
import { EditorDocument } from "../types";

export const exportMarkdown = async (document: EditorDocument) => {
  const markdown = await generateMarkdown(document.data);
  return markdown;
};

export default exportMarkdown;