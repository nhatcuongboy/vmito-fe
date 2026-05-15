'use client';

import { CourtDirection } from '@/lib/api/types';
import { Box, Spinner } from '@chakra-ui/react';
import { useState } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { TMatchType } from '@/hooks/useCourtsTabModals';
import CourtPlayer, { BadmintonCourtPlayer } from './CourtPlayer';
import { useAiAssistantStore } from '@/stores/useAiAssistantStore';
import { useLocale, useTranslations } from 'next-intl';
import { Locale } from '@/i18n/locales';

interface BadmintonCourtProps {
  players: BadmintonCourtPlayer[];
  isActive: boolean;
  elapsedTime?: string;
  courtName?: string;
  courtNumber?: number;
  width?: string;
  isLoading?: boolean;
  status?: 'IN_USE' | 'READY' | 'EMPTY';
  mode?: 'manage' | 'view' | 'selection';
  courtColor?: string;
  matchType?: TMatchType;
  // Selection mode props
  onPlayerSelect?: (player: BadmintonCourtPlayer, position: number) => void;
  onPlayerRemove?: (position: number) => void;
  onPositionSelect?: (position: number) => void; // New: click on empty position
  currentPlayerPosition?: number; // 0-3, which position is currently being selected
  selectedPositions?: (BadmintonCourtPlayer | undefined)[]; // For selection mode
  direction?: CourtDirection; // Layout direction from API
  preSelectedPlayers?: Array<{
    playerId: string;
    position: number;
    player?: BadmintonCourtPlayer;
  }>; // Pre-selected players for next match
  onAIAnalysis?: () => void; // Callback for AI analysis button
}

