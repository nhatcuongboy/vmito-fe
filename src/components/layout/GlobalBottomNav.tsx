'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname, useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/api/types';
import BottomNavigationBar, {
  NavigationTab,
} from '@/components/ui/BottomNavigationBar';
import { Home, Search, Trophy, Users, LayoutDashboard } from 'lucide-react';
import { useMemo, useState, useTransition, useEffect } from 'react';

export default function GlobalBottomNav() {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('navigation');
  
  const [isPending, startTransition] = useTransition();
  const [pendingTabId, setPendingTabId] = useState<number | null>(null);

  // Check if current path is an excluded path (Session Details or Tournament Management)
  const isExcluded = useMemo(() => {
    if (!pathname) return false;
    
    // Explicitly exclude /host/tournaments/[id] which has its own tabs
    if (pathname.match(/\/host\/tournaments\/[^/]+$/)) return true;
    
    return (
      // Exclude session detail pages
      pathname.includes('/host/sessions/') ||
      pathname.includes('/player/sessions/') ||
      
      // Exclude tournament sub-pages management that might need full screen or have their own nav
      // But keep bottom nav for main lists if desired. For now based on requirements:
      // "Except session detail content" -> We only definitely exclude session details.
      // However, host tournament management usually has many tabs (Overview, Categories, etc)
      // so we might want to exclude it to avoid double bottom bars if they use bottom bars too.
      // The requirement only mentioned SessionDetailContent.
      // Let's stick to excluding Session Details for now.
      
      // Also potentially exclude specific full-screen flows like /join/confirm if needed
      pathname.includes('/join/confirm')
    );
  }, [pathname]);

  const tabs = useMemo<NavigationTab[]>(() => {
    if (!isAuthenticated || !user) return [];

    if (user.role === UserRole.ADMIN) {
      return [
        { id: 1, label: t('home'), icon: Home, href: '/host/dashboard' },
        { id: 2, label: t('host'), icon: LayoutDashboard, href: '/host/sessions' },
        { id: 3, label: t('browse'), icon: Search, href: '/browse/sessions' },
        { id: 4, label: t('users'), icon: Users, href: '/admin/users' },
      ];
    }

    if (user.role === UserRole.HOST) {
      return [
        { id: 1, label: t('home'), icon: Home, href: '/host/dashboard' },
        { id: 2, label: t('host'), icon: LayoutDashboard, href: '/host/sessions' },
        { id: 3, label: t('browse'), icon: Search, href: '/browse/sessions' },
      ];
    }

    // Default to Player view (including Guest if they are authenticated via some mechanism)
    return [
      { id: 1, label: t('home'), icon: Home, href: '/player/dashboard' },
      { id: 2, label: t('mySessions'), icon: Trophy, href: '/player/sessions' }, // Or whatever list page players have
      { id: 3, label: t('browse'), icon: Search, href: '/browse/sessions' },
    ];
  }, [isAuthenticated, user, t]);

  // Handle Tab Change
  const handleTabChange = (tabId: number) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && tab.href) {
      if (pathname === tab.href) return; // Already on this page
      
      setPendingTabId(tabId);
      startTransition(() => {
        router.push(tab.href!);
      });
    }
  };

  // Reset pending state when navigation is complete or path changes
  useEffect(() => {
    if (!isPending) {
      setPendingTabId(null);
    }
  }, [isPending, pathname]);

  // Determine current active tab
  const activeTab = useMemo(() => {
    if (!pathname) return 0;
    
    // Find the matching tab based on pathname prefix
    // We reverse sort by href length to match the refined paths first
    const sortedTabs = [...tabs].sort((a, b) => (b.href?.length || 0) - (a.href?.length || 0));
    
    const matched = sortedTabs.find(tab => pathname.startsWith(tab.href || ''));
    return matched ? matched.id : 0;
  }, [pathname, tabs]);

  if (!isAuthenticated || isExcluded || tabs.length === 0 || user?.role === UserRole.GUEST) {
    return null;
  }

  return (
    <BottomNavigationBar
      tabs={tabs.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
      activeTab={activeTab}
      loadingTabId={pendingTabId}
      onTabChange={handleTabChange}
    />
  );
}
