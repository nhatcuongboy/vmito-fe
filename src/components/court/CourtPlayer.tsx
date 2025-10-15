'use client';

import { Player } from '@/types/session';
import { getLevelLabel } from '@/utils/level-mapping';
import { Box, Text } from '@chakra-ui/react';
import { Mars, User, Venus, X, HelpCircle, UserX } from 'lucide-react';
import { useRef } from 'react';
import PlayerTooltip from './PlayerTooltip';

interface BadmintonCourtPlayer extends Player {
  pairNumber?: number; // Add pair number for explicit pair assignment
  isCurrentPlayer?: boolean; // Add highlighting for current player
  desire?: string; // Add desire field
  levelDescription?: string; // Add level description field
}

// Helper functions
function getGenderColor(gender?: string): string {
  if (gender === 'MALE') return '#3182ce';
  if (gender === 'FEMALE') return '#d53f8c';
  if (gender === 'OTHER') return '#805ad5';
  if (gender === 'PREFER_NOT_TO_SAY') return '#718096';
  return '#718096';
}

function getGenderIcon(gender?: string) {
  if (gender === 'MALE') return Mars;
  if (gender === 'FEMALE') return Venus;
  if (gender === 'OTHER') return User;
  if (gender === 'PREFER_NOT_TO_SAY') return HelpCircle;
  return User;
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

// CourtPlayer component
interface CourtPlayerProps {
  player: BadmintonCourtPlayer;
  index: number;
  players: BadmintonCourtPlayer[];
  mode: 'manage' | 'view' | 'selection';
  isClicked: boolean;
  onPlayerClick: (id: string | null) => void;
  onRemovePlayer?: (position: number) => void; // Remove callback with position
}

export default function CourtPlayer({
  player,
  index,
  players,
  mode,
  isClicked,
  onPlayerClick,
  onRemovePlayer,
}: CourtPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null!);

  // Skip if player is invalid
  if (!player || !player.id) {
    console.warn(`Invalid player at index ${index}:`, player);
    return null;
  }

  // In selection mode, always use index as position
  let positionIndex = index;
  // For other modes, simply use the index (since BadmintonCourt already handles the mapping)
  if (mode !== 'selection') {
    positionIndex = index;
  }

  // Calculate positions: 4 centers of 4 equal parts of the court
  // Each part: width 50%, height 50%
  // Centers: (25%,25%), (75%,25%), (25%,75%), (75%,75%)
  // index 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right
  const positions = [
    { top: '30%', left: '25%' }, // Top-left (1)
    { top: '30%', left: '75%' }, // Top-right (2)
    { top: '72%', left: '25%' }, // Bottom-left (3)
    { top: '72%', left: '75%' }, // Bottom-right (4)
  ];
  const position = positions[positionIndex] || positions[0];
  const pairColors = getPairColor(player, index);
  const GenderIcon = getGenderIcon(player.gender);

  // Calculate tooltip position based on player position
  const getTooltipPosition = () => {
    if (!playerRef.current) {
      return { left: '50%', top: '50%' };
    }

    const rect = playerRef.current.getBoundingClientRect();
    const tooltipWidth = 280; // maxW="280px"
    const tooltipHeight = 150; // reduced approximate height

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - tooltipHeight - 5; // reduced gap above player

    // Adjust if tooltip goes outside viewport
    if (left < 10) {
      left = 10;
    }
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }

    if (top < 10) {
      // If not enough space above, show below but closer
      top = rect.bottom + 5; // reduced gap below player
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  const playerEffectColor = '#ffffff';

  return (
    <>
      <Box
        ref={playerRef}
        position="absolute"
        {...position}
        transform="translate(-50%, -50%)"
        zIndex={3}
      >
        <Box
          position="relative"
          bg={pairColors.bg}
          borderRadius="full"
          border="3px solid"
          borderColor={pairColors.border}
          p={1}
          w="50px"
          h="50px"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          boxShadow="md"
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            transform: 'scale(1.1)',
            boxShadow: 'xl',
          }}
          zIndex={2}
          onClick={(e) => {
            e.stopPropagation();
            onPlayerClick(isClicked ? null : player.id);
          }}
        >
          {/* Gender badge at top-left */}
          <Box
            position="absolute"
            top="-8px"
            left="-8px"
            bg={getGenderColor(player.gender)}
            color="white"
            borderRadius="full"
            w="22px"
            h="22px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="2px solid white"
            zIndex={5}
            boxShadow="sm"
          >
            <Box as={GenderIcon} boxSize="14px" />
          </Box>
          {/* Current player effect - hidden in selection mode */}
          {player.isCurrentPlayer && mode !== 'selection' && (
            <>
              <Box
                position="absolute"
                top="-4px"
                left="-4px"
                right="-4px"
                bottom="-4px"
                borderRadius="full"
                boxShadow={`0 0 0 10px rgba(255, 255, 255, 0.6), 0 0 16px 0 ${playerEffectColor}`}
                zIndex={2}
                pointerEvents="none"
                animation="currentPlayerPulse 1.5s infinite"
              />
              <style jsx>{`
                @keyframes currentPlayerPulse {
                  0% {
                    box-shadow:
                      0 0 0 6px rgba(255, 255, 255, 0.6),
                      0 0 8px 0 ${playerEffectColor};
                  }
                  50% {
                    box-shadow:
                      0 0 0 10px rgba(255, 255, 255, 0.3),
                      0 0 16px 0 ${playerEffectColor};
                  }
                  100% {
                    box-shadow:
                      0 0 0 6px rgba(255, 255, 255, 0.6),
                      0 0 8px 0 ${playerEffectColor};
                  }
                }
              `}</style>
            </>
          )}
          {/* Player Number only (gender hidden) */}
          <Text
            fontSize="l"
            fontWeight="bold"
            color={pairColors.border}
            lineHeight="1"
            mb={0.5}
          >
            #{player.playerNumber}
          </Text>
        </Box>

        {mode !== 'view' && (
          <>
            <Box
              position="absolute"
              top="-10px"
              right="-12px"
              bg={pairColors.border}
              color="white"
              borderRadius="full"
              w="35px"
              h="22px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              fontWeight="bold"
              border="2px solid white"
              zIndex={4}
            >
              {getLevelLabel(player.level, '?')}
            </Box>
          </>
        )}
        {/* Remove button */}
        {mode === 'selection' && (
          <Box
            position="absolute"
            bottom="-8px"
            right="-8px"
            bg="red.500"
            color="white"
            borderRadius="full"
            w="20px"
            h="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="2px solid white"
            zIndex={5}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              bg: 'red.600',
              transform: 'scale(1.1)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRemovePlayer?.(index);
            }}
          >
            <Box as={X} boxSize="12px" />
          </Box>
        )}
      </Box>

      {/* Tooltip rendered using PlayerTooltip component */}
      <PlayerTooltip
        player={player}
        index={index}
        isVisible={isClicked}
        position={getTooltipPosition()}
        mode={mode}
        playerRef={playerRef}
      />
    </>
  );
}

// Export types for reuse
export type { BadmintonCourtPlayer };
