"use client"

import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';
import { memo, useEffect } from 'react';

export default memo(function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  }, []);

  useEffect(() => {
    NProgress.done()
  }, [pathname, searchParams]);

  return null;
});
