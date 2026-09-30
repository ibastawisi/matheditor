"use client"
import { type CSSProperties, type PropsWithChildren, type ReactNode, useEffect, useRef, useState } from "react";

/** How long the editor must keep its size before it is shown */
const QUIET_MS = 150;
/** Shown by then even if it keeps resizing, such as while images load */
const MAX_WAIT_MS = 3000;

const HIDDEN: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  visibility: "hidden",
  pointerEvents: "none",
};

/**
 * Keeps `fallback`, the document as the server rendered it, on screen while
 * the editor renders behind it, and swaps them in one frame once the editor
 * has settled. The editor's math, graphs and sketches render after it mounts
 * and grow for a few frames, and the page layout follows them a frame later:
 * shown right away, everything below them would move.
 */
export const EditorHandoff: React.FC<PropsWithChildren<{ fallback: ReactNode }>> = ({ fallback, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || ready) return;
    const show = () => setReady(true);
    let quiet = 0;
    const cap = window.setTimeout(show, MAX_WAIT_MS);
    const observer = new ResizeObserver(() => {
      // nothing settles until the editor has rendered
      if (!el.querySelector(".editor-input")) return;
      window.clearTimeout(quiet);
      quiet = window.setTimeout(show, QUIET_MS);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(quiet);
      window.clearTimeout(cap);
    };
  }, [ready]);

  return (
    <div style={{ position: "relative" }}>
      {!ready && fallback}
      <div ref={ref} style={ready ? undefined : HIDDEN} inert={!ready}>
        {children}
      </div>
    </div>
  );
};

export default EditorHandoff;
