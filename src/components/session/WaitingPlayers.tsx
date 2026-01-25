import React from 'react';
import { Box, Flex, Heading } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Player } from '@/types/session';
import { PlayerGrid } from '../player/PlayerGrid';

interface WaitingPlayersProps {
  waitingPlayers: Player[];
  formatWaitTime: (waitTimeInMinutes: number) => string;
  selectedPlayers: string[];
  mode: 'manage' | 'view';
}

const WaitingPlayers: React.FC<WaitingPlayersProps> = ({
  waitingPlayers,
  formatWaitTime,
  selectedPlayers,
  mode,
}) => {
  const t = useTranslations('SessionDetail');

  if (waitingPlayers.length === 0) {
    return null;
  }

  return (
    <Box mt={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">
          {t('courtsTab.waitingPlayers')} ({waitingPlayers.length})
        </Heading>
      </Flex>
      <PlayerGrid
        players={waitingPlayers}
        playerFilter={['WAITING']}
        formatWaitTime={formatWaitTime}
        selectedPlayers={selectedPlayers}
        mode={mode}
      />
    </Box>
  );
};

export default WaitingPlayers;
