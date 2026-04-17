import { Button as CompatButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { CourtService } from '@/lib/api/court.service';
import { CourtDirection, SuggestedPlayersResponse } from '@/lib/api/types';
import { Court, Player } from '@/types/session';
import { PlayerGrid } from '@/components/player/PlayerGrid';
import BadmintonCourt from '@/components/court/BadmintonCourt';
import { Badge, Box, Flex, HStack, Tabs, Text } from '@chakra-ui/react';
import { Play, Shuffle, Sparkles, UserPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Locale } from '@/i18n/locales';

type SelectionMode = 'auto' | 'manual';

interface ICourtPlayerSelectionModalProps {
  isOpen: boolean;
  court: Court | null;
  waitingPlayers: Player[];
  waitingPlayersCount: number;
  numberOfCourts: number;

  // Manual selection state (managed by parent hook)
  selectedPlayers: (string | null)[];
  currentPosition: number;
  onPlayerToggle: (playerId: string) => void;
  onPositionSelect: (position: number) => void;
  onPlayerRemove: (position: number) => void;

  // Callbacks
  onConfirmAuto: (
    suggestedPlayers: SuggestedPlayersResponse,
    direction?: CourtDirection
  ) => void;
  onConfirmManual: (
    playersWithPosition: Array<{ playerId: string; position: number }>
  ) => void;
  onCancel: () => void;

  // Utilities
  getCourtDisplayName: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  formatWaitTime: (waitTimeInMinutes: number) => string;

  // Loading states
  isLoadingAutoConfirm?: boolean;
  isLoadingManualConfirm?: boolean;

  // Optional
  courtColor?: string;
  title?: string;
  description?: string;
}

const CourtPlayerSelectionModal: React.FC<ICourtPlayerSelectionModalProps> = ({
  isOpen,
  court,
  waitingPlayers,
  waitingPlayersCount,
  numberOfCourts,
  selectedPlayers,
  currentPosition,
  onPlayerToggle,
  onPositionSelect,
  onPlayerRemove,
  onConfirmAuto,
  onConfirmManual,
  onCancel,
  getCourtDisplayName,
  formatWaitTime,
  isLoadingAutoConfirm = false,
  isLoadingManualConfirm = false,
  courtColor,
  title,
  description,
}) => {
  const t = useTranslations('SessionDetail');
  const locale = useLocale() as Locale;

  // Tab / mode state
  const [mode, setMode] = useState<SelectionMode>('auto');

  // Auto-assign internal state
  const [suggestedPlayers, setSuggestedPlayers] =
    useState<SuggestedPlayersResponse | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [useAi, setUseAi] = useState(false);

  // Calculate default topCount
  const defaultTopCount = useMemo(() => {
    if (!numberOfCourts || !waitingPlayersCount) {
      return waitingPlayersCount || 4;
    }
    const calculatedDefault = 4 * numberOfCourts;
    return Math.min(calculatedDefault, waitingPlayersCount);
  }, [numberOfCourts, waitingPlayersCount]);

  const [topCount, setTopCount] = useState(defaultTopCount);

  // Fetch suggested players
  const fetchSuggestedPlayers = useCallback(
    async (courtId: string, count: number, enableAi: boolean = false) => {
      try {
        setIsLoadingSuggestion(true);
        const response = await CourtService.getSuggestedPlayersForCourt(
          courtId,
          count,
          enableAi,
          locale
        );
        setSuggestedPlayers(response);
      } catch (error) {
        console.error('Error getting suggested players:', error);
      } finally {
        setIsLoadingSuggestion(false);
      }
    },
    [locale]
  );

  // Combine players from both pairs for court visualization
  const autoAssignPlayers = useMemo(() => {
    return suggestedPlayers
      ? [
          ...suggestedPlayers.pair1.players.map(
            (player: Player, index: number) => ({
              ...player,
              pairNumber: 1,
              isCurrentPlayer: false,
              courtPosition: index,
            })
          ),
          ...suggestedPlayers.pair2.players.map(
            (player: Player, index: number) => ({
              ...player,
              pairNumber: 2,
              isCurrentPlayer: false,
              courtPosition: index + 2,
            })
          ),
        ]
      : [];
  }, [suggestedPlayers]);

  // Fetch when modal opens
  useEffect(() => {
    if (isOpen && court?.id) {
      setTopCount(defaultTopCount);
      setMode('auto');
      fetchSuggestedPlayers(court.id, defaultTopCount, false);
    } else if (!isOpen) {
      // Reset state when modal closes
      setSuggestedPlayers(null);
      setIsLoadingSuggestion(false);
      setUseAi(false);
    }
  }, [isOpen, court?.id, defaultTopCount, fetchSuggestedPlayers]);

  // Handle topCount change
  const handleTopCountChange = (newTopCount: number) => {
    if (!court?.id) return;
    setTopCount(newTopCount);
    fetchSuggestedPlayers(court.id, newTopCount, useAi);
  };

  // Handle AI toggle
  const handleAiToggle = () => {
    if (!court?.id) return;
    const newUseAi = !useAi;
    setUseAi(newUseAi);
    fetchSuggestedPlayers(court.id, topCount, newUseAi);
  };

  // Handle tab change — tabs are independent, no state sync
  const handleModeChange = (details: { value: string }) => {
    setMode(details.value as SelectionMode);
  };

  // Handle auto confirm
  const handleConfirmAuto = async () => {
    if (!suggestedPlayers) return;
    try {
      await onConfirmAuto(suggestedPlayers, CourtDirection.HORIZONTAL);
    } catch (error) {
      console.error('Error confirming auto match:', error);
    }
  };

  // Handle manual confirm
  const handleConfirmManual = () => {
    const selectedCount = selectedPlayers.filter((p) => p !== null).length;
    if (selectedCount === 4) {
      const playersWithPosition = selectedPlayers
        .map((playerId, index) => ({
          playerId: playerId as string,
          position: index,
        }))
        .filter((p) => p.playerId !== null);
      onConfirmManual(playersWithPosition);
    }
  };

  // Create selectedPositions array for manual mode court visualization
  const selectedPositions = useMemo(() => {
    return selectedPlayers.map((playerId) => {
      if (!playerId) return undefined;
      return waitingPlayers.find((p) => p.id === playerId);
    });
  }, [selectedPlayers, waitingPlayers]);

  const selectedCount = useMemo(
    () => selectedPlayers.filter((p) => p !== null).length,
    [selectedPlayers]
  );

  if (!isOpen || !court) return null;

  const isAutoMode = mode === 'auto';
  const isLoading = isAutoMode ? isLoadingAutoConfirm : isLoadingManualConfirm;
  const isConfirmDisabled = isAutoMode
    ? isLoadingSuggestion || !suggestedPlayers
    : selectedCount !== 4;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onCancel}
      title={
        title ??
        t('courtsTab.playerSelectionTitle', {
          courtNumber: court.courtNumber,
        })
      }
      description={description ?? t('courtsTab.playerSelectionDescription')}
      size="xl"
      showCloseButton={true}
      footer={
        <Flex justify="flex-end" gap={2} width="full">
          <CompatButton
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('courtsTab.cancel')}
          </CompatButton>
          <CompatButton
            onClick={isAutoMode ? handleConfirmAuto : handleConfirmManual}
            loading={isLoading}
            disabled={isConfirmDisabled}
          >
            <Box as={Play} boxSize={4} mr={1} />
            {isAutoMode
              ? t('courtsTab.confirmMatch')
              : t('courtsTab.confirmMatchManual', { count: selectedCount })}
          </CompatButton>
        </Flex>
      }
      maxBodyHeight="75vh"
    >
      <Box>
        {/* Tab Switcher */}
        <Tabs.Root
          value={mode}
          onValueChange={handleModeChange}
          variant="line"
          size="sm"
        >
          <Tabs.List mb={2}>
            <Tabs.Trigger value="auto">
              <HStack gap={1.5}>
                <Box as={Shuffle} boxSize={3.5} />
                <Text fontSize="sm">{t('courtsTab.autoAssignMatch')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger value="manual">
              <HStack gap={1.5}>
                <Box as={UserPlus} boxSize={3.5} />
                <Text fontSize="sm">{t('courtsTab.manualSelection')}</Text>
              </HStack>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Auto-Assign Tab Content */}
          <Tabs.Content value="auto">
            <AutoAssignContent
              court={court}
              waitingPlayersCount={waitingPlayersCount}
              topCount={topCount}
              useAi={useAi}
              isLoading={isLoadingSuggestion}
              suggestedPlayers={suggestedPlayers}
              autoAssignPlayers={autoAssignPlayers}
              onTopCountChange={handleTopCountChange}
              onAiToggle={handleAiToggle}
              getCourtDisplayName={getCourtDisplayName}
              courtColor={courtColor}
              t={t}
            />
          </Tabs.Content>

          {/* Manual Selection Tab Content */}
          <Tabs.Content value="manual">
            <ManualSelectContent
              court={court}
              waitingPlayers={waitingPlayers}
              selectedPlayers={selectedPlayers}
              selectedPositions={selectedPositions}
              selectedCount={selectedCount}
              currentPosition={currentPosition}
              onPlayerToggle={onPlayerToggle}
              onPositionSelect={onPositionSelect}
              onPlayerRemove={onPlayerRemove}
              getCourtDisplayName={getCourtDisplayName}
              formatWaitTime={formatWaitTime}
              t={t}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </VModal>
  );
};

