'use client';

import { useEffect } from 'react';

import NProgress from 'nprogress';

type PushStateInput = [data: unknown, unused: string, url?: string | URL | null | undefined];

export default function ProgressBar() {
  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleAnchorClick = (event: MouseEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      const target = event.currentTarget as HTMLAnchorElement;
      if (target.target === '_blank') return;
      if (target.href !== window.location.href) {
        NProgress.start();
      }
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
}
