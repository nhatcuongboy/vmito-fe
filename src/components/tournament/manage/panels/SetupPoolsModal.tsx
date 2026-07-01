'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import {
  ArrowLeft,
  GripVertical,
  Info,
  RefreshCw,
  Shuffle,
  Sparkles,
  X,
} from 'lucide-react';
import VModal from '@/components/ui/VModal';
import { useTranslations } from 'next-intl';
import {
  Category,
  CategoryGroup,
  CategoryMatch,
  CategoryRegistration,
  MatchStatus,
} from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { generateRoundRobinMatches } from '@/utils/round-robin';
import { toaster } from '@/components/ui/toaster';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext as SortableContextBase,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EditMatchesModal from './EditMatchesModal';
import EditSeedsModal from './EditSeedsModal';

// Workaround for @dnd-kit type incompatibility with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SortableContext = SortableContextBase as any;

// ─── Types ───────────────────────────────────────────────────────────────────

export type TSetupStep = 'configure' | 'matches';
type TMatchMethod = 'generate' | 'manual';
type TMatchesPerTeam = 'all' | number;

interface IPreviewTeam {
  id: string;
  name: string;
}

interface IPreviewPool {
  name: string;
  teams: IPreviewTeam[];
}

interface IPreviewMatch {
  poolName: string;
  matchIndex: number;
  team1: IPreviewTeam;
  team2: IPreviewTeam;
}

interface ICrossoverPair {
  pool1: string;
  pool2: string;
}

export interface ISetupPoolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
  onSaved: () => void;
  initialStep?: TSetupStep;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const POOL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const getRegName = (reg: CategoryRegistration): string => {
  if (reg.player) return reg.player.name;
  if (reg.pair)
    return (
      reg.pair.name ||
      reg.pair.members?.map((m) => m.player?.name).join(' & ') ||
      'Unknown'
    );
  return 'Unknown';
};

const getMatchName = (match: CategoryMatch, position: 1 | 2): string => {
  const p = match.participants?.find((pp) => pp.position === position);
  const reg = p?.categoryRegistration;
  if (!reg) return '?';
  if (reg.player) return reg.player.name;
  if (reg.pair)
    return (
      reg.pair.name ||
      reg.pair.members?.map((m) => m.player?.name).join(' & ') ||
      '?'
    );
  return '?';
};

const naturalTeamSort = (a: IPreviewTeam, b: IPreviewTeam): number =>
  a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: 'base',
  });

const distributeIntoGroups = (
  teams: IPreviewTeam[],
  groupCount: number,
  poolLabelText: string
): IPreviewPool[] => {
  const pools: IPreviewPool[] = Array.from({ length: groupCount }, (_, i) => ({
    name: `${poolLabelText} ${POOL_LABELS[i] ?? String(i + 1)}`,
    teams: [],
  }));

  const orderedTeams = [...teams].sort(naturalTeamSort);
  const baseGroupSize = Math.floor(orderedTeams.length / groupCount);
  const remainder = orderedTeams.length % groupCount;
  let offset = 0;

  pools.forEach((pool, idx) => {
    const groupSize = baseGroupSize + (idx < remainder ? 1 : 0);
    pool.teams = orderedTeams.slice(offset, offset + groupSize);
    offset += groupSize;
  });

  return pools;
};

const computePreviewMatches = (pools: IPreviewPool[]): IPreviewMatch[] => {
  const all: IPreviewMatch[] = [];
  pools.forEach((pool) => {
    const ids = pool.teams.map((t) => t.id);
    const { matches } = generateRoundRobinMatches(ids);
    matches.forEach((m, idx) => {
      const t1 = pool.teams.find((t) => t.id === m.participant1Id)!;
      const t2 = pool.teams.find((t) => t.id === m.participant2Id)!;
      all.push({
        poolName: pool.name,
        matchIndex: idx + 1,
        team1: t1,
        team2: t2,
      });
    });
  });
  return all;
};

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Box
      as="button"
      w="44px"
      h="24px"
      borderRadius="full"
      bg={checked ? 'black' : 'gray.300'}
      position="relative"
      onClick={() => onChange(!checked)}
      transition="background 0.2s"
      flexShrink={0}
    >
      <Box
        position="absolute"
        top="2px"
        left={checked ? 'calc(100% - 22px)' : '2px'}
        w="20px"
        h="20px"
        bg="white"
        borderRadius="full"
        boxShadow="sm"
        transition="left 0.2s"
      />
    </Box>
  );
}

