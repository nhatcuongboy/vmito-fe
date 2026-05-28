import { Box } from '@chakra-ui/react';
import AppEmptyState from '@/components/ui/AppEmptyState';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

interface PlayerEmptyStateProps {
  isFiltered?: boolean;
  filterName?: string;
  onAddPlayer?: () => void;
}

const PlayerEmptyState: React.FC<PlayerEmptyStateProps> = ({
  isFiltered = false,
  filterName,
}) => {
  const t = useTranslations('pages.playerManagement');

  return (
    <AppEmptyState
      icon={<Box as={Users} boxSize={10} color="gray.400" />}
      title={isFiltered ? t('noPlayersWithFilter') : t('noPlayersYet')}
      description={
        isFiltered
          ? t('noPlayersWithFilterDescription', {
              status: filterName || '',
            })
          : t('noPlayersYetDescription')
      }
    />
  );
};

export default PlayerEmptyState;
