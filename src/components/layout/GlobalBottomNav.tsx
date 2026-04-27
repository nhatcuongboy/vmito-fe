'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname, useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { Home, ClipboardList, Users, User } from 'lucide-react';
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
  const [isPendingCreate, startCreateTransition] = useTransition();

  const isVisible = useBottomNavVisibility();

  const tabs = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return [
      { id: 1, label: t('mainHome'), icon: Home, href: ROUTES.HOME },
      {
        id: 2,
        label: t('sessions'),
        icon: ClipboardList,
        href: ROUTES.HOST.SESSIONS.LIST,
      },
      { id: 3, label: t('myClubs'), icon: Users, href: ROUTES.CLUBS.MY_CLUBS },
      { id: 4, label: t('personal'), icon: User, href: `/user/${user.id}` },
    ];
  }, [isAuthenticated, user, t]);

  const handleTabChange = (tabId: number) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab?.href || pathname === tab.href) return;
    setPendingTabId(tabId);
    startTransition(() => {
      router.push(tab.href!);
    });
  };

  useEffect(() => {
    if (!isPending) setPendingTabId(null);
  }, [isPending, pathname]);

  const activeTab = useMemo(() => {
    if (!pathname) return 0;
    const sorted = [...tabs].sort(
      (a, b) => (b.href?.length || 0) - (a.href?.length || 0)
    );
    return sorted.find((tab) => pathname.startsWith(tab.href || ''))?.id ?? 0;
  }, [pathname, tabs]);

  const handleCreateSession = () => {
    startCreateTransition(() => {
      router.push(ROUTES.SESSIONS.NEW);
    });
  };

  const centerAction = useMemo(() => {
    if (pathname.startsWith(ROUTES.CLUBS.BROWSE)) {
      return {
        label: t('createClub'),
        onClick: () => {
          startCreateTransition(() => {
            router.push(ROUTES.HOST.CLUBS.CREATE);
          });
        },
        loading: isPendingCreate,
      };
    }
    if (pathname.startsWith(ROUTES.BROWSE.TOURNAMENTS.LIST)) {
      return {
        label: t('createTournament'),
        onClick: () => {
          startCreateTransition(() => {
            router.push(ROUTES.HOST.TOURNAMENTS.NEW);
          });
        },
        loading: isPendingCreate,
      };
    }
    return {
      label: t('createSession'),
      onClick: handleCreateSession,
      loading: isPendingCreate,
    };
  }, [pathname, t, isPendingCreate, handleCreateSession, router]);

  if (!isVisible || tabs.length === 0) return null;

  return (
    <BottomNavigationBar
      tabs={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
      activeTab={activeTab}
      loadingTabId={pendingTabId}
      onTabChange={handleTabChange}
      centerAction={centerAction}
    />
  );
}
