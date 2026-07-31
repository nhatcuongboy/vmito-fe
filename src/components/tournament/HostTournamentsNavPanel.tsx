'use client';

import { Trophy, Ticket } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { useState, useTransition, useEffect } from 'react';

export default function HostTournamentsNavPanel() {
  const tNav = useTranslations('navigation');
  const tHost = useTranslations('pages.tournaments.hostList');
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTabId, setPendingTabId] = useState<number | null>(null);

  const activeId = (() => {
    const normalized = pathname.replace(/\/$/, '') || '/';
    if (normalized === ROUTES.HOST.TOURNAMENTS.JOINED) return 1;
    if (normalized === ROUTES.HOST.TOURNAMENTS.LIST) return 0;
    return 0;
  })();

  const navItems = [
    {
      id: 0,
      label: tHost('manageTab') || 'Quản lý giải',
      icon: Trophy,
      href: ROUTES.HOST.TOURNAMENTS.LIST,
    },
    {
      id: 1,
      label: tHost('joinedTab') || 'Giải tham gia',
      icon: Ticket,
      href: ROUTES.HOST.TOURNAMENTS.JOINED,
    },
  ];

  const bottomTabs = navItems.map((item) => ({
    id: item.id,
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

  const handleCreateTournament = () => {
    startTransition(() => {
      router.push(ROUTES.HOST.TOURNAMENTS.NEW);
    });
  };

  return (
    <BottomNavigationBar
      tabs={bottomTabs}
      activeTab={activeId}
      loadingTabId={pendingTabId}
      onTabChange={(id) => handleNavigate(id)}
      alwaysVisible={false}
      centerAction={{
        label: tHost('createTab') || 'Tạo giải',
        onClick: handleCreateTournament,
        dataTour: 'create-tournament',
      }}
    />
  );
}
