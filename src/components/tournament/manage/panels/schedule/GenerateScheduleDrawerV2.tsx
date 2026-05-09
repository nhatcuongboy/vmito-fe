'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Flex, Text, Heading, Badge } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { VDrawer } from '@/components/ui/VDrawer';
import {
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings2,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  Category,
  CategoryMatch,
  TournamentCourt,
  ICourtConstraint,
  IGenerateScheduleResponse,
} from '@/lib/api/types';
import { ScheduleGeneratorService } from '@/lib/api/schedule-generator.service';
import { toaster } from '@/components/ui/toaster';
import TimeSlotPicker from './TimeSlotPicker';
import CourtSelector from './CourtSelector';
import { useModal } from '@/components/ui/VModal';

const DURATION_OPTIONS = Array.from({ length: 36 }, (_, i) => (i + 1) * 5);
const TIME_BUFFER_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 45, 60];
const CATEGORY_COLORS = [
  '#ECC94B',
  '#90CDF4',
  '#68D391',
  '#B794F4',
  '#FBB6CE',
  '#FBD38D',
  '#76E4F7',
  '#FEB2B2',
];

interface LocalTimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  timeBuffer: number;
  courts: {
    courtId: string;
    constraints?: ICourtConstraint;
  }[];
}

interface GenerateScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  categories: Category[];
  allMatches: CategoryMatch[];
  courts: TournamentCourt[];
  venueName?: string;
  onGenerated: (response: IGenerateScheduleResponse) => void;
}

function DraggableCategoryItem({
  category,
  color,
  index,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  category: Category;
  color: string;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}) {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      p={2}
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      cursor="grab"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      _hover={{ bg: 'gray.50' }}
    >
      <GripVertical size={14} color="#A0AEC0" />
      <Box w="12px" h="12px" borderRadius="full" bg={color} flexShrink={0} />
      <Text fontSize="sm" fontWeight="medium">
        {category.name}
      </Text>
      <Badge ml="auto" fontSize="2xs" colorScheme="gray">
        #{index + 1}
      </Badge>
    </Box>
  );
}

