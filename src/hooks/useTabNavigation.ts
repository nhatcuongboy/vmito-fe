import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

/**
 * Custom hook for managing tab navigation with URL synchronization
 *
 * @returns Object containing activeTab state and handlers
 */
export function useTabNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize activeTab from URL parameter or default to 0
  const [activeTab, setActiveTab] = useState<number>(() => {
    const tabParam = searchParams.get('tab');
    const tabIndex = tabParam ? parseInt(tabParam, 10) : 0;
    return tabIndex >= 0 ? tabIndex : 0;
  });

  // Sync activeTab when URL param changes (e.g. browser back/forward)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const tabIndex = tabParam ? parseInt(tabParam, 10) : 0;
    const newTab = tabIndex >= 0 ? tabIndex : 0;
    setActiveTab(newTab);
  }, [searchParams]);

  // Function to update URL with current tab
  const updateTabInURL = (tabIndex: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabIndex.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Function to handle tab change
  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);
    updateTabInURL(tabIndex);
  };

  return {
    activeTab,
    handleTabChange,
  };
}