// ─── SortablePoolTeam ───────────────────────────────────────────────────────

function SortablePoolTeam({ team }: { team: IPreviewTeam }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <Flex
      ref={setNodeRef}
      style={style}
      px={4}
      py={3}
      align="center"
      justify="space-between"
      borderBottomWidth="1px"
      borderColor="gray.50"
      _last={{ borderBottomWidth: '0' }}
    >
      <Text fontSize="sm">{team.name}</Text>
      <Box
        color="gray.400"
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </Box>
    </Flex>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetupPoolsModal({
  isOpen,
  onClose,
  category,
  onSaved,
  initialStep = 'configure',
}: ISetupPoolsModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  const [step, setStep] = useState<TSetupStep>(initialStep);
  const [registrations, setRegistrations] = useState<CategoryRegistration[]>(
    []
  );
  const [existingGroups, setExistingGroups] = useState<CategoryGroup[]>([]);
  const [existingMatches, setExistingMatches] = useState<CategoryMatch[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Config state
  const [groupCount, setGroupCount] = useState(
    Math.max(1, category.groupCount ?? 1)
  );
  const [seedTeams, setSeedTeams] = useState(false);
  const [matchMethod, setMatchMethod] = useState<TMatchMethod>('generate');
  const [matchesPerTeam, setMatchesPerTeam] = useState<TMatchesPerTeam>('all');
  // Crossover pools
  const [crossoverEnabled, setCrossoverEnabled] = useState(false);
  const [crossoverPairs, setCrossoverPairs] = useState<ICrossoverPair[]>([]);
  // Custom seed order (when user reorders via Edit Seeds)
  const [seedOrder, setSeedOrder] = useState<IPreviewTeam[] | null>(null);
  const [isEditSeedsOpen, setIsEditSeedsOpen] = useState(false);
  // Track if config has changed since modal opened
  const [hasChanges, setHasChanges] = useState(initialStep === 'configure');
  // Custom matches set via the Edit Matches modal (overrides auto-generated preview)
  const [customMatches, setCustomMatches] = useState<IPreviewMatch[] | null>(
    null
  );
  const [isEditMatchesOpen, setIsEditMatchesOpen] = useState(false);
  // Confirmation before a save that would wipe existing matches/scores
  const [isConfirmOverwriteOpen, setIsConfirmOverwriteOpen] = useState(false);

  // Reset and load on open
  useEffect(() => {
    if (!isOpen) return;
    setStep(initialStep);
    setGroupCount(Math.max(1, category.groupCount ?? 1));
    setSeedTeams(false);
    setMatchMethod('generate');
    setMatchesPerTeam('all');
    setCrossoverEnabled(false);
    setCrossoverPairs([]);
    setSeedOrder(null);
    setIsEditSeedsOpen(false);
    setHasChanges(initialStep === 'configure');
    setCustomMatches(null);
    setIsEditMatchesOpen(false);
    setIsConfirmOverwriteOpen(false);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, category.id]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [regs, groups, matches] = await Promise.all([
        CategoryService.getRegistrations(category.id),
        CategoryService.getGroups(category.id),
        CategoryService.getMatches(category.id),
      ]);
      setRegistrations(regs);
      setExistingGroups(groups);
      setExistingMatches(matches);
      // If opened at 'matches' but no matches exist yet, fall back to configure
      if (initialStep === 'matches' && matches.length === 0) {
        setStep('configure');
        setHasChanges(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  // ─── Computed ──────────────────────────────────────────────────────────────

  const previewTeams = useMemo(
    () =>
      seedOrder ??
      registrations.map((r) => ({ id: r.id, name: getRegName(r) })),
    [registrations, seedOrder]
  );

  const poolLabelText = t('panels.rounds.poolLabel');

  const previewPools = useMemo(
    () => distributeIntoGroups(previewTeams, groupCount, poolLabelText),
    [previewTeams, groupCount, poolLabelText]
  );

  // Editable pool state — starts from previewPools, updated by drag-and-drop
  const [poolTeams, setPoolTeams] = useState<IPreviewPool[]>([]);
  useEffect(() => {
    setPoolTeams(previewPools);
  }, [previewPools]);

  const previewMatches = useMemo(
    () =>
      computePreviewMatches(poolTeams.length > 0 ? poolTeams : previewPools),
    [poolTeams, previewPools]
  );

  // Flat list of teams with pool names for the EditMatchesModal dropdown
  const teamsWithPools = useMemo(() => {
    const activePools = poolTeams.length > 0 ? poolTeams : previewPools;
    return activePools.flatMap((pool) =>
      pool.teams.map((team) => ({ ...team, poolName: pool.name }))
    );
  }, [poolTeams, previewPools]);

  const groupNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    existingGroups.forEach((g, idx) => {
      map[g.id] =
        g.name || `${poolLabelText} ${POOL_LABELS[idx] ?? String(idx + 1)}`;
    });
    return map;
  }, [existingGroups, poolLabelText]);

  const maxGroupCount = Math.max(1, Math.floor(registrations.length / 2));

  // Decide what to show in the matches step
  const showExistingMatches = !hasChanges && existingMatches.length > 0;

  // Saving recreates all groups/matches from scratch (see handleSaveMatches),
  // which destroys any scores already recorded. Warn before doing that.
  const hasPlayedMatches = existingMatches.some(
    (m) => !!m.score || m.status === MatchStatus.FINISHED
  );

  // ─── DnD for pool teams ────────────────────────────────────────────────────

  const poolDndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handlePoolDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find which pool each item is in
    let sourcePoolIdx = -1;
    let overPoolIdx = -1;

    setPoolTeams((prev) => {
      const pools = prev.map((p) => ({
        ...p,
        teams: [...p.teams],
      }));

      for (let i = 0; i < pools.length; i++) {
        if (pools[i].teams.some((t) => t.id === activeId)) sourcePoolIdx = i;
        if (pools[i].teams.some((t) => t.id === overId)) overPoolIdx = i;
        // Check if overId is a pool name (droppable container)
        if (pools[i].name === overId) overPoolIdx = i;
      }

      if (sourcePoolIdx === -1 || overPoolIdx === -1) return prev;
      if (sourcePoolIdx === overPoolIdx) return prev; // same pool, handled by dragEnd

      // Move team from source pool to target pool
      const teamIdx = pools[sourcePoolIdx].teams.findIndex(
        (t) => t.id === activeId
      );
      if (teamIdx === -1) return prev;
      const [team] = pools[sourcePoolIdx].teams.splice(teamIdx, 1);
      const overTeamIdx = pools[overPoolIdx].teams.findIndex(
        (t) => t.id === overId
      );
      if (overTeamIdx !== -1) {
        pools[overPoolIdx].teams.splice(overTeamIdx, 0, team);
      } else {
        pools[overPoolIdx].teams.push(team);
      }
      return pools;
    });
  }, []);

  const handlePoolDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setPoolTeams((prev) => {
      const pools = prev.map((p) => ({
        ...p,
        teams: [...p.teams],
      }));

      // Find which pool the active item is in
      for (let i = 0; i < pools.length; i++) {
        const oldIdx = pools[i].teams.findIndex((t) => t.id === activeId);
        const newIdx = pools[i].teams.findIndex((t) => t.id === overId);
        if (oldIdx !== -1 && newIdx !== -1) {
          pools[i].teams = arrayMove(pools[i].teams, oldIdx, newIdx);
          break;
        }
      }
      return pools;
    });
    setHasChanges(true);
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleConfigChange = (fn: () => void) => {
    fn();
    setHasChanges(true);
    setCustomMatches(null);
  };

  // Edit seeds confirm handler
  const handleSeedsConfirm = (ordered: IPreviewTeam[]) => {
    setSeedOrder(ordered);
    setHasChanges(true);
    setCustomMatches(null);
  };

  const handleGenerateGames = () => {
    if (previewTeams.length < 2) {
      toaster.error({ title: t('panels.rounds.needAtLeast2Teams') });
      return;
    }
    const badPool = previewPools.find((p) => p.teams.length < 2);
    if (badPool) {
      toaster.error({
        title: t('panels.rounds.poolNeedsMinTeams', { pool: badPool.name }),
      });
      return;
    }
    setCustomMatches(null); // ensure fresh auto-generated matches on first open
    setStep('matches');
  };

  const handleEditMatchesConfirm = (
    rows: { id: string; team1Id: string; team2Id: string }[]
  ) => {
    // Map row IDs back to team objects for display
    const updated: IPreviewMatch[] = rows
      .filter((r) => r.team1Id && r.team2Id)
      .map((r, idx) => {
        const t1 = previewTeams.find((t) => t.id === r.team1Id) ?? {
          id: r.team1Id,
          name: r.team1Id,
        };
        const t2 = previewTeams.find((t) => t.id === r.team2Id) ?? {
          id: r.team2Id,
          name: r.team2Id,
        };
        return {
          poolName: '', // pool grouping not needed for custom matches
          matchIndex: idx + 1,
          team1: t1,
          team2: t2,
        };
      });
    setCustomMatches(updated);
    setHasChanges(true);
  };

  const handleSaveMatches = async () => {
    try {
      setIsSaving(true);
      // Delete existing groups (cascades matches)
      for (const g of existingGroups) {
        await CategoryService.deleteGroup(category.id, g.id, {
          showToast: false,
        });
      }
      // Persist groupCount
      await CategoryService.updateCategory(
        category.id,
        { groupCount },
        { showToast: false }
      );
      // Create new groups
      const newGroups = await CategoryService.createGroups(category.id, {
        showToast: false,
      });
      // Assign registrations to groups based on the user's pool arrangement
      const activePools = poolTeams.length > 0 ? poolTeams : previewPools;
      for (let i = 0; i < newGroups.length && i < activePools.length; i++) {
        const registrationIds = activePools[i].teams.map((t) => t.id);
        if (registrationIds.length > 0) {
          await CategoryService.bulkAssignRegistrationsToGroup(
            category.id,
            newGroups[i].id,
            registrationIds,
            { showToast: false }
          );
        }
      }

      if (customMatches) {
        // Save custom-edited matches one by one
        const groupNameToId: Record<string, string> = {};
        newGroups.forEach((g, idx) => {
          groupNameToId[
            `${poolLabelText} ${POOL_LABELS[idx] ?? String(idx + 1)}`
          ] = g.id;
        });
        // Fetch registrations to build name→id map
        const regs = await CategoryService.getRegistrations(category.id);
        const regIdSet = new Set(regs.map((r) => r.id));
        let matchNumber = 1;
        for (const m of customMatches) {
          if (!regIdSet.has(m.team1.id) || !regIdSet.has(m.team2.id)) continue;
          await CategoryService.createMatch(category.id, {
            round: 'GROUP',
            matchNumber: matchNumber++,
            participants: [
              { categoryRegistrationId: m.team1.id, position: 1 },
              { categoryRegistrationId: m.team2.id, position: 2 },
            ],
          });
        }
      } else {
        // Generate round-robin matches automatically
        await CategoryService.generateAllGroupMatches(category.id, {
          showToast: false,
        });
      }

      toaster.success({ title: t('panels.rounds.matchesSaved') });
      onSaved();
      onClose();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : t('panels.rounds.matchesSaveFailed');
      toaster.error({ title: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Gate the save behind a confirmation when it would discard recorded scores.
  const handleSavePress = () => {
    if (hasPlayedMatches) {
      setIsConfirmOverwriteOpen(true);
    } else {
      handleSaveMatches();
    }
  };

  if (!isOpen) return null;

  // ─── Footer ────────────────────────────────────────────────────────────────
  const modalFooter = (
    <Flex w="full" align="center" justify="space-between">
      {step === 'configure' ? (
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('panels.rounds.cancel')}
          </Button>
          <Button
            style={{ background: '#1a202c', color: 'white' }}
            leftIcon={<Sparkles size={14} />}
            onClick={handleGenerateGames}
            disabled={registrations.length < 2 || loadingData}
          >
            {t('panels.rounds.generateGroupGames')}
          </Button>
        </>
      ) : (
        <>
          {hasChanges ? (
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => setStep('configure')}
            >
              {t('panels.rounds.back')}
            </Button>
          ) : (
            <Box />
          )}
          <Button
            style={{ background: '#1a202c', color: 'white' }}
            onClick={showExistingMatches ? onClose : handleSavePress}
            disabled={isSaving}
          >
            {isSaving
              ? t('panels.rounds.saving')
              : showExistingMatches
                ? t('panels.rounds.done')
                : t('panels.rounds.saveMatches')}
          </Button>
        </>
      )}
    </Flex>
  );

  return (
    <>
      <VModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <Flex align="center" gap={3}>
            <Flex
              w="36px"
              h="36px"
              bg="blue.50"
              borderRadius="lg"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <RefreshCw size={18} color="#3182CE" />
            </Flex>
            <Box>
              <Text fontWeight="bold" fontSize="md" lineHeight="1.2">
                {t('panels.rounds.roundRobin')}
              </Text>
              <Text fontSize="xs" color="gray.500" fontWeight="normal">
                {t('panels.rounds.configurePoolsAndConfirm')}
              </Text>
            </Box>
          </Flex>
        }
        size="full"
        footer={modalFooter}
        maxBodyHeight={{ base: '70vh', md: '75vh' }}
        zIndex={1400}
      >
        {/* ─── Step 1: Configure ───────────────────────────────────────── */}
        {step === 'configure' && (
          <Flex
            direction={{ base: 'column', md: 'row' }}
            minH="400px"
            mx={-4}
            mt={-4}
          >
            {/* Left panel – options */}
            <Flex
              direction="column"
              gap={6}
              w={{ base: 'full', md: '340px' }}
              flexShrink={0}
              p={6}
              borderRightWidth={{ md: '1px' }}
              borderColor="gray.200"
              overflowY="auto"
            >
              {/* Seed teams */}
              <Flex align="center" justify="space-between" gap={4}>
                <Text fontSize="sm">{t('panels.rounds.seedTeams')}</Text>
                <ToggleSwitch
                  checked={seedTeams}
                  onChange={(v) => handleConfigChange(() => setSeedTeams(v))}
                />
              </Flex>

              {/* Edit seeds button (visible when seed toggle is on) */}
              {seedTeams && (
                <Button
                  size="sm"
                  variant="outline"
                  w="full"
                  onClick={() => setIsEditSeedsOpen(true)}
                >
                  {t('panels.rounds.editSeedsButton')}
                </Button>
              )}

              {/* Number of pools */}
              <Box>
                <Text fontSize="xs" color="gray.500" mb={2} fontWeight="medium">
                  {t('panels.rounds.numberOfPools')}
                </Text>
                <select
                  value={groupCount}
                  onChange={(e) =>
                    handleConfigChange(() =>
                      setGroupCount(Number(e.target.value))
                    )
                  }
                  style={{
                    width: '100%',
                    padding: '0 12px',
                    height: '44px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {Array.from({ length: maxGroupCount }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n === 1
                          ? t('panels.rounds.onePool')
                          : t('panels.rounds.nPools', { count: n })}
                      </option>
                    )
                  )}
                </select>
              </Box>

              {/* Match setup method */}
              <Box>
                <Text fontSize="sm" mb={2}>
                  {t('panels.rounds.matchSetupMethod')}
                </Text>
                <Flex bg="gray.100" borderRadius="lg" p={1} gap={1}>
                  {(['generate', 'manual'] as TMatchMethod[]).map((method) => (
                    <Box
                      key={method}
                      flex={1}
                      py={2}
                      textAlign="center"
                      fontSize="sm"
                      fontWeight={
                        matchMethod === method ? 'semibold' : 'normal'
                      }
                      bg={matchMethod === method ? 'white' : 'transparent'}
                      borderRadius="md"
                      cursor="pointer"
                      boxShadow={matchMethod === method ? 'xs' : 'none'}
                      transition="all 0.15s"
                      onClick={() =>
                        handleConfigChange(() => setMatchMethod(method))
                      }
                    >
                      {method === 'generate'
                        ? t('panels.rounds.generateMethod')
                        : t('panels.rounds.manualEntry')}
                    </Box>
                  ))}
                </Flex>
              </Box>

              {/* Matches per team (generate) or info box (manual) */}
              {matchMethod === 'generate' ? (
                <Box>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    mb={2}
                    fontWeight="medium"
                  >
                    {t('panels.rounds.matchesPerTeam')}
                  </Text>
                  <select
                    value={String(matchesPerTeam)}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleConfigChange(() =>
                        setMatchesPerTeam(val === 'all' ? 'all' : Number(val))
                      );
                    }}
                    style={{
                      width: '100%',
                      padding: '0 12px',
                      height: '44px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">
                      {t('panels.rounds.playAllOnce')}
                    </option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {t('panels.rounds.nMatches', { count: n })}
                      </option>
                    ))}
                  </select>
                </Box>
              ) : (
                <Flex
                  bg="yellow.50"
                  borderRadius="lg"
                  p={4}
                  gap={3}
                  align="center"
                >
                  <Box color="gray.500" flexShrink={0}>
                    <Info size={16} />
                  </Box>
                  <Text fontSize="sm" color="gray.600">
                    {t('panels.rounds.manualEntryInfo')}
                  </Text>
                </Flex>
              )}

              {/* Include crossover pools */}
              <Box>
                <Flex align="center" justify="space-between" gap={4} mb={2}>
                  <Flex align="center" gap={1.5}>
                    <Text fontSize="sm">
                      {t('panels.rounds.includeCrossoverPools')}
                    </Text>
                    <Box
                      title={t('panels.rounds.crossoverPoolsDescription')}
                      cursor="help"
                      color="gray.400"
                    >
                      <Info size={14} />
                    </Box>
                  </Flex>
                  <ToggleSwitch
                    checked={crossoverEnabled}
                    onChange={(v) =>
                      handleConfigChange(() => {
                        setCrossoverEnabled(v);
                        if (!v) setCrossoverPairs([]);
                      })
                    }
                  />
                </Flex>

                {crossoverEnabled && (
                  <VStack gap={3} align="stretch" mt={2}>
                    {crossoverPairs.map((pair, idx) => (
                      <Flex key={idx} align="center" gap={2}>
                        <select
                          value={pair.pool1}
                          onChange={(e) => {
                            const newPairs = [...crossoverPairs];
                            newPairs[idx] = {
                              ...newPairs[idx],
                              pool1: e.target.value,
                            };
                            setCrossoverPairs(newPairs);
                            setHasChanges(true);
                          }}
                          style={{
                            flex: 1,
                            padding: '0 8px',
                            height: '40px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '13px',
                            background: 'white',
                          }}
                        >
                          <option value="">
                            {t('panels.rounds.selectPool')}
                          </option>
                          {poolTeams.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <Box color="gray.400" flexShrink={0}>
                          <Shuffle size={16} />
                        </Box>
                        <select
                          value={pair.pool2}
                          onChange={(e) => {
                            const newPairs = [...crossoverPairs];
                            newPairs[idx] = {
                              ...newPairs[idx],
                              pool2: e.target.value,
                            };
                            setCrossoverPairs(newPairs);
                            setHasChanges(true);
                          }}
                          style={{
                            flex: 1,
                            padding: '0 8px',
                            height: '40px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '13px',
                            background: 'white',
                          }}
                        >
                          <option value="">
                            {t('panels.rounds.selectPool')}
                          </option>
                          {poolTeams.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <Box
                          as="button"
                          color="gray.400"
                          _hover={{ color: 'gray.600' }}
                          flexShrink={0}
                          onClick={() => {
                            setCrossoverPairs((prev) =>
                              prev.filter((_, i) => i !== idx)
                            );
                            setHasChanges(true);
                          }}
                        >
                          <X size={16} />
                        </Box>
                      </Flex>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      w="full"
                      onClick={() =>
                        setCrossoverPairs((prev) => [
                          ...prev,
                          { pool1: '', pool2: '' },
                        ])
                      }
                    >
                      {t('panels.rounds.addCrossover')}
                    </Button>
                  </VStack>
                )}
              </Box>
            </Flex>

            {/* Right panel – pool preview with drag-and-drop */}
            <Box flex={1} bg="gray.50" overflowY="auto" p={6}>
              {loadingData ? (
                <Flex justify="center" align="center" h="200px">
                  <Text color="gray.400" fontSize="sm">
                    {t('panels.rounds.loadingTeams')}
                  </Text>
                </Flex>
              ) : registrations.length === 0 ? (
                <Flex justify="center" align="center" h="200px">
                  <Text color="gray.400" fontSize="sm">
                    {t('panels.rounds.noTeamsRegistered')}
                  </Text>
                </Flex>
              ) : (
                <DndContext
                  sensors={poolDndSensors}
                  collisionDetection={closestCenter}
                  onDragOver={handlePoolDragOver}
                  onDragEnd={handlePoolDragEnd}
                >
                  <Flex maxW="700px" mx="auto" gap={4} flexWrap="wrap">
                    {poolTeams.map((pool) => (
                      <Box
                        key={pool.name}
                        bg="white"
                        borderRadius="xl"
                        borderWidth="1.5px"
                        borderColor="yellow.200"
                        overflow="hidden"
                        flex="1 1 240px"
                        maxW={{ base: 'full', md: '320px' }}
                      >
                        <Box
                          px={4}
                          py={3}
                          borderBottomWidth="1px"
                          borderColor="gray.100"
                        >
                          <Text fontWeight="semibold" fontSize="sm">
                            {pool.name}
                          </Text>
                        </Box>
                        <SortableContext
                          items={pool.teams.map((t) => t.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <VStack gap={0} align="stretch">
                            {pool.teams.map((team) => (
                              <SortablePoolTeam key={team.id} team={team} />
                            ))}
                          </VStack>
                        </SortableContext>
                      </Box>
                    ))}
                  </Flex>
                </DndContext>
              )}
            </Box>
          </Flex>
        )}

        {/* ─── Step 2: Match list ──────────────────────────────────────── */}
        {step === 'matches' && (
          <Box maxW="1200px" mx="auto" py={2} px={4}>
            {/* Edit matches button */}
            <Box mb={4}>
              <Button
                size="sm"
                variant="outline"
                w="full"
                maxW="400px"
                mx="auto"
                display="block"
                onClick={() => setIsEditMatchesOpen(true)}
              >
                {t('panels.rounds.editMatches')}
              </Button>
            </Box>

            {/* Match cards */}
            <Box
              display="grid"
              gridTemplateColumns={{
                base: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
              gap={3}
            >
              {(() => {
                // Display priority: customMatches → existingMatches → previewMatches
                const displayMatches: Array<{
                  key: string;
                  number: number;
                  poolLabel: string;
                  name1: string;
                  name2: string;
                }> = customMatches
                  ? customMatches.map((m, idx) => ({
                      key: `custom-${idx}`,
                      number: idx + 1,
                      poolLabel: '',
                      name1: m.team1.name,
                      name2: m.team2.name,
                    }))
                  : showExistingMatches
                    ? existingMatches.map((match, idx) => ({
                        key: match.id,
                        number: idx + 1,
                        poolLabel: match.groupId
                          ? (groupNameMap[match.groupId] ??
                            t('panels.rounds.poolLabel'))
                          : t('panels.rounds.poolLabel'),
                        name1: getMatchName(match, 1),
                        name2: getMatchName(match, 2),
                      }))
                    : previewMatches.map((match, idx) => ({
                        key: `preview-${idx}`,
                        number: idx + 1,
                        poolLabel: match.poolName,
                        name1: match.team1.name,
                        name2: match.team2.name,
                      }));

                return displayMatches.map((m) => (
                  <Box
                    key={m.key}
                    borderWidth="1.5px"
                    borderColor="yellow.300"
                    borderRadius="xl"
                    p={4}
                    bg="yellow.50"
                  >
                    <Text
                      fontSize="xs"
                      color="yellow.600"
                      fontWeight="medium"
                      mb={2}
                    >
                      {t('panels.rounds.matchLabel', { number: m.number })}
                      {m.poolLabel ? ` • ${m.poolLabel}` : ''}
                    </Text>
                    <Text fontSize="md" fontWeight="semibold">
                      {m.name1}
                    </Text>
                    <Text fontSize="md" fontWeight="semibold">
                      {m.name2}
                    </Text>
                  </Box>
                ));
              })()}
            </Box>
          </Box>
        )}
      </VModal>
      {/* Edit Matches dialog */}
      <EditMatchesModal
        isOpen={isEditMatchesOpen}
        onClose={() => setIsEditMatchesOpen(false)}
        matches={
          customMatches
            ? customMatches.map((m, idx) => ({
                id: `match-${idx}`,
                team1Id: m.team1.id,
                team2Id: m.team2.id,
              }))
            : showExistingMatches
              ? existingMatches.map((match) => ({
                  id: match.id,
                  team1Id:
                    match.participants?.find((p) => p.position === 1)
                      ?.categoryRegistrationId ?? '',
                  team2Id:
                    match.participants?.find((p) => p.position === 2)
                      ?.categoryRegistrationId ?? '',
                }))
              : previewMatches.map((m, idx) => ({
                  id: `match-${idx}`,
                  team1Id: m.team1.id,
                  team2Id: m.team2.id,
                }))
        }
        teams={teamsWithPools}
        onConfirm={handleEditMatchesConfirm}
      />
      {/* Edit Seeds dialog */}
      <EditSeedsModal
        isOpen={isEditSeedsOpen}
        onClose={() => setIsEditSeedsOpen(false)}
        teams={previewTeams}
        onConfirm={handleSeedsConfirm}
      />
      {/* Overwrite confirmation — only shown when scores would be discarded */}
      <VModal
        isOpen={isConfirmOverwriteOpen}
        onClose={() => setIsConfirmOverwriteOpen(false)}
        title={t('panels.rounds.confirmOverwriteTitle')}
        primaryActionText={t('panels.rounds.confirmOverwriteConfirm')}
        onPrimaryAction={() => {
          setIsConfirmOverwriteOpen(false);
          handleSaveMatches();
        }}
        isPrimaryLoading={isSaving}
        primaryColorScheme="red"
        secondaryActionText={t('panels.rounds.cancel')}
        zIndex={1500}
      >
        <Text fontSize="sm" color="gray.600">
          {t('panels.rounds.confirmOverwriteMessage')}
        </Text>
      </VModal>
    </>
  );
}
