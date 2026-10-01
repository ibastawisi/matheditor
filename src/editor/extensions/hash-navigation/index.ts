import { $getRoot, defineExtension, mergeRegister } from "lexical";
import { formatId, TableOfContentsExtension } from "@/editor/extensions/table-of-contents";

const decodeHash = (hash: string) => {
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
};

/**
 * What a fragment points to in a document: a figure with that id, a link that
 * is its own bookmark, or a heading with that text
 */
export function findHashTarget(root: HTMLElement, hash: string, findHeading: (id: string) => HTMLElement | null): HTMLElement | null {
  const id = decodeHash(hash);
  if (!id) return null;
  const element = root.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
  if (element) return element;
  const bookmark = Array.from(root.querySelectorAll<HTMLElement>("a[target=_self]")).find((a) => a.getAttribute("href") === `#${id}`);
  if (bookmark) return bookmark;
  return findHeading(formatId(id));
}

/** Scrolls to an element, and again once the layout has settled, as math and pages render after it */
export function scrollToElement(element: HTMLElement, block: ScrollLogicalPosition = "start") {
  element.scrollIntoView({ block });
  setTimeout(() => element.scrollIntoView({ block, behavior: "smooth" }), 0);
}

/** Scrolls to what the URL's fragment points to, when the document opens and when the fragment changes */
export const HashNavigationExtension = defineExtension({
  name: "hash-navigation",
  dependencies: [TableOfContentsExtension],
  register(editor, _config, state) {
    const { tableOfContents } = state.getDependency(TableOfContentsExtension).output;
    // a live document is empty until its content arrives, and is scrolled then
    let pending = true;
    const navigate = () => {
      const root = editor.getRootElement();
      const hash = window.location.hash;
      const findHeading = (id: string) => {
        const heading = tableOfContents.peek().find((entry) => entry.id === id);
        return heading ? editor.getElementByKey(heading.key) : null;
      };
      const target = root && hash ? findHashTarget(root, hash, findHeading) : null;
      if (target) scrollToElement(target);
      pending = !target && editor.getEditorState().read(() => $getRoot().isEmpty());
    };
    const onHashChange = () => navigate();
    window.addEventListener("hashchange", onHashChange);
    return mergeRegister(
      () => window.removeEventListener("hashchange", onHashChange),
      editor.registerRootListener((root) => {
        if (!root) return;
        const frame = requestAnimationFrame(navigate);
        return () => cancelAnimationFrame(frame);
      }),
      editor.registerUpdateListener(() => {
        if (pending) navigate();
      }),
    );
  },
});
