import { Activity, Trophy, Info, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import BottomNavigationBar, {
  NavigationTab,
} from '@/components/ui/BottomNavigationBar';
import { useBottomNavVisibility } from '@/hooks/useBottomNavVisibility';

interface PlayerSessionBottomNavProps {
  activeTab: number;
  setActiveTab: (tab: number) => void;
}

export default function PlayerSessionBottomNav({
  activeTab,
  setActiveTab,
}: PlayerSessionBottomNavProps) {
  const t = useTranslations('SessionDetail');
  const isGlobalBottomNavVisible = useBottomNavVisibility();

  const navigationTabs = useMemo<NavigationTab[]>(
    () => [
      { id: 0, label: t('tabOverview'), icon: Info },
      { id: 1, label: t('tabStatus'), icon: Activity },
      { id: 3, label: t('tabResults'), icon: Trophy },
      { id: 4, label: t('tabPayment'), icon: DollarSign },
    ],
    [t]
  );

  return (
    <BottomNavigationBar
      tabs={navigationTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      alwaysVisible
      bottomOffset={
        isGlobalBottomNavVisible
          ? {
              base: 'calc(64px + env(safe-area-inset-bottom))',
              md: '0',
            }
          : undefined
      }
    />
  );
}
