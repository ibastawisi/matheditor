import "prismjs";
import "prismjs/components/prism-csharp";
import { configExtension, defineExtension } from "@lexical/extension";
import { CodeNode } from "@lexical/code-core";
import { CodePrismExtension } from "@lexical/code-prism";
import { domOverride, DOMRenderExtension } from "@lexical/html";
import { getNodeAnchorName } from "@/editor/utils/getEditorContainer";

export const CodeExtension = defineExtension({
  name: "code",
  dependencies: [
    CodePrismExtension,
    configExtension(DOMRenderExtension, {
      overrides: [
        domOverride([CodeNode], {
          $decorateDOM(nextNode, _prevNode, dom) {
            dom.style.setProperty("anchor-name", getNodeAnchorName(nextNode.getKey()));
          },
        }),
      ],
    }),
  ],
});
