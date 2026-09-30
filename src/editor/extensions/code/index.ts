import "prismjs";
import "prismjs/components/prism-csharp";
import { configExtension, defineExtension } from "@lexical/extension";
import { CodeNode } from "@lexical/code-core";
import { CodePrismExtension } from "@lexical/code-prism";
import { domOverride, DOMRenderExtension } from "@lexical/html";
import type { NodeKey } from "lexical";
import { getNodeAnchorName } from "@/editor/utils/getEditorContainer";
import { CodeGutters } from "./gutter";

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
  register: (editor) => {
    const gutters = new CodeGutters();
    const elements = new Map<NodeKey, HTMLElement>();
    const unregister = editor.registerMutationListener(CodeNode, (mutations) => {
      for (const [key, type] of mutations) {
        const previous = elements.get(key);
        const element = type === "destroyed" ? null : editor.getElementByKey(key);
        if (previous && previous !== element) gutters.unobserve(previous);
        if (element) {
          // Lexical writes one number per line here, which the gutter does not use
          element.removeAttribute("data-gutter");
          elements.set(key, element);
          gutters.observe(element);
        } else {
          elements.delete(key);
        }
      }
    }, { skipInitialization: false });
    return () => {
      unregister();
      gutters.dispose();
    };
  },
});
