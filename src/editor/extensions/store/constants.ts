export const DIALOG_TYPES = {
  image: "image",
  graph: "graph",
  sketch: "sketch",
  table: "table",
  iframe: "iframe",
  link: "link",
  layout: "layout",
  ocr: "ocr",
  ai: "ai",
} as const;

export const DEFAULT_FONT_SIZE = 16;

export const blockTypeToBlockName = {
  bullet: "Bulleted List",
  check: "Check List",
  code: "Code Block",
  quote: "Quote",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  number: "Numbered List",
  paragraph: "Normal",
};
