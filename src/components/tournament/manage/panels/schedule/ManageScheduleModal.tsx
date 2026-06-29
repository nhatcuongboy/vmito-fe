'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { VModal, useModal } from '@/components/ui/VModal';
import {
  List,
  Calendar as CalendarIcon,
  Sparkles,
  Wand2,
  Plus,
} from 'lucide-react';
import {
  Tournament,
  Category,
  CategoryMatch,
  TournamentCourt,
  TournamentUmpire,
  IBulkScheduleItem,
  IGenerateScheduleResponse,
} from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import { ScheduleGeneratorService } from '@/lib/api/schedule-generator.service';
import { toaster } from '@/components/ui/toaster';
import ScheduleCalendarView from './ScheduleCalendarView';
import ScheduleListView from './ScheduleListView';
import EditMatchTimeSheet from './EditMatchTimeSheet';
import GenerateScheduleDrawerV2 from './GenerateScheduleDrawerV2';
import GenerationResultModal from './GenerationResultModal';
import SchedulePreviewDrawer from './SchedulePreviewDrawer';
import AIImportScheduleDrawer from './AIImportScheduleDrawer';
import AddMatchSheet from './AddMatchSheet';
import DeleteMatchConfirmModal from './DeleteMatchConfirmModal';
import { IGenerateScheduleResult } from '@/utils/schedule-generator';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

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
  const [umpires, setUmpires] = useState<TournamentUmpire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyMatches, setDirtyMatches] = useState<
    Map<string, IBulkScheduleItem>
  >(new Map());
  const [defaultMatchLength] = useState(60);
  const [manualEntry, setManualEntry] = useState(false);

  const generateDrawerModal = useModal();
  const resultModal = useModal();
  const aiImportModal = useModal();
  const addMatchModal = useModal();
  const [deletingMatch, setDeletingMatch] = useState<CategoryMatch | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [generationResult] = useState<IGenerateScheduleResult | null>(null);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);

  // Backend-generated schedule state
  const [backendGenerationResponse, setBackendGenerationResponse] =
    useState<IGenerateScheduleResponse | null>(null);
  const previewDrawerModal = useModal();

  // Preview mode: schedule generated but not yet saved to DB
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(
    null
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const isPreviewMode = pendingScheduleId !== null;

  // Fetch data on mount
  useEffect(() => {
    if (!isOpen) {
      setManualEntry(false);
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [matchesData, courtsData, umpiresData] = await Promise.all([
          TournamentService.getAllMatches(tournament.id),
          TournamentService.getCourts(tournament.id),
          TournamentService.getUmpires(tournament.id),
        ]);
        setAllMatches(matchesData);
        setCourts(courtsData);
        setUmpires(umpiresData);
      } catch (error) {
        console.error('Error loading schedule data:', error);
        toaster.error({ title: t('loadFailed') });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOpen, t, tournament.id]);

  const hasScheduledMatches = allMatches.some((m) => m.startTime && m.courtId);

  // Only show courts that are associated with a venue (courts the tournament has configured).
  // Falls back to all courts if none have a venue association.
  const venueCourts = (() => {
    const linked = courts.filter((c) => c.tournamentVenueId);
    return linked.length > 0 ? linked : courts;
  })();

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
                estimatedEndTime: endTime ? new Date(endTime) : undefined,
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

  // Handle backend-generated schedule
  const handleBackendGenerated = useCallback(
    (response: IGenerateScheduleResponse) => {
      setBackendGenerationResponse(response);
      generateDrawerModal.onClose();
      previewDrawerModal.onOpen();
    },
    [generateDrawerModal, previewDrawerModal]
  );

  // "View schedule" from summary modal → load preview into main list view
  const handleViewSchedulePreview = useCallback(async () => {
    if (!backendGenerationResponse) return;
    setIsLoadingPreview(true);
    try {
      // Refresh matches (auto-generated matches may be new)
      const matchesData = await TournamentService.getAllMatches(tournament.id);
      // Load preview assignments
      const preview = await ScheduleGeneratorService.getPreview(
        tournament.id,
        backendGenerationResponse.scheduleId
      );
      // Apply preview assignments to local match state
      const assignmentMap = new Map(
        preview.matches.map((pm) => [pm.matchId, pm])
      );
      const updatedMatches = matchesData.map((m) => {
        const assignment = assignmentMap.get(m.id);
        if (assignment) {
          return {
            ...m,
            courtId: assignment.courtId,
            startTime: new Date(assignment.startTime),
            endTime: new Date(assignment.endTime),
            estimatedEndTime: new Date(assignment.endTime),
          };
        }
        return m;
      });
      setAllMatches(updatedMatches);
      setPendingScheduleId(backendGenerationResponse.scheduleId);
      setManualEntry(true); // ensure we show list view, not empty state
      setViewMode('list');
      previewDrawerModal.onClose();
    } catch {
      toaster.error({ title: t('previewLoadFailed') });
    } finally {
      setIsLoadingPreview(false);
    }
  }, [backendGenerationResponse, t, tournament.id, previewDrawerModal]);

  // Save the pending preview schedule to DB
  const handleSavePreview = useCallback(async () => {
    if (!pendingScheduleId) return;
    setIsSavingPreview(true);
    try {
      const result = await ScheduleGeneratorService.saveSchedule(
        tournament.id,
        pendingScheduleId
      );
      if (result.success) {
        toaster.success({
          title: t('saveSuccess', { count: result.scheduledCount }),
        });
        setPendingScheduleId(null);
        setBackendGenerationResponse(null);
        onScheduleSaved?.();
        onClose();
      }
    } catch {
      toaster.error({ title: t('saveFailed') });
    } finally {
      setIsSavingPreview(false);
    }
  }, [pendingScheduleId, t, tournament.id, onScheduleSaved, onClose]);

  const handlePreviewCancel = useCallback(() => {
    setBackendGenerationResponse(null);
    setPendingScheduleId(null);
  }, []);

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
      toaster.error({ title: t('saveFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDirtyMatches(new Map());
    onClose();
  };

  // A manually-created match is already persisted by AddMatchSheet — just
  // surface it in the list view.
  const handleMatchCreated = useCallback(
    (match: CategoryMatch) => {
      setAllMatches((prev) => [...prev, match]);
      setManualEntry(true);
      setViewMode('list');
      onScheduleSaved?.();
    },
    [onScheduleSaved]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingMatch) return;
    const matchId = deletingMatch.id;
    setIsDeleting(true);
    try {
      await CategoryService.deleteMatch(matchId);
      setAllMatches((prev) => prev.filter((m) => m.id !== matchId));
      setDirtyMatches((prev) => {
        if (!prev.has(matchId)) return prev;
        const next = new Map(prev);
        next.delete(matchId);
        return next;
      });
      setDeletingMatch(null);
      onScheduleSaved?.();
    } catch (error) {
      console.error('Error deleting match:', error);
      toaster.error({ title: t('deleteFailed') });
    } finally {
      setIsDeleting(false);
    }
  }, [deletingMatch, onScheduleSaved, t]);

  return (
    <>
      <VModal
        isOpen={isOpen}
        onClose={handleCancel}
        size="full"
        showCloseButton={false}
        hideSecondaryAction
        maxBodyHeight="calc(100vh - 200px)"
        title={t('title')}
      >
        {/* Custom header - Fixed */}
        <Flex
          justify="space-between"
          align="center"
          pb={3}
          borderBottomWidth="1px"
          borderColor="gray.200"
          mb={3}
          position="sticky"
          top={0}
          bg="white"
          zIndex={10}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Flex gap={2} align="center">
            {/* Segmented view-mode toggle */}
            <Flex
              bg="gray.100"
              borderRadius="md"
              p="2px"
              _dark={{ bg: 'gray.700' }}
            >
              <Button
                size="sm"
                variant="ghost"
                borderRadius="md"
                bg={viewMode === 'list' ? 'white' : 'transparent'}
                color={viewMode === 'list' ? 'gray.800' : 'gray.500'}
                boxShadow={viewMode === 'list' ? 'sm' : 'none'}
                _hover={{ bg: viewMode === 'list' ? 'white' : 'gray.200' }}
                _dark={{
                  bg: viewMode === 'list' ? 'gray.600' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'gray.400',
                }}
                onClick={() => setViewMode('list')}
                px={3}
              >
                <List size={14} />
                {t('listView')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                borderRadius="md"
                bg={viewMode === 'calendar' ? 'white' : 'transparent'}
                color={viewMode === 'calendar' ? 'gray.800' : 'gray.500'}
                boxShadow={viewMode === 'calendar' ? 'sm' : 'none'}
                _hover={{ bg: viewMode === 'calendar' ? 'white' : 'gray.200' }}
                _dark={{
                  bg: viewMode === 'calendar' ? 'gray.600' : 'transparent',
                  color: viewMode === 'calendar' ? 'white' : 'gray.400',
                }}
                onClick={() => setViewMode('calendar')}
                px={3}
              >
                <CalendarIcon size={14} />
                {t('calendarView')}
              </Button>
            </Flex>
            <Button
              size="sm"
              bg="purple.500"
              color="white"
              _hover={{ bg: 'purple.600' }}
              _dark={{ bg: 'purple.600', _hover: { bg: 'purple.700' } }}
              onClick={generateDrawerModal.onOpen}
            >
              <Sparkles size={14} />
              {t('generate')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorPalette="purple"
              onClick={aiImportModal.onOpen}
            >
              <Wand2 size={14} />
              {t('aiImport.button')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              colorPalette="green"
              onClick={addMatchModal.onOpen}
            >
              <Plus size={14} />
              {t('addMatch')}
            </Button>
          </Flex>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            {t('close')}
          </Button>
        </Flex>

        {/* Content */}
        {isLoading ? (
          <TournamentMatchListSkeleton count={5} />
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
            <Text
              color="gray.500"
              textAlign="center"
              maxW="300px"
              _dark={{ color: 'gray.400' }}
            >
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
            <Text fontSize="sm" color="gray.400" _dark={{ color: 'gray.500' }}>
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
            onDeleteMatch={(matchId) =>
              setDeletingMatch(allMatches.find((m) => m.id === matchId) ?? null)
            }
          />
        ) : (
          <ScheduleCalendarView
            matches={allMatches}
            categories={categories}
            courts={venueCourts}
            defaultMatchLength={defaultMatchLength}
            onMatchMove={handleMatchMove}
          />
        )}

        {/* Footer - Fixed */}
        <Flex
          justify="flex-end"
          align="center"
          gap={3}
          pt={3}
          mt={3}
          borderTopWidth="1px"
          borderColor="gray.200"
          position="sticky"
          bottom={0}
          bg="white"
          zIndex={10}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Button variant="ghost" onClick={handleCancel}>
            {t('cancel')}
          </Button>
          {isPreviewMode ? (
            <Button
              colorPalette="green"
              onClick={handleSavePreview}
              loading={isSavingPreview}
            >
              Save changes
            </Button>
          ) : (
            <Button
              colorPalette="green"
              onClick={handleSave}
              disabled={dirtyMatches.size === 0}
              loading={isSaving}
            >
              {t('save')}
            </Button>
          )}
        </Flex>
      </VModal>

      {/* Generate Schedule Drawer (v2 with backend API) */}
      <GenerateScheduleDrawerV2
        isOpen={generateDrawerModal.isOpen}
        onClose={generateDrawerModal.onClose}
        tournamentId={tournament.id}
        tournamentStartDate={tournament.startDate}
        categories={categories}
        allMatches={allMatches}
        courts={courts}
        venueName={tournament.venue?.name}
        onGenerated={handleBackendGenerated}
      />

      {/* Generation Result Modal (legacy fallback) */}
      {generationResult && (
        <GenerationResultModal
          isOpen={resultModal.isOpen}
          onClose={resultModal.onClose}
          result={generationResult}
          onViewSchedule={handleViewSchedule}
        />
      )}

      {/* Schedule Preview Summary (new backend flow) */}
      {backendGenerationResponse && (
        <SchedulePreviewDrawer
          isOpen={previewDrawerModal.isOpen}
          onClose={previewDrawerModal.onClose}
          generationResponse={backendGenerationResponse}
          onViewSchedule={handleViewSchedulePreview}
          onCancel={handlePreviewCancel}
          isLoadingView={isLoadingPreview}
        />
      )}

      {/* Edit Match Time Sheet */}
      <EditMatchTimeSheet
        isOpen={editingMatch !== null}
        onClose={() => setEditingMatch(null)}
        match={allMatches.find((m) => m.id === editingMatch) ?? null}
        courts={courts}
        tournamentStartDate={tournament.startDate}
        umpires={umpires}
        onUpdate={async (
          matchId,
          courtId,
          startTime,
          endTime,
          matchCode,
          refereeId
        ) => {
          const previous = allMatches.find((m) => m.id === matchId);
          const referee = refereeId
            ? (umpires.find((u) => u.id === refereeId) ?? null)
            : null;
          handleMatchMove(matchId, courtId, startTime, endTime);
          setAllMatches((prev) =>
            prev.map((m) =>
              m.id === matchId
                ? {
                    ...m,
                    matchCode,
                    refereeId: refereeId ?? undefined,
                    referee,
                  }
                : m
            )
          );
          setEditingMatch(null);
          try {
            const tasks: Promise<unknown>[] = [
              CategoryService.updateMatch(
                matchId,
                { matchCode },
                {
                  showToast: false,
                }
              ),
              CategoryService.bulkUpdateSchedule([
                { matchId, courtId, startTime, endTime },
              ]),
            ];
            if (refereeId) {
              tasks.push(
                CategoryService.assignReferee(matchId, refereeId, {
                  showToast: false,
                })
              );
            } else if (previous?.refereeId) {
              tasks.push(
                CategoryService.unassignReferee(matchId, { showToast: false })
              );
            }
            await Promise.all(tasks);
          } catch {
            toaster.error({ title: t('updateFailed') });
          }
        }}
      />
      {/* AI Import Schedule Drawer */}
      <AIImportScheduleDrawer
        isOpen={aiImportModal.isOpen}
        onClose={aiImportModal.onClose}
        tournamentId={tournament.id}
        categories={categories}
        courts={courts}
        matches={allMatches}
        onImported={async () => {
          try {
            const matchesData = await TournamentService.getAllMatches(
              tournament.id
            );
            setAllMatches(matchesData);
            setDirtyMatches(new Map());
            setManualEntry(true);
            setViewMode('list');
            onScheduleSaved?.();
          } catch {
            // ignore reload error - toast already shown by drawer
          }
        }}
      />

      {/* Manual match entry */}
      <AddMatchSheet
        isOpen={addMatchModal.isOpen}
        onClose={addMatchModal.onClose}
        categories={categories}
        courts={courts}
        allMatches={allMatches}
        onCreated={handleMatchCreated}
      />

      {/* Delete confirmation */}
      <DeleteMatchConfirmModal
        isOpen={deletingMatch !== null}
        onClose={() => setDeletingMatch(null)}
        match={deletingMatch}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
