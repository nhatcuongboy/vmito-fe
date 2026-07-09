'use client';

import { Player } from '@/types/session';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Box, Text } from '@chakra-ui/react';
import { Mars, User, Venus, X, HelpCircle } from 'lucide-react';
import { useRef } from 'react';
import PlayerTooltip from './PlayerTooltip';
import { useCourtDisplayModeStore } from '@/stores/useCourtDisplayModeStore';

import { TMatchType } from '@/hooks/useCourtsTabModals';

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

// Canvas-based name truncation helper to avoid trailing space before ellipsis
let memoCanvas: HTMLCanvasElement | null = null;
let memoContext: CanvasRenderingContext2D | null = null;

function getTruncatedName(name: string, maxWidth: number): string {
  if (typeof window === 'undefined') return name;

  try {
    if (!memoCanvas) {
      memoCanvas = document.createElement('canvas');
      memoContext = memoCanvas.getContext('2d');
    }
    const context = memoContext;
    if (!context) return name;

    context.font =
      '600 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    const trimmed = name.trim();
    if (context.measureText(trimmed).width <= maxWidth) {
      return trimmed;
    }

    const ellipsis = '...';
    const ellipsisWidth = context.measureText(ellipsis).width;
    const targetWidth = maxWidth - ellipsisWidth;

    let low = 0;
    let high = trimmed.length;
    let bestFitLength = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const testString = trimmed.slice(0, mid);
      if (context.measureText(testString).width <= targetWidth) {
        bestFitLength = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const truncated = trimmed.slice(0, bestFitLength).trimEnd();
    return `${truncated}${ellipsis}`;
  } catch (e) {
    console.error('Error truncating name:', e);
    return name;
  }
}

// CourtPlayer component
interface CourtPlayerProps {
  player: BadmintonCourtPlayer;
  index: number;
  mode: 'manage' | 'view' | 'selection';
  matchType?: TMatchType;
  isClicked: boolean;
  onPlayerClick: (id: string | null) => void;
  onRemovePlayer?: (position: number) => void; // Remove callback with position
}

export default function CourtPlayer({
  player,
  index,
  mode,
  matchType = 'doubles',
  isClicked,
  onPlayerClick,
  onRemovePlayer,
}: CourtPlayerProps) {
  const { getLevelShortLabel } = useLevelLabel();
  const playerRef = useRef<HTMLDivElement>(null!);
  const courtDisplayMode = useCourtDisplayModeStore((s) => s.courtDisplayMode);
  const isNameMode = courtDisplayMode === 'name';

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

  // Calculate positions based on match type
  const positions =
    matchType === 'singles'
      ? [
          { top: '50%', left: '25%' }, // Left center
          { top: '50%', left: '75%' }, // Right center
        ]
      : [
          { top: '30%', left: '25%' }, // Top-left (1)
          { top: '30%', left: '75%' }, // Top-right (2)
          { top: '72%', left: '25%' }, // Bottom-left (3)
          { top: '72%', left: '75%' }, // Bottom-right (4)
        ];
  const position = positions[positionIndex] || positions[0];
  const pairColors = getPairColor(player, index);
  const GenderIcon = getGenderIcon(player.gender);

  const playerEffectColor = '#ffffff';
  const playerDisplayName = player.name?.trim() || `#${player.playerNumber}`;

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
          as="button"
          aria-label={`Xem thông tin người chơi ${playerDisplayName}`}
          aria-expanded={isClicked}
          position="relative"
          bg={pairColors.bg}
          borderRadius={isNameMode ? '8px' : 'full'}
          border="3px solid"
          borderColor={pairColors.border}
          p={isNameMode ? 0 : 1}
          {...(isNameMode
            ? {
                w: '96px',
                h: '38px',
                px: '6px',
                py: '4px',
              }
            : {
                w: '50px',
                h: '50px',
              })}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          boxShadow="md"
          cursor="pointer"
          transition="transform 0.2s ease, box-shadow 0.2s ease"
          _hover={{
            transform: 'scale(1.1)',
            boxShadow: 'xl',
          }}
          _focusVisible={{
            outline: 'none',
            boxShadow: `0 0 0 3px white, 0 0 0 6px ${pairColors.border}`,
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
            top={isNameMode ? '-10px' : '-8px'}
            left={isNameMode ? '-10px' : '-8px'}
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
            aria-hidden="true"
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
                borderRadius={isNameMode ? '10px' : 'full'}
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
          {/* Player display: number mode shows #{number}, name mode shows player name */}
          {isNameMode ? (
            <Text
              fontSize="15px"
              fontWeight={600}
              color={pairColors.border}
              lineHeight="1.2"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              maxW="100%"
            >
              {getTruncatedName(player.name || `#${player.playerNumber}`, 78)}
            </Text>
          ) : (
            <Text
              fontSize="l"
              fontWeight="bold"
              color={pairColors.border}
              lineHeight="1"
              mb={0.5}
            >
              #{player.playerNumber}
            </Text>
          )}
        </Box>

        {mode !== 'view' && (
          <>
            <Box
              position="absolute"
              top={isNameMode ? '-12px' : '-10px'}
              right={isNameMode ? '-10px' : '-12px'}
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
              {getLevelShortLabel(player.level) || '?'}
            </Box>
          </>
        )}
        {/* Remove button */}
        {mode === 'selection' && (
          <Box
            position="absolute"
            bottom={isNameMode ? '-10px' : '-8px'}
            right={isNameMode ? '-10px' : '-8px'}
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
        mode={mode}
        playerRef={playerRef}
      />
    </>
  );
}

// Export types for reuse
export type { BadmintonCourtPlayer };
