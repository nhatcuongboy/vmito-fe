'use client';

import { useState } from 'react';
import { Box, Flex, Text, Heading } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useLocale, useTranslations } from 'next-intl';
import { VDrawer } from '@/components/ui/VDrawer';
import { X } from 'lucide-react';
import { Category, CategoryMatch, TournamentCourt } from '@/lib/api/types';
import {
  generateSchedule,
  IGenerateScheduleResult,
} from '@/utils/schedule-generator';
import { toaster } from '@/components/ui/toaster';
import TimeSlotPicker from './TimeSlotPicker';

const MATCH_LENGTHS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90, 105, 120,
];
const TIME_BETWEEN_OPTIONS = [0, 5, 10, 15, 30];
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

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  selectedCourts: string[];
  timeBetweenMinutes: number;
}

interface GenerateScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  allMatches: CategoryMatch[];
  courts: TournamentCourt[];
  venueName?: string;
  onGenerated: (result: IGenerateScheduleResult) => void;
}

function CategoryItem({
  category,
  color,
}: {
  category: Category;
  color: string;
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
    >
      <Box w="12px" h="12px" borderRadius="full" bg={color} flexShrink={0} />
      <Text fontSize="sm" fontWeight="medium">
        {category.name}
      </Text>
    </Box>
  );
}

export default function GenerateScheduleDrawer({
  isOpen,
  onClose,
  categories,
  allMatches,
  courts,
  onGenerated,
}: GenerateScheduleDrawerProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.generate'
  );
  const locale = useLocale();

  const [orderedCategories] = useState(categories);
  const [matchLength, setMatchLength] = useState(60);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '17:00',
      selectedCourts: courts.map((c) => c.id),
      timeBetweenMinutes: 0,
    },
  ]);
  const [isLoadingGenerate, setIsLoadingGenerate] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const editingSlot = editingSlotId
    ? timeSlots.find((s) => s.id === editingSlotId)
    : null;

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
      const newSlot: TimeSlot = {
        id: Date.now().toString(),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        selectedCourts: courts.map((c) => c.id),
        timeBetweenMinutes: 0,
      };
      setTimeSlots((prev) => [...prev, newSlot]);
    }
    setPickerOpen(false);
    setEditingSlotId(null);
  };

  const handleRemoveTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter((s) => s.id !== id));
  };

  const handleUpdateTimeBetween = (slotId: string, minutes: number) => {
    setTimeSlots(
      timeSlots.map((s) =>
        s.id === slotId ? { ...s, timeBetweenMinutes: minutes } : s
      )
    );
  };

  const handleGenerate = async () => {
    try {
      setIsLoadingGenerate(true);

      const unscheduledMatches = allMatches.filter(
        (m) => !m.startTime || !m.courtId
      );
      if (unscheduledMatches.length === 0) {
        toaster.error({
          title: t('allScheduled'),
        });
        return;
      }

      const slotConfigs = timeSlots
        .filter((s) => s.selectedCourts.length > 0)
        .map((s) => ({
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          timeBetweenMinutes: s.timeBetweenMinutes,
          courtIds: s.selectedCourts,
        }));

      if (slotConfigs.length === 0) {
        toaster.error({ title: t('noCourts') });
        return;
      }

      const categoriesForSchedule = orderedCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        matches: unscheduledMatches.filter((m) => m.categoryId === cat.id),
      }));

      const result = generateSchedule({
        categories: categoriesForSchedule,
        timeSlots: slotConfigs,
        matchLengthMinutes: matchLength,
      });

      if (result.scheduled.length === 0) {
        toaster.error({
          title: t('generationFailed'),
          description: t('generationFailedDesc'),
        });
        return;
      }

      onGenerated(result);
    } catch (error) {
      console.error('Generate error:', error);
      toaster.error({ title: t('error') });
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
        secondaryActionText="Cancel"
      >
        <VStack gap={6} align="stretch">
          <Box>
            <Heading size="sm" mb={1}>
              {t('categoryOrder')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>
              {t('categoryOrderDesc')}
            </Text>
            <VStack gap={2} align="stretch">
              {orderedCategories.map((cat, idx) => (
                <CategoryItem
                  key={cat.id}
                  category={cat}
                  color={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                />
              ))}
            </VStack>
          </Box>

          <Box>
            <Heading size="sm" mb={1}>
              {t('matchLength')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>
              {t('matchLengthDesc')}
            </Text>
            <select
              style={{
                width: '100%',
                padding: '12px',
                borderWidth: '1px',
                borderColor: '#CBD5E0',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              value={matchLength}
              onChange={(e) => setMatchLength(Number(e.target.value))}
            >
              {MATCH_LENGTHS.map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </Box>

          <Box>
            <Heading size="sm" mb={1}>
              {t('availableTimes')}
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>
              {t('availableTimesDesc')}
            </Text>

            <VStack gap={3} align="stretch">
              {timeSlots.map((slot) => (
                <Box
                  key={slot.id}
                  p={3}
                  bg="gray.50"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.200"
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {new Date(slot.date + 'T00:00:00').toLocaleDateString(
                          locale,
                          { month: 'short', day: 'numeric' }
                        )}{' '}
                        @ {slot.startTime} - {slot.endTime}
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {t('courtsCount', {
                          count: slot.selectedCourts.length,
                        })}
                      </Text>
                    </Box>
                    <Flex gap={1}>
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

                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {t('timeBetween')}
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
                      value={slot.timeBetweenMinutes}
                      onChange={(e) =>
                        handleUpdateTimeBetween(slot.id, Number(e.target.value))
                      }
                    >
                      {TIME_BETWEEN_OPTIONS.map((m) => (
                        <option key={`${slot.id}-${m}`} value={m}>
                          {m} min
                        </option>
                      ))}
                    </select>
                  </Box>
                </Box>
              ))}
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

      {/* Time slot picker modal */}
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
    </>
  );
}
