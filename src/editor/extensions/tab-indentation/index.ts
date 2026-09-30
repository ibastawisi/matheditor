import {
  configExtension,
  defineExtension,
  TabIndentationExtension as LexicalTabIndentationExtension,
} from "@lexical/extension";

export const TabIndentationExtension = defineExtension({
  name: "tab-indentation",
  dependencies: [
    configExtension(LexicalTabIndentationExtension, {
      maxIndent: 7,
    }),
  ],
});
