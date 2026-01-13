import React from 'react';
import {
  VStack,
  Flex,
  Heading,
  HStack,
  Button,
  Text,
  Box,
  Collapsible,
} from '@chakra-ui/react';
import { PlayerGrid } from '@/components/player/PlayerGrid';
import SessionPlayerStatistics from './SessionPlayerStatistics';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Player {
  id: string;
  playerNumber: number;
  name?: string; // Optional to match API
  gender?: string;
  level?: number;
  status: string;
  currentWaitTime: number;
  totalWaitTime: number;
  matchesPlayed: number;
  currentCourtId?: string;
  preFilledByHost: boolean;
  confirmedByPlayer: boolean;
}

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
}
const PlayersTab: React.FC<PlayersTabProps> = ({
  sessionPlayers,
  playerFilter,
  setPlayerFilter,
  formatWaitTime,
  mode = 'manage', // Default to manage mode
  sessionId, // Destructure sessionId from props
  onPlayerUpdate,
}) => {
  const t = useTranslations('SessionDetail');

  // Collapsible state for players section
  const [isPlayersSectionOpen, setIsPlayersSectionOpen] = React.useState(true);
  // Collapsible state for statistics section
  const [isStatisticsSectionOpen, setIsStatisticsSectionOpen] =
    React.useState(true);
  return (
    <VStack gap={6} align="stretch">
      {/* Players Section with Collapsible */}
      <Collapsible.Root
        open={isPlayersSectionOpen}
        onOpenChange={(details) => setIsPlayersSectionOpen(details.open)}
      >
        <Collapsible.Trigger paddingY="3" width="100%">
          <Flex justify="space-between" align="center">
            <HStack gap={2} alignItems="center">
              <Heading size="md">{t('playersTab.players')}</Heading>
              <Box
                as={ChevronDown}
                boxSize={5}
                color="gray.500"
                transform={
                  isPlayersSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }
                transition="transform 0.2s ease-in-out"
              />
            </HStack>
          </Flex>
        </Collapsible.Trigger>
        <Collapsible.Content>
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
        </Collapsible.Content>
      </Collapsible.Root>

      {/* Player Statistics Section with Collapsible */}
      {/* <Collapsible.Root
        open={isStatisticsSectionOpen}
        onOpenChange={(details) => setIsStatisticsSectionOpen(details.open)}
      >
        <Collapsible.Trigger paddingY="3" width="100%">
          <HStack gap={2} alignItems="center">
            <Heading size="md">{t('playersTab.playerStatistics')}</Heading>
            <Box
              as={ChevronDown}
              boxSize={5}
              color="gray.500"
              transform={
                isStatisticsSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)'
              }
              transition="transform 0.2s ease-in-out"
            />
          </HStack>
        </Collapsible.Trigger>
        <Collapsible.Content>
          {isStatisticsSectionOpen && (
            <SessionPlayerStatistics sessionId={sessionId} />
          )}
        </Collapsible.Content>
      </Collapsible.Root> */}
    </VStack>
  );
};

export default PlayersTab;
