'use client';

import { Box } from '@chakra-ui/react';
import { AppSearchBar } from '@/components/common/AppSearchBar';
import { UnderlineTabs, TabItem } from '@/components/ui/UnderlineTabs';
import { TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { useTranslations } from 'next-intl';

export type HostTournamentMobileTab = 'open' | 'ended' | 'all';

interface HostTournamentsHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeTab: HostTournamentMobileTab;
  onTabChange: (tab: HostTournamentMobileTab) => void;
  onFilterClick?: () => void;
}

export function HostTournamentsHeader({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  onFilterClick,
}: HostTournamentsHeaderProps) {
  const t = useTranslations('pages.tournaments');

  const tabs: TabItem[] = [
    {
      id: 'open',
      label: t('filters.status.open') || 'Đang mở',
    },
    {
      id: 'ended',
      label: t('filters.status.FINISHED') || 'Đã kết thúc',
    },
    {
      id: 'all',
      label: t('filters.status.all') || 'Tất cả',
    },
  ];

  return (
    <Box
      display={{ base: 'block', md: 'none' }}
      position="fixed"
      top={`calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`}
      left={0}
      right={0}
      zIndex={1090}
      bg="bg"
      pt={2.5}
      pb={0}
      borderBottomWidth="1px"
      borderColor="border.subtle"
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
    >
      <Box mb={2}>
        <AppSearchBar
          placeholder={t('hostList.searchPlaceholder') || 'Tìm kiếm giải...'}
          value={search}
          onChange={onSearchChange}
          onFilterClick={onFilterClick}
          showFilter={true}
        />
      </Box>
      <UnderlineTabs
        items={tabs}
        activeId={activeTab}
        onTabClick={(id) => onTabChange(id as HostTournamentMobileTab)}
        px="16px"
      />
    </Box>
  );
}
