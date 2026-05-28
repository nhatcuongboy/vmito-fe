import { Button as CompatButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { CourtService } from '@/lib/api/court.service';
import { CourtDirection, SuggestedPlayersResponse } from '@/lib/api/types';
import { Court, Player } from '@/types/session';
import { PlayerGrid } from '@/components/player/PlayerGrid';
import BadmintonCourt from '@/components/court/BadmintonCourt';
import { Box, Flex, HStack, Input, Tabs, Text } from '@chakra-ui/react';
import { Search, Sparkles, User, UserPlus, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Locale } from '@/i18n/locales';
import MatchCourtPreview, { MatchPairStats } from './MatchCourtPreview';
import { TMatchType } from '@/hooks/useCourtsTabModals';

type SelectionMode = 'auto' | 'manual';

interface ICourtPlayerSelectionModalProps {
  isOpen: boolean;
  court: Court | null;
  waitingPlayers: Player[];
  waitingPlayersCount: number;
  numberOfCourts: number;

  // Match type
  matchType: TMatchType;
  onMatchTypeChange: (type: TMatchType) => void;

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
  matchType,
  onMatchTypeChange,
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

  // Keep tab/matching options separate for singles and doubles.
  const [modeByMatchType, setModeByMatchType] = useState<
    Record<TMatchType, SelectionMode>
  >({
    singles: 'manual',
    doubles: 'manual',
  });
  const [useAiByMatchType, setUseAiByMatchType] = useState<
    Record<TMatchType, boolean>
  >({
    singles: false,
    doubles: false,
  });
  const [topCountByMatchType, setTopCountByMatchType] = useState<
    Partial<Record<TMatchType, number>>
  >({});

  // Auto-assign internal state
  const [suggestedPlayersByMatchType, setSuggestedPlayersByMatchType] =
    useState<Partial<Record<TMatchType, SuggestedPlayersResponse>>>({});
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const initializedCourtIdRef = useRef<string | null>(null);
  const latestSuggestionRequestRef = useRef(0);
  const activeSuggestionRequestKeyRef = useRef<string | null>(null);
  const suggestedPlayers = suggestedPlayersByMatchType[matchType] ?? null;

  // Calculate default topCount
  const playersPerCourt = matchType === 'singles' ? 2 : 4;
  const defaultTopCount = useMemo(() => {
    if (!numberOfCourts || !waitingPlayersCount) {
      return waitingPlayersCount || playersPerCourt;
    }
    const calculatedDefault = playersPerCourt * numberOfCourts;
    return Math.min(calculatedDefault, waitingPlayersCount);
  }, [numberOfCourts, waitingPlayersCount, playersPerCourt]);

  const mode = modeByMatchType[matchType];
  const useAi = useAiByMatchType[matchType];
  const topCount = topCountByMatchType[matchType] ?? defaultTopCount;

  // Fetch suggested players
  const fetchSuggestedPlayers = useCallback(
    async (
      courtId: string,
      count: number,
      enableAi: boolean = false,
      suggestionMatchType: TMatchType
    ) => {
      const requestKey = [
        courtId,
        count,
        enableAi ? 'ai' : 'standard',
        locale,
        suggestionMatchType,
      ].join(':');

      if (activeSuggestionRequestKeyRef.current === requestKey) return;

      const requestId = latestSuggestionRequestRef.current + 1;
      latestSuggestionRequestRef.current = requestId;
      activeSuggestionRequestKeyRef.current = requestKey;

      try {
        setIsLoadingSuggestion(true);
        const apiMatchType =
          suggestionMatchType === 'singles' ? 'SINGLES' : 'DOUBLES';
        const response = await CourtService.getSuggestedPlayersForCourt(
          courtId,
          count,
          enableAi,
          locale,
          apiMatchType
        );

        if (latestSuggestionRequestRef.current !== requestId) return;

        setSuggestedPlayersByMatchType((prev) => ({
          ...prev,
          [suggestionMatchType]: response,
        }));
      } catch (error) {
        if (latestSuggestionRequestRef.current === requestId) {
          console.error('Error getting suggested players:', error);
        }
      } finally {
        if (latestSuggestionRequestRef.current === requestId) {
          activeSuggestionRequestKeyRef.current = null;
          setIsLoadingSuggestion(false);
        }
      }
    },
    [locale]
  );

  // Combine players from both pairs for court visualization
  const autoAssignPlayers = useMemo(() => {
    if (!suggestedPlayers) return [];
    const isSingles = matchType === 'singles';
    return [
      ...suggestedPlayers.pair1.players.map(
        (player: Player, index: number) => ({
          ...player,
          pairNumber: 1,
          isCurrentPlayer: false,
          courtPosition: isSingles ? 0 : index,
        })
      ),
      ...suggestedPlayers.pair2.players.map(
        (player: Player, index: number) => ({
          ...player,
          pairNumber: 2,
          isCurrentPlayer: false,
          courtPosition: isSingles ? 1 : index + 2,
        })
      ),
    ];
  }, [suggestedPlayers, matchType]);

  // Fetch when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      initializedCourtIdRef.current = null;
      latestSuggestionRequestRef.current += 1;
      activeSuggestionRequestKeyRef.current = null;
      setSuggestedPlayersByMatchType({});
      setIsLoadingSuggestion(false);
      setModeByMatchType({ singles: 'manual', doubles: 'manual' });
      setUseAiByMatchType({ singles: false, doubles: false });
      setTopCountByMatchType({});
      return;
    }

    if (!court?.id || initializedCourtIdRef.current === court.id) return;

    initializedCourtIdRef.current = court.id;
    setModeByMatchType({ singles: 'manual', doubles: 'manual' });
    setUseAiByMatchType({ singles: false, doubles: false });
    setTopCountByMatchType({});
    setSuggestedPlayersByMatchType({});
    fetchSuggestedPlayers(court.id, defaultTopCount, false, matchType);
  }, [court?.id, defaultTopCount, fetchSuggestedPlayers, isOpen, matchType]);

  // Fetch each match type with its own AI/top-count options.
  useEffect(() => {
    if (!isOpen || !court?.id) return;

    const cachedSuggestion = suggestedPlayersByMatchType[matchType];
    if (cachedSuggestion && (!useAi || cachedSuggestion.usedAi)) return;

    fetchSuggestedPlayers(court.id, topCount, useAi, matchType);
  }, [
    court?.id,
    fetchSuggestedPlayers,
    isOpen,
    matchType,
    suggestedPlayersByMatchType,
    topCount,
    useAi,
  ]);

  // Handle topCount change
  const handleTopCountChange = (newTopCount: number) => {
    if (!court?.id) return;
    setTopCountByMatchType((prev) => ({
      ...prev,
      [matchType]: newTopCount,
    }));
    setSuggestedPlayersByMatchType((prev) => {
      const next = { ...prev };
      delete next[matchType];
      return next;
    });
    fetchSuggestedPlayers(court.id, newTopCount, useAi, matchType);
  };

  // Handle AI toggle
  const handleAiToggle = () => {
    if (!court?.id) return;
    const newUseAi = !useAi;
    setUseAiByMatchType((prev) => ({
      ...prev,
      [matchType]: newUseAi,
    }));
    const cachedSuggestion = suggestedPlayersByMatchType[matchType];
    if (newUseAi && cachedSuggestion?.usedAi) return;
    fetchSuggestedPlayers(court.id, topCount, newUseAi, matchType);
  };

  // Handle tab change for the current singles/doubles context.
  const handleModeChange = (details: { value: string }) => {
    setModeByMatchType((prev) => ({
      ...prev,
      [matchType]: details.value as SelectionMode,
    }));
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
    const requiredCount = matchType === 'singles' ? 2 : 4;
    if (selectedCount === requiredCount) {
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
  const requiredPlayerCount = matchType === 'singles' ? 2 : 4;
  const isConfirmDisabled = isAutoMode
    ? isLoadingSuggestion || !suggestedPlayers
    : selectedCount !== requiredPlayerCount;

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
        <Flex gap={2} justify="flex-end" width="full">
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
            {t('courtsTab.confirmMatch')}
          </CompatButton>
        </Flex>
      }
      maxBodyHeight="75vh"
    >
      <Box>
        {/* Match Type Tab Selector */}
        <Flex justify="center" mb={2} mt={-4}>
          <Flex
            bg="gray.100"
            p={0.5}
            borderRadius="full"
            borderWidth="1px"
            borderColor="gray.200"
            _dark={{
              bg: 'blackAlpha.200',
              borderColor: 'whiteAlpha.200',
            }}
          >
            <Flex
              cursor="pointer"
              align="center"
              px={3}
              py={1}
              borderRadius="full"
              transition="all 0.2s"
              bg={matchType === 'doubles' ? 'white' : 'transparent'}
              color={matchType === 'doubles' ? 'blue.600' : 'gray.500'}
              _dark={{
                bg: matchType === 'doubles' ? 'blue.900/50' : 'transparent',
                color: matchType === 'doubles' ? 'blue.200' : 'gray.300',
              }}
              boxShadow={
                matchType === 'doubles'
                  ? { base: 'sm', _dark: '0 8px 18px rgba(0, 0, 0, 0.35)' }
                  : 'none'
              }
              onClick={() => onMatchTypeChange('doubles')}
            >
              <Box as={Users} boxSize={3} mr={1.5} />
              <Text
                fontSize="xs"
                fontWeight={matchType === 'doubles' ? 'bold' : 'medium'}
              >
                {t('courtsTab.doubles')}
              </Text>
            </Flex>
            <Flex
              cursor="pointer"
              align="center"
              px={3}
              py={1}
              borderRadius="full"
              transition="all 0.2s"
              bg={matchType === 'singles' ? 'white' : 'transparent'}
              color={matchType === 'singles' ? 'blue.600' : 'gray.500'}
              _dark={{
                bg: matchType === 'singles' ? 'blue.900/50' : 'transparent',
                color: matchType === 'singles' ? 'blue.200' : 'gray.300',
              }}
              boxShadow={
                matchType === 'singles'
                  ? { base: 'sm', _dark: '0 8px 18px rgba(0, 0, 0, 0.35)' }
                  : 'none'
              }
              onClick={() => onMatchTypeChange('singles')}
            >
              <Box as={User} boxSize={3} mr={1.5} />
              <Text
                fontSize="xs"
                fontWeight={matchType === 'singles' ? 'bold' : 'medium'}
              >
                {t('courtsTab.singles')}
              </Text>
            </Flex>
          </Flex>
        </Flex>

        {/* Tab Switcher */}
        <Tabs.Root
          value={mode}
          onValueChange={handleModeChange}
          variant="line"
          size="sm"
        >
          <Tabs.List
            mb={0}
            borderColor={{ base: 'border', _dark: 'whiteAlpha.300' }}
          >
            <Tabs.Trigger
              value="manual"
              color={{ base: 'fg.muted', _dark: 'gray.300' }}
              _selected={{
                color: { base: 'fg', _dark: 'white' },
                borderColor: { base: 'green.500', _dark: 'green.300' },
              }}
            >
              <HStack gap={1.5}>
                <Box as={UserPlus} boxSize={3.5} />
                <Text fontSize="sm">{t('courtsTab.manualSelection')}</Text>
              </HStack>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="auto"
              color={{ base: 'fg.muted', _dark: 'gray.300' }}
              _selected={{
                color: { base: 'fg', _dark: 'white' },
                borderColor: { base: 'green.500', _dark: 'green.300' },
              }}
            >
              <HStack gap={1.5}>
                <Box as={Sparkles} boxSize={3.5} color="purple.500" />
                <Text fontSize="sm">{t('courtsTab.autoAssignMatch')}</Text>
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
              matchType={matchType}
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

const LEVEL_SHORT_LABELS: Record<number, string> = {
  1: 'Yếu',
  2: 'TBY',
  3: 'TB-',
  4: 'TB',
  5: 'TB+',
  6: 'Khá',
  7: 'BC',
  8: 'CN',
};

const normalizeAiReasonLevels = (reason: string) =>
  reason.replace(/\b(?:Level|Cấp|等级)\s*([1-8])\b/gi, (_, level: string) => {
    return LEVEL_SHORT_LABELS[Number(level)] ?? _;
  });

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
  waitingPlayersCount: _waitingPlayersCount,
  topCount: _topCount,
  useAi,
  isLoading,
  suggestedPlayers,
  autoAssignPlayers,
  onTopCountChange: _onTopCountChange,
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
      {/* AI Toggle */}
      <Box
        position="relative"
        overflow="hidden"
        borderRadius="lg"
        mb={2}
        cursor={isLoading ? 'not-allowed' : 'pointer'}
        onClick={!isLoading ? onAiToggle : undefined}
        style={{
          background:
            'linear-gradient(135deg, #6b21a8 0%, #7c3aed 50%, #4f46e5 100%)',
          border: '1.5px solid #7c3aed',
          transition:
            'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          boxShadow: useAi
            ? '0 4px 20px rgba(124, 58, 237, 0.4)'
            : '0 2px 12px rgba(124, 58, 237, 0.28)',
        }}
      >
        {/* Shimmer overlay when active */}
        {useAi && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            pointerEvents="none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'aiShimmer 2.5s ease-in-out infinite',
            }}
            css={{
              '@keyframes aiShimmer': {
                '0%': { backgroundPosition: '-200% 0' },
                '100%': { backgroundPosition: '200% 0' },
              },
            }}
          />
        )}

        <HStack gap={3} align="center" justify="space-between" p={2.5}>
          <HStack gap={2} align="center">
            {/* Animated sparkles icon */}
            <Box
              style={{
                animation: useAi ? 'aiSpin 3s linear infinite' : 'none',
                display: 'flex',
              }}
              css={{
                '@keyframes aiSpin': {
                  '0%': { transform: 'rotate(0deg) scale(1)' },
                  '50%': { transform: 'rotate(180deg) scale(1.2)' },
                  '100%': { transform: 'rotate(360deg) scale(1)' },
                },
              }}
            >
              <Box
                as={Sparkles}
                boxSize={4}
                color="yellow.300"
                style={{ transition: 'color 0.3s' }}
              />
            </Box>
            <Box>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="white"
                style={{ transition: 'color 0.3s', lineHeight: 1.2 }}
              >
                {aiPoweredMatchingLabel}
              </Text>
              <Text
                fontSize="xs"
                color="purple.200"
                style={{ transition: 'color 0.3s' }}
              >
                {useAi
                  ? isLoading
                    ? 'Đang phân tích trình độ...'
                    : ''
                  : 'Ghép cặp tự động theo trình độ'}
              </Text>
            </Box>
          </HStack>

          {/* Custom toggle switch */}
          <Box
            position="relative"
            w="40px"
            h="22px"
            borderRadius="full"
            flexShrink={0}
            style={{
              background: useAi ? '#fbbf24' : 'rgba(255, 255, 255, 0.28)',
              border: useAi
                ? '1.5px solid #f59e0b'
                : '1.5px solid rgba(255, 255, 255, 0.45)',
              transition:
                'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              boxShadow: useAi
                ? '0 0 10px rgba(251,191,36,0.6)'
                : 'inset 0 0 0 1px rgba(124, 58, 237, 0.18)',
            }}
          >
            <Box
              position="absolute"
              top="2px"
              w="16px"
              h="16px"
              borderRadius="full"
              bg="white"
              style={{
                left: useAi ? '20px' : '2px',
                transition: 'left 0.25s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </Box>
        </HStack>

        {useAi && suggestedPlayers?.usedAi && suggestedPlayers?.aiReason && (
          <Box
            px={2.5}
            py={2}
            fontSize="xs"
            color="purple.100"
            borderTopWidth="1px"
            borderTopColor="rgba(255,255,255,0.2)"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
            }}
          >
            <Text fontWeight="semibold" color="white" mb={1}>
              {t('courtsTab.aiReasoning')}:
            </Text>
            <Text>{normalizeAiReasonLevels(suggestedPlayers.aiReason)}</Text>
          </Box>
        )}
      </Box>

      <MatchCourtPreview
        players={autoAssignPlayers}
        courtName={getCourtDisplayName(court.courtName, court.courtNumber)}
        isLoading={isLoading && !useAi}
        direction={court?.direction || CourtDirection.HORIZONTAL}
        courtColor={courtColor}
        showAiLoadingOverlay={useAi && isLoading}
        aiLoadingLabel={aiAnalyzingLabel}
        pair1Players={!isLoading ? suggestedPlayers?.pair1.players : undefined}
        pair2Players={!isLoading ? suggestedPlayers?.pair2.players : undefined}
        scoreDifference={suggestedPlayers?.scoreDifference}
      />

      {/* TopCount Selection — temporarily hidden */}
    </Box>
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
  matchType: TMatchType;
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
  selectedCount: _selectedCount,
  currentPosition,
  matchType,
  onPlayerToggle,
  onPositionSelect,
  onPlayerRemove,
  getCourtDisplayName,
  formatWaitTime,
  t,
}) => {
  const [searchText, setSearchText] = useState('');

  const filteredPlayers = useMemo(() => {
    if (!searchText.trim()) return waitingPlayers;
    const query = searchText.trim().toLowerCase();
    return waitingPlayers.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        String(p.playerNumber).includes(query)
    );
  }, [waitingPlayers, searchText]);

  // Calculate pair stats from selected positions
  // Doubles: Positions 0,1 = pair 1; positions 2,3 = pair 2
  // Singles: Position 0 = player 1; position 1 = player 2
  const manualPairStats = useMemo(() => {
    const getLevelScore = (player?: Player) => player?.level ?? 3;

    if (matchType === 'singles') {
      const p1 = selectedPositions[0];
      const p2 = selectedPositions[1];
      if (!p1 || !p2) return null;
      const pair1Score = getLevelScore(p1);
      const pair2Score = getLevelScore(p2);
      return {
        pair1Score,
        pair2Score,
        scoreDifference: Math.abs(pair1Score - pair2Score),
        pair1Players: [p1],
        pair2Players: [p2],
      };
    }

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
  }, [selectedPositions, matchType]);

  return (
    <Box>
      {/* Court Preview */}
      <Box pb={2} mb={1}>
        <Box
          maxW={{ base: '100%', md: '360px' }}
          mx="auto"
          _dark={{ filter: 'saturate(0.85) brightness(0.92)' }}
        >
          <BadmintonCourt
            players={[]}
            isActive={false}
            mode="selection"
            matchType={matchType}
            selectedPositions={selectedPositions}
            currentPlayerPosition={currentPosition}
            onPlayerRemove={onPlayerRemove}
            onPositionSelect={onPositionSelect}
            courtName={getCourtDisplayName(court.courtName, court.courtNumber)}
            width="100%"
            direction={court?.direction || CourtDirection.HORIZONTAL}
          />

          {/* Inline Pair Stats for manual selection */}
          {manualPairStats && (
            <MatchPairStats
              scoreDifference={manualPairStats.scoreDifference}
              pair1Players={manualPairStats.pair1Players}
              pair2Players={manualPairStats.pair2Players}
            />
          )}
        </Box>
      </Box>

      {/* Available Players Grid */}
      <Box>
        <Flex align="center" justify="space-between" mb={2} gap={3}>
          <Text fontSize="md" fontWeight="medium" flexShrink={0}>
            {t('courtsTab.availablePlayers')}
          </Text>
          <Flex
            align="center"
            borderWidth="1px"
            borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.300' }}
            borderRadius="md"
            px={2}
            py={0.5}
            bg={{ base: 'white', _dark: 'gray.900' }}
            color={{ base: 'gray.900', _dark: 'gray.100' }}
            gap={1.5}
            flex="1"
            maxW="180px"
            _focusWithin={{
              borderColor: { base: 'blue.400', _dark: 'green.300' },
              boxShadow: '0 0 0 1px var(--chakra-colors-green-300)',
            }}
          >
            <Box
              as={Search}
              boxSize={3.5}
              color={{ base: 'gray.400', _dark: 'gray.500' }}
              flexShrink={0}
            />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm người chơi…"
              aria-label="Tìm người chơi"
              size="xs"
              border="none"
              outline="none"
              p={0}
              fontSize="sm"
              color={{ base: 'gray.900', _dark: 'gray.100' }}
              bg="transparent"
              _placeholder={{ color: { base: 'gray.400', _dark: 'gray.500' } }}
              _focus={{ boxShadow: 'none' }}
            />
          </Flex>
        </Flex>
        <Box
          overflowY="auto"
          maxH={{ base: '35vh', md: '30vh' }}
          minH="120px"
          px={1}
          py={1}
          css={{
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: 'var(--chakra-colors-gray-500)',
              borderRadius: '2px',
            },
          }}
        >
          {waitingPlayers.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
              {t('courtsTab.noPlayersWaiting')}
            </Text>
          ) : filteredPlayers.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={8}>
              Không tìm thấy người chơi
            </Text>
          ) : (
            <PlayerGrid
              players={filteredPlayers}
              playerFilter={['WAITING']}
              formatWaitTime={formatWaitTime}
              selectedPlayers={selectedPlayers.filter(
                (p): p is string => p !== null
              )}
              onPlayerToggle={onPlayerToggle}
              selectionMode={true}
              columns={{ base: 2, md: 3, lg: 4 }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CourtPlayerSelectionModal;
