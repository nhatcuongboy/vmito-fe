'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Flex, Heading, Text, Badge, SimpleGrid } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useTranslations, useLocale } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import {
  ListChecks,
  Zap,
  RefreshCw,
  Trash2,
  MapPin,
  GripVertical,
  Plus,
  CornerUpLeft,
  X,
  Clock,
} from 'lucide-react';
import {
  Tournament,
  Category,
  ICourtAvailability,
  IQueuedMatch,
  TournamentCourtStatus,
  MatchStatus,
} from '@/lib/api/types';
import { ScheduleQueueService } from '@/lib/api/schedule-generator.service';
import { toaster } from '@/components/ui/toaster';
import { useTournamentSocket } from '@/hooks/useTournamentSocket';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';

interface NextAvailableCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  categories: Category[];
}

const COURT_STATUS_COLOR: Record<TournamentCourtStatus, string> = {
  [TournamentCourtStatus.AVAILABLE]: 'green',
  [TournamentCourtStatus.OCCUPIED]: 'orange',
  [TournamentCourtStatus.MAINTENANCE]: 'gray',
};

export default function NextAvailableCourtModal({
  isOpen,
  onClose,
  tournament,
  categories,
}: NextAvailableCourtModalProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.liveQueue'
  );
  const locale = useLocale();

  const [courts, setCourts] = useState<ICourtAvailability[]>([]);
  const [queue, setQueue] = useState<IQueuedMatch[]>([]);
  const [addable, setAddable] = useState<IQueuedMatch[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  const categoryName = useCallback(
    (categoryId: string) =>
      categories.find((c) => c.id === categoryId)?.name ?? categoryId,
    [categories]
  );

  const matchTitle = useCallback(
    (m: { participants: { name: string }[]; matchNumber: number }) =>
      m.participants.map((p) => p.name).join(' vs ') ||
      t('matchLabel', { number: m.matchNumber }),
    [t]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [courtsData, queueData] = await Promise.all([
        ScheduleQueueService.getAvailableCourts(tournament.id),
        ScheduleQueueService.getQueue(tournament.id),
      ]);
      setCourts(courtsData);
      setQueue(queueData);
    } catch {
      toaster.error({ title: t('loadFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [tournament.id, t]);

  useEffect(() => {
    if (isOpen) {
      load();
    } else {
      setShowAdd(false);
    }
  }, [isOpen, load]);

  // Live updates: refetch queue + courts whenever the schedule changes or a
  // match ends (which frees a court / triggers auto-assign). Only subscribe
  // while the modal is open.
  useTournamentSocket(isOpen ? tournament.id : undefined, {
    onScheduleUpdated: () => load(),
    onMatchEnded: () => load(),
  });

  const runAction = useCallback(
    async (action: () => Promise<void>) => {
      setIsBusy(true);
      try {
        await action();
        await load();
      } catch {
        toaster.error({ title: t('actionFailed') });
      } finally {
        setIsBusy(false);
      }
    },
    [load, t]
  );

  const handleInitialize = () =>
    runAction(async () => {
      const res = await ScheduleQueueService.initializeQueue(tournament.id);
      toaster.success({
        title: t('initializeSuccess', { count: res.queuedCount }),
      });
    });

  const handleAssignNext = () =>
    runAction(async () => {
      const res = await ScheduleQueueService.autoAssignNext(tournament.id);
      if (res.success) {
        toaster.success({ title: t('assignedSuccess') });
      } else {
        toaster.info({ title: res.error || t('assignNothing') });
      }
    });

  const handleRemove = (matchId: string) =>
    runAction(() =>
      ScheduleQueueService.removeFromQueue(tournament.id, matchId).then(
        () => undefined
      )
    );

  const handleUnassign = (matchId: string) =>
    runAction(async () => {
      await ScheduleQueueService.unassignMatch(tournament.id, matchId);
      toaster.success({ title: t('returnedSuccess') });
    });

  // ----- Add-match picker -----
  const loadAddable = useCallback(async () => {
    try {
      const data = await ScheduleQueueService.getAddableMatches(tournament.id);
      setAddable(data);
    } catch {
      toaster.error({ title: t('loadFailed') });
    }
  }, [tournament.id, t]);

  const handleToggleAdd = async () => {
    const next = !showAdd;
    setShowAdd(next);
    if (next) await loadAddable();
  };

  const handleAddMatch = (matchId: string) =>
    runAction(async () => {
      await ScheduleQueueService.addToQueue(tournament.id, matchId);
      setAddable((prev) => prev.filter((m) => m.matchId !== matchId));
      toaster.success({ title: t('addedSuccess') });
    });

  // ----- Drag-and-drop reorder -----
  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (dropIndex: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === dropIndex) return;
    const reordered = [...queue];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(dropIndex, 0, moved);
    setQueue(reordered);
    runAction(() =>
      ScheduleQueueService.reorderQueue(
        tournament.id,
        reordered.map((m) => m.matchId)
      ).then(() => undefined)
    );
  };

  const availableCount = courts.filter(
    (c) => c.status === TournamentCourtStatus.AVAILABLE
  ).length;

  const formatTime = (iso: string) => formatTimeByDevicePreference(iso);

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      hideSecondaryAction
      maxBodyHeight="calc(100vh - 200px)"
      title={t('title')}
    >
      <VStack gap={4} align="stretch">
        {/* Toolbar */}
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={2}
          pb={3}
          borderBottomWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700' }}
        >
          <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
            {t('subtitle')}
          </Text>
          <Flex gap={2} wrap="wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleInitialize}
              disabled={isBusy || isLoading}
            >
              <ListChecks size={14} />
              {t('initialize')}
            </Button>
            <Button
              size="sm"
              bg="gray.800"
              color="white"
              onClick={handleAssignNext}
              disabled={
                isBusy ||
                isLoading ||
                availableCount === 0 ||
                queue.length === 0
              }
            >
              <Zap size={14} />
              {t('assignNext')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={load}
              disabled={isBusy || isLoading}
            >
              <RefreshCw size={14} />
              {t('refresh')}
            </Button>
          </Flex>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {/* Courts */}
          <Box>
            <Heading size="sm" mb={2}>
              {t('courts')} ({courts.length})
            </Heading>
            {courts.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                {t('noCourts')}
              </Text>
            ) : (
              <VStack gap={2} align="stretch">
                {courts.map((court) => {
                  const cm = court.currentMatch;
                  const canReturn = cm?.status === MatchStatus.SCHEDULED;
                  return (
                    <Box
                      key={court.courtId}
                      p={3}
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      bg="white"
                      _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                    >
                      <Flex align="center" gap={3}>
                        <MapPin size={16} />
                        <Text fontSize="sm" fontWeight="medium" flex={1}>
                          {court.courtName || `#${court.courtNumber}`}
                        </Text>
                        {court.estimatedAvailableAt &&
                          court.status === TournamentCourtStatus.OCCUPIED && (
                            <Flex
                              align="center"
                              gap={1}
                              color="gray.500"
                              _dark={{ color: 'gray.400' }}
                            >
                              <Clock size={12} />
                              <Text fontSize="xs">
                                {t('availableAt', {
                                  time: formatTime(court.estimatedAvailableAt),
                                })}
                              </Text>
                            </Flex>
                          )}
                        <Badge colorPalette={COURT_STATUS_COLOR[court.status]}>
                          {t(`status.${court.status}`)}
                        </Badge>
                      </Flex>
                      {cm && (
                        <Flex
                          mt={2}
                          pl={7}
                          gap={2}
                          align="center"
                          borderLeftWidth="2px"
                          borderColor="orange.200"
                          _dark={{ borderColor: 'orange.700' }}
                        >
                          <Box flex={1} minW={0}>
                            <Text fontSize="sm">{matchTitle(cm)}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {categoryName(cm.categoryId)} • {cm.round}
                            </Text>
                          </Box>
                          {canReturn && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleUnassign(cm.matchId)}
                              disabled={isBusy}
                              title={t('returnToQueue')}
                            >
                              <CornerUpLeft size={14} />
                            </Button>
                          )}
                        </Flex>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>

          {/* Queue */}
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Heading size="sm">
                {t('queue')} ({queue.length})
              </Heading>
              <Button
                size="xs"
                variant="outline"
                onClick={handleToggleAdd}
                disabled={isBusy || isLoading}
              >
                {showAdd ? <X size={12} /> : <Plus size={12} />}
                {t('addMatch')}
              </Button>
            </Flex>

            {/* Add-match picker */}
            {showAdd && (
              <Box
                mb={3}
                p={2}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="gray.50"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              >
                {addable.length === 0 ? (
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    textAlign="center"
                    py={2}
                  >
                    {t('noAddable')}
                  </Text>
                ) : (
                  <VStack gap={1} align="stretch" maxH="220px" overflowY="auto">
                    {addable.map((match) => (
                      <Flex
                        key={match.matchId}
                        align="center"
                        gap={2}
                        p={2}
                        borderRadius="md"
                        bg="white"
                        _dark={{ bg: 'gray.900' }}
                      >
                        <Box flex={1} minW={0}>
                          <Text fontSize="sm">{matchTitle(match)}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {categoryName(match.categoryId)} • {match.round}
                          </Text>
                        </Box>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleAddMatch(match.matchId)}
                          disabled={isBusy}
                        >
                          <Plus size={14} />
                        </Button>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </Box>
            )}

            {queue.length === 0 ? (
              <Box
                p={4}
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="gray.300"
                borderRadius="lg"
                textAlign="center"
                _dark={{ borderColor: 'gray.600' }}
              >
                <Text fontSize="sm" color="gray.500" mb={1}>
                  {t('emptyQueue')}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {t('emptyQueueHint')}
                </Text>
              </Box>
            ) : (
              <VStack gap={2} align="stretch">
                {queue.map((match, index) => (
                  <Flex
                    key={match.matchId}
                    align="center"
                    gap={2}
                    p={3}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    bg="white"
                    cursor="grab"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                  >
                    <GripVertical size={14} color="#A0AEC0" />
                    <Badge colorPalette="gray" flexShrink={0}>
                      {index + 1}
                    </Badge>
                    <Box flex={1} minW={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {matchTitle(match)}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {categoryName(match.categoryId)} • {match.round}
                      </Text>
                    </Box>
                    <Button
                      variant="ghost"
                      size="xs"
                      flexShrink={0}
                      onClick={() => handleRemove(match.matchId)}
                      disabled={isBusy}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        </SimpleGrid>
      </VStack>
    </VModal>
  );
}