// ─── Auto-Assign Sub-Component ───────────────────────────────────────────────

interface IAutoAssignContentProps {
  court: Court;
  waitingPlayersCount: number;
  topCount: number;
  useAi: boolean;
  isLoading: boolean;
  suggestedPlayers: SuggestedPlayersResponse | null;
  autoAssignPlayers: Array<
    Player & { pairNumber: number; courtPosition: number }
  >;
  onTopCountChange: (count: number) => void;
  onAiToggle: () => void;
  getCourtDisplayName: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  courtColor?: string;
  t: ReturnType<typeof useTranslations<'SessionDetail'>>;
}

const AutoAssignContent: React.FC<IAutoAssignContentProps> = ({
  court,
  waitingPlayersCount,
  topCount,
  useAi,
  isLoading,
  suggestedPlayers,
  autoAssignPlayers,
  onTopCountChange,
  onAiToggle,
  getCourtDisplayName,
  courtColor,
  t,
}) => {
  const aiPoweredMatchingLabel = t.has('courtsTab.aiPoweredMatching')
    ? t('courtsTab.aiPoweredMatching')
    : t('courtsTab.autoAssignMatch');
  const aiAnalyzingLabel = t.has('courtsTab.aiAnalyzing')
    ? t('courtsTab.aiAnalyzing')
    : t('courtsTab.loadingSuggestedPlayers');

  return (
    <Box>
      {/* TopCount Selection */}
      {waitingPlayersCount > 0 && (
        <Box bg="gray.50" p={2} borderRadius="md" mb={2}>
          <HStack gap={3} align="center">
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {t('courtsTab.playersToConsider')}:
            </Text>
            <Box flex="1" maxW="130px">
              <select
                style={{
                  fontSize: '14px',
                  backgroundColor: 'white',
                  borderColor: '#d1d5db',
                  borderWidth: '1px',
                  borderRadius: '6px',
                  padding: '8px',
                  width: '100%',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
                value={topCount}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onTopCountChange(parseInt(e.target.value))
                }
                disabled={isLoading}
              >
                {Array.from(
                  { length: Math.max(0, waitingPlayersCount - 3) },
                  (_, i) => i + 4
                ).map((count) => (
                  <option key={count} value={count}>
                    {count} {t('courtsTab.players')}
                  </option>
                ))}
              </select>
            </Box>
            <Box fontSize="sm" color="gray.500">
              {t('courtsTab.longestWait')}
            </Box>
          </HStack>
        </Box>
      )}

      {/* AI Toggle */}
      <Box bg="purple.50" p={2} borderRadius="md" mb={2}>
        <HStack gap={2} align="center" justify="space-between">
          <HStack gap={1.5}>
            <Box as={Sparkles} boxSize={3.5} color="purple.500" />
            <Text fontSize="sm" fontWeight="medium" color="purple.700">
              {aiPoweredMatchingLabel}
            </Text>
          </HStack>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={useAi}
              onChange={onAiToggle}
              disabled={isLoading}
              style={{
                marginRight: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            />
            <Text fontSize="sm" color="purple.600">
              {useAi ? 'On' : 'Off'}
            </Text>
          </label>
        </HStack>
        {suggestedPlayers?.usedAi && suggestedPlayers?.aiReason && (
          <Box
            mt={1.5}
            p={2}
            bg="white"
            borderRadius="md"
            fontSize="xs"
            color="purple.600"
          >
            <Text fontWeight="medium">{t('courtsTab.aiReasoning')}:</Text>
            <Text>{suggestedPlayers.aiReason}</Text>
          </Box>
        )}
      </Box>

      {/* Court Visualization */}
      <Box maxW="400px" mx="auto" position="relative">
        <BadmintonCourt
          players={autoAssignPlayers}
          isActive={true}
          courtName={getCourtDisplayName(court.courtName, court.courtNumber)}
          width="100%"
          showTimeInCenter={false}
          isLoading={isLoading && !useAi}
          direction={court?.direction || CourtDirection.HORIZONTAL}
          courtColor={courtColor}
        />

        {/* AI Loading Overlay inside the court */}
        {useAi && isLoading && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            align="center"
            justify="center"
            bg="blackAlpha.600"
            zIndex={5}
            borderRadius="md"
            direction="column"
            gap={2}
          >
            <Box
              width="60%"
              height="4px"
              bg="whiteAlpha.300"
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                height="100%"
                width="40%"
                bg="purple.400"
                borderRadius="full"
                animation="aiSlide 1.5s ease-in-out infinite"
                css={{
                  '@keyframes aiSlide': {
                    '0%': { transform: 'translateX(-100%)' },
                    '50%': { transform: 'translateX(200%)' },
                    '100%': { transform: 'translateX(-100%)' },
                  },
                }}
              />
            </Box>
            <HStack gap={1.5}>
              <Box
                as={Sparkles}
                boxSize={3.5}
                color="purple.300"
                animation="pulse 1.5s ease-in-out infinite"
                css={{
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 0.6 },
                    '50%': { opacity: 1 },
                  },
                }}
              />
              <Text fontSize="xs" color="white" fontWeight="medium">
                {aiAnalyzingLabel}
              </Text>
            </HStack>
          </Flex>
        )}

        {/* Inline Pair Stats */}
        {!isLoading && suggestedPlayers && (
          <PairStatsBar
            pair1Score={suggestedPlayers.pair1.totalLevelScore}
            pair2Score={suggestedPlayers.pair2.totalLevelScore}
            scoreDifference={suggestedPlayers.scoreDifference}
            pair1Players={suggestedPlayers.pair1.players}
            pair2Players={suggestedPlayers.pair2.players}
            t={t}
          />
        )}
      </Box>
    </Box>
  );
};

