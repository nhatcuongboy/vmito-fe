'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { usePathname, useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { Home, ClipboardList, Newspaper, User } from 'lucide-react';
import { useMemo, useState, useTransition, useEffect } from 'react';
import { useBottomNavVisibility } from '@/hooks/useBottomNavVisibility';
import { ROUTES } from '@/constants';
import dynamic from 'next/dynamic';
import type { ExtractedSessionData } from '@/lib/api/ai.service';

// Only opened via the center "Tạo kèo" button — no need to ship it upfront
const AISessionModal = dynamic(
  () =>
    import('@/components/session/AISessionModal').then(
      (mod) => mod.AISessionModal
    ),
  { ssr: false }
);
import { usePreferenceStore } from '@/stores/usePreferenceStore';

export default function GlobalBottomNav() {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('navigation');

  const [isPending, startTransition] = useTransition();
  const [pendingTabId, setPendingTabId] = useState<number | null>(null);
  const [isPendingCreate, startCreateTransition] = useTransition();

  // AI Session Modal state (for the default "Tạo kèo" center action)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const { useAiForCreation } = usePreferenceStore();

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
      { id: 3, label: t('newsfeed'), icon: Newspaper, href: '/newsfeed' },
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

  const handleAISuccess = (data: ExtractedSessionData) => {
    sessionStorage.setItem('vmito_pending_session_data', JSON.stringify(data));
    setIsAIModalOpen(false);
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
    // Default: open AI session creation modal
    return {
      label: t('createSession'),
      onClick: () => {
        if (useAiForCreation) {
          setIsAIModalOpen(true);
        } else {
          startCreateTransition(() => {
            router.push(ROUTES.SESSIONS.NEW);
          });
        }
      },
      loading: isPendingCreate,
      dataTour: 'create-session',
    };
  }, [pathname, t, isPendingCreate, router, useAiForCreation]);

  if (!isVisible || tabs.length === 0) return null;

  return (
    <>
      <BottomNavigationBar
        tabs={tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeTab={activeTab}
        loadingTabId={pendingTabId}
        onTabChange={handleTabChange}
        centerAction={centerAction}
      />

      {/* AI Session creation modal triggered by center "Tạo kèo" button */}
      <AISessionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />
    </>
  );
}
