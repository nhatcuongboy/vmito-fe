'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname, useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/api/types';
import BottomNavigationBar, {
  NavigationTab,
} from '@/components/ui/BottomNavigationBar';
import {
  Home,
  Search,
  Trophy,
  Ticket,
  Calendar,
  ClipboardCheck,
} from 'lucide-react';
import { useMemo, useState, useTransition, useEffect } from 'react';
import { useBottomNavVisibility } from '@/hooks/useBottomNavVisibility';
import { ROUTES } from '@/constants';

export default function GlobalBottomNav() {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('navigation');

  const [isPending, startTransition] = useTransition();
  const [pendingTabId, setPendingTabId] = useState<number | null>(null);

  // Check visibility using the hook
  const isBottomNavVisible = useBottomNavVisibility();

  const tabs = useMemo<NavigationTab[]>(() => {
    if (!isAuthenticated || !user) return [];

    if (user.role === UserRole.ADMIN) {
      return [
        { id: 1, label: t('home'), icon: Home, href: ROUTES.HOME },
        {
          id: 2,
          label: t('host'),
          icon: Calendar,
          href: ROUTES.HOST.SESSIONS.LIST,
        },
        {
          id: 6,
          label: t('joined'),
          icon: Ticket,
          href: ROUTES.PLAYER.SESSIONS.LIST,
        },
        {
          id: 7,
          label: t('pendingJoinRequests'),
          icon: ClipboardCheck,
          href: ROUTES.HOST.PENDING_JOIN_REQUESTS,
        },
      ];
    }

    if (user.role === UserRole.HOST) {
      return [
        { id: 1, label: t('home'), icon: Home, href: ROUTES.HOME },
        {
          id: 2,
          label: t('host'),
          icon: Calendar,
          href: ROUTES.HOST.SESSIONS.LIST,
        },
        {
          id: 6,
          label: t('joined'),
          icon: Ticket,
          href: ROUTES.PLAYER.SESSIONS.LIST,
        },
        {
          id: 7,
          label: t('pendingJoinRequests'),
          icon: ClipboardCheck,
          href: ROUTES.HOST.PENDING_JOIN_REQUESTS,
        },
      ];
    }

    // Default to Player view (including Guest if they are authenticated via some mechanism)
    return [
      { id: 1, label: t('home'), icon: Home, href: ROUTES.HOME },
      {
        id: 4,
        label: t('host'),
        icon: Calendar,
        href: ROUTES.PLAYER.HOST_FEATURE,
      },
      {
        id: 2,
        label: t('joined'),
        icon: Ticket,
        href: ROUTES.PLAYER.SESSIONS.LIST,
      },
      {
        id: 7,
        label: t('pendingJoinRequests'),
        icon: ClipboardCheck,
        href: ROUTES.HOST.PENDING_JOIN_REQUESTS,
      },
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
    const sortedTabs = [...tabs].sort(
      (a, b) => (b.href?.length || 0) - (a.href?.length || 0)
    );

    const matched = sortedTabs.find((tab) =>
      pathname.startsWith(tab.href || '')
    );
    return matched ? matched.id : 0;
  }, [pathname, tabs]);

  if (!isBottomNavVisible || tabs.length === 0) {
    return null;
  }

  return (
    <BottomNavigationBar
      tabs={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
      activeTab={activeTab}
      loadingTabId={pendingTabId}
      onTabChange={handleTabChange}
    />
  );
}
