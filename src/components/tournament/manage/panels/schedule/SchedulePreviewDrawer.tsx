'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Badge } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trophy,
  Edit3,
} from 'lucide-react';
import {
  IGenerateScheduleResponse,
  IPreviewMatch,
  TournamentCourt,
  Category,
} from '@/lib/api/types';
import { ScheduleGeneratorService } from '@/lib/api/schedule-generator.service';
import { toaster } from '@/components/ui/toaster';

interface SchedulePreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  scheduleId: string;
  generationResponse: IGenerateScheduleResponse;
  courts: TournamentCourt[];
  categories: Category[];
  onSaved: () => void;
  onCancel: () => void;
}

const CATEGORY_COLORS = [
  '#ECC94B',
  '#90CDF4',
  '#68D391',
  '#B794F4',
  '#FC8181',
  '#F6AD55',
  '#76E4F7',
  '#FEB2B2',
];

function getRoundLabel(round: string): string {
  const labels: Record<string, string> = {
    GROUP: 'Pool Play',
    POOL_PLAY: 'Pool Play',
    FINAL: 'Final',
    FINALS: 'Finals',
    SEMIFINALS: 'Semi Finals',
    SEMI_FINALS: 'Semi Finals',
    QUARTERFINALS: 'Quarter Finals',
    QUARTER_FINALS: 'Quarter Finals',
    '3RD': '3rd Place',
    ROUND_OF_16: 'Round of 16',
  };
  return labels[round] ?? round.replace(/_/g, ' ');
}

function isGroupRound(round: string): boolean {
  const r = round.toUpperCase();
  return r === 'GROUP' || r === 'POOL_PLAY';
}