// ─── Pair Stats Bar Sub-Component ────────────────────────────────────────────

interface IPairStatsBarProps {
  pair1Score: number;
  pair2Score: number;
  scoreDifference: number;
  pair1Players?: Player[];
  pair2Players?: Player[];
  t: ReturnType<typeof useTranslations<'SessionDetail'>>;
}

const PairStatsBar: React.FC<IPairStatsBarProps> = ({
  pair1Score,
  pair2Score,
  scoreDifference,
  pair1Players,
  pair2Players,
  t,
}) => {
  return (
    <HStack
      justify="space-between"
      align="flex-start"
      mt={2}
      px={2}
      py={1.5}
      bg="gray.50"
      borderRadius="md"
      fontSize="xs"
    >
      {/* Pair 1 */}
      <Box textAlign="center" flex="1">
        <HStack gap={1} justify="center" mb={0.5}>
          <Badge colorPalette="blue" variant="solid" size="sm">
            {t('courtsTab.pair1')}
          </Badge>
          {/* <Text fontWeight="bold" color="blue.700">
            ({pair1Score}
            <Text as="span" fontSize="2xs" color="blue.400" fontWeight="normal"> {t('courtsTab.levelUnit')}</Text>)
          </Text> */}
        </HStack>
        {pair1Players?.map((p) => (
          <Text key={p.id} color="gray.600" lineClamp={1} fontSize="xs">
            {p.name || `#${p.playerNumber}`}
          </Text>
        ))}
      </Box>

      {/* Gap */}
      <Box textAlign="center" pt={0.5}>
        <Text color="gray.400" fontSize="2xs">
          {t('courtsTab.gapLabel')}
        </Text>
        <Badge colorPalette="yellow" variant="solid" size="sm">
          {scoreDifference}{' '}
          <Text as="span" fontSize="2xs" fontWeight="normal">
            {t('courtsTab.levelUnit')}
          </Text>
        </Badge>
      </Box>

      {/* Pair 2 */}
      <Box textAlign="center" flex="1">
        <HStack gap={1} justify="center" mb={0.5}>
          <Badge colorPalette="orange" variant="solid" size="sm">
            {t('courtsTab.pair2')}
          </Badge>
          {/* <Text fontWeight="bold" color="orange.700">
            ({pair2Score}
            <Text as="span" fontSize="2xs" color="orange.400" fontWeight="normal"> {t('courtsTab.levelUnit')}</Text>)
          </Text> */}
        </HStack>
        {pair2Players?.map((p) => (
          <Text key={p.id} color="gray.600" lineClamp={1} fontSize="xs">
            {p.name || `#${p.playerNumber}`}
          </Text>
        ))}
      </Box>
    </HStack>
  );
};

