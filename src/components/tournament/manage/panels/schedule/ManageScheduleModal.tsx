'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flex, Text, Spinner } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { VModal, useModal } from '@/components/ui/VModal';
import { List, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import {
  Tournament,
  Category,
  CategoryMatch,
  TournamentCourt,
  IBulkScheduleItem,
} from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import { toaster } from '@/components/ui/toaster';
import ScheduleCalendarView from './ScheduleCalendarView';
import ScheduleListView from './ScheduleListView';
import EditMatchTimeSheet from './EditMatchTimeSheet';
import GenerateScheduleDrawer from './GenerateScheduleDrawer';
import GenerationResultModal from './GenerationResultModal';
import { IGenerateScheduleResult } from '@/utils/schedule-generator';

type ViewMode = 'list' | 'calendar';

interface ManageScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  categories: Category[];
  onScheduleSaved?: () => void;
}

export default function ManageScheduleModal({
  isOpen,
  onClose,
  tournament,
  categories,
  onScheduleSaved,
}: ManageScheduleModalProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.manager'
  );

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [allMatches, setAllMatches] = useState<CategoryMatch[]>([]);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyMatches, setDirtyMatches] = useState<
    Map<string, IBulkScheduleItem>
  >(new Map());
  const [defaultMatchLength] = useState(60);
  const [manualEntry, setManualEntry] = useState(false);

  const generateDrawerModal = useModal();
  const resultModal = useModal();
  const [generationResult, setGenerationResult] =
    useState<IGenerateScheduleResult | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    if (!isOpen) {
      setManualEntry(false);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [matchesData, courtsData] = await Promise.all([
          TournamentService.getAllMatches(tournament.id),
          TournamentService.getCourts(tournament.id),
        ]);
        setAllMatches(matchesData);
        setCourts(courtsData);
      } catch (error) {
        console.error('Error loading schedule data:', error);
        toaster.error({ title: 'Failed to load schedule data' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen, tournament.id]);

  const hasScheduledMatches = allMatches.some((m) => m.startTime && m.courtId);

  const handleMatchMove = useCallback(
    (
      matchId: string,
      courtId: string | null,
      startTime: string | null,
      endTime: string | null
    ) => {
      // Update local state
      setAllMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                courtId: courtId || undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
              }
            : m
        )
      );

      // Track dirty match
      setDirtyMatches((prev) => {
        const next = new Map(prev);
        next.set(matchId, { matchId, courtId, startTime, endTime });
        return next;
      });
    },
    []
  );

  const handleGenerated = useCallback(
    (result: IGenerateScheduleResult) => {
      setGenerationResult(result);
      generateDrawerModal.onClose();
      resultModal.onOpen();
    },
    [generateDrawerModal, resultModal]
  );

  const handleViewSchedule = useCallback(() => {
    if (!generationResult) return;

    // Apply generated schedule to local match state
    const schedMap = new Map(
      generationResult.scheduled.map((s) => [s.matchId, s])
    );

    setAllMatches((prev) =>
      prev.map((m) => {
        const sched = schedMap.get(m.id);
        if (sched) {
          return {
            ...m,
            courtId: sched.courtId,
            startTime: new Date(sched.startTime),
            endTime: new Date(sched.endTime),
          };
        }
        return m;
      })
    );

    // Mark all as dirty
    const newDirty = new Map(dirtyMatches);
    for (const sched of generationResult.scheduled) {
      newDirty.set(sched.matchId, {
        matchId: sched.matchId,
        courtId: sched.courtId,
        startTime: sched.startTime,
        endTime: sched.endTime,
      });
    }
    setDirtyMatches(newDirty);

    resultModal.onClose();
    setViewMode('calendar');
  }, [generationResult, dirtyMatches, resultModal]);

  const handleSave = async () => {
    if (dirtyMatches.size === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const updates = Array.from(dirtyMatches.values());
      await CategoryService.bulkUpdateSchedule(updates);
      setDirtyMatches(new Map());
      onScheduleSaved?.();
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toaster.error({ title: 'Failed to save schedule' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDirtyMatches(new Map());
    onClose();
  };

  return (
    <>
      <VModal
        isOpen={isOpen}
        onClose={handleCancel}
        size="full"
        showCloseButton={false}
        hideSecondaryAction
        maxBodyHeight="calc(100vh - 140px)"
      >
        {/* Custom header */}
        <Flex
          justify="space-between"
          align="center"
          pb={3}
          borderBottomWidth="1px"
          borderColor="gray.200"
          mb={3}
        >
          <Flex gap={2}>
            <Button
              variant={viewMode === 'list' ? 'solid' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List size={14} />
              {t('listView')}
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'solid' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarIcon size={14} />
              {t('calendarView')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={generateDrawerModal.onOpen}
            >
              <Sparkles size={14} />
              {t('generate')}
            </Button>
          </Flex>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            {t('close')}
          </Button>
        </Flex>

        {/* Content */}
        {isLoading ? (
          <Flex justify="center" align="center" minH="400px">
            <Spinner />
          </Flex>
        ) : !hasScheduledMatches && dirtyMatches.size === 0 && !manualEntry ? (
          /* Empty state */
          <Flex
            direction="column"
            align="center"
            justify="center"
            minH="400px"
            gap={4}
          >
            <Text fontSize="4xl">📅</Text>
            <Text color="gray.500" textAlign="center" maxW="300px">
              {t('emptyTitle')}
            </Text>
            <Button
              bg="gray.800"
              color="white"
              onClick={generateDrawerModal.onOpen}
            >
              <Sparkles size={16} />
              {t('generateSchedule')}
            </Button>
            <Text fontSize="sm" color="gray.400">
              OR
            </Text>
            <Button
              variant="outline"
              onClick={() => {
                setManualEntry(true);
                setViewMode('list');
              }}
            >
              {t('enterManually')}
            </Button>
          </Flex>
        ) : viewMode === 'list' ? (
          <ScheduleListView
            matches={allMatches}
            categories={categories}
            courts={courts}
            onEditMatch={(matchId) => {
              setViewMode('list');
              setEditingMatch(matchId);
            }}
          />
        ) : (
          <ScheduleCalendarView
            matches={allMatches}
            categories={categories}
            courts={courts}
            defaultMatchLength={defaultMatchLength}
            onMatchMove={handleMatchMove}
          />
        )}

        {/* Footer */}
        <Flex
          justify="space-between"
          pt={3}
          mt={3}
          borderTopWidth="1px"
          borderColor="gray.200"
        >
          <Button variant="ghost" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button
            bg="gray.800"
            color="white"
            onClick={handleSave}
            disabled={dirtyMatches.size === 0}
            loading={isSaving}
          >
            {t('save')}
          </Button>
        </Flex>
      </VModal>

      {/* Generate Schedule Drawer */}
      <GenerateScheduleDrawer
        isOpen={generateDrawerModal.isOpen}
        onClose={generateDrawerModal.onClose}
        categories={categories}
        allMatches={allMatches}
        courts={courts}
        venueName={tournament.venue?.name}
        onGenerated={handleGenerated}
      />

      {/* Generation Result Modal */}
      {generationResult && (
        <GenerationResultModal
          isOpen={resultModal.isOpen}
          onClose={resultModal.onClose}
          result={generationResult}
          onViewSchedule={handleViewSchedule}
        />
      )}

      {/* Edit Match Time Sheet */}
      <EditMatchTimeSheet
        isOpen={editingMatch !== null}
        onClose={() => setEditingMatch(null)}
        match={allMatches.find((m) => m.id === editingMatch) ?? null}
        courts={courts}
        onUpdate={(matchId, courtId, startTime, endTime) => {
          handleMatchMove(matchId, courtId, startTime, endTime);
          setEditingMatch(null);
        }}
      />
    </>
  );
}
