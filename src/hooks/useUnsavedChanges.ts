'use client';

import { useEffect } from 'react';

/**
 * Warns before a full page unload (reload, tab close, external link) while
 * there are unsaved edits.
 *
 * Deliberately limited to `beforeunload`: the App Router exposes no stable
 * way to intercept a soft navigation, so in-app navigation is covered by
 * showing an explicit "unsaved" badge next to the affected section instead.
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) =>
      event.preventDefault();
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);
}

export default useUnsavedChanges;
