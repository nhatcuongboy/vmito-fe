'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Portal,
  MenuRoot,
  MenuTrigger,
  MenuPositioner,
  MenuContent,
  MenuItem,
} from '@chakra-ui/react';
import {
  motion,
  useDragControls,
  useMotionValue,
  type PanInfo,
} from 'framer-motion';
import { Button, IconButton, HStack } from '@/components/ui/chakra-compat';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MoreVertical,
  Flag,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { Tournament, TournamentStatus } from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { VModal, useModal } from '@/components/ui/VModal';
import {
  SETUP_STEP_IDS,
  SETUP_STEP_MANAGE_OPTION,
  useTournamentSetupSteps,
} from './useTournamentSetupSteps';
import { useTournamentProgress } from './useTournamentProgress';
import { buildRunSteps, GuideCategoryRow, RunStepId } from './guideModel';
import { subscribeTournamentGuideToggle } from '@/lib/tournamentGuideEvents';
import { useTournamentGuideVisibilityStore } from '@/stores/useTournamentGuideVisibilityStore';

interface Props {
  tournament: Tournament;
  onTournamentUpdate: (tournament: Tournament) => void;
}

const storageKey = (slug: string, suffix: string) =>
  `vmito.tournament.${slug}.${suffix}`;

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
const CORNER_STORAGE_KEY = 'vmito.tournamentGuide.corner';
const CORNER_OFFSET = '24px';
const CORNER_STYLE: Record<Corner, React.CSSProperties> = {
  'top-left': { top: CORNER_OFFSET, left: CORNER_OFFSET },
  'top-right': { top: CORNER_OFFSET, right: CORNER_OFFSET },
  'bottom-left': { bottom: CORNER_OFFSET, left: CORNER_OFFSET },
  'bottom-right': { bottom: CORNER_OFFSET, right: CORNER_OFFSET },
};
const isCorner = (value: string | null): value is Corner =>
  value === 'top-left' ||
  value === 'top-right' ||
  value === 'bottom-left' ||
  value === 'bottom-right';

function StepCircle({ done, label }: { done: boolean; label: string }) {
  return (
    <Flex
      w="26px"
      h="26px"
      borderRadius="full"
      bg={done ? 'green.500' : 'gray.100'}
      color={done ? 'white' : 'gray.600'}
      align="center"
      justify="center"
      fontSize="xs"
      fontWeight="semibold"
      flexShrink={0}
      _dark={{
        bg: done ? 'green.500' : 'gray.700',
        color: done ? 'white' : 'gray.300',
      }}
    >
      {done ? <Check size={14} strokeWidth={3} /> : label}
    </Flex>
  );
}

