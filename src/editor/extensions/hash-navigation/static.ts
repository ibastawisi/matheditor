"use client"
import { useEffect } from "react";
import { getStaticHeadings } from "@/editor/extensions/table-of-contents/static";
import { findHashTarget, scrollToElement } from ".";

/**
 * Scrolls to what the URL's fragment points to in the document rendered in
 * `container`, once it is laid out and when the fragment changes. The browser
 * finds figures by their id, but not headings or links that are bookmarks.
 */
export function useStaticHashNavigation(container: HTMLElement | null) {
  useEffect(() => {
    if (!container) return;
    const navigate = () => {
      const hash = window.location.hash;
      const findHeading = (id: string) => getStaticHeadings(container).find((heading) => heading.id === id)?.element ?? null;
      const target = hash ? findHashTarget(container, hash, findHeading) : null;
      if (target) scrollToElement(target);
    };
    const frame = requestAnimationFrame(navigate);
    window.addEventListener("hashchange", navigate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", navigate);
    };
  }, [container]);
}
