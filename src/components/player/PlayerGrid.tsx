'use client';

import { Card, CardBody, SimpleGrid } from '@/components/ui/chakra-compat';
import { Player } from '@/lib/api/types';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { Mars, User, Users, Venus, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { PlayerDetailModal } from './PlayerDetailModal';
import { PlayerActionMenu } from '@/components/session/player-management/PlayerActionMenu';
import { useTranslations } from 'next-intl';

// Color constants for different player states
const PLAYER_COLORS = {
  SELECTED: {
    bg: { base: 'blue.100', _dark: 'blue.900/40' },
    border: 'blue.500',
    scheme: 'blue',
  },
  READY: {
    bg: { base: 'yellow.200', _dark: 'yellow.800/40' },
    border: 'yellow.500',
    scheme: 'yellow',
  },
  WAITING: {
    bg: { base: 'orange.200', _dark: 'orange.800/40' },
    border: 'orange.500',
    scheme: 'orange',
  },
  PLAYING: {
    bg: { base: 'green.200', _dark: 'green.800/40' },
    border: 'green.500',
    scheme: 'green',
  },
  INACTIVE: {
    bg: { base: 'gray.200', _dark: 'whiteAlpha.200' },
    border: 'gray.400',
    scheme: 'gray',
  },
  DEFAULT: {
    bg: { base: 'gray.50', _dark: 'whiteAlpha.50' },
    border: 'gray.200',
    scheme: 'gray',
  },
};

const PLAYER_CARD_SHADOW = {
  base: '0 6px 16px rgba(15, 23, 42, 0.14)',
  _dark: '0 10px 24px rgba(0, 0, 0, 0.28)',
};

const SELECTED_PLAYER_CARD_SHADOW = {
  base: 'sm',
  _dark: '0 0 0 1px rgba(96, 165, 250, 0.35), 0 12px 28px rgba(0, 0, 0, 0.35)',
};

interface PlayerGridProps {
  players: Player[];
  playerFilter: string[]; // Changed to array of strings
  formatWaitTime: (waitTimeInMinutes: number) => string;
  selectedPlayers?: string[];
  onPlayerToggle?: (playerId: string) => void;
  selectionMode?: boolean;
  mode?: 'view' | 'manage';
  sessionId?: string;
  onPlayerUpdate?: () => void;
  isShowWaitTime?: boolean;
  onEdit?: (player: Player) => void;
  onDelete?: (playerId: string) => void;
  onToggleStatus?: (playerId: string) => void;
  onShowQR?: (player: Player) => void;
  columns?: Record<string, number>;
}

export const PlayerGrid = ({
  players,
  playerFilter,
  formatWaitTime,
  selectedPlayers = [],
  onPlayerToggle,
  selectionMode = false,
  mode = 'manage',
  sessionId,
  onPlayerUpdate,
  isShowWaitTime = true,
  onEdit,
  onDelete,
  onToggleStatus,
  onShowQR,
  columns: columnsProp,
}: PlayerGridProps) => {
  const t = useTranslations('pages.playerManagement');
  const { getLevelShortLabel } = useLevelLabel();
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] =
    useState<Player | null>(null);
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);

  const handleShowDetail = (player: Player) => {
    if (onShowQR) {
      onShowQR(player);
    } else {
      setSelectedPlayerForDetail(player);
    }
  };
  return (
    <>
      <SimpleGrid
        columns={columnsProp ?? { base: 2, md: 4, lg: 6 }}
        spacing={{ base: 3, md: 4 }}
      >
        {players.map((player) => {
          // Color scheme based on status and filter
          let bgColor, borderColor;
          const isSelected =
            selectionMode && selectedPlayers.includes(player.id);

          const isStatusHighlighted =
            playerFilter.length === 0 || playerFilter.includes(player.status);

          if (isSelected) {
            // Blue color for selected players
            bgColor = PLAYER_COLORS.SELECTED.bg;
            borderColor = PLAYER_COLORS.SELECTED.border;
          } else if (isStatusHighlighted && player.status === 'READY') {
            // Green for ready players
            bgColor = PLAYER_COLORS.READY.bg;
            borderColor = PLAYER_COLORS.READY.border;
          } else if (isStatusHighlighted && player.status === 'WAITING') {
            // Orange color for waiting players (increased intensity)
            bgColor = PLAYER_COLORS.WAITING.bg;
            borderColor = PLAYER_COLORS.WAITING.border;
          } else if (isStatusHighlighted && player.status === 'PLAYING') {
            // Blue for playing players
            bgColor = PLAYER_COLORS.PLAYING.bg;
            borderColor = PLAYER_COLORS.PLAYING.border;
          } else if (isStatusHighlighted && player.status === 'INACTIVE') {
            // Gray for inactive players
            bgColor = PLAYER_COLORS.INACTIVE.bg;
            borderColor = PLAYER_COLORS.INACTIVE.border;
          } else {
            // Default color for other statuses or filtered out
            bgColor = PLAYER_COLORS.DEFAULT.bg;
            borderColor = PLAYER_COLORS.DEFAULT.border;
          }

          return (
            <Card
              key={player.id}
              variant="outline"
              size="sm"
              borderRadius="xl"
              borderWidth="2px"
              borderColor={borderColor}
              bg={bgColor}
              transition="all 0.2s"
              position="relative"
              overflow="visible"
              zIndex={openPlayerId === player.id ? 1000 : 1}
              cursor="pointer"
              boxShadow={
                selectionMode
                  ? isSelected
                    ? SELECTED_PLAYER_CARD_SHADOW
                    : PLAYER_CARD_SHADOW
                  : PLAYER_CARD_SHADOW
              }
              onClick={
                selectionMode
                  ? () => onPlayerToggle?.(player.id)
                  : () => handleShowDetail(player)
              }
              _hover={{
                transform: 'scale(1.02)',
                boxShadow: selectionMode
                  ? {
                      base: 'md',
                      _dark: '0 12px 30px rgba(0, 0, 0, 0.42)',
                    }
                  : 'lg',
                borderColor: selectionMode
                  ? { base: 'blue.300', _dark: 'whiteAlpha.400' }
                  : undefined,
              }}
            >
              <CardBody px={2.5} py={2.5} position="relative">
                {/* Row 1: Player number pill + wait time badge */}
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <Flex
                    bg={{ base: 'orange.500', _dark: 'orange.400' }}
                    color="white"
                    borderRadius="md"
                    px={1.5}
                    py={0.5}
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Text fontWeight="extrabold" fontSize="xs" lineHeight={1.2}>
                      #{player.playerNumber}
                    </Text>
                  </Flex>
                  {isShowWaitTime &&
                    (player.status === 'WAITING' ||
                      player.status === 'READY') && (
                      <Badge
                        colorPalette={
                          player.currentWaitTime > 15
                            ? 'red'
                            : player.currentWaitTime > 10
                              ? 'orange'
                              : 'gray'
                        }
                        variant="solid"
                        fontSize="xs"
                        borderRadius="md"
                        fontWeight="bold"
                        mr={mode === 'manage' && sessionId ? 6 : 0}
                      >
                        {formatWaitTime(player.currentWaitTime)}
                      </Badge>
                    )}
                </Flex>

                {/* Row 2: Player name */}
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  color="fg"
                  mb={2}
                  title={player.name || `Player ${player.playerNumber}`}
                >
                  {player.name ||
                    t('playerWithNumber', { number: player.playerNumber })}
                </Text>

                {/* Row 3: Badges + match count */}
                <Flex
                  justifyContent="space-between"
                  alignItems="center"
                  gap={1}
                  pr={selectionMode ? 6 : 0}
                >
                  <Flex alignItems="center" gap={1} overflow="hidden">
                    {mode === 'manage' && (
                      <Badge
                        variant="outline"
                        bg={{
                          base: 'whiteAlpha.800',
                          _dark: 'whiteAlpha.100',
                        }}
                        fontSize="xs"
                        borderRadius="sm"
                        flexShrink={0}
                      >
                        {getLevelShortLabel(player.level)}
                      </Badge>
                    )}
                    <Badge
                      variant="solid"
                      colorPalette={
                        player.gender === 'MALE'
                          ? 'blue'
                          : player.gender === 'FEMALE'
                            ? 'pink'
                            : player.gender === 'OTHER'
                              ? 'purple'
                              : 'gray'
                      }
                      fontSize="xs"
                      borderRadius="sm"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      flexShrink={0}
                    >
                      {player.gender === 'MALE' ? (
                        <Mars size={12} />
                      ) : player.gender === 'FEMALE' ? (
                        <Venus size={12} />
                      ) : player.gender === 'OTHER' ? (
                        <Users size={12} />
                      ) : (
                        <User size={12} />
                      )}
                    </Badge>
                  </Flex>
                  <Text
                    fontSize="xs"
                    color="fg.muted"
                    fontWeight="semibold"
                    whiteSpace="nowrap"
                    flexShrink={0}
                  >
                    {t('matchesCount', { count: player.matchesPlayed })}
                  </Text>
                </Flex>

                {/* Selection indicator (bottom right) */}
                {selectionMode && isSelected && (
                  <Box
                    position="absolute"
                    bottom={1.5}
                    right={1.5}
                    w={5}
                    h={5}
                    borderRadius="full"
                    bg="blue.500"
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                    boxShadow="sm"
                  >
                    ✓
                  </Box>
                )}

                {/* Action Menu */}
                {mode === 'manage' && sessionId && (
                  <Box
                    position="absolute"
                    top={0.5}
                    right={0.5}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PlayerActionMenu
                      player={player}
                      onShowQR={onShowQR || handleShowDetail}
                      onEdit={onEdit || (() => {})}
                      onDelete={onDelete || (() => {})}
                      onToggleStatus={onToggleStatus || (() => {})}
                      t={t}
                      buttonVariant="ghost"
                      buttonSize="xs"
                      onOpenChange={(isOpen) => {
                        if (isOpen) {
                          setOpenPlayerId(player.id);
                        } else if (openPlayerId === player.id) {
                          setOpenPlayerId(null);
                        }
                      }}
                    />
                  </Box>
                )}
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      {/* Player Detail Modal */}
      {selectedPlayerForDetail && (
        <PlayerDetailModal
          isOpen={!!selectedPlayerForDetail}
          onClose={() => setSelectedPlayerForDetail(null)}
          player={selectedPlayerForDetail}
          sessionId={sessionId}
          formatWaitTime={formatWaitTime}
          onPlayerUpdate={onPlayerUpdate}
        />
      )}
    </>
  );
};
