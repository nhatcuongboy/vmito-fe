'use client';

import { Player } from '@/types/session';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Box, Text, Portal } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

interface BadmintonCourtPlayer extends Player {
  pairNumber?: number;
  isCurrentPlayer?: boolean;
  desire?: string;
  levelDescription?: string;
}

function formatWaitTime(waitTimeInMinutes?: number): string {
  if (!waitTimeInMinutes) return '0m';
  const hours = Math.floor(waitTimeInMinutes / 60);
  const minutes = waitTimeInMinutes % 60;
  if (hours > 0) {
    return `${hours}h${minutes}m`;
  }
  return `${minutes}m`;
}

function getPairColor(player?: BadmintonCourtPlayer, playerIndex?: number) {
  let pairNumber = player?.pairNumber;
  if (!pairNumber && playerIndex !== undefined) {
    // Column-based pairing: left column (0,2) = pair 1, right column (1,3) = pair 2
    pairNumber = playerIndex % 2 === 0 ? 1 : 2;
  } else if (!pairNumber) {
    pairNumber = 1;
  }
  const pairIndex = pairNumber - 1;
  const pairColors = [
    { bg: 'blue.50', border: 'blue.500', name: 'Blue' },
    { bg: 'orange.50', border: 'orange.500', name: 'Orange' },
  ];
  return pairColors[pairIndex] || pairColors[0];
}

interface PlayerTooltipProps {
  player: BadmintonCourtPlayer;
  index: number;
  isVisible: boolean;
  position: { left: string; top: string };
  mode?: 'manage' | 'view' | 'selection';
  playerRef?: React.RefObject<HTMLDivElement>;
}

export default function PlayerTooltip({
  player,
  index,
  isVisible,
  position,
  mode = 'manage',
  playerRef,
}: PlayerTooltipProps) {
  const { getLevelShortLabel } = useLevelLabel();
  const t = useTranslations('common');
  const [tooltipPosition, setTooltipPosition] = useState(position);

  // Update tooltip position for better placement
  useEffect(() => {
    if (isVisible && playerRef?.current) {
      const updatePosition = () => {
        const rect = playerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Calculate more precise position - closer to the player circle
        const tooltipWidth = 280;
        const tooltipHeight = 150;
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;
        let top = rect.top - tooltipHeight - 5; // Closer gap

        // Adjust if tooltip goes outside viewport
        if (left < 10) left = 10;
        if (left + tooltipWidth > window.innerWidth - 10) {
          left = window.innerWidth - tooltipWidth - 10;
        }

        // If not enough space above, position below but very close
        if (top < 10) {
          top = rect.bottom + 5;
        }

        setTooltipPosition({
          left: `${left}px`,
          top: `${top}px`,
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }
  }, [isVisible, playerRef]);

  if (!isVisible) return null;

  // Calculate player's pair info
  let pairNumber = player.pairNumber;
  if (!pairNumber) {
    // Column-based pairing: left column (0,2) = pair 1, right column (1,3) = pair 2
    pairNumber = index % 2 === 0 ? 1 : 2;
  }
  const pairColors = getPairColor(player, index);
  const pairName = pairColors.name;

  return (
    <Portal>
      <Box
        position="fixed"
        {...tooltipPosition}
        bg="gray.900"
        color="white"
        borderRadius="md"
        boxShadow="dark-lg"
        fontSize="sm"
        zIndex={9999}
        minW="240px"
        maxW="280px"
        p={4}
        animation="fadeIn 0.2s"
        border="1px solid"
        borderColor="gray.700"
      >
        <Text fontWeight="bold" fontSize="lg" mb={1} color="white">
          #{player.playerNumber}
        </Text>

        <Text fontSize="md" fontWeight="medium" color="green.300" mb={4}>
          {player.name || `Player ${player.playerNumber}`}
        </Text>

        <Box display="flex" flexDirection="column" gap={2}>
          {/* Gender */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text color="gray.400">{t('gender')}:</Text>
            <Text color="white" fontWeight="medium">
              {player.gender ? player.gender.toUpperCase() : 'UNKNOWN'}
            </Text>
          </Box>

          {/* Level - Only show in manage mode */}
          {mode === 'manage' && (
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Text color="gray.400">{t('level')}:</Text>
              <Text color="white" fontWeight="medium">
                {getLevelShortLabel(player.level) || 'N/A'}
              </Text>
            </Box>
          )}

          {/* Simple check for valid level description - optional display could be added here if needed, 
              but distinct from the design request which focuses on layout. 
              Keeping it minimal as per provided image. */}

          {/* Matches Played */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text color="gray.400">{t('matchesPlayed')}:</Text>
            <Text color="white" fontWeight="medium">
              {player.matchesPlayed || 0}
            </Text>
          </Box>

          {/* Wait Time */}
          {mode === 'manage' &&
            ['WAITING', 'READY'].includes(player.status) && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text color="gray.400">{t('waitTime')}:</Text>
                <Text color="white" fontWeight="medium">
                  {formatWaitTime(player.currentWaitTime)}
                </Text>
              </Box>
            )}

          {/* Pair */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text color="gray.400">{t('pair')}:</Text>
            <Text color={pairColors.border} fontWeight="bold">
              {t('pair')} {pairNumber}
            </Text>
          </Box>
        </Box>
      </Box>
    </Portal>
  );
}

// Export types for reuse
export type { BadmintonCourtPlayer };
