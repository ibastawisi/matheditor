import { useEffect, useEffectEvent } from "react";
import { IS_APPLE } from "@lexical/utils";
import { useAppStore } from "@/store";

/**
 * Opens the drawer on its search tab on Cmd+F or Ctrl+F, instead of the
 * browser's find. `onOpen` is called as the tab opens, like a change of tab.
 */
export default function useSearchShortcut(enabled: boolean, onOpen?: () => void) {
  const toggleDrawer = useAppStore(state => state.toggleDrawer);
  const setDrawerTab = useAppStore(state => state.setDrawerTab);
  const open = useEffectEvent(() => {
    onOpen?.();
    setDrawerTab("search");
    toggleDrawer(true);
    // the search may be open already, when it does not focus itself
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>("[data-document-search]")?.select());
  });

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      // a dialog, like the sketch editor, may have a find of its own
      if (event.defaultPrevented || event.key.toLowerCase() !== "f" || event.shiftKey || event.altKey) return;
      if (IS_APPLE ? !event.metaKey || event.ctrlKey : !event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      open();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}
