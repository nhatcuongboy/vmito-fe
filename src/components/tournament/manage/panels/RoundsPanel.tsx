'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Flex, Heading, Input, Text, Badge } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import {
  ChevronDown,
  Edit,
  GitBranch,
  Layers,
  ListTree,
  RefreshCw,
  Shuffle,
  Trash2,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Category,
  CategoryFormat,
  CategoryGroup,
  CategoryMatch,
  CategoryMatchParticipant,
  CategoryRegistration,
  MatchStatus,
} from '@/lib/api/types';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';
import SetupPoolsModal, { TSetupStep } from './SetupPoolsModal';
import AdvancingTeamsModal from './AdvancingTeamsModal';
import PlayoffsBracketModal from './PlayoffsBracketModal';
import SingleEliminationBracketModal from './SingleEliminationBracketModal';
import DoubleEliminationBracketModal from './DoubleEliminationBracketModal';
import DoubleEliminationBracketViz from './DoubleEliminationBracketViz';
import BracketVisualization from './BracketVisualization';

interface IRoundsPanelProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
}

const CATEGORY_COLORS = [
  '#ECC94B',
  '#63B3ED',
  '#68D391',
  '#FC8181',
  '#B794F4',
  '#F6AD55',
  '#76E4F7',
  '#FEB2B2',
];

const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const getOrdinalLabel = (
  rank: number,
  t: ReturnType<typeof useTranslations>
): string => {
  const oneBased = rank + 1;
  const key = oneBased >= 1 && oneBased <= 8 ? String(oneBased) : 'other';
  return t(`panels.rounds.ordinals.${key}`, { rank: oneBased });
};

const getParticipantName = (participant: CategoryMatchParticipant): string => {
  const reg = participant?.categoryRegistration;
  if (!reg) return '?';
  if (reg.player) return reg.player.name;
  if (reg.pair) {
    return (
      reg.pair.name ||
      reg.pair.members?.map((m) => m.player?.name).join(' & ') ||
      '?'
    );
  }
  return '?';
};

const STATUS_COLOR_MAP: Record<string, string> = {
  [MatchStatus.SCHEDULED]: 'gray',
  [MatchStatus.IN_PROGRESS]: 'blue',
  [MatchStatus.FINISHED]: 'green',
  [MatchStatus.CANCELLED]: 'red',
};

type MatchGenerationPreview = Awaited<
  ReturnType<typeof CategoryService.getMatchGenerationPreview>
>;

const nextPowerOf2 = (n: number): number => {
  let power = 1;
  while (power < n) power *= 2;
  return power;
};

const getExpectedEliminationMatchCount = (category: Category): number => {
  const isSingleElimination =
    category.format === CategoryFormat.SINGLE_ELIMINATION;
  const isDoubleElimination =
    category.format === CategoryFormat.DOUBLE_ELIMINATION;
  const teamCount =
    isSingleElimination || isDoubleElimination
      ? (category._count?.registrations ?? category.registrations?.length ?? 0)
      : (category.groupCount ?? 0) * (category.winnersPerGroup ?? 0);

  if (teamCount < 2) return 0;

  const bracketSize = nextPowerOf2(teamCount);

  if (isDoubleElimination) {
    // Pure double elimination: upper (n-1) + lower (n-2) + grand final (1).
    const deConfig = (
      category.formatConfig as Record<string, unknown> | undefined
    )?.doubleElimination as Record<string, unknown> | undefined;
    const hasReset = deConfig?.isTrueDoubleElimination !== false;
    return bracketSize * 2 - 2 + (hasReset ? 1 : 0);
  }

  const mainMatches = bracketSize - 1;
  const hasThirdPlace = category.thirdPlaceMatch && bracketSize >= 4;

  return mainMatches + (hasThirdPlace ? 1 : 0);
};

