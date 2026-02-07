'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export default function NProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      speed: 400,
      minimum: 0.08,
      easing: 'ease',
      trickleSpeed: 200,
    });

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor?.href && !anchor.target) {
        const url = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);

        if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
          NProgress.start();
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}
