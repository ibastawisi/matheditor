'use client';

import { memo, useEffect } from 'react';

import NProgress from 'nprogress';

type PushStateInput = [data: unknown, unused: string, url?: string | URL | null | undefined];

export default memo(function ProgressBar() {
  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleAnchorClick = (event: MouseEvent) => {
      if (event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;
      const targetElement = event.currentTarget as HTMLAnchorElement;
      if (window.location.origin !== targetElement.origin) return;
      if (window.location.href === targetElement.href) return;
      if (targetElement.target) return;
      const editorRoot = document.querySelector('.editor-input');
      if (editorRoot && editorRoot.contains(targetElement)) return;
      NProgress.start();
    };

    const handleMutation: MutationCallback = () => {
      const anchorElements: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('a[href]');
      anchorElements.forEach(anchor => anchor.addEventListener('click', handleAnchorClick));
    };

    const mutationObserver = new MutationObserver(handleMutation);

    mutationObserver.observe(document, { childList: true, subtree: true });

    window.history.pushState = new Proxy(window.history.pushState, {
      apply: (target, thisArg, argArray: PushStateInput) => {
        NProgress.done();
        return target.apply(thisArg, argArray);
      },
    });
  });

  return null;
});
