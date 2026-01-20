import React from 'react';
import { VStack, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { PlayerGrid } from '@/components/player/PlayerGrid';
import PlayerManagement from '@/components/session/PlayerManagement';
import { LayoutGrid, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ISession, Player } from '@/lib/api/types';

// Ensure PlayerFilter type includes 'READY' and 'INACTIVE'
export type PlayerFilter = 'ALL' | 'PLAYING' | 'WAITING' | 'READY' | 'INACTIVE';

interface PlayersTabProps {
  sessionPlayers: Player[];
  playerFilter: PlayerFilter;
  setPlayerFilter: (filter: PlayerFilter) => void;
  formatWaitTime: (waitTimeInMinutes: number) => string;
  mode?: 'view' | 'manage'; // Optional mode prop to control UI
  sessionId: string; // Add sessionId prop
  onPlayerUpdate?: () => void;
  session?: ISession; // Add session prop
}

const PlayersTab: React.FC<PlayersTabProps> = ({
  sessionPlayers,
  playerFilter,
  setPlayerFilter,
  formatWaitTime,
  mode = 'manage', // Default to manage mode
  sessionId, // Destructure sessionId from props
  onPlayerUpdate,
  session,
}) => {
  const t = useTranslations('SessionDetail');
  // View mode state: 'grid' or 'manage'
  // Default to 'grid' unless explicitly set otherwise
  const [viewMode, setViewMode] = React.useState<'grid' | 'manage'>('grid');

  // If in manage view and we have session data, show PlayerManagement
  if (viewMode === 'manage' && session) {
    return (
      <VStack gap={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="md">{t('playersTab.managePlayers')}</Heading>
          <Button
            size="sm"
            onClick={() => setViewMode('grid')}
            leftIcon={<LayoutGrid size={16} />}
            variant="outline"
          >
            {t('playersTab.gridView')}
          </Button>
        </Flex>
        <PlayerManagement session={session} onDataRefresh={onPlayerUpdate} />
      </VStack>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Players Section Header */}
      <Flex justify="space-between" align="center">
        <Heading size="md">{t('playersTab.players')}</Heading>

        {/* View Toggle / Manage Button */}
        {session && (
          <Button
            size="sm"
            onClick={() => setViewMode('manage')}
            leftIcon={<Settings size={16} />}
            variant="outline"
            colorScheme="gray"
          >
            {t('playersTab.managePlayers')}
          </Button>
        )}
      </Flex>

      {/* Filter Buttons */}
      <Flex justify="flex-end" align="center" mb={4}>
        <HStack gap={2}>
          <Button
            size="sm"
            onClick={() => setPlayerFilter('ALL')}
            colorScheme={playerFilter === 'ALL' ? 'orange' : 'gray'}
            variant={playerFilter === 'ALL' ? 'solid' : 'outline'}
          >
            {t('playersTab.all')} ({sessionPlayers.length})
          </Button>
          <Button
            size="sm"
            onClick={() => setPlayerFilter('PLAYING')}
            colorScheme={playerFilter === 'PLAYING' ? 'blue' : 'gray'}
            variant={playerFilter === 'PLAYING' ? 'solid' : 'outline'}
          >
            {t('playersTab.playing')} (
            {sessionPlayers.filter((p) => p.status === 'PLAYING').length})
          </Button>
          <Button
            size="sm"
            onClick={() => setPlayerFilter('WAITING')}
            colorScheme={playerFilter === 'WAITING' ? 'orange' : 'gray'}
            variant={playerFilter === 'WAITING' ? 'solid' : 'outline'}
          >
            {t('playersTab.waiting')} (
            {sessionPlayers.filter((p) => p.status === 'WAITING').length})
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setPlayerFilter('READY');
            }}
            colorScheme={playerFilter === 'READY' ? 'green' : 'gray'}
            variant={playerFilter === 'READY' ? 'solid' : 'outline'}
          >
            {t('playersTab.ready')} (
            {sessionPlayers.filter((p) => p.status === 'READY').length})
          </Button>
          <Button
            size="sm"
            onClick={() => setPlayerFilter('INACTIVE')}
            colorScheme={playerFilter === 'INACTIVE' ? 'red' : 'gray'}
            variant={playerFilter === 'INACTIVE' ? 'solid' : 'outline'}
          >
            {t('playersTab.inactive')} (
            {sessionPlayers.filter((p) => p.status === 'INACTIVE').length})
          </Button>
        </HStack>
      </Flex>
      {/* Filtered Players Grid */}
      {(() => {
        const filteredPlayers = sessionPlayers.filter((player) => {
          if (playerFilter === 'ALL') return true;
          return player.status === playerFilter;
        });
        if (filteredPlayers.length === 0) {
          return (
            <Text fontSize="lg" color="gray.500" textAlign="center" py={8}>
              {t('playersTab.noPlayersFound', {
                status: t(`playersTab.${playerFilter.toLowerCase()}`),
              })}
            </Text>
          );
        }
        return (
          <PlayerGrid
            players={filteredPlayers}
            playerFilter={playerFilter}
            formatWaitTime={formatWaitTime}
            mode={mode}
            sessionId={sessionId}
            onPlayerUpdate={onPlayerUpdate}
          />
        );
      })()}
    </VStack>
  );
};

export default PlayersTab;