export default function BadmintonCourt({
  players,
  isActive,
  elapsedTime,
  courtName,
  courtNumber,
  width = '100%',
  isLoading = false,
  status,
  mode = 'manage',
  courtColor = '#179a3b',
  matchType = 'doubles',
  onPlayerSelect,
  onPlayerRemove,
  onPositionSelect,
  currentPlayerPosition = 0,
  selectedPositions = [],
  direction = CourtDirection.HORIZONTAL,
  preSelectedPlayers = [],
  onAIAnalysis,
}: BadmintonCourtProps) {
  const [clickedPlayer, setClickedPlayer] = useState<string | null>(null);
  const aspectRatio = 13.4 / 6.1;
  const preSelectedCount = preSelectedPlayers.length;
  const { openWithMessage } = useAiAssistantStore();
  const locale = useLocale();
  const tAi = useTranslations('aiAssistant');

  const handleAnnounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const sortedPlayers = [...players].sort(
      (a, b) => (a.courtPosition ?? 0) - (b.courtPosition ?? 0)
    );

    const getPlayerName = (p: BadmintonCourtPlayer | undefined | null) =>
      p?.name || `Người chơi ${p?.playerNumber ?? ''}`;

    // Group by pairs based on visual column (HORIZONTAL vs VERTICAL)
    let pair1: BadmintonCourtPlayer[];
    let pair2: BadmintonCourtPlayer[];
    if (sortedPlayers.length <= 2) {
      // Singles: 1 player per side
      pair1 = [sortedPlayers[0]].filter(Boolean) as BadmintonCourtPlayer[];
      pair2 = [sortedPlayers[1]].filter(Boolean) as BadmintonCourtPlayer[];
    } else if (direction === CourtDirection.HORIZONTAL) {
      // HORIZONTAL mapping: sorted[0] & [1] → left column (pair 1), sorted[2] & [3] → right column (pair 2)
      pair1 = [sortedPlayers[0], sortedPlayers[1]].filter(
        Boolean
      ) as BadmintonCourtPlayer[];
      pair2 = [sortedPlayers[2], sortedPlayers[3]].filter(
        Boolean
      ) as BadmintonCourtPlayer[];
    } else {
      // VERTICAL mapping: sorted[0] & [2] → left column (pair 1), sorted[1] & [3] → right column (pair 2)
      pair1 = [sortedPlayers[0], sortedPlayers[2]].filter(
        Boolean
      ) as BadmintonCourtPlayer[];
      pair2 = [sortedPlayers[1], sortedPlayers[3]].filter(
        Boolean
      ) as BadmintonCourtPlayer[];
    }

    const pair1Names = pair1.map(getPlayerName).join(' và ');
    const pair2Names = pair2.map(getPlayerName).join(' và ');
    const allNames = pair1Names + (pair2Names ? ` , ${pair2Names}` : '');

    const courtNum = courtNumber ?? '';
    const intro =
      status === 'READY'
        ? `Mời những người chơi sau vào sân số`
        : `Những người chơi sau đang chơi trên sân số`;
    const detail = `${courtNum}: ${allNames}`;

    window.speechSynthesis.cancel();

    const utterance1 = new SpeechSynthesisUtterance(intro);
    utterance1.lang = 'vi-VN';
    utterance1.rate = 1.1;

    const utterance2 = new SpeechSynthesisUtterance(detail);
    utterance2.lang = 'vi-VN';
    utterance2.rate = 0.85;

    utterance1.onend = () => window.speechSynthesis.speak(utterance2);
    window.speechSynthesis.speak(utterance1);
  };

  const handleAIAnalysis = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onAIAnalysis) {
      onAIAnalysis();
      return;
    }

    // Build analysis prompt for this specific court match
    const isVi = locale === Locale.VI;
    const isCn = locale === Locale.CN;
    const sortedPlayers = [...players].sort(
      (a, b) => (a.courtPosition ?? 0) - (b.courtPosition ?? 0)
    );

    // Group players into pairs
    let pair1: BadmintonCourtPlayer[];
    let pair2: BadmintonCourtPlayer[];

    if (sortedPlayers.length <= 2) {
      // Singles
      pair1 = [sortedPlayers[0]].filter(Boolean) as BadmintonCourtPlayer[];
      pair2 = [sortedPlayers[1]].filter(Boolean) as BadmintonCourtPlayer[];
    } else if (direction === CourtDirection.HORIZONTAL) {
      pair1 = [sortedPlayers[0], sortedPlayers[1]].filter(
        Boolean
      ) as BadmintonCourtPlayer[];
      pair2 = [sortedPlayers[2], sortedPlayers[3]].filter(
        Boolean
      ) as BadmintonCourtPlayer[];
    } else {
      pair1 = [sortedPlayers[0], sortedPlayers[2]].filter(
        Boolean
      ) as BadmintonCourtPlayer[];
      pair2 = [sortedPlayers[1], sortedPlayers[3]].filter(
        Boolean
      ) as BadmintonCourtPlayer[];
    }

    const formatPlayerInfo = (player: BadmintonCourtPlayer) => {
      const level = player.level
        ? isCn
          ? `等级 ${player.level}`
          : isVi
            ? `Trình độ ${player.level}`
            : `Level ${player.level}`
        : isCn
          ? '水平未确定'
          : isVi
            ? 'Chưa xác định trình độ'
            : 'Unknown level';
      const fallbackName = isCn
        ? `球员 ${player.playerNumber}`
        : isVi
          ? `Người chơi ${player.playerNumber}`
          : `Player ${player.playerNumber}`;
      return `${player.name || fallbackName} (${level})`;
    };

    const pair1Info = pair1.map(formatPlayerInfo).join(' & ');
    const pair2Info = pair2.map(formatPlayerInfo).join(' & ');

    let prompt: string;
    const courtLabel = courtName || courtNumber || '';
    if (isVi) {
      prompt =
        `Hãy phân tích nhanh trận đấu cầu lông trên sân ${courtLabel} và cho tôi biết:\n\n` +
        `**Đội 1:** ${pair1Info}\n` +
        `**Đội 2:** ${pair2Info}\n\n` +
        `Phân tích:\n` +
        `1. Độ cạnh tranh/chênh lệch giữa 2 đội\n` +
        `2. Điểm mạnh/yếu của mỗi đội\n` +
        `3. Dự đoán kết quả và gợi ý chiến thuật\n\n` +
        `Chỉ trả lời ngắn gọn (5-7 dòng), bằng tiếng Việt.`;
    } else if (isCn) {
      prompt =
        `请快速分析 ${courtLabel} 球场上的这场羽毛球比赛，并告诉我：\n\n` +
        `**队伍 1：** ${pair1Info}\n` +
        `**队伍 2：** ${pair2Info}\n\n` +
        `分析：\n` +
        `1. 两队的竞争强度/水平差距\n` +
        `2. 每队的优势和弱点\n` +
        `3. 结果预测和战术建议\n\n` +
        `请用中文简短回答（5-7 行）。`;
    } else {
      prompt =
        `Quickly analyze this badminton match on court ${courtLabel} and tell me:\n\n` +
        `**Team 1:** ${pair1Info}\n` +
        `**Team 2:** ${pair2Info}\n\n` +
        `Analysis:\n` +
        `1. Competitiveness/skill gap between teams\n` +
        `2. Strengths/weaknesses of each team\n` +
        `3. Predicted outcome and tactical suggestions\n\n` +
        `Keep the answer concise (5-7 lines).`;
    }

    openWithMessage(
      prompt,
      tAi('pageContexts.matchAnalysis', { court: courtLabel })
    );
  };

  // Create placeholder players for selection mode
  const getDisplayPlayers = () => {
    if (mode !== 'selection') {
      // For manage/view modes, sort players by their courtPosition if available
      const sortedPlayers = [...players].sort((a, b) => {
        const posA = a.courtPosition ?? 0;
        const posB = b.courtPosition ?? 0;
        return posA - posB;
      });

      // Singles: 2 players → return directly (CourtPlayer handles positioning)
      if (sortedPlayers.length <= 2) {
        return sortedPlayers;
      }

      // Visual mapping based on direction prop
      let visualMapping: number[];
      if (direction === CourtDirection.HORIZONTAL) {
        // Horizontal layout (columns first)
        // API position 0 → Visual index 0 (top-left)
        // API position 1 → Visual index 2 (bottom-left)
        // API position 2 → Visual index 1 (top-right)
        // API position 3 → Visual index 3 (bottom-right)
        visualMapping = [0, 2, 1, 3];
      } else {
        // Vertical layout (rows first)
        // API position 0 → Visual index 0 (top-left)
        // API position 1 → Visual index 1 (top-right)
        // API position 2 → Visual index 2 (bottom-left)
        // API position 3 → Visual index 3 (bottom-right)
        visualMapping = [0, 1, 2, 3];
      }
      const remappedPlayers: (BadmintonCourtPlayer | null)[] = [
        null,
        null,
        null,
        null,
      ];

      sortedPlayers.forEach((player, index) => {
        const visualIndex = visualMapping[index] ?? index;
        if (visualIndex < 4) {
          remappedPlayers[visualIndex] = {
            ...player,
            // pairNumber, // Left column = pair 1, right column = pair 2
          };
        }
      });

      return remappedPlayers.filter(Boolean) as BadmintonCourtPlayer[];
    }

    // In selection mode, use selectedPositions array
    // Apply same visual mapping based on direction
    const isSingles = matchType === 'singles';

    if (isSingles) {
      // Singles: 2 positions → visual index 0 (left center) and 1 (right center)
      const displayPlayers: (BadmintonCourtPlayer | null)[] = [null, null];
      selectedPositions.forEach((player, i) => {
        if (i < 2 && player) {
          const courtPlayer: BadmintonCourtPlayer = {
            ...player,
            pairNumber: i + 1,
            isCurrentPlayer: i === currentPlayerPosition,
          };
          displayPlayers[i] = courtPlayer;
        }
      });
      return displayPlayers;
    }

    const displayPlayers: (BadmintonCourtPlayer | null)[] = [
      null,
      null,
      null,
      null,
    ];

    let mapping: number[];
    if (direction === CourtDirection.HORIZONTAL) {
      mapping = [0, 2, 1, 3];
    } else {
      mapping = [0, 1, 2, 3];
    }

    selectedPositions.forEach((player, i) => {
      const mappedIndex = mapping[i];
      if (mappedIndex < 4 && player) {
        // Assign pair by column: left (0,2) = pair 1, right (1,3) = pair 2
        const pairNumber = mappedIndex % 2 === 0 ? 1 : 2;
        const courtPlayer: BadmintonCourtPlayer = {
          ...player,
          pairNumber,
          // Highlight by selection order, not visual index
          isCurrentPlayer: i === currentPlayerPosition,
        };
        displayPlayers[mappedIndex] = courtPlayer;
      }
    });
    return displayPlayers;
  };

  const displayPlayers = getDisplayPlayers();

  // Determine effective match type: infer singles from player count in non-selection mode
  const effectiveMatchType: TMatchType =
    mode !== 'selection' && players.length > 0 && players.length <= 2
      ? 'singles'
      : matchType;

  // Handle player removal in selection mode
  const handlePlayerRemove = (position: number) => {
    if (mode === 'selection' && onPlayerRemove) {
      onPlayerRemove(position);
    }
  };

  const handlePlayerClick = (
    playerId: string | null,
    player?: BadmintonCourtPlayer,
    position?: number
  ) => {
    setClickedPlayer(playerId);
    if (mode === 'selection' && player && position !== undefined) {
      onPlayerSelect?.(player, position);
    }
  };

  return (
    <Box
      width={width}
      aspectRatio={aspectRatio}
      position="relative"
      data-court-name={courtName ?? ''}
      data-elapsed-time={elapsedTime ?? ''}
      data-preselected-count={preSelectedCount}
      borderColor={
        status === 'READY'
          ? 'yellow.500' // yellow border for READY
          : status === 'IN_USE' || isActive || mode === 'selection'
            ? 'green.200' // green border for active courts and selection mode
            : 'border'
      }
      borderRadius="md"
      overflow="visible"
      // boxShadow={status === "READY" ? "0 0 0 4px #fef08a" : undefined}
    >
      {/* Outer boundary */}
      <Box
        position="absolute"
        top="0%"
        left="0%"
        right="0%"
        bottom="0%"
        pointerEvents="all"
        zIndex={1}
        bg={
          status === 'READY'
            ? { base: '#fef3c7', _dark: 'yellow.900/30' } // light yellow
            : status === 'IN_USE' || isActive || mode === 'selection'
              ? courtColor // use prop for active courts and selection mode
              : { base: '#e6e6e6', _dark: 'gray.700' }
        }
        border="4px solid"
        borderColor={
          status === 'READY'
            ? 'yellow.400'
            : status === 'IN_USE' || isActive || mode === 'selection'
              ? 'whiteAlpha.300'
              : 'border'
        }
        onClick={(e) => {
          e.stopPropagation();
          setClickedPlayer(null);
        }}
      />
      {/* Net (center dashed line) */}
      <Box
        position="absolute"
        top="0%"
        bottom="0%"
        left="50%"
        width="0"
        borderLeft="2px dashed #fff"
        zIndex={2}
      />
      {/* Center horizontal line (across the court, at 50%) */}
      <Box
        position="absolute"
        left="0%"
        right="0%"
        top="50%"
        height="0"
        borderTop="2px solid #fff"
        zIndex={2}
      />
      {/* Top and bottom doubles service lines */}
      <Box
        position="absolute"
        top="10%"
        left="0%"
        right="0%"
        height="0"
        borderTop="2px solid #fff"
        zIndex={2}
      />
      <Box
        position="absolute"
        bottom="10%"
        left="0%"
        right="0%"
        height="0"
        borderTop="2px solid #fff"
        zIndex={2}
      />
      {/* Left and right doubles sidelines */}
      <Box
        position="absolute"
        top="0%"
        bottom="0%"
        left="8%"
        width="0"
        borderLeft="2px solid #fff"
        zIndex={2}
      />
      <Box
        position="absolute"
        top="0%"
        bottom="0%"
        right="8%"
        width="0"
        borderLeft="2px solid #fff"
        zIndex={2}
      />
      {/* Center service lines (vertical, from net to service lines) */}
      <Box
        position="absolute"
        top="0%"
        bottom="50%"
        left="40%"
        width="0"
        borderLeft="2px solid #fff"
        zIndex={2}
      />
      <Box
        position="absolute"
        top="0%"
        bottom="50%"
        right="40%"
        width="0"
        borderLeft="2px solid #fff"
        zIndex={2}
      />
      <Box
        position="absolute"
        top="50%"
        bottom="0%"
        left="40%"
        width="0"
        borderLeft="2px solid #fff"
        zIndex={2}
      />
      <Box
        position="absolute"
        top="50%"
        bottom="0%"
        right="40%"
        width="0"
        borderLeft="2px solid #fff"
        zIndex={2}
      />
      {/* Click outside backdrop to close tooltip */}
      {clickedPlayer && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          zIndex={9998}
          onClick={() => setClickedPlayer(null)}
        />
      )}
      {/* Player positions: center of each doubles service box */}
      {mode === 'selection'
        ? // Selection mode: Show placeholders and highlight current position
          displayPlayers.map((player, visualIndex) => {
            const isSingles = matchType === 'singles';
            // Calculate selection index from visual index based on direction
            let selectionIndex: number;
            if (isSingles) {
              // Singles: visual index maps directly to selection index (0, 1)
              selectionIndex = visualIndex;
            } else {
              let reverseMapping: number[];
              if (direction === CourtDirection.HORIZONTAL) {
                reverseMapping = [0, 2, 1, 3];
              } else {
                reverseMapping = [0, 1, 2, 3];
              }
              selectionIndex = reverseMapping[visualIndex];
            }

            if (player) {
              // Render actual player
              return (
                <CourtPlayer
                  key={`player-${visualIndex}-${player.id}`}
                  player={{
                    ...player,
                    isCurrentPlayer: selectionIndex === currentPlayerPosition,
                  }}
                  index={visualIndex}
                  mode={mode}
                  matchType={matchType}
                  isClicked={clickedPlayer === player.id}
                  onPlayerClick={(id) =>
                    handlePlayerClick(id, player, selectionIndex)
                  }
                  onRemovePlayer={() => handlePlayerRemove(selectionIndex)}
                />
              );
            } else {
              // Render placeholder for empty position
              return (
                <Box
                  key={`placeholder-${visualIndex}`}
                  position="absolute"
                  {...(() => {
                    if (isSingles) {
                      // Singles: 2 positions, centered vertically on each side
                      const singlesPositions = [
                        { top: '50%', left: '25%' }, // Left center
                        { top: '50%', left: '75%' }, // Right center
                      ];
                      return singlesPositions[visualIndex];
                    }
                    const positions = [
                      { top: '30%', left: '25%' }, // Top-left
                      { top: '30%', left: '75%' }, // Top-right
                      { top: '72%', left: '25%' }, // Bottom-left
                      { top: '72%', left: '75%' }, // Bottom-right
                    ];
                    return positions[visualIndex];
                  })()}
                  transform="translate(-50%, -50%)"
                  zIndex={3}
                  cursor="pointer"
                  onClick={() => {
                    if (onPositionSelect) {
                      onPositionSelect(selectionIndex);
                    }
                  }}
                >
                  <Box
                    position="relative"
                    bg={
                      selectionIndex === currentPlayerPosition
                        ? { base: 'yellow.100', _dark: 'yellow.900/40' }
                        : { base: 'gray.100', _dark: 'whiteAlpha.100' }
                    }
                    borderRadius="full"
                    border="3px dashed"
                    borderColor={
                      selectionIndex === currentPlayerPosition
                        ? 'yellow.500'
                        : { base: 'gray.400', _dark: 'whiteAlpha.400' }
                    }
                    w="50px"
                    h="50px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow={
                      selectionIndex === currentPlayerPosition ? 'lg' : 'sm'
                    }
                    transition="all 0.3s"
                    _hover={{
                      transform:
                        selectionIndex === currentPlayerPosition
                          ? 'scale(1.1)'
                          : 'scale(1.05)',
                      borderColor: 'yellow.400',
                    }}
                  >
                    {selectionIndex === currentPlayerPosition && (
                      <>
                        {/* Pulsing effect for current position */}
                        <Box
                          position="absolute"
                          top="-4px"
                          left="-4px"
                          right="-4px"
                          bottom="-4px"
                          borderRadius="full"
                          border="2px solid"
                          borderColor="yellow.500"
                          animation="currentPositionPulse 2s infinite"
                          pointerEvents="none"
                        />
                        <style jsx>{`
                          @keyframes currentPositionPulse {
                            0% {
                              transform: scale(1);
                              opacity: 1;
                            }
                            50% {
                              transform: scale(1.2);
                              opacity: 0.7;
                            }
                            100% {
                              transform: scale(1);
                              opacity: 1;
                            }
                          }
                        `}</style>
                      </>
                    )}
                    <Box
                      fontSize="lg"
                      fontWeight="bold"
                      color={
                        selectionIndex === currentPlayerPosition
                          ? { base: 'yellow.700', _dark: 'yellow.400' }
                          : 'fg.muted'
                      }
                    >
                      {selectionIndex + 1}
                    </Box>
                  </Box>
                </Box>
              );
            }
          })
        : // Normal mode: Render actual players from displayPlayers (sorted by courtPosition)
          displayPlayers &&
          displayPlayers.length > 0 &&
          (displayPlayers.filter(Boolean) as BadmintonCourtPlayer[]).map(
            (player, index) => (
              <CourtPlayer
                key={player.id}
                player={player}
                index={index}
                mode={mode}
                matchType={effectiveMatchType}
                isClicked={clickedPlayer === player.id}
                onPlayerClick={(id) => handlePlayerClick(id, player, index)}
              />
            )
          )}
      )
      {isLoading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="blackAlpha.800"
          color="white"
          px={2}
          py={2}
          borderRadius="full"
          fontSize="sm"
          fontWeight="bold"
          boxShadow="lg"
          zIndex={5}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Spinner size="md" />
        </Box>
      )}
      {/* AI Analysis button - only visible when READY or IN_USE */}
      {(status === 'READY' || status === 'IN_USE') && (
        <Box
          position="absolute"
          top="4%"
          right="2%"
          zIndex={6}
          cursor="pointer"
          onClick={handleAIAnalysis}
          bg="purple.500"
          opacity={0.92}
          backdropFilter="blur(8px)"
          borderRadius="full"
          w="28px"
          h="28px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          _hover={{
            bg: 'purple.600',
            transform: 'scale(1.15)',
            opacity: 1,
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.6)',
          }}
          transition="all 0.3s ease"
          title="Trợ lý AI phân tích trận đấu"
          boxShadow="0 4px 12px rgba(139, 92, 246, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2)"
          border="1px solid"
          borderColor="whiteAlpha.300"
        >
          <Sparkles size={15} color="white" />
        </Box>
      )}
      {/* Speaker icon for court announcements - only visible when READY or IN_USE and in manage mode */}
      {(status === 'READY' || status === 'IN_USE') && mode === 'manage' && (
        <Box
          position="absolute"
          bottom="4%"
          right="2%"
          zIndex={10}
          cursor="pointer"
          onClick={handleAnnounce}
          bg="blackAlpha.600"
          borderRadius="full"
          w="28px"
          h="28px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          _hover={{ bg: 'blackAlpha.800', transform: 'scale(1.1)' }}
          transition="all 0.2s"
          title="Thông báo qua loa"
        >
          <Volume2 size={15} color="white" />
        </Box>
      )}
    </Box>
  );
}
