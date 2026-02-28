'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname, useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/api/types';
import BottomNavigationBar, {
  NavigationTab,
} from '@/components/ui/BottomNavigationBar';
import {
  Search,
  Ticket,
  ClipboardList,
  Users,
  MapPin,
  CheckCircle,
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

  const isAdminContext = useMemo(
    () => !!pathname?.startsWith('/admin'),
    [pathname]
  );

  const tabs = useMemo<NavigationTab[]>(() => {
    if (!isAuthenticated || !user) return [];

    // ADMIN on admin pages → admin management tabs
    if (user.role === UserRole.ADMIN && isAdminContext) {
      return [
        { id: 10, label: t('home'), icon: Search, href: ROUTES.HOME },
        {
          id: 11,
          label: t('venues'),
          icon: MapPin,
          href: ROUTES.ADMIN.VENUES,
        },
        {
          id: 12,
          label: t('users'),
          icon: Users,
          href: ROUTES.ADMIN.USERS,
        },
        {
          id: 13,
          label: t('clubsAdmin'),
          icon: CheckCircle,
          href: ROUTES.ADMIN.CLUBS,
        },
      ];
    }

    // PLAYER, HOST and ADMIN (on non-admin pages) share the same tabs
    return [
      { id: 1, label: t('home'), icon: Search, href: ROUTES.HOME },
      {
        id: 2,
        label: t('host'),
        icon: ClipboardList,
        href: ROUTES.HOST.SESSIONS.LIST,
      },
      {
        id: 3,
        label: t('joined'),
        icon: Ticket,
        href: ROUTES.PLAYER.SESSIONS.LIST,
      },
      {
        id: 4,
        label: t('myClubs'),
        icon: Users,
        href: ROUTES.CLUBS.MY_CLUBS,
      },
    ];
  }, [isAuthenticated, user, isAdminContext, t]);

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