export default function RoundsPanel({
  categories,
  selectedCategory,
  onSelectCategory,
}: IRoundsPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [registrations, setRegistrations] = useState<CategoryRegistration[]>(
    []
  );
  const [matchesByGroup, setMatchesByGroup] = useState<
    Record<string, CategoryMatch[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [isCreatingGroups, setIsCreatingGroups] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingShells, setIsGeneratingShells] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  const [generationPreview, setGenerationPreview] =
    useState<MatchGenerationPreview | null>(null);
  const [isDeleteAllMatchesOpen, setIsDeleteAllMatchesOpen] = useState(false);
  const [isDeletingAllMatches, setIsDeletingAllMatches] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [groupCountInput, setGroupCountInput] = useState<number>(2);

  // Modal states
  const [isPoolsModalOpen, setIsPoolsModalOpen] = useState(false);
  const [poolsModalInitialStep, setPoolsModalInitialStep] =
    useState<TSetupStep>('configure');
  const [isAdvancingModalOpen, setIsAdvancingModalOpen] = useState(false);
  const [isPlayoffsModalOpen, setIsPlayoffsModalOpen] = useState(false);

  // Category state for refreshing after modal saves
  const [localCategory, setLocalCategory] = useState<Category | null>(null);

  const activeCategory = localCategory ?? selectedCategory ?? categories[0];
  const activeCategoryIndex = categories.findIndex(
    (category) => category.id === activeCategory?.id
  );
  const activeCategoryColor =
    CATEGORY_COLORS[activeCategoryIndex % CATEGORY_COLORS.length] ?? '#63B3ED';

  const isRRSE = activeCategory?.format === CategoryFormat.ROUND_ROBIN_TO_SE;
  const isRoundRobin = activeCategory?.format === CategoryFormat.ROUND_ROBIN;
  const isSingleElimination =
    activeCategory?.format === CategoryFormat.SINGLE_ELIMINATION;
  const isDoubleElimination =
    activeCategory?.format === CategoryFormat.DOUBLE_ELIMINATION;
  const isPoolFormat = isRRSE || isRoundRobin;

  // SE bracket modal state
  const [isSEBracketModalOpen, setIsSEBracketModalOpen] = useState(false);

  useEffect(() => {
    if (activeCategory?.groupCount && activeCategory.groupCount > 0) {
      setGroupCountInput(activeCategory.groupCount);
    } else {
      setGroupCountInput(2);
    }
  }, [activeCategory?.id, activeCategory?.groupCount]);

  // Refresh local category when selected category changes
  useEffect(() => {
    setLocalCategory(null);
  }, [selectedCategory?.id]);

  const loadGroupsAndMatches = useCallback(async (categoryId: string) => {
    try {
      setLoading(true);
      const [groupsData, matchesData, regsData] = await Promise.all([
        CategoryService.getGroups(categoryId),
        CategoryService.getMatches(categoryId),
        CategoryService.getRegistrations(categoryId),
      ]);
      setGroups(groupsData);
      setRegistrations(regsData);

      const grouped: Record<string, CategoryMatch[]> = {};
      for (const match of matchesData) {
        const gId = match.groupId || '_ungrouped';
        if (!grouped[gId]) grouped[gId] = [];
        grouped[gId].push(match);
      }
      setMatchesByGroup(grouped);
      return { groupsData, matchesData, regsData };
    } catch (error) {
      console.error('Error loading groups and matches:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeCategory) {
      loadGroupsAndMatches(activeCategory.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory?.id, loadGroupsAndMatches]);

  const handleRefreshCategory = async () => {
    if (!activeCategory) return;
    let updated: Category | null = null;
    try {
      updated = await CategoryService.getCategory(activeCategory.id);
      setLocalCategory(updated);
    } catch {
      // ignore
    }
    const loaded = await loadGroupsAndMatches(activeCategory.id);
    return {
      category: updated ?? activeCategory,
      matches: loaded?.matchesData,
    };
  };

  // ─── Flat layout handlers (ROUND_ROBIN) ──────────────────────────────────

  const handleCreateGroups = async () => {
    if (!activeCategory) return;
    const count = groupCountInput;
    if (count < 1) {
      toaster.error({ title: t('panels.rounds.groupCountMin') });
      return;
    }
    try {
      setIsCreatingGroups(true);
      if ((activeCategory.groupCount ?? 0) !== count) {
        await CategoryService.updateCategory(activeCategory.id, {
          groupCount: count,
        });
      }
      const created = await CategoryService.createGroups(activeCategory.id);
      toaster.success({
        title: t('panels.rounds.groupsCreated', { count: created.length }),
      });
      await loadGroupsAndMatches(activeCategory.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('panels.rounds.createGroupsFailed');
      toaster.error({ title: message });
    } finally {
      setIsCreatingGroups(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!activeCategory) return;
    try {
      setIsAssigning(true);
      await CategoryService.autoAssignAllRegistrations(activeCategory.id, {
        shuffle: true,
      });
      toaster.success({ title: t('panels.rounds.teamsAssigned') });
      await loadGroupsAndMatches(activeCategory.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('panels.rounds.assignTeamsFailed');
      toaster.error({ title: message });
    } finally {
      setIsAssigning(false);
    }
  };

  const runGenerateAllMatches = async (
    forceReplaceScheduledMatches = false
  ) => {
    if (!activeCategory) return;
    try {
      setIsGenerating(true);
      await CategoryService.generateAllGroupMatches(activeCategory.id, {
        forceReplaceScheduledMatches,
      });
      setIsRegenerateConfirmOpen(false);
      setGenerationPreview(null);
      await loadGroupsAndMatches(activeCategory.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('panels.rounds.generateMatchesFailed');
      toaster.error({ title: message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAllMatches = async () => {
    if (!activeCategory) return;
    try {
      setIsGenerating(true);
      const preview = await CategoryService.getMatchGenerationPreview(
        activeCategory.id
      );
      setGenerationPreview(preview);
      if (!preview.canGenerate) {
        toaster.error({
          title: t('panels.rounds.cannotRegenerateStartedTitle'),
          description: t('panels.rounds.cannotRegenerateStartedDesc'),
        });
        return;
      }
      if (preview.requiresForceReplaceScheduledMatches) {
        setIsRegenerateConfirmOpen(true);
        return;
      }
      await runGenerateAllMatches(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('panels.rounds.generateMatchesFailed');
      toaster.error({ title: message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateEliminationShells = async () => {
    if (!activeCategory) return;
    try {
      setIsGeneratingShells(true);
      await CategoryService.generateEliminationShells(activeCategory.id, {
        showToast: false,
      });
      await loadGroupsAndMatches(activeCategory.id);
      toaster.success({
        title: t('panels.rounds.eliminationGamesGenerated'),
      });
    } catch (error: unknown) {
      const apiError = error as {
        response?: { data?: { code?: string; message?: string | string[] } };
      };
      const code = apiError?.response?.data?.code;
      if (code === 'HAS_SCORED_ELIMINATION') {
        toaster.error({ title: t('panels.rounds.eliminationHasScores') });
        return;
      }
      const raw = apiError?.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : raw ||
          (error instanceof Error
            ? error.message
            : t('panels.rounds.generateEliminationFailed'));
      toaster.error({
        title: t('panels.rounds.generateEliminationFailed'),
        description: message,
      });
    } finally {
      setIsGeneratingShells(false);
    }
  };

  const handleDeleteAllMatches = async () => {
    if (!activeCategory?.tournamentId) return;
    try {
      setIsDeletingAllMatches(true);
      const result = await TournamentService.deleteAllMatches(
        activeCategory.tournamentId
      );
      toaster.success({
        title: t('panels.rounds.deleteAllMatchesSuccess', {
          count: result.deletedCount,
        }),
      });
      setIsDeleteAllMatchesOpen(false);
      await loadGroupsAndMatches(activeCategory.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t('panels.rounds.deleteAllMatchesError');
      toaster.error({ title: message });
    } finally {
      setIsDeletingAllMatches(false);
    }
  };

  const handleGenerateBracket = async () => {
    if (!activeCategory) return;
    try {
      setIsCompleting(true);
      await CategoryService.completeGroupStage(activeCategory.id, {
        showToast: false,
      });
      setIsGenerateConfirmOpen(false);
      const refreshed = await handleRefreshCategory();
      const refreshedCategory = refreshed?.category ?? activeCategory;
      const generatedMatches =
        refreshed?.matches?.filter(
          (match) => !match.groupId && match.round !== 'GROUP'
        ) ?? [];
      const expectedMatches =
        getExpectedEliminationMatchCount(refreshedCategory);

      if (
        expectedMatches > 0 &&
        generatedMatches.length > 0 &&
        generatedMatches.length < expectedMatches
      ) {
        toaster.info({
          title: t('panels.rounds.bracketGeneratedIncompleteTitle'),
          description: t(
            'panels.rounds.bracketGeneratedIncompleteDescription',
            {
              actual: generatedMatches.length,
              expected: expectedMatches,
            }
          ),
        });
      } else {
        toaster.success({ title: t('panels.rounds.bracketGenerated') });
      }
    } catch (error: unknown) {
      const apiError = error as {
        response?: { data?: { message?: string | string[] } };
      };
      const raw = apiError?.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : raw ||
          (error instanceof Error
            ? error.message
            : t('panels.rounds.generateBracketFailed'));
      toaster.error({
        title: t('panels.rounds.generateBracketFailed'),
        description: message,
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // ─── Derived state ─────────────────────────────────────────────────────────

  const totalMatches = Object.values(matchesByGroup).reduce(
    (sum, matches) => sum + matches.length,
    0
  );
  const tournamentMatchCount = Math.max(
    totalMatches,
    categories.reduce((sum, cat) => sum + (cat._count?.matches ?? 0), 0)
  );
  const allGroupsHaveMatches =
    groups.length > 0 &&
    groups.every((g) => (matchesByGroup[g.id]?.length || 0) > 0);
  const hasTeamsInGroups =
    groups.length > 0 && groups.some((g) => (g._count?.registrations || 0) > 0);
  const totalTeamsInGroups = groups.reduce(
    (sum, g) => sum + (g._count?.registrations || 0),
    0
  );

  // RRSE-specific derived state
  const isPoolsConfigured = groups.length > 0;
  const winnersPerGroup = activeCategory?.winnersPerGroup ?? 0;
  const isAdvancingConfigured = winnersPerGroup > 0;
  const groupCount = activeCategory?.groupCount ?? groups.length;
  const totalRegistrations = registrations.length;

  // Check for elimination matches
  const eliminationMatches = useMemo(() => {
    const ungrouped = matchesByGroup['_ungrouped'] ?? [];
    return ungrouped.filter((m) => m.round !== 'GROUP');
  }, [matchesByGroup]);
  // The bracket preview is renderable as soon as the advancing config yields at
  // least two playoff slots — it only needs winnersPerGroup × groupCount. Gating
  // solely on created elimination matches (which require the group stage to be
  // finished first) hid the diagram after saving a default playoffs config.
  const isPlayoffsConfigured =
    eliminationMatches.length > 0 ||
    Boolean(activeCategory?.thirdPlaceMatch) ||
    winnersPerGroup * groupCount >= 2;
  const hasEliminationMatches = eliminationMatches.length > 0;
  const finishedEliminationMatches = eliminationMatches.filter(
    (match) => match.status === MatchStatus.FINISHED
  ).length;
  // A first-round BYE is auto-finished with score 'BYE'; that's a seeding
  // artefact, not a played result, so it must not count as "scored" (otherwise
  // a freshly-seeded bracket with byes would wrongly look locked).
  const isPlayedResult = (match: CategoryMatch) =>
    (Boolean(match.score) && match.score !== 'BYE') ||
    (match.sets?.length ?? 0) > 0;
  const scoredEliminationMatches = eliminationMatches.filter(
    (match) =>
      (match.status === MatchStatus.FINISHED && match.score !== 'BYE') ||
      isPlayedResult(match)
  ).length;
  // Mirrors the backend's HAS_SCORED_ELIMINATION guard in
  // regenerateEliminationShells: blocks on IN_PROGRESS (a match started at 0-0
  // must still block) or a real played result — but not on auto-BYE matches.
  const touchedEliminationMatches = eliminationMatches.filter(
    (match) => match.status === MatchStatus.IN_PROGRESS || isPlayedResult(match)
  ).length;

  // Group-stage completion progress (used to gate bracket generation)
  const groupStageMatches = useMemo(
    () =>
      Object.values(matchesByGroup)
        .flat()
        .filter((m) => m.round === 'GROUP'),
    [matchesByGroup]
  );
  const finishedGroupMatches = groupStageMatches.filter(
    (m) => m.status === MatchStatus.FINISHED
  ).length;
  const totalGroupMatches = groupStageMatches.length;
  const allGroupMatchesFinished =
    totalGroupMatches > 0 && finishedGroupMatches === totalGroupMatches;

  const roundsActions = (
    <Flex justify="flex-end" gap={2} flexWrap="wrap">
      <Button
        size="sm"
        variant="outline"
        colorPalette="red"
        leftIcon={<Trash2 size={14} />}
        disabled={tournamentMatchCount === 0 || isDeletingAllMatches}
        onClick={() => setIsDeleteAllMatchesOpen(true)}
      >
        {t('panels.rounds.deleteAllMatches')}
      </Button>
    </Flex>
  );

  const roundsModals = (
    <>
      <VModal
        isOpen={isRegenerateConfirmOpen}
        onClose={() => {
          setIsRegenerateConfirmOpen(false);
          setGenerationPreview(null);
        }}
        title={t('panels.rounds.replaceScheduledConfirmTitle')}
        size="sm"
        primaryActionText={t('panels.rounds.replaceScheduledConfirmAction')}
        primaryColorScheme="red"
        onPrimaryAction={() => runGenerateAllMatches(true)}
        isPrimaryLoading={isGenerating}
        isSecondaryDisabled={isGenerating}
      >
        <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.200' }}>
          {t('panels.rounds.replaceScheduledConfirmDesc', {
            count: generationPreview?.scheduledAssignedMatches ?? 0,
          })}
        </Text>
      </VModal>

      <VModal
        isOpen={isDeleteAllMatchesOpen}
        onClose={() => setIsDeleteAllMatchesOpen(false)}
        title={t('panels.rounds.deleteAllMatchesConfirmTitle')}
        size="sm"
        primaryActionText={t('panels.rounds.deleteAllMatchesConfirmAction')}
        primaryColorScheme="red"
        onPrimaryAction={handleDeleteAllMatches}
        isPrimaryLoading={isDeletingAllMatches}
        isSecondaryDisabled={isDeletingAllMatches}
      >
        <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.200' }}>
          {t('panels.rounds.deleteAllMatchesConfirmDesc', {
            count: tournamentMatchCount,
          })}
        </Text>
      </VModal>
    </>
  );

  const advancingSlots = useMemo(() => {
    if (!isAdvancingConfigured || groupCount <= 0) return [];
    const slots: string[] = [];
    for (let rank = 0; rank < winnersPerGroup; rank++) {
      for (let g = 0; g < groupCount; g++) {
        const poolLabel = POOL_LABELS[g] ?? String(g + 1);
        slots.push(
          t('panels.rounds.nthPoolLabel', {
            rank: getOrdinalLabel(rank, t),
            pool: poolLabel,
          })
        );
      }
    }
    return slots;
  }, [isAdvancingConfigured, groupCount, winnersPerGroup, t]);

  // ─── Category selector (shared) ────────────────────────────────────────────

  const tf = useTranslations('pages.tournaments.detail.formatWizard.formats');

  const CategorySelector = () => {
    if (categories.length === 0) return null;

    const formatName = activeCategory
      ? tf(`${activeCategory.format}.name`)
      : '';

    return (
      <Flex align="center" gap={3} flexWrap="wrap">
        <Box position="relative" maxW="220px" flex="1">
          <Flex
            as="button"
            align="center"
            gap={2}
            px={3}
            py={1.5}
            borderRadius="full"
            bg="gray.100"
            _hover={{ bg: 'gray.200', _dark: { bg: 'gray.700' } }}
            _dark={{ bg: 'gray.800' }}
            cursor="pointer"
            fontSize="sm"
            fontWeight="medium"
            w="full"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
          >
            <Box
              w="8px"
              h="8px"
              borderRadius="full"
              bg={activeCategoryColor}
              flexShrink={0}
            />
            <Text
              flex="1"
              textAlign="left"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {activeCategory?.name}
            </Text>
            <ChevronDown size={14} />
          </Flex>

          {isDropdownOpen && (
            <>
              <Box
                position="fixed"
                inset={0}
                zIndex={10}
                onClick={() => setIsDropdownOpen(false)}
              />
              <Box
                position="absolute"
                top="calc(100% + 4px)"
                left={0}
                zIndex={11}
                bg="white"
                borderRadius="xl"
                boxShadow="md"
                minW="160px"
                py={1}
                border="1px solid"
                borderColor="gray.100"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              >
                {categories.map((cat, idx) => (
                  <Flex
                    key={cat.id}
                    as="button"
                    align="center"
                    gap={2}
                    px={4}
                    py={2.5}
                    w="full"
                    fontSize="sm"
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                    onClick={() => {
                      onSelectCategory(cat);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                      flexShrink={0}
                    />
                    <Text>{cat.name}</Text>
                  </Flex>
                ))}
              </Box>
            </>
          )}
        </Box>

        {activeCategory && (
          <Badge
            variant="subtle"
            colorPalette="gray"
            px={3}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontWeight="medium"
          >
            {formatName}
          </Badge>
        )}
      </Flex>
    );
  };

  // ─── Single / Double Elimination Stepper Layout ────────────────────────────

  if (isSingleElimination || isDoubleElimination) {
    const hasBracketMatches = eliminationMatches.length > 0;

    return (
      <VStack gap={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="md">{t('panels.rounds.title')}</Heading>
        </Flex>

        <CategorySelector />

        {loading ? (
          <TournamentMatchListSkeleton count={4} />
        ) : (
          <Box position="relative" pl={6}>
            <VStack gap={8} align="stretch">
              <StepperSection
                icon={ListTree}
                title={t('panels.rounds.bracket')}
                subtitle={t('panels.rounds.bracketSubtitle')}
                color="green"
              >
                <VStack gap={3} align="stretch">
                  {hasBracketMatches && (
                    <Box
                      bg="white"
                      borderRadius="xl"
                      borderWidth="1.5px"
                      borderColor="gray.200"
                      overflow="hidden"
                      p={3}
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    >
                      {isDoubleElimination ? (
                        <DoubleEliminationBracketViz
                          teamCount={totalRegistrations}
                          isTrueDoubleElimination={
                            (
                              activeCategory?.formatConfig as
                                | Record<string, unknown>
                                | undefined
                            )?.doubleElimination
                              ? ((
                                  (
                                    activeCategory?.formatConfig as Record<
                                      string,
                                      unknown
                                    >
                                  ).doubleElimination as Record<string, unknown>
                                ).isTrueDoubleElimination as boolean) !== false
                              : true
                          }
                          compact
                        />
                      ) : (
                        <BracketVisualization
                          teamCount={totalRegistrations}
                          groupCount={1}
                          winnersPerGroup={totalRegistrations}
                          thirdPlaceMatch={
                            activeCategory?.thirdPlaceMatch ?? false
                          }
                          compact
                        />
                      )}
                    </Box>
                  )}
                  <Button
                    size="sm"
                    variant={hasBracketMatches ? 'outline' : 'solid'}
                    leftIcon={
                      hasBracketMatches ? <Edit size={14} /> : undefined
                    }
                    style={
                      hasBracketMatches
                        ? undefined
                        : { background: '#1a202c', color: 'white' }
                    }
                    onClick={() => setIsSEBracketModalOpen(true)}
                  >
                    {t('panels.rounds.setupBracket')}
                  </Button>
                  <GenerateBracketSection
                    hasGroupStage={false}
                    finishedGroupMatches={0}
                    totalGroupMatches={0}
                    hasBracket={hasBracketMatches}
                    canGenerate={totalRegistrations >= 2}
                    isLoading={isCompleting}
                    onClick={() => setIsGenerateConfirmOpen(true)}
                  />
                </VStack>
              </StepperSection>
            </VStack>
          </Box>
        )}

        {activeCategory && (
          <>
            {isDoubleElimination ? (
              <DoubleEliminationBracketModal
                isOpen={isSEBracketModalOpen}
                onClose={() => setIsSEBracketModalOpen(false)}
                category={activeCategory}
                registrations={registrations}
                onSaved={handleRefreshCategory}
              />
            ) : (
              <SingleEliminationBracketModal
                isOpen={isSEBracketModalOpen}
                onClose={() => setIsSEBracketModalOpen(false)}
                category={activeCategory}
                registrations={registrations}
                onSaved={handleRefreshCategory}
              />
            )}
            <GenerateBracketConfirmModal
              isOpen={isGenerateConfirmOpen}
              onClose={() => setIsGenerateConfirmOpen(false)}
              onConfirm={handleGenerateBracket}
              isLoading={isCompleting}
              hasBracket={hasEliminationMatches}
            />
            {roundsModals}
          </>
        )}

        {roundsActions}
      </VStack>
    );
  }

  // ─── RRSE Stepper Layout ───────────────────────────────────────────────────

  if (isPoolFormat) {
    return (
      <VStack gap={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="md">{t('panels.rounds.title')}</Heading>
        </Flex>

        <CategorySelector />

        {loading ? (
          <TournamentMatchListSkeleton count={4} />
        ) : (
          <>
            {isRRSE &&
              allGroupMatchesFinished &&
              isAdvancingConfigured &&
              !hasEliminationMatches && (
                <BracketReadyBanner
                  finishedGroupMatches={finishedGroupMatches}
                  totalGroupMatches={totalGroupMatches}
                  categoryName={activeCategory.name}
                  hasBracket={hasEliminationMatches}
                  playoffMatchCount={eliminationMatches.length}
                  scoredPlayoffMatchCount={scoredEliminationMatches}
                  isLoading={isCompleting}
                  onClick={() => setIsGenerateConfirmOpen(true)}
                />
              )}

            <Box position="relative" pl={6}>
              {/* Vertical connector line */}
              {isRRSE && (
                <Box
                  position="absolute"
                  left="22px"
                  top="28px"
                  bottom="28px"
                  w="2px"
                  bg="gray.200"
                  _dark={{ bg: 'gray.700' }}
                />
              )}

              <VStack gap={8} align="stretch">
                {/* ── Phase 1: Pool Play ── */}
                <StepperSection
                  icon={RefreshCw}
                  title={t('panels.rounds.poolPlay')}
                  subtitle={t('panels.rounds.poolPlaySubtitle')}
                >
                  {isPoolsConfigured ? (
                    <VStack gap={2.5} align="stretch">
                      {/* Pool summary — side-by-side grids */}
                      <Flex gap={3} flexWrap="wrap">
                        {groups.map((group, idx) => {
                          const groupRegs = group.registrations ?? [];
                          const groupMatchCount =
                            matchesByGroup[group.id]?.length ?? 0;
                          // Format group name: if name is just a letter (A, B, C...), prepend with translated "Bảng"
                          const poolLabel = group.name
                            ? group.name.length === 1 ||
                              /^[A-Z]$/.test(group.name)
                              ? `${t('panels.rounds.poolLabel')} ${group.name}`
                              : group.name
                            : `${t('panels.rounds.poolLabel')} ${
                                POOL_LABELS[idx] ?? String(idx + 1)
                              }`;
                          return (
                            <Box
                              key={group.id}
                              bg="white"
                              borderRadius="xl"
                              borderWidth="1.5px"
                              borderColor="yellow.200"
                              overflow="hidden"
                              flex="1 1 180px"
                              maxW="280px"
                              _dark={{
                                bg: 'gray.800',
                                borderColor: 'gray.700',
                              }}
                            >
                              <Flex
                                px={3}
                                py={2}
                                align="center"
                                justify="space-between"
                                gap={2}
                                borderBottomWidth="1px"
                                borderColor="gray.100"
                                _dark={{ borderColor: 'gray.700' }}
                              >
                                <Text fontWeight="semibold" fontSize="sm">
                                  {poolLabel}
                                </Text>
                                {groupMatchCount > 0 && (
                                  <Badge
                                    colorPalette="green"
                                    variant="subtle"
                                    fontSize="2xs"
                                  >
                                    {t('panels.rounds.matchCount', {
                                      count: groupMatchCount,
                                    })}
                                  </Badge>
                                )}
                              </Flex>
                              <VStack gap={0} align="stretch">
                                {groupRegs.length > 0
                                  ? groupRegs.map((gr) => {
                                      const reg = gr.categoryRegistration;
                                      const name = reg?.player
                                        ? reg.player.name
                                        : reg?.pair
                                          ? (reg.pair.name ??
                                            reg.pair.members
                                              ?.map((m) => m.player?.name)
                                              .join(' & ') ??
                                            '?')
                                          : '?';
                                      return (
                                        <Flex
                                          key={gr.id}
                                          px={3}
                                          py={2}
                                          align="center"
                                          borderBottomWidth="1px"
                                          borderColor="gray.50"
                                          _last={{ borderBottomWidth: '0' }}
                                          _dark={{ borderColor: 'gray.700' }}
                                        >
                                          <Text fontSize="xs">{name}</Text>
                                        </Flex>
                                      );
                                    })
                                  : Array.from({
                                      length: group._count?.registrations ?? 0,
                                    }).map((_, i) => (
                                      <Flex
                                        key={i}
                                        px={3}
                                        py={2}
                                        borderBottomWidth="1px"
                                        borderColor="gray.50"
                                        _last={{ borderBottomWidth: '0' }}
                                        _dark={{ borderColor: 'gray.700' }}
                                      >
                                        <Text
                                          fontSize="xs"
                                          color="gray.400"
                                          _dark={{ color: 'gray.500' }}
                                        >
                                          {t('panels.rounds.teamLabel')} {i + 1}
                                        </Text>
                                      </Flex>
                                    ))}
                              </VStack>
                            </Box>
                          );
                        })}
                      </Flex>

                      {/* Group-stage status — always visible so the host can
                          tell at a glance whether matches were generated and
                          how many, instead of only showing a count once > 0. */}
                      {totalGroupMatches > 0 ? (
                        <Badge
                          alignSelf="flex-start"
                          colorPalette={
                            allGroupMatchesFinished ? 'green' : 'gray'
                          }
                          variant="outline"
                          borderRadius="md"
                          px={2}
                          py={0.5}
                          fontSize="xs"
                          fontWeight="medium"
                        >
                          {t('panels.rounds.groupMatchesStatus', {
                            total: totalGroupMatches,
                            finished: finishedGroupMatches,
                          })}
                        </Badge>
                      ) : (
                        <Badge
                          alignSelf="flex-start"
                          colorPalette="gray"
                          variant="outline"
                          borderRadius="md"
                          px={2}
                          py={0.5}
                          fontSize="xs"
                          fontWeight="medium"
                          color="fg.muted"
                        >
                          {t('panels.rounds.groupMatchesNotGenerated')}
                        </Badge>
                      )}

                      {/* Edit buttons */}
                      <Flex gap={2} flexWrap="wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          flex="1"
                          leftIcon={<Edit size={14} />}
                          onClick={() => {
                            setPoolsModalInitialStep('configure');
                            setIsPoolsModalOpen(true);
                          }}
                        >
                          {t('panels.rounds.editPools')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          flex="1"
                          leftIcon={<Edit size={14} />}
                          onClick={() => {
                            setPoolsModalInitialStep('matches');
                            setIsPoolsModalOpen(true);
                          }}
                        >
                          {t('panels.rounds.editMatches')}
                        </Button>
                      </Flex>

                      {/* Explicit generate — mirrors "Phát sinh trận vòng loại"
                          in the playoff section, so both stages follow the same
                          Configure → Generate model instead of the pool matches
                          being generated implicitly on modal save. */}
                      <Button
                        size="sm"
                        w="full"
                        colorPalette="blue"
                        variant={totalGroupMatches > 0 ? 'outline' : 'solid'}
                        leftIcon={<RefreshCw size={14} />}
                        loading={isGenerating}
                        disabled={isGenerating || !hasTeamsInGroups}
                        onClick={handleGenerateAllMatches}
                      >
                        {totalGroupMatches > 0
                          ? t('panels.rounds.regenerateGroupGames')
                          : t('panels.rounds.generateGroupGames')}
                      </Button>

                      {/* Chốt đội đi tiếp: fills the playoff bracket with the
                          advancing teams once the group stage is done. Lives
                          here (not under Playoffs) since it's the natural next
                          step right after group matches finish. */}
                      {isRRSE &&
                        (!allGroupMatchesFinished || hasEliminationMatches) && (
                          <GenerateBracketSection
                            hasGroupStage
                            variant="finalize"
                            finishedGroupMatches={finishedGroupMatches}
                            totalGroupMatches={totalGroupMatches}
                            hasBracket={hasEliminationMatches}
                            canGenerate={
                              allGroupMatchesFinished &&
                              scoredEliminationMatches === 0
                            }
                            scoredMatches={scoredEliminationMatches}
                            isLoading={isCompleting}
                            onClick={() => setIsGenerateConfirmOpen(true)}
                          />
                        )}
                    </VStack>
                  ) : (
                    <Button
                      size="sm"
                      w="full"
                      style={{ background: '#1a202c', color: 'white' }}
                      onClick={() => {
                        setPoolsModalInitialStep('configure');
                        setIsPoolsModalOpen(true);
                      }}
                    >
                      {t('panels.rounds.setupPools')}
                    </Button>
                  )}
                </StepperSection>

                {/* ── Phase 2: Advancing Teams (RRSE only) ── */}
                {isRRSE && (
                  <StepperSection
                    icon={Users}
                    title={t('panels.rounds.advancingTeams')}
                    subtitle={t('panels.rounds.advancingTeamsSubtitle')}
                  >
                    {isAdvancingConfigured ? (
                      <VStack gap={3} align="stretch">
                        <Box
                          bg="white"
                          borderRadius="xl"
                          borderWidth="1.5px"
                          borderColor="yellow.200"
                          overflow="hidden"
                          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                        >
                          <Box
                            px={4}
                            py={3}
                            borderBottomWidth="1px"
                            borderColor="gray.100"
                            _dark={{ borderColor: 'gray.700' }}
                          >
                            <Text fontWeight="semibold" fontSize="sm">
                              {t('panels.rounds.playoffs')}
                            </Text>
                          </Box>
                          <VStack gap={0} align="stretch">
                            {advancingSlots.map((slot, idx) => (
                              <Flex
                                key={idx}
                                px={4}
                                py={2}
                                align="center"
                                gap={2}
                                borderBottomWidth={
                                  idx < advancingSlots.length - 1 ? '1px' : '0'
                                }
                                borderColor="gray.50"
                                _dark={{ borderColor: 'gray.700' }}
                              >
                                <Users size={14} color="#A0AEC0" />
                                <Text fontSize="xs">{slot}</Text>
                              </Flex>
                            ))}
                          </VStack>
                        </Box>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Edit size={14} />}
                          onClick={() => setIsAdvancingModalOpen(true)}
                        >
                          {t('panels.rounds.editAdvancingTeams')}
                        </Button>
                      </VStack>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        w="full"
                        onClick={() => setIsAdvancingModalOpen(true)}
                      >
                        {t('panels.rounds.addAdvancingTeams')}
                      </Button>
                    )}
                  </StepperSection>
                )}

                {/* ── Phase 3: Playoffs (RRSE only) ── */}
                {isRRSE && (
                  <StepperSection
                    icon={ListTree}
                    title={t('panels.rounds.playoffs')}
                    subtitle={t('panels.rounds.playoffsSubtitle')}
                  >
                    <VStack gap={3} align="stretch">
                      {isPlayoffsConfigured ? (
                        <>
                          {/* Bracket thumbnail. When no shells exist yet this is
                              only a preview of the shape derived from the
                              advancing-teams config, so dim it and label it as
                              such — otherwise it's indistinguishable from real
                              generated matches. */}
                          <Box
                            position="relative"
                            bg="white"
                            borderRadius="xl"
                            borderWidth="1.5px"
                            borderColor="yellow.200"
                            overflow="hidden"
                            p={3}
                            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                          >
                            <Box opacity={hasEliminationMatches ? 1 : 0.5}>
                              <BracketVisualization
                                teamCount={winnersPerGroup * groupCount}
                                groupCount={groupCount}
                                winnersPerGroup={winnersPerGroup || 2}
                                thirdPlaceMatch={
                                  activeCategory?.thirdPlaceMatch ?? false
                                }
                                compact
                              />
                            </Box>
                            {!hasEliminationMatches && (
                              <Badge
                                position="absolute"
                                top={2}
                                right={2}
                                colorPalette="gray"
                                variant="solid"
                              >
                                {t('panels.rounds.bracketPreviewLabel')}
                              </Badge>
                            )}
                          </Box>
                          {/* Count reflects real generated shells only (not the
                              config-derived expected count), so the host can
                              tell whether matches exist yet. */}
                          {hasEliminationMatches ? (
                            <Badge
                              alignSelf="flex-start"
                              colorPalette={
                                finishedEliminationMatches ===
                                eliminationMatches.length
                                  ? 'green'
                                  : 'gray'
                              }
                              variant="outline"
                              borderRadius="md"
                              px={2}
                              py={0.5}
                              fontSize="xs"
                              fontWeight="medium"
                            >
                              {t('panels.rounds.playoffMatchesStatus', {
                                total: eliminationMatches.length,
                                finished: finishedEliminationMatches,
                              })}
                            </Badge>
                          ) : (
                            <Badge
                              alignSelf="flex-start"
                              colorPalette="gray"
                              variant="outline"
                              borderRadius="md"
                              px={2}
                              py={0.5}
                              fontSize="xs"
                              fontWeight="medium"
                              color="fg.muted"
                            >
                              {t('panels.rounds.playoffMatchesNotGenerated')}
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            w="full"
                            leftIcon={<Edit size={14} />}
                            onClick={() => setIsPlayoffsModalOpen(true)}
                          >
                            {t('panels.rounds.setupBracket')}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          w="full"
                          onClick={() => setIsPlayoffsModalOpen(true)}
                        >
                          {t('panels.rounds.addBracket')}
                        </Button>
                      )}
                      {isAdvancingConfigured &&
                        winnersPerGroup * groupCount >= 2 && (
                          <Button
                            size="sm"
                            w="full"
                            colorPalette="blue"
                            variant={
                              hasEliminationMatches ? 'outline' : 'solid'
                            }
                            leftIcon={<ListTree size={14} />}
                            disabled={
                              touchedEliminationMatches > 0 ||
                              isGeneratingShells
                            }
                            loading={isGeneratingShells}
                            onClick={handleGenerateEliminationShells}
                          >
                            {hasEliminationMatches
                              ? t('panels.rounds.regenerateEliminationGames')
                              : t('panels.rounds.generateEliminationGames')}
                          </Button>
                        )}
                    </VStack>
                  </StepperSection>
                )}
              </VStack>
            </Box>
          </>
        )}

        {/* Modals */}
        {activeCategory && (
          <>
            <SetupPoolsModal
              isOpen={isPoolsModalOpen}
              onClose={() => setIsPoolsModalOpen(false)}
              category={activeCategory}
              onSaved={handleRefreshCategory}
              initialStep={poolsModalInitialStep}
            />
            <AdvancingTeamsModal
              isOpen={isAdvancingModalOpen}
              onClose={() => setIsAdvancingModalOpen(false)}
              category={activeCategory}
              groupCount={groupCount || 2}
              totalRegistrations={totalRegistrations}
              onSaved={handleRefreshCategory}
            />
            <PlayoffsBracketModal
              isOpen={isPlayoffsModalOpen}
              onClose={() => setIsPlayoffsModalOpen(false)}
              category={activeCategory}
              groupCount={groupCount || 2}
              onSaved={handleRefreshCategory}
            />
            <GenerateBracketConfirmModal
              isOpen={isGenerateConfirmOpen}
              onClose={() => setIsGenerateConfirmOpen(false)}
              onConfirm={handleGenerateBracket}
              isLoading={isCompleting}
              hasBracket={hasEliminationMatches}
            />
            {roundsModals}
          </>
        )}

        {roundsActions}
      </VStack>
    );
  }

  // ─── Flat Layout (ROUND_ROBIN / SINGLE_ELIMINATION fallback) ───────────────

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Heading size="md">{t('panels.rounds.title')}</Heading>
      </Flex>

      <CategorySelector />

      {loading ? (
        <TournamentMatchListSkeleton count={4} />
      ) : groups.length === 0 ? (
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={6}
          bg="gray.50"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Flex direction="column" align="center" gap={4}>
            <Box color="gray.400" _dark={{ color: 'gray.500' }}>
              <GitBranch size={32} />
            </Box>
            <Text
              fontSize="sm"
              color="gray.600"
              fontWeight="medium"
              _dark={{ color: 'gray.300' }}
            >
              {t('panels.rounds.setupGroups')}
            </Text>
            <Text
              fontSize="xs"
              color="gray.500"
              textAlign="center"
              px={2}
              _dark={{ color: 'gray.400' }}
            >
              {t('panels.rounds.setupGroupsDescription')}
            </Text>

            <Flex
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              p={4}
              gap={4}
              align="center"
              w="100%"
              maxW="320px"
              _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
            >
              <Text fontSize="sm" fontWeight="medium" flex={1}>
                {t('panels.rounds.numberOfGroups')}
              </Text>
              <Flex align="center" gap={2}>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setGroupCountInput((v) => Math.max(1, v - 1))}
                  disabled={groupCountInput <= 1}
                >
                  −
                </Button>
                <Input
                  size="sm"
                  type="number"
                  min={1}
                  max={16}
                  value={groupCountInput}
                  onChange={(e) =>
                    setGroupCountInput(
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  w="52px"
                  textAlign="center"
                />
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setGroupCountInput((v) => Math.min(16, v + 1))}
                  disabled={groupCountInput >= 16}
                >
                  +
                </Button>
              </Flex>
            </Flex>

            <Button
              size="sm"
              colorPalette="green"
              leftIcon={<Layers size={14} />}
              onClick={handleCreateGroups}
              disabled={isCreatingGroups}
            >
              {isCreatingGroups
                ? t('panels.rounds.creating')
                : t('panels.rounds.createGroups', { count: groupCountInput })}
            </Button>
          </Flex>
        </Box>
      ) : (
        <VStack gap={4} align="stretch">
          {!allGroupsHaveMatches && (
            <Flex
              bg="green.50"
              borderWidth="1px"
              borderColor="green.200"
              borderRadius="lg"
              p={3}
              align="center"
              gap={2}
              flexWrap="wrap"
              _dark={{ bg: 'green.900', borderColor: 'green.700' }}
            >
              {!hasTeamsInGroups ? (
                <>
                  <Shuffle size={16} color="var(--chakra-colors-green-600)" />
                  <Text
                    fontSize="sm"
                    color="green.700"
                    flex={1}
                    _dark={{ color: 'green.200' }}
                  >
                    {t('panels.rounds.noTeamsInGroups')}
                  </Text>
                  <Button
                    size="xs"
                    colorPalette="green"
                    onClick={handleAutoAssign}
                    disabled={isAssigning}
                  >
                    {isAssigning
                      ? t('panels.rounds.assigning')
                      : t('panels.rounds.autoAssignTeams')}
                  </Button>
                </>
              ) : (
                <>
                  <Zap size={16} color="var(--chakra-colors-green-600)" />
                  <Text
                    fontSize="sm"
                    color="green.700"
                    flex={1}
                    _dark={{ color: 'green.200' }}
                  >
                    {t('panels.rounds.readyToGenerate', {
                      count: totalTeamsInGroups,
                    })}
                  </Text>
                  <Button
                    size="xs"
                    colorPalette="green"
                    onClick={handleGenerateAllMatches}
                    disabled={isGenerating}
                  >
                    {isGenerating
                      ? t('panels.rounds.generating')
                      : t('panels.rounds.generateGroupGames')}
                  </Button>
                </>
              )}
            </Flex>
          )}

          {allGroupsHaveMatches && (
            <Flex
              bg="green.50"
              borderWidth="1px"
              borderColor="green.200"
              borderRadius="lg"
              p={3}
              align="center"
              gap={2}
              _dark={{ bg: 'green.900', borderColor: 'green.700' }}
            >
              <Trophy size={16} color="var(--chakra-colors-green-600)" />
              <Text
                fontSize="sm"
                color="green.700"
                fontWeight="medium"
                _dark={{ color: 'green.200' }}
              >
                {t('panels.rounds.allGroupsHaveMatches')}
              </Text>
              <Text
                fontSize="sm"
                color="green.600"
                ml="auto"
                _dark={{ color: 'green.300' }}
              >
                {t('panels.rounds.matchCount', { count: totalMatches })}
              </Text>
            </Flex>
          )}

          {groups.map((group) => {
            const groupMatches = matchesByGroup[group.id] || [];
            // Format group name: if name is just a letter (A, B, C...), prepend with translated "Bảng"
            // Otherwise use the name as-is or fallback to groupLabel with number
            const groupName = group.name
              ? group.name.length === 1 || /^[A-Z]$/.test(group.name)
                ? `${t('panels.rounds.poolLabel')} ${group.name}`
                : group.name
              : t('panels.rounds.groupLabel', { number: group.groupNumber });
            const regCount = group._count?.registrations || 0;

            return (
              <Box
                key={group.id}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="xl"
                overflow="hidden"
                bg="white"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              >
                <Flex
                  bg="gray.50"
                  px={4}
                  py={3}
                  align="center"
                  justify="space-between"
                  borderBottomWidth={
                    groupMatches.length > 0 || regCount > 0 ? '1px' : '0'
                  }
                  borderColor="gray.200"
                  _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                >
                  <Flex align="center" gap={2}>
                    <Text fontWeight="semibold" fontSize="sm">
                      {groupName}
                    </Text>
                    {regCount > 0 && groupMatches.length === 0 && (
                      <Badge
                        colorPalette="blue"
                        fontSize="2xs"
                        variant="subtle"
                      >
                        {t('panels.rounds.teamsCount', { count: regCount })}
                      </Badge>
                    )}
                    {groupMatches.length > 0 && (
                      <Badge
                        colorPalette="green"
                        fontSize="2xs"
                        variant="subtle"
                      >
                        {t('panels.rounds.matchCount', {
                          count: groupMatches.length,
                        })}
                      </Badge>
                    )}
                  </Flex>
                </Flex>

                {groupMatches.length > 0 ? (
                  <VStack gap={0} align="stretch">
                    {groupMatches.map((match, idx) => {
                      const p1 = match.participants?.find(
                        (p) => p.position === 1
                      );
                      const p2 = match.participants?.find(
                        (p) => p.position === 2
                      );
                      const p1Name = p1 ? getParticipantName(p1) : '?';
                      const p2Name = p2 ? getParticipantName(p2) : '?';
                      const statusColor =
                        STATUS_COLOR_MAP[match.status] || 'gray';

                      return (
                        <Box
                          key={match.id}
                          px={4}
                          py={3}
                          borderBottomWidth={
                            idx < groupMatches.length - 1 ? '1px' : '0'
                          }
                          borderColor="gray.100"
                          _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                          _dark={{ borderColor: 'gray.700' }}
                        >
                          <Flex align="center" gap={3}>
                            <Text
                              fontSize="xs"
                              color="gray.400"
                              fontWeight="medium"
                              minW="32px"
                              _dark={{ color: 'gray.500' }}
                            >
                              #{match.matchNumber}
                            </Text>

                            <Flex flex={1} align="center" gap={2} minW={0}>
                              <Text
                                fontSize="sm"
                                fontWeight={
                                  match.winnerId &&
                                  p1?.categoryRegistrationId === match.winnerId
                                    ? 'bold'
                                    : 'normal'
                                }
                                truncate
                              >
                                {p1Name}
                              </Text>
                              <Text
                                fontSize="xs"
                                color="gray.400"
                                flexShrink={0}
                                _dark={{ color: 'gray.500' }}
                              >
                                {t('panels.rounds.vs')}
                              </Text>
                              <Text
                                fontSize="sm"
                                fontWeight={
                                  match.winnerId &&
                                  p2?.categoryRegistrationId === match.winnerId
                                    ? 'bold'
                                    : 'normal'
                                }
                                truncate
                              >
                                {p2Name}
                              </Text>
                            </Flex>

                            <Text
                              fontSize="sm"
                              color={match.score ? 'gray.700' : 'gray.400'}
                              fontWeight={match.score ? 'semibold' : 'normal'}
                              minW="60px"
                              textAlign="center"
                              _dark={{
                                color: match.score ? 'gray.200' : 'gray.500',
                              }}
                            >
                              {match.score || t('panels.rounds.noScore')}
                            </Text>

                            <Badge
                              colorPalette={statusColor}
                              fontSize="2xs"
                              variant="subtle"
                            >
                              {t(`panels.rounds.${match.status.toLowerCase()}`)}
                            </Badge>
                          </Flex>
                        </Box>
                      );
                    })}
                  </VStack>
                ) : regCount === 0 ? (
                  <Flex py={4} justify="center">
                    <Text
                      fontSize="xs"
                      color="gray.400"
                      _dark={{ color: 'gray.500' }}
                    >
                      {t('panels.rounds.noTeamsInGroup')}
                    </Text>
                  </Flex>
                ) : null}
              </Box>
            );
          })}
        </VStack>
      )}

      {roundsActions}
      {roundsModals}
    </VStack>
  );
}

// ─── StepperSection ──────────────────────────────────────────────────────────

function StepperSection({
  icon: Icon,
  title,
  subtitle,
  children,
  color = 'yellow',
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  color?: 'yellow' | 'green';
}) {
  const bgColor = color === 'green' ? 'green.100' : 'yellow.100';
  const iconColor = color === 'green' ? '#38A169' : '#D69E2E';

  return (
    <Box>
      <Flex align="flex-start" gap={3} mb={3}>
        <Flex
          w="40px"
          h="40px"
          bg={bgColor}
          borderRadius="lg"
          align="center"
          justify="center"
          flexShrink={0}
          borderWidth="1px"
          borderColor="white"
          boxShadow="sm"
          _dark={{
            bg: color === 'green' ? 'green.900' : 'yellow.900',
            borderColor: 'gray.700',
          }}
        >
          <Icon size={18} color={iconColor} />
        </Flex>
        <Box minW={0} flex={1}>
          <Text fontWeight="bold" fontSize="md" lineHeight="1.2">
            {title}
          </Text>
          <Text
            fontSize="sm"
            color="gray.500"
            mt={1}
            _dark={{ color: 'gray.400' }}
          >
            {subtitle}
          </Text>
        </Box>
      </Flex>

      <Box ml="20px" pl={5}>
        {children}
      </Box>
    </Box>
  );
}

function BracketReadyBanner({
  finishedGroupMatches,
  totalGroupMatches,
  categoryName,
  hasBracket,
  playoffMatchCount,
  scoredPlayoffMatchCount,
  isLoading,
  onClick,
}: {
  finishedGroupMatches: number;
  totalGroupMatches: number;
  categoryName: string;
  hasBracket: boolean;
  playoffMatchCount: number;
  scoredPlayoffMatchCount: number;
  isLoading: boolean;
  onClick: () => void;
}) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const hasPlayoffScores = scoredPlayoffMatchCount > 0;

  return (
    <Box
      ml={{ base: 0, md: '20px' }}
      mb={5}
      borderWidth="1px"
      borderColor={hasBracket ? 'orange.200' : 'green.200'}
      borderRadius="xl"
      bg={hasBracket ? 'orange.50' : 'green.50'}
      px={{ base: 4, md: 5 }}
      py={4}
      _dark={{
        bg: hasBracket ? 'orange.950' : 'green.950',
        borderColor: hasBracket ? 'orange.800' : 'green.800',
      }}
    >
      <Flex
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={3}
        direction={{ base: 'column', md: 'row' }}
      >
        <Box minW={0}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={hasBracket ? 'orange.800' : 'green.800'}
            _dark={{ color: hasBracket ? 'orange.200' : 'green.200' }}
          >
            {categoryName} ·{' '}
            {t('panels.rounds.groupProgress', {
              finished: finishedGroupMatches,
              total: totalGroupMatches,
            })}
          </Text>
          <Text fontWeight="bold" mt={1}>
            {hasBracket
              ? t('panels.rounds.bracketReadyRegenerateTitle')
              : t('panels.rounds.bracketReadyGenerateTitle')}
          </Text>
          <Text
            fontSize="sm"
            color="gray.700"
            mt={1}
            _dark={{ color: 'gray.200' }}
          >
            {!hasBracket
              ? t('panels.rounds.bracketReadyGenerateDescription')
              : hasPlayoffScores
                ? t(
                    'panels.rounds.bracketReadyRegenerateWithScoresDescription',
                    {
                      matches: playoffMatchCount,
                      scored: scoredPlayoffMatchCount,
                    }
                  )
                : t(
                    'panels.rounds.bracketReadyRegenerateWithoutScoresDescription',
                    { matches: playoffMatchCount }
                  )}
          </Text>
        </Box>

        <Button
          size="sm"
          colorPalette={hasBracket ? 'orange' : 'green'}
          variant={hasBracket ? 'outline' : 'solid'}
          leftIcon={<Trophy size={14} />}
          loading={isLoading}
          onClick={onClick}
          flexShrink={0}
        >
          {hasBracket
            ? t('panels.rounds.refinalizeAdvancing')
            : t('panels.rounds.finalizeAdvancing')}
        </Button>
      </Flex>
    </Box>
  );
}

// ─── GenerateBracketSection ──────────────────────────────────────────────────
// Triggers the backend completeGroupStage flow which generates the elimination
// bracket (from group standings for RRSE, or from all registrations for SE).

function GenerateBracketSection({
  hasGroupStage,
  finishedGroupMatches,
  totalGroupMatches,
  hasBracket,
  canGenerate,
  scoredMatches = 0,
  isLoading,
  onClick,
  variant = 'bracket',
}: {
  hasGroupStage: boolean;
  finishedGroupMatches: number;
  totalGroupMatches: number;
  hasBracket: boolean;
  canGenerate: boolean;
  scoredMatches?: number;
  isLoading: boolean;
  onClick: () => void;
  // 'finalize' → RRSE "Chốt đội đi tiếp" (fill advancing teams into the shells);
  // 'bracket' → direct SE/DE "Tạo nhánh đấu" (build the bracket from scratch).
  variant?: 'finalize' | 'bracket';
}) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const primaryLabel =
    variant === 'finalize'
      ? hasBracket
        ? t('panels.rounds.refinalizeAdvancing')
        : t('panels.rounds.finalizeAdvancing')
      : hasBracket
        ? t('panels.rounds.regenerateBracket')
        : t('panels.rounds.generatePlayoffs');

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      p={2.5}
      bg="gray.50"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      {hasBracket && (
        <Text fontSize="xs" color="orange.600" mb={1.5}>
          {t('panels.rounds.overwriteWarning')}
        </Text>
      )}
      <Button
        size="sm"
        w="full"
        colorPalette={hasBracket ? 'orange' : 'green'}
        variant={hasBracket ? 'outline' : 'solid'}
        leftIcon={<Trophy size={14} />}
        disabled={!canGenerate || isLoading}
        loading={isLoading}
        onClick={onClick}
      >
        {primaryLabel}
      </Button>
      {!canGenerate && !hasBracket && (
        <Text
          fontSize="xs"
          color="gray.400"
          mt={1.5}
          textAlign="center"
          _dark={{ color: 'gray.500' }}
        >
          {t('panels.rounds.generateBracketLocked')}
        </Text>
      )}
      {!canGenerate && hasBracket && scoredMatches > 0 && (
        <Text
          fontSize="xs"
          color="orange.600"
          mt={1.5}
          textAlign="center"
          _dark={{ color: 'orange.400' }}
        >
          {t('panels.rounds.regenerateBracketLocked', {
            scored: scoredMatches,
          })}
        </Text>
      )}
    </Box>
  );
}

// ─── GenerateBracketConfirmModal ─────────────────────────────────────────────

function GenerateBracketConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  hasBracket,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  hasBracket: boolean;
}) {
  const t = useTranslations('pages.tournaments.detail.manage');

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('panels.rounds.confirmGenerateTitle')}
      zIndex={1600}
      primaryActionText={t('panels.rounds.generatePlayoffs')}
      onPrimaryAction={onConfirm}
      isPrimaryLoading={isLoading}
      primaryColorScheme={hasBracket ? 'orange' : 'green'}
      secondaryActionText={t('panels.rounds.cancel')}
    >
      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
        {t('panels.rounds.confirmGenerateMessage')}
      </Text>
      {hasBracket && (
        <Text fontSize="sm" color="orange.600" mt={2}>
          {t('panels.rounds.overwriteWarning')}
        </Text>
      )}
    </VModal>
  );
}