// ─── Manual Selection Sub-Component ──────────────────────────────────────────

interface IManualSelectContentProps {
  court: Court;
  waitingPlayers: Player[];
  selectedPlayers: (string | null)[];
  selectedPositions: (Player | undefined)[];
  selectedCount: number;
  currentPosition: number;
  onPlayerToggle: (playerId: string) => void;
  onPositionSelect: (position: number) => void;
  onPlayerRemove: (position: number) => void;
  getCourtDisplayName: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
  formatWaitTime: (waitTimeInMinutes: number) => string;
  t: ReturnType<typeof useTranslations<'SessionDetail'>>;
}

const ManualSelectContent: React.FC<IManualSelectContentProps> = ({
  court,
  waitingPlayers,
  selectedPlayers,
  selectedPositions,
  selectedCount,
  currentPosition,
  onPlayerToggle,
  onPositionSelect,
  onPlayerRemove,
  getCourtDisplayName,
  formatWaitTime,
  t,
}) => {
  // Calculate pair stats from selected positions
  // Positions 0,1 = pair 1; positions 2,3 = pair 2
  const manualPairStats = useMemo(() => {
    const getLevelScore = (player?: Player) => player?.level ?? 3;
    const p1 = selectedPositions[0];
    const p2 = selectedPositions[1];
    const p3 = selectedPositions[2];
    const p4 = selectedPositions[3];
    const pair1Score =
      (p1 ? getLevelScore(p1) : 0) + (p2 ? getLevelScore(p2) : 0);
    const pair2Score =
      (p3 ? getLevelScore(p3) : 0) + (p4 ? getLevelScore(p4) : 0);
    const pair1Players = [p1, p2].filter((p): p is Player => !!p);
    const pair2Players = [p3, p4].filter((p): p is Player => !!p);
    const hasBothPairs = pair1Players.length > 0 && pair2Players.length > 0;
    return hasBothPairs
      ? {
          pair1Score,
          pair2Score,
          scoreDifference: Math.abs(pair1Score - pair2Score),
          pair1Players,
          pair2Players,
        }
      : null;
  }, [selectedPositions]);

  return (
    <Box>
      {/* Court Preview — sticky while scrolling the player list */}
      <Box position="sticky" top={0} zIndex={10} bg="white" pb={2} mb={1}>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          {t('courtsTab.selectedPlayersCount', { count: selectedCount })}
        </Text>
        <Box maxW="400px" mx="auto">
          <BadmintonCourt
            players={[]}
            isActive={false}
            mode="selection"
            selectedPositions={selectedPositions}
            currentPlayerPosition={currentPosition}
            onPlayerRemove={onPlayerRemove}
            onPositionSelect={onPositionSelect}
            courtName={getCourtDisplayName(court.courtName, court.courtNumber)}
            width="100%"
            showTimeInCenter={false}
            direction={court?.direction || CourtDirection.HORIZONTAL}
          />

          {/* Inline Pair Stats for manual selection */}
          {manualPairStats && (
            <PairStatsBar
              pair1Score={manualPairStats.pair1Score}
              pair2Score={manualPairStats.pair2Score}
              scoreDifference={manualPairStats.scoreDifference}
              pair1Players={manualPairStats.pair1Players}
              pair2Players={manualPairStats.pair2Players}
              t={t}
            />
          )}
        </Box>
      </Box>

      {/* Available Players Grid */}
      <Box>
        <Text fontSize="md" fontWeight="medium" mb={2}>
          {t('courtsTab.availablePlayers')}
        </Text>
        {waitingPlayers.length === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
            {t('courtsTab.noPlayersWaiting')}
          </Text>
        ) : (
          <PlayerGrid
            players={waitingPlayers}
            playerFilter={['WAITING']}
            formatWaitTime={formatWaitTime}
            selectedPlayers={selectedPlayers.filter(
              (p): p is string => p !== null
            )}
            onPlayerToggle={onPlayerToggle}
            selectionMode={true}
          />
        )}
      </Box>
    </Box>
  );
};

export default CourtPlayerSelectionModal;
