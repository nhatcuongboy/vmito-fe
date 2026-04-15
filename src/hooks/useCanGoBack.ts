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
    // performance.navigation.type 0 = normal navigate (link/JS)
    // history.length > 1 alone is unreliable (browsers seed it at 1-2)
    // Combine with the Next.js-internal referrer: if the document has a
    // same-origin referrer, the user came from another page in the app.
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