export default function GenerateScheduleDrawer({
  isOpen,
  onClose,
  tournamentId,
  categories,
  allMatches,
  courts,
  onGenerated,
}: GenerateScheduleDrawerProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.generate'
  );
  const tc = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.constraints'
  );

  // Category priority
  const [orderedCategories, setOrderedCategories] =
    useState<Category[]>(categories);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Match durations per round type
  const [poolPlayDuration, setPoolPlayDuration] = useState(60);
  const [playoffsDuration, setPlayoffsDuration] = useState(60);

  // Keep scheduled matches toggle
  const [keepScheduledMatches, setKeepScheduledMatches] = useState(false);

  // Time slots - initialized empty; populated when drawer opens with current courts
  const [timeSlots, setTimeSlots] = useState<LocalTimeSlot[]>([]);

  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  // Keep a stable ref to courts so the open-effect always sees latest value
  const courtsRef = useRef(courts);
  useEffect(() => {
    courtsRef.current = courts;
  }, [courts]);

  // When the drawer opens, (re-)initialize the default time slot with the
  // courts that are available at that moment (avoids stale-closure bug where
  // courts were still [] during component mount).
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const defaultSlot: LocalTimeSlot = {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        endTime: '17:00',
        timeBuffer: 0,
        courts: courtsRef.current.map((c) => ({ courtId: c.id })),
      };
      setTimeSlots([defaultSlot]);
      setExpandedSlotId(defaultSlot.id);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  const [isLoadingGenerate, setIsLoadingGenerate] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Modals
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [courtSelectorSlotId, setCourtSelectorSlotId] = useState<string | null>(
    null
  );
  const [constraintEditCourt, setConstraintEditCourt] = useState<{
    slotId: string;
    courtId: string;
  } | null>(null);

  const editingSlot = editingSlotId
    ? timeSlots.find((s) => s.id === editingSlotId)
    : null;

  // Drag and drop for categories
  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };
  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const items = [...orderedCategories];
    const [removed] = items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, removed);
    setOrderedCategories(items);
    setDragIndex(null);
  };

  // Time slot actions
  const handleAddTimeSlot = () => {
    setEditingSlotId(null);
    setPickerOpen(true);
  };

  const handleEditTimeSlot = (id: string) => {
    setEditingSlotId(id);
    setPickerOpen(true);
  };

  const handlePickerConfirm = (data: {
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    if (editingSlotId) {
      setTimeSlots((prev) =>
        prev.map((s) =>
          s.id === editingSlotId
            ? {
                ...s,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
              }
            : s
        )
      );
    } else {
      const newSlot: LocalTimeSlot = {
        id: Date.now().toString(),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        timeBuffer: 0,
        courts: courts.map((c) => ({ courtId: c.id })),
      };
      setTimeSlots((prev) => [...prev, newSlot]);
    }
    setPickerOpen(false);
    setEditingSlotId(null);
  };

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateTimeBuffer = (slotId: string, buffer: number) => {
    setTimeSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, timeBuffer: buffer } : s))
    );
  };

  // Court selection for time slot
  const handleCourtSelectionConfirm = (courtIds: string[]) => {
    if (!courtSelectorSlotId) return;
    setTimeSlots((prev) =>
      prev.map((s) => {
        if (s.id !== courtSelectorSlotId) return s;
        // Keep existing constraints for courts that remain
        const existingMap = new Map(
          s.courts.map((c) => [c.courtId, c.constraints])
        );
        return {
          ...s,
          courts: courtIds.map((id) => ({
            courtId: id,
            constraints: existingMap.get(id),
          })),
        };
      })
    );
    setCourtSelectorSlotId(null);
  };

  const handleRemoveCourtFromSlot = (slotId: string, courtId: string) => {
    setTimeSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        return {
          ...s,
          courts: s.courts.filter((c) => c.courtId !== courtId),
        };
      })
    );
  };

  // Constraint editing
  const handleUpdateConstraint = (
    slotId: string,
    courtId: string,
    constraints: ICourtConstraint | undefined
  ) => {
    setTimeSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId) return s;
        return {
          ...s,
          courts: s.courts.map((c) =>
            c.courtId === courtId ? { ...c, constraints } : c
          ),
        };
      })
    );
    setConstraintEditCourt(null);
  };

  const getCourtLabel = (courtId: string): string => {
    const court = courts.find((c) => c.id === courtId);
    return court?.courtName || `Court ${court?.courtNumber || '?'}`;
  };

  const getConstraintLabel = (constraints?: ICourtConstraint): string => {
    if (
      !constraints ||
      (!constraints.categories?.length &&
        !constraints.rounds?.length &&
        !constraints.groups?.length)
    ) {
      return t('anyMatch');
    }

    const parts: string[] = [];
    if (constraints.categories?.length) {
      const names = constraints.categories
        .map((id) => categories.find((c) => c.id === id)?.name || id)
        .join(', ');
      parts.push(names);
    }
    if (constraints.rounds?.length) {
      parts.push(constraints.rounds.join(', '));
    }
    if (constraints.groups?.length) {
      parts.push(t('groupsCount', { count: constraints.groups.length }));
    }
    return parts.join(' • ');
  };

  // Generate handler
  const handleGenerate = async () => {
    setValidationErrors([]);
    setIsLoadingGenerate(true);
    try {
      const request = {
        categoryPriorities: orderedCategories.map((c) => c.id),
        matchDurations: {
          POOL_PLAY: poolPlayDuration,
          PLAYOFFS: playoffsDuration,
        },
        timeSlots: timeSlots.map((ts) => ({
          date: ts.date,
          startTime: ts.startTime,
          endTime: ts.endTime,
          timeBuffer: ts.timeBuffer,
          courts: ts.courts.map((c) => ({
            courtId: c.courtId,
            constraints: c.constraints,
          })),
        })),
        keepScheduledMatches,
      };

      // Validate first
      const validation = await ScheduleGeneratorService.validateConfig(
        tournamentId,
        request
      );

      if (!validation.valid) {
        setValidationErrors(validation.errors.map((e) => e.message));
        return;
      }

      // Generate
      const result = await ScheduleGeneratorService.generate(
        tournamentId,
        request
      );

      onGenerated(result);
      onClose();
    } catch (error) {
      console.error('Generate error:', error);
      toaster.error({ title: t('generationFailed') });
    } finally {
      setIsLoadingGenerate(false);
    }
  };

  return (
    <>
      <VDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={t('title')}
        size="lg"
        primaryActionText={t('generateBtn')}
        onPrimaryAction={handleGenerate}
        isPrimaryLoading={isLoadingGenerate}
        secondaryActionText={t('cancel')}
      >
        <VStack gap={6} align="stretch">
          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <Box
              bg="red.50"
              borderWidth="1px"
              borderColor="red.200"
              borderRadius="md"
              p={3}
            >
              {validationErrors.map((err, idx) => (
                <Text key={idx} fontSize="sm" color="red.600">
                  • {err}
                </Text>
              ))}
            </Box>
          )}

          {/* Keep scheduled matches toggle */}
          <Box
            p={3}
            bg="gray.50"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Flex align="center" justify="space-between">
              <Box>
                <Text fontSize="sm" fontWeight="medium">
                  {t('keepScheduled')}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {t('keepScheduledDesc')}
                </Text>
              </Box>
              <input
                type="checkbox"
                checked={keepScheduledMatches}
                onChange={(e) => setKeepScheduledMatches(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
            </Flex>
          </Box>

          {/* Category Priority */}
          <Box>
            <Heading size="sm" mb={1}>
              {t('categoryOrder')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>
              {t('categoryOrderDesc')}
            </Text>
            <VStack gap={2} align="stretch">
              {orderedCategories.map((cat, idx) => (
                <DraggableCategoryItem
                  key={cat.id}
                  category={cat}
                  color={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                  index={idx}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </VStack>
          </Box>

          {/* Match Duration per round type */}
          <Box>
            <Heading size="sm" mb={1}>
              {t('matchLength')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>
              {t('matchLengthDesc')}
            </Text>
            <VStack gap={3} align="stretch">
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  {t('poolPlay')}
                </Text>
                <select
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderWidth: '1px',
                    borderColor: '#CBD5E0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  value={poolPlayDuration}
                  onChange={(e) => setPoolPlayDuration(Number(e.target.value))}
                >
                  {DURATION_OPTIONS.map((m) => (
                    <option key={`pp-${m}`} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  {t('playoffs')}
                </Text>
                <select
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderWidth: '1px',
                    borderColor: '#CBD5E0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  value={playoffsDuration}
                  onChange={(e) => setPlayoffsDuration(Number(e.target.value))}
                >
                  {DURATION_OPTIONS.map((m) => (
                    <option key={`po-${m}`} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
              </Box>
            </VStack>
          </Box>

          {/* Time Slots */}
          <Box>
            <Heading size="sm" mb={1}>
              {t('availableTimes')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>
              {t('availableTimesDesc')}
            </Text>

            <VStack gap={3} align="stretch">
              {timeSlots.map((slot) => {
                const isExpanded = expandedSlotId === slot.id;
                return (
                  <Box
                    key={slot.id}
                    p={3}
                    bg="gray.50"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                  >
                    {/* Collapsed header */}
                    <Flex justify="space-between" align="center">
                      <Box
                        flex={1}
                        cursor="pointer"
                        onClick={() =>
                          setExpandedSlotId(isExpanded ? null : slot.id)
                        }
                      >
                        <Text fontSize="sm" fontWeight="semibold">
                          {new Date(slot.date + 'T00:00:00').toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                            }
                          )}{' '}
                          @ {slot.startTime} - {slot.endTime}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {t('courtsCount', { count: slot.courts.length })} •{' '}
                          {slot.timeBuffer > 0
                            ? t('minBuffer', { count: slot.timeBuffer })
                            : t('noBuffer')}
                        </Text>
                      </Box>
                      <Flex gap={1}>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            setExpandedSlotId(isExpanded ? null : slot.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleEditTimeSlot(slot.id)}
                        >
                          {t('edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleRemoveTimeSlot(slot.id)}
                        >
                          <X size={14} />
                        </Button>
                      </Flex>
                    </Flex>

                    {/* Expanded details */}
                    {isExpanded && (
                      <Box
                        mt={3}
                        pt={3}
                        borderTopWidth="1px"
                        borderColor="gray.200"
                      >
                        {/* Time Buffer */}
                        <Box mb={3}>
                          <Text fontSize="xs" color="gray.500" mb={1}>
                            {t('timeBuffer')}
                          </Text>
                          <select
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderWidth: '1px',
                              borderColor: '#CBD5E0',
                              borderRadius: '8px',
                              fontSize: '14px',
                            }}
                            value={slot.timeBuffer}
                            onChange={(e) =>
                              handleUpdateTimeBuffer(
                                slot.id,
                                Number(e.target.value)
                              )
                            }
                          >
                            {TIME_BUFFER_OPTIONS.map((m) => (
                              <option key={`buf-${slot.id}-${m}`} value={m}>
                                {m} min
                              </option>
                            ))}
                          </select>
                        </Box>

                        {/* Courts */}
                        <Flex justify="space-between" align="center" mb={2}>
                          <Text fontSize="xs" color="gray.500">
                            {t('courts')} ({slot.courts.length})
                          </Text>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setCourtSelectorSlotId(slot.id)}
                          >
                            <Plus size={12} /> {t('selectCourts')}
                          </Button>
                        </Flex>

                        <VStack gap={2} align="stretch">
                          {slot.courts.map((courtSlot) => (
                            <Flex
                              key={courtSlot.courtId}
                              align="center"
                              gap={2}
                              p={2}
                              bg="white"
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor="gray.200"
                            >
                              <Text fontSize="sm" fontWeight="medium" flex={1}>
                                {getCourtLabel(courtSlot.courtId)}
                              </Text>
                              <Badge
                                fontSize="2xs"
                                colorScheme={
                                  courtSlot.constraints?.categories?.length ||
                                  courtSlot.constraints?.rounds?.length
                                    ? 'blue'
                                    : 'gray'
                                }
                              >
                                {getConstraintLabel(courtSlot.constraints)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() =>
                                  setConstraintEditCourt({
                                    slotId: slot.id,
                                    courtId: courtSlot.courtId,
                                  })
                                }
                              >
                                <Settings2 size={12} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() =>
                                  handleRemoveCourtFromSlot(
                                    slot.id,
                                    courtSlot.courtId
                                  )
                                }
                              >
                                <Trash2 size={12} />
                              </Button>
                            </Flex>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </VStack>

            <Button
              variant="outline"
              w="100%"
              mt={3}
              onClick={handleAddTimeSlot}
            >
              + {t('addTimeSlot')}
            </Button>
          </Box>
        </VStack>
      </VDrawer>

      {/* Time slot picker */}
      <TimeSlotPicker
        isOpen={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          setEditingSlotId(null);
        }}
        onConfirm={handlePickerConfirm}
        initialDate={editingSlot?.date}
        initialStartTime={editingSlot?.startTime}
        initialEndTime={editingSlot?.endTime}
        zIndex={1500}
      />

      {/* Court selector modal */}
      {courtSelectorSlotId && (
        <CourtSelector
          isOpen={!!courtSelectorSlotId}
          onClose={() => setCourtSelectorSlotId(null)}
          courts={courts}
          selectedCourtIds={
            timeSlots
              .find((s) => s.id === courtSelectorSlotId)
              ?.courts.map((c) => c.courtId) || []
          }
          onConfirm={handleCourtSelectionConfirm}
        />
      )}

      {/* Constraint editor modal */}
      {constraintEditCourt && (
        <ConstraintEditorModal
          isOpen={!!constraintEditCourt}
          onClose={() => setConstraintEditCourt(null)}
          categories={categories}
          currentConstraints={
            timeSlots
              .find((s) => s.id === constraintEditCourt.slotId)
              ?.courts.find((c) => c.courtId === constraintEditCourt.courtId)
              ?.constraints
          }
          onConfirm={(constraints) =>
            handleUpdateConstraint(
              constraintEditCourt.slotId,
              constraintEditCourt.courtId,
              constraints
            )
          }
          courtLabel={getCourtLabel(constraintEditCourt.courtId)}
        />
      )}
    </>
  );
}

// ===== Constraint Editor Modal =====
import { VModal } from '@/components/ui/VModal';

interface ConstraintEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currentConstraints?: ICourtConstraint;
  onConfirm: (constraints: ICourtConstraint | undefined) => void;
  courtLabel: string;
}

function ConstraintEditorModal({
  isOpen,
  onClose,
  categories,
  currentConstraints,
  onConfirm,
  courtLabel,
}: ConstraintEditorModalProps) {
  const tc = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.constraints'
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentConstraints?.categories || []
  );
  const [selectedRounds, setSelectedRounds] = useState<string[]>(
    currentConstraints?.rounds || []
  );

  const allRounds = ['GROUP', 'QF', 'SF', 'F', '3RD'];

  const handleToggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  const handleToggleRound = (round: string) => {
    setSelectedRounds((prev) =>
      prev.includes(round) ? prev.filter((r) => r !== round) : [...prev, round]
    );
  };

  const handleConfirm = () => {
    if (selectedCategories.length === 0 && selectedRounds.length === 0) {
      onConfirm(undefined);
    } else {
      onConfirm({
        categories:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        rounds: selectedRounds.length > 0 ? selectedRounds : undefined,
      });
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedCategories([]);
    setSelectedRounds([]);
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={tc('title', { court: courtLabel })}
      primaryActionText={tc('save')}
      onPrimaryAction={handleConfirm}
      secondaryActionText={tc('cancel')}
      size="sm"
    >
      <VStack gap={4} align="stretch">
        <Box>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="sm" fontWeight="medium">
              {tc('categories')}
            </Text>
            <Button variant="ghost" size="xs" onClick={handleClear}>
              {tc('clearAll')}
            </Button>
          </Flex>
          <VStack gap={2} align="stretch">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <Box
                  key={cat.id}
                  p={2}
                  borderWidth="1px"
                  borderColor={isSelected ? 'blue.400' : 'gray.200'}
                  bg={isSelected ? 'blue.50' : 'white'}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => handleToggleCategory(cat.id)}
                >
                  <Text fontSize="sm">{cat.name}</Text>
                </Box>
              );
            })}
          </VStack>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            {tc('rounds')}
          </Text>
          <Flex gap={2} flexWrap="wrap">
            {allRounds.map((round) => {
              const isSelected = selectedRounds.includes(round);
              return (
                <Box
                  key={round}
                  px={3}
                  py={1}
                  borderWidth="1px"
                  borderColor={isSelected ? 'blue.400' : 'gray.200'}
                  bg={isSelected ? 'blue.50' : 'white'}
                  borderRadius="full"
                  cursor="pointer"
                  onClick={() => handleToggleRound(round)}
                >
                  <Text fontSize="xs">{round}</Text>
                </Box>
              );
            })}
          </Flex>
        </Box>

        {selectedCategories.length === 0 && selectedRounds.length === 0 && (
          <Text fontSize="xs" color="gray.500" textAlign="center">
            {tc('noConstraints')}
          </Text>
        )}
      </VStack>
    </VModal>
  );
}
