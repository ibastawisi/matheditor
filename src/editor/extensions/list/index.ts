import { defineExtension } from "@lexical/extension";
import { CheckListExtension, ListExtension as LexicalListExtension } from "@lexical/list";

export const ListExtension = defineExtension({
  name: "list",
  dependencies: [LexicalListExtension, CheckListExtension],
});
