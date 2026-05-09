'use client';

import { Shield, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import BottomNavigationBar from '@/components/ui/BottomNavigationBar';
import { useState, useTransition, useEffect } from 'react';

interface ClubsNavPanelProps {
  activeTab: 'managing' | 'member';
  onTabChange: (tab: 'managing' | 'member') => void;
}

const TAB_ID_TO_KEY: Record<number, 'managing' | 'member'> = {
  0: 'managing',
  1: 'member',
};

const TAB_KEY_TO_ID: Record<'managing' | 'member', number> = {
  managing: 0,
  member: 1,
};

export default function ClubsNavPanel({
  activeTab,
  onTabChange,
}: ClubsNavPanelProps) {
  const t = useTranslations('navigation');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingTabId, setPendingTabId] = useState<number | null>(null);

  const bottomTabs = [
    { id: 0, label: t('manageGroups'), icon: Shield },
    { id: 1, label: t('joinedGroups'), icon: Users },
  ];

  const handleTabChange = (id: number) => {
    const key = TAB_ID_TO_KEY[id];
    if (!key || key === activeTab) return;
    setPendingTabId(id);
    startTransition(() => {
      onTabChange(key);
    });
  };

  const handleCreateClub = () => {
    startTransition(() => {
      router.push(ROUTES.HOST.CLUBS.CREATE);
    });
  };

  useEffect(() => {
    if (!isPending) setPendingTabId(null);
  }, [isPending]);

  return (
    <BottomNavigationBar
      tabs={bottomTabs}
      activeTab={TAB_KEY_TO_ID[activeTab]}
      loadingTabId={pendingTabId}
      onTabChange={handleTabChange}
      alwaysVisible={false}
      centerAction={{
        label: t('createClub'),
        onClick: handleCreateClub,
      }}
    />
  );
}
