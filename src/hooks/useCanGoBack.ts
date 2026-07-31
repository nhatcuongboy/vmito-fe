import { useEffect, useState } from 'react';

/**
 * Detects whether the user navigated to this page from within the app
 * (i.e. there is meaningful browser history to go back to).
 *
 * Returns `false` when the page is opened directly via URL / new tab.
 */
export const useCanGoBack = (): boolean => {
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // history.length > 1 covers SPA (client-side) navigation — Next.js
    // increments it on every router.push / <Link> click, but a fresh
    // direct-URL open starts at 1.
    if (window.history.length > 1) {
      setCanGoBack(true);
      return;
    }
    // Fallback: full-page HTTP navigation from within the same origin
    // (e.g. a hard-refresh after following an in-app link externally).
    const referrer = document.referrer;
    if (referrer) {
      try {
        const refOrigin = new URL(referrer).origin;
        if (refOrigin === window.location.origin) {
          setCanGoBack(true);
          return;
        }
      } catch {
        // invalid referrer URL — treat as no referrer
      }
    }
    setCanGoBack(false);
  }, []);

  return canGoBack;
};
