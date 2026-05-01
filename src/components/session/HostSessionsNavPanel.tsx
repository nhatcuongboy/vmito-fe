'use client';

import { ClipboardList, Ticket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { useState, useTransition, useEffect } from 'react';
import { AISessionModal } from '@/components/session/AISessionModal';
import type { ExtractedSessionData } from '@/lib/api/ai.service';
import { usePreferenceStore } from '@/stores/usePreferenceStore';

export default function HostSessionsNavPanel() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTabId, setPendingTabId] = useState<number | null>(null);

  // AI Session Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const { useAiForCreation } = usePreferenceStore();

  const activeId = (() => {
    if (
      pathname === ROUTES.HOST.SESSIONS.LIST ||
      pathname === ROUTES.HOST.PENDING_JOIN_REQUESTS
    )
      return 0;
    if (pathname === ROUTES.PLAYER.SESSIONS.LIST) return 1;
    return -1;
  })();

  const navItems = [
    {
      id: 0,
      label: t('host'),
      icon: ClipboardList,
      href: ROUTES.HOST.SESSIONS.LIST,
    },
    {
      id: 1,
      label: t('joined'),
      icon: Ticket,
      href: ROUTES.PLAYER.SESSIONS.LIST,
    },
  ];

  const bottomTabs = navItems.map((item) => ({
    id: item.id as number,
    label: item.label,
    icon: item.icon,
  }));

  const handleNavigate = (id: number | string) => {
    const item = navItems.find((n) => n.id === Number(id));
    if (!item) return;

    const normalizedPathname = pathname.replace(/\/$/, '') || '/';
    const normalizedHref = item.href.replace(/\/$/, '') || '/';

    if (normalizedPathname === normalizedHref) return;

    setPendingTabId(Number(id));
    startTransition(() => {
      router.push(item.href);
    });
  };

  useEffect(() => {
    if (!isPending) setPendingTabId(null);
  }, [isPending, pathname]);

  const handleCreateSession = () => {
    if (useAiForCreation) {
      setIsAIModalOpen(true);
    } else {
      startTransition(() => {
        router.push(ROUTES.SESSIONS.NEW);
      });
    }
  };

  const handleAISuccess = (data: ExtractedSessionData) => {
    sessionStorage.setItem('vmito_pending_session_data', JSON.stringify(data));
    setIsAIModalOpen(false);
    startTransition(() => {
      router.push(ROUTES.SESSIONS.NEW);
    });
  };

  return (
    <>
      {/* Mobile: bottom navigation bar (uses GlobalBottomNav slot) */}
      <BottomNavigationBar
        tabs={bottomTabs}
        activeTab={activeId}
        loadingTabId={pendingTabId}
        onTabChange={(id) => handleNavigate(id)}
        alwaysVisible={false}
        centerAction={{
          label: t('createSession'),
          onClick: handleCreateSession,
        }}
      />

      {/* AI Session creation modal */}
      <AISessionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={handleAISuccess}
      />
    </>
  );
}