/** Format ISO string as "Tue, May 12 @ 11:02" */
function formatMatchDateTime(isoString: string): string {
  const d = new Date(isoString);
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} @ ${timePart}`;
}

export default function SchedulePreviewDrawer({
  isOpen,
  onClose,
  tournamentId,
  scheduleId,
  generationResponse,
  courts,
  categories: _categories,
  onSaved,
  onCancel,
}: SchedulePreviewDrawerProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.preview'
  );

  const [step, setStep] = useState<'summary' | 'list'>('summary');
  const [previewMatches, setPreviewMatches] = useState<IPreviewMatch[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMatch, setEditingMatch] = useState<IPreviewMatch | null>(null);

  // Reset to summary step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('summary');
      setPreviewMatches([]);
      setEditingMatch(null);
    }
  }, [isOpen]);

  const { summary, conflicts } = generationResponse;
  const isComplete = summary.unscheduledMatches === 0;

  // Load preview then switch to list step
  const handleViewSchedule = async () => {
    setIsLoadingList(true);
    try {
      const preview = await ScheduleGeneratorService.getPreview(
        tournamentId,
        scheduleId
      );
      setPreviewMatches(preview.matches);
      setStep('list');
    } catch {
      toaster.error({ title: 'Failed to load schedule preview' });
    } finally {
      setIsLoadingList(false);
    }
  };

  // Save schedule directly (no confirmation dialog)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await ScheduleGeneratorService.saveSchedule(
        tournamentId,
        scheduleId
      );
      if (result.success) {
        toaster.success({
          title: t('scheduleSaved', { count: result.scheduledCount }),
        });
        onSaved();
        onClose();
      }
    } catch {
      toaster.error({ title: t('failedSave') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  // Handle match edit
  const handleMatchUpdated = async (
    matchId: string,
    courtId: string,
    startTime: string,
    duration: number
  ) => {
    try {
      const result = await ScheduleGeneratorService.updateMatchAssignment(
        tournamentId,
        scheduleId,
        matchId,
        { courtId, startTime, duration }
      );

      if (!result.success) {
        toaster.error({
          title: t('conflictDetected'),
          description: result.conflicts?.[0]?.reason || t('unableToUpdate'),
        });
        return;
      }

      // Reload preview
      const preview = await ScheduleGeneratorService.getPreview(
        tournamentId,
        scheduleId
      );
      setPreviewMatches(preview.matches);
      setEditingMatch(null);
      toaster.success({ title: t('matchUpdated') });
    } catch {
      toaster.error({ title: t('failedUpdate') });
    }
  };

  return (
    <>
      {/* ===== STEP 1: SUMMARY ===== */}
      <VModal
        isOpen={isOpen && step === 'summary'}
        onClose={handleCancel}
        title="Generated schedule"
        primaryActionText="View schedule"
        onPrimaryAction={handleViewSchedule}
        isPrimaryLoading={isLoadingList}
        secondaryActionText="Cancel"
        onSecondaryAction={handleCancel}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          {/* Success / Warning banner */}
          <Box
            p={4}
            bg={isComplete ? 'green.50' : 'orange.50'}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={isComplete ? 'green.200' : 'orange.200'}
          >
            <Flex align="center" gap={3}>
              {isComplete ? (
                <CheckCircle size={20} color="#38A169" />
              ) : (
                <AlertTriangle size={20} color="#DD6B20" />
              )}
              <Text
                fontSize="sm"
                color={isComplete ? 'green.700' : 'orange.700'}
                fontWeight="medium"
              >
                {isComplete
                  ? 'Successfully generated a schedule for all matches.'
                  : `${summary.unscheduledMatches} match(es) could not be scheduled. Consider adding more time slots.`}
              </Text>
            </Flex>
          </Box>

          {/* Category cards */}
          <Flex gap={3} flexWrap="wrap">
            {summary.byCategory.map((cat, idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              return (
                <Box
                  key={cat.categoryId}
                  borderWidth="2px"
                  borderColor={color}
                  borderRadius="xl"
                  p={4}
                  flex="1 1 200px"
                  minW="180px"
                >
                  {/* Category header */}
                  <Flex align="center" gap={2} mb={3}>
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg={color}
                      flexShrink={0}
                    />
                    <Text fontWeight="semibold" fontSize="sm" flex={1}>
                      {cat.categoryName}
                    </Text>
                    <Text
                      fontSize="sm"
                      color={
                        cat.scheduled === cat.total ? 'green.600' : 'red.500'
                      }
                      fontWeight="bold"
                    >
                      {cat.scheduled}/{cat.total}
                    </Text>
                  </Flex>

                  {/* Round breakdown */}
                  <VStack gap={1.5} align="stretch">
                    {cat.byRound.map((r, ri) => (
                      <Flex
                        key={ri}
                        align="center"
                        justify="space-between"
                        fontSize="xs"
                        color="gray.600"
                      >
                        <Flex align="center" gap={1.5}>
                          {isGroupRound(r.round) ? (
                            <RefreshCw size={11} />
                          ) : (
                            <Trophy size={11} />
                          )}
                          <Text>{getRoundLabel(r.round)}</Text>
                        </Flex>
                        <Text
                          color={
                            r.scheduled === r.total ? 'green.600' : 'red.500'
                          }
                          fontWeight="medium"
                        >
                          {r.scheduled}/{r.total}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                </Box>
              );
            })}
          </Flex>

          {/* Conflicts (if any) */}
          {conflicts.length > 0 && (
            <Box
              p={3}
              bg="orange.50"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="orange.200"
            >
              <Flex align="center" gap={2} mb={1}>
                <AlertTriangle size={14} color="#DD6B20" />
                <Text fontSize="xs" fontWeight="medium" color="orange.700">
                  {conflicts.length} scheduling conflict(s)
                </Text>
              </Flex>
              {conflicts.slice(0, 3).map((c, i) => (
                <Text key={i} fontSize="xs" color="orange.600" pl={5}>
                  • {c.reason}
                </Text>
              ))}
              {conflicts.length > 3 && (
                <Text fontSize="xs" color="orange.500" pl={5}>
                  +{conflicts.length - 3} more
                </Text>
              )}
            </Box>
          )}
        </VStack>
      </VModal>

      {/* ===== STEP 2: MATCH LIST ===== */}
      <VModal
        isOpen={isOpen && step === 'list'}
        onClose={handleCancel}
        title="Schedule Preview"
        primaryActionText="Save changes"
        onPrimaryAction={handleSave}
        isPrimaryLoading={isSaving}
        secondaryActionText="Cancel"
        onSecondaryAction={handleCancel}
        size="xl"
        maxBodyHeight={{ base: '70vh', md: '75vh' }}
      >
        {/* Column header */}
        <Box px={3} py={2} bg="gray.50" borderRadius="md" mb={2}>
          <Flex gap={3} align="center">
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" w="52px">
              #
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" flex={1}>
              Player 1
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" flex={1}>
              Player 2
            </Text>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.500"
              w="160px"
            >
              Date &amp; Time
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" w="80px">
              Court
            </Text>
            <Box w="32px" />
          </Flex>
        </Box>

        {/* Match rows */}
        <VStack gap={0} align="stretch">
          {previewMatches
            .slice()
            .sort(
              (a, b) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
            )
            .map((match) => (
              <Flex
                key={match.matchId}
                px={3}
                py={3}
                align="center"
                gap={3}
                borderBottomWidth="1px"
                borderColor="gray.100"
                _hover={{ bg: 'gray.50' }}
              >
                <Box w="52px">
                  <Badge
                    fontSize="xs"
                    bg="gray.100"
                    color="gray.700"
                    borderRadius="full"
                    px={2}
                    py={0.5}
                  >
                    #{match.matchNumber}
                  </Badge>
                </Box>
                <Box flex={1} overflow="hidden">
                  <Text
                    fontSize="sm"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {match.participants[0] ?? '—'}
                  </Text>
                </Box>
                <Box flex={1} overflow="hidden">
                  <Text
                    fontSize="sm"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {match.participants[1] ?? '—'}
                  </Text>
                </Box>
                <Text fontSize="xs" color="gray.600" w="160px" flexShrink={0}>
                  {formatMatchDateTime(match.startTime)}
                </Text>
                <Text fontSize="xs" color="gray.600" w="80px" flexShrink={0}>
                  {match.courtName}
                </Text>
                <Box w="32px" flexShrink={0}>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setEditingMatch(match)}
                  >
                    <Edit3 size={14} />
                  </Button>
                </Box>
              </Flex>
            ))}
        </VStack>
      </VModal>

      {/* Edit Match Modal */}
      {editingMatch && (
        <EditMatchModal
          isOpen={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          match={editingMatch}
          courts={courts}
          onSave={handleMatchUpdated}
        />
      )}
    </>
  );
}

// ===== Edit Match Modal =====
interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: IPreviewMatch;
  courts: TournamentCourt[];
  onSave: (
    matchId: string,
    courtId: string,
    startTime: string,
    duration: number
  ) => void;
}

function EditMatchModal({
  isOpen,
  onClose,
  match,
  courts,
  onSave,
}: EditMatchModalProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.preview'
  );
  const [courtId, setCourtId] = useState(match.courtId);
  const [startTime, setStartTime] = useState(
    new Date(match.startTime).toISOString().slice(0, 16)
  );
  const [duration, setDuration] = useState(match.duration);

  const durationOptions = Array.from({ length: 36 }, (_, i) => (i + 1) * 5);

  const handleSave = () => {
    onSave(match.matchId, courtId, new Date(startTime).toISOString(), duration);
  };

  const handleClear = () => {
    // Reset to unscheduled would need a clear endpoint
    onClose();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editMatch', { number: match.matchNumber })}
      primaryActionText={t('save')}
      onPrimaryAction={handleSave}
      secondaryActionText={t('cancel')}
      size="sm"
    >
      <VStack gap={4} align="stretch">
        {/* Match info (read-only) */}
        <Box>
          <Text fontSize="xs" color="gray.500">
            {t('match')}
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {match.participants.join(' vs ')}
          </Text>
          <Flex gap={2} mt={1}>
            <Badge fontSize="2xs" colorScheme="blue">
              {match.categoryName}
            </Badge>
            <Badge fontSize="2xs" colorScheme="purple">
              {match.round}
            </Badge>
          </Flex>
        </Box>

        {/* Date & Time */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {t('startTime')}
          </Text>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderWidth: '1px',
              borderColor: '#CBD5E0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
        </Box>

        {/* Duration */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {t('duration')}
          </Text>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '10px',
              borderWidth: '1px',
              borderColor: '#CBD5E0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {durationOptions.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </Box>

        {/* Court */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {t('court')}
          </Text>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderWidth: '1px',
              borderColor: '#CBD5E0',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.courtName || `Court ${court.courtNumber}`}
              </option>
            ))}
          </select>
        </Box>

        {/* Clear button */}
        <Button variant="outline" w="100%" onClick={handleClear}>
          {t('clearAssignment')}
        </Button>
      </VStack>
    </VModal>
  );
}