export default function TournamentGuideWidget({
  tournament,
  onTournamentUpdate,
}: Props) {
  const t = useTranslations('pages.tournaments.detail.dashboard');
  const tStatus = useTranslations(
    'pages.tournaments.detail.manage.statusBanner'
  );
  const router = useRouter();
  const slug = tournament.slug;

  // SSR-safe persisted UI state; null = not hydrated yet (render nothing)
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  // Screen corner is a device preference, not per-tournament, so it's stored
  // under a global (non-slug-scoped) localStorage key.
  const [corner, setCorner] = useState<Corner>('bottom-right');
  useEffect(() => {
    setDismissed(
      window.localStorage.getItem(storageKey(slug, 'guideDismissed')) === 'true'
    );
    setCollapsed(
      window.localStorage.getItem(storageKey(slug, 'guideCollapsed')) === 'true'
    );
    const storedCorner = window.localStorage.getItem(CORNER_STORAGE_KEY);
    if (isCorner(storedCorner)) setCorner(storedCorner);
  }, [slug]);

  // Reopen from the slide-out menu's toggle icon even if previously dismissed.
  useEffect(
    () =>
      subscribeTournamentGuideToggle(() => {
        window.localStorage.removeItem(storageKey(slug, 'guideDismissed'));
        setDismissed(false);
        setCollapsed((cur) => {
          if (!cur) return cur;
          window.localStorage.setItem(
            storageKey(slug, 'guideCollapsed'),
            'false'
          );
          return false;
        });
      }),
    [slug]
  );

  const isCancelled = tournament.status === TournamentStatus.CANCELLED;

  // Let the slide-out menu know the widget is on screen so it can hide its
  // own duplicate "reopen guide" entry point in that case.
  const setGuideVisible = useTournamentGuideVisibilityStore(
    (state) => state.setVisible
  );
  useEffect(() => {
    const isVisible = dismissed === false && !isCancelled;
    setGuideVisible(isVisible);
    return () => setGuideVisible(false);
  }, [dismissed, isCancelled, setGuideVisible]);

  const dragControls = useDragControls();
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const isRight = info.point.x > window.innerWidth / 2;
    const isBottom = info.point.y > window.innerHeight / 2;
    const next: Corner = isBottom
      ? isRight
        ? 'bottom-right'
        : 'bottom-left'
      : isRight
        ? 'top-right'
        : 'top-left';
    setCorner(next);
    window.localStorage.setItem(CORNER_STORAGE_KEY, next);
    dragX.set(0);
    dragY.set(0);
  };

  const handleDismiss = () => {
    window.localStorage.setItem(storageKey(slug, 'guideDismissed'), 'true');
    setDismissed(true);
  };
  const toggleCollapsed = () => {
    setCollapsed((cur) => {
      const next = !cur;
      window.localStorage.setItem(
        storageKey(slug, 'guideCollapsed'),
        String(next)
      );
      return next;
    });
  };

  const { completionMap, completedCount, totalCount, isSetupComplete } =
    useTournamentSetupSteps(tournament);

  const progressEnabled =
    isSetupComplete && dismissed === false && !isCancelled;
  const { progress } = useTournamentProgress(tournament.id, progressEnabled);

  const runSteps = useMemo(() => {
    if (!progress) return null;
    // The finish step also reflects the tournament prop so the widget's own
    // Finish action (and the manage banner) update it instantly.
    return buildRunSteps(progress).map((step) =>
      step.id === 'finish'
        ? {
            ...step,
            done: step.done || tournament.status === TournamentStatus.FINISHED,
          }
        : step
    );
  }, [progress, tournament.status]);

  const phase: 'setup' | 'run' = isSetupComplete ? 'run' : 'setup';

  // One step expanded at a time; default to the first incomplete step of the
  // current phase.
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  useEffect(() => {
    if (phase === 'setup') {
      setExpandedStep(SETUP_STEP_IDS.find((id) => !completionMap[id]) ?? null);
    }
    // Run phase default is set when steps arrive (effect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const firstIncompleteRunStep = runSteps?.find((s) => !s.done)?.id ?? null;
  const [runDefaultApplied, setRunDefaultApplied] = useState(false);
  useEffect(() => {
    if (phase === 'run' && runSteps && !runDefaultApplied) {
      setExpandedStep(firstIncompleteRunStep);
      setRunDefaultApplied(true);
    }
  }, [phase, runSteps, runDefaultApplied, firstIncompleteRunStep]);

  const toggleStep = (id: string) =>
    setExpandedStep((cur) => (cur === id ? null : id));

  // Finish confirm modal
  const finishModal = useModal();
  const [isFinishing, setIsFinishing] = useState(false);
  const handleFinish = async () => {
    try {
      setIsFinishing(true);
      const updated = await TournamentService.updateTournamentStatus(
        tournament.id,
        TournamentStatus.FINISHED
      );
      onTournamentUpdate(updated);
      finishModal.onClose();
    } catch (error) {
      console.error('Error finishing tournament:', error);
    } finally {
      setIsFinishing(false);
    }
  };

  if (dismissed !== false || isCancelled) return null;

  // Header title + phase-scoped progress
  const doneRunSteps = runSteps?.filter((s) => s.done).length ?? 0;
  const totalRunSteps = runSteps?.length ?? 0;
  const allRunDone = totalRunSteps > 0 && doneRunSteps === totalRunSteps;
  const headerTitle =
    phase === 'setup'
      ? t('guide.headerSetup')
      : allRunDone
        ? t('guide.headerFinished')
        : firstIncompleteRunStep
          ? t(`guide.steps.${firstIncompleteRunStep}.title`)
          : t('guide.headerFinished');
  const progressCompleted = phase === 'setup' ? completedCount : doneRunSteps;
  const progressTotal = phase === 'setup' ? totalCount : totalRunSteps;
  const progressPercent =
    progressTotal > 0 ? (progressCompleted / progressTotal) * 100 : 0;

  const goToManage = (query: string) =>
    router.push(`/tournament/${slug}/manage${query}`);

  const renderCategoryRows = (stepId: RunStepId, rows: GuideCategoryRow[]) => (
    <Flex direction="column" gap={2} mt={2}>
      {rows.map((row) => (
        <Flex
          key={row.categoryId}
          align="center"
          gap={2.5}
          px={3}
          py={2}
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="full"
          cursor="pointer"
          _hover={{ bg: 'gray.50' }}
          _dark={{
            bg: 'gray.800',
            borderColor: 'gray.700',
            _hover: { bg: 'gray.700' },
          }}
          onClick={() =>
            goToManage(
              stepId === 'poolPlay'
                ? `?option=results&categories=${row.categoryId}&rounds=GROUP`
                : `?option=rounds&categoryId=${row.categoryId}`
            )
          }
        >
          {row.done ? (
            <Flex
              w="22px"
              h="22px"
              borderRadius="full"
              bg="green.500"
              color="white"
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Check size={13} strokeWidth={3} />
            </Flex>
          ) : (
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              flexShrink={0}
              _dark={{ color: 'gray.400' }}
            >
              {t('guide.categoryMatches', {
                finished: row.finished,
                total: row.total,
              })}
            </Text>
          )}
          <Text fontSize="sm" fontWeight="medium" flex="1" lineClamp={1}>
            {row.label}
          </Text>
          <ChevronRight size={16} color="var(--chakra-colors-gray-400)" />
        </Flex>
      ))}
    </Flex>
  );

  const renderStepRow = (options: {
    id: string;
    index: number;
    done: boolean;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
    rows?: React.ReactNode;
  }) => {
    const isExpanded = expandedStep === options.id;
    return (
      <Box key={options.id}>
        <Flex
          align="center"
          gap={3}
          px={4}
          py={2.5}
          cursor="pointer"
          onClick={() => toggleStep(options.id)}
          _hover={{ bg: options.done ? 'green.50' : 'gray.50' }}
          _dark={{
            _hover: {
              bg: options.done ? 'rgba(34, 197, 94, 0.14)' : 'gray.700',
            },
          }}
        >
          <StepCircle done={options.done} label={String(options.index + 1)} />
          <Text
            fontWeight="semibold"
            fontSize="sm"
            flex="1"
            color={options.done ? 'green.700' : 'gray.800'}
            _dark={{ color: options.done ? 'green.100' : 'gray.100' }}
          >
            {options.title}
          </Text>
          {isExpanded ? (
            <ChevronUp size={16} color="var(--chakra-colors-gray-400)" />
          ) : (
            <ChevronDown size={16} color="var(--chakra-colors-gray-400)" />
          )}
        </Flex>
        {isExpanded && (
          <Box px={4} pb={3} pl="55px">
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {options.description}
            </Text>
            {options.rows}
            {options.action && (
              <Button
                size="sm"
                mt={2}
                variant="solid"
                colorPalette="green"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  options.action!.onClick();
                }}
              >
                {options.action.label}
              </Button>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      <Box display={{ base: 'none', md: 'block' }}>
        <motion.div
          drag
          dragListener={false}
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          style={{
            position: 'fixed',
            zIndex: 1200,
            width: 360,
            x: dragX,
            y: dragY,
            ...CORNER_STYLE[corner],
          }}
        >
          <Box
            borderRadius="2xl"
            overflow="hidden"
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="0 12px 40px rgba(0, 0, 0, 0.18)"
            bg="white"
            _dark={{
              bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
              borderColor:
                'var(--tournament-border, var(--chakra-colors-gray-700))',
            }}
          >
            {/* Green header (matches the dashboard setup banner); also the drag handle */}
            <Box
              bg="green.600"
              px={4}
              pt={3}
              pb={3}
              cursor="grab"
              _dark={{ bg: 'green.700' }}
              onPointerDown={(e: React.PointerEvent) => dragControls.start(e)}
            >
              <Flex align="center" gap={2}>
                <Text
                  color="white"
                  fontWeight="bold"
                  fontSize="md"
                  flex="1"
                  lineClamp={1}
                >
                  {headerTitle}
                </Text>
                <MenuRoot positioning={{ placement: 'top-end' }}>
                  <MenuTrigger asChild>
                    <IconButton
                      aria-label={t('guide.moreActions')}
                      variant="ghost"
                      size="xs"
                      color="white"
                      _hover={{ bg: 'whiteAlpha.300' }}
                      onPointerDown={(e: React.PointerEvent) =>
                        e.stopPropagation()
                      }
                    >
                      <MoreVertical size={16} />
                    </IconButton>
                  </MenuTrigger>
                  <Portal>
                    <MenuPositioner zIndex={2000}>
                      <MenuContent
                        minW="180px"
                        zIndex={2001}
                        bg="white"
                        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                        boxShadow="lg"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        p={1}
                      >
                        <MenuItem value="dismiss" onClick={handleDismiss}>
                          <HStack gap={2}>
                            <X size={16} />
                            <Text>{t('guide.menu.dismiss')}</Text>
                          </HStack>
                        </MenuItem>
                      </MenuContent>
                    </MenuPositioner>
                  </Portal>
                </MenuRoot>
                <IconButton
                  aria-label={
                    collapsed ? t('guide.expand') : t('guide.collapse')
                  }
                  variant="ghost"
                  size="xs"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.300' }}
                  onClick={toggleCollapsed}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                >
                  {collapsed ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </IconButton>
              </Flex>
              <Box
                mt={2}
                h="5px"
                borderRadius="full"
                bg="whiteAlpha.300"
                overflow="hidden"
              >
                <Box
                  h="full"
                  w={`${progressPercent}%`}
                  bg="white"
                  borderRadius="full"
                  transition="width 0.3s"
                />
              </Box>
            </Box>

            {/* Body */}
            {!collapsed && (
              <>
                <Text
                  px={4}
                  pt={2.5}
                  pb={1.5}
                  fontSize="sm"
                  bg="green.50"
                  color="gray.700"
                  _dark={{ bg: 'rgba(34, 197, 94, 0.14)', color: 'green.100' }}
                >
                  {t('guide.progress', {
                    completed: progressCompleted,
                    total: progressTotal,
                  })}
                </Text>
                <Box maxH="50vh" overflowY="auto" pt={1} pb={2}>
                  {phase === 'setup'
                    ? SETUP_STEP_IDS.map((id, index) =>
                        renderStepRow({
                          id,
                          index,
                          done: completionMap[id],
                          title: t(`steps.${id}.title`),
                          description: t(`steps.${id}.description`),
                          action: {
                            label: t(`steps.${id}.action`),
                            onClick: () => {
                              const option = SETUP_STEP_MANAGE_OPTION[id];
                              goToManage(option ? `?option=${option}` : '');
                            },
                          },
                        })
                      )
                    : (runSteps ?? []).map((step, index) =>
                        renderStepRow({
                          id: step.id,
                          index,
                          done: step.done,
                          title: t(`guide.steps.${step.id}.title`),
                          description: t(`guide.steps.${step.id}.description`),
                          rows: step.rows
                            ? renderCategoryRows(step.id, step.rows)
                            : undefined,
                          action:
                            step.id === 'startPlayoffs'
                              ? {
                                  label: t('guide.steps.startPlayoffs.action'),
                                  onClick: () => {
                                    const target = progress?.categories.find(
                                      (c) =>
                                        c.hasEliminationStage &&
                                        !c.elimGenerated
                                    );
                                    goToManage(
                                      `?option=rounds${
                                        target
                                          ? `&categoryId=${target.categoryId}`
                                          : ''
                                      }`
                                    );
                                  },
                                }
                              : step.id === 'finish' && !step.done
                                ? {
                                    label: t('guide.steps.finish.action'),
                                    onClick: finishModal.onOpen,
                                  }
                                : undefined,
                        })
                      )}
                </Box>
              </>
            )}
          </Box>
        </motion.div>
      </Box>

      {/* Finish tournament confirm (mirrors TournamentStatusBanner) */}
      <VModal
        isOpen={finishModal.isOpen}
        onClose={finishModal.onClose}
        isCentered
        size="sm"
        primaryActionText={tStatus('confirm.finish.button')}
        onPrimaryAction={handleFinish}
        isPrimaryLoading={isFinishing}
        secondaryActionText={tStatus('cancelButton')}
        showCloseButton={false}
      >
        <Flex direction="column" align="center" gap={4} py={2}>
          <Flex
            w="56px"
            h="56px"
            bg="green.100"
            borderRadius="xl"
            align="center"
            justify="center"
            _dark={{ bg: 'green.900' }}
          >
            <Flag size={28} color="var(--chakra-colors-green-600)" />
          </Flex>
          <Box textAlign="center">
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              {tStatus('confirm.finish.title')}
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {tStatus('confirm.finish.description')}
            </Text>
          </Box>
        </Flex>
      </VModal>
    </>
  );
}
