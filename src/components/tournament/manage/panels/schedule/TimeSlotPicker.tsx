'use client';

import { useState, useMemo, useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeSlotPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  zIndex?: number;
}

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  for (const m of [0, 30]) {
    if (h === 23 && m === 30) continue;
    const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    TIME_OPTIONS.push(value);
    // Store display label mapping externally if needed
  }
}

const formatTimeDisplay = (time24: string): string => {
  const [h, m] = time24.split(':').map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function TimeSlotPicker({
  isOpen,
  onClose,
  onConfirm,
  initialDate,
  initialStartTime,
  initialEndTime,
  zIndex,
}: TimeSlotPickerProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.generate'
  );

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(
    initialDate ? new Date(initialDate) : today
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialDate ? new Date(initialDate) : null
  );
  const [startTime, setStartTime] = useState(initialStartTime ?? '09:00');
  const [endTime, setEndTime] = useState(initialEndTime ?? '17:00');

  // Reset internal state whenever the modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      const initDate = initialDate ? new Date(initialDate) : today;
      setViewMonth(initDate);
      setSelectedDate(initialDate ? new Date(initialDate) : null);
      setStartTime(initialStartTime ?? '09:00');
      setEndTime(initialEndTime ?? '17:00');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month fill
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month fill (to complete the grid)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handlePrevMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    );
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const handleConfirm = () => {
    if (!selectedDate) return;
    const dateStr = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
    onConfirm({ date: dateStr, startTime, endTime });
    onClose();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      primaryActionText={t('confirm')}
      onPrimaryAction={handleConfirm}
      isPrimaryDisabled={!selectedDate}
      secondaryActionText="Cancel"
      size="sm"
      zIndex={zIndex}
    >
      <VStack gap={4} align="stretch">
        {/* Time selectors */}
        <Flex gap={3}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('startTime')}
            </Text>
            <select
              style={{
                width: '100%',
                padding: '8px',
                borderWidth: '1px',
                borderColor: '#CBD5E0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
              }}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTimeDisplay(t)}
                </option>
              ))}
            </select>
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('endTime')}
            </Text>
            <select
              style={{
                width: '100%',
                padding: '8px',
                borderWidth: '1px',
                borderColor: '#CBD5E0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
              }}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTimeDisplay(t)}
                </option>
              ))}
            </select>
          </Box>
        </Flex>

        {/* Calendar */}
        <Box>
          <Flex justify="space-between" align="center" mb={3}>
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <Text fontWeight="semibold" fontSize="sm">
              {monthLabel}
            </Text>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight size={16} />
            </Button>
          </Flex>

          {/* Day headers */}
          <Box
            display="grid"
            gridTemplateColumns="repeat(7, 1fr)"
            gap={0}
            mb={1}
          >
            {DAYS.map((d) => (
              <Flex key={d} justify="center" py={1}>
                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                  {d}
                </Text>
              </Flex>
            ))}
          </Box>

          {/* Calendar grid */}
          <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0}>
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);

              return (
                <Flex
                  key={idx}
                  justify="center"
                  align="center"
                  py={1.5}
                  cursor={isCurrentMonth ? 'pointer' : 'default'}
                  onClick={() => isCurrentMonth && setSelectedDate(date)}
                >
                  <Flex
                    w="36px"
                    h="36px"
                    borderRadius="full"
                    justify="center"
                    align="center"
                    bg={isSelected ? 'gray.800' : 'transparent'}
                    color={
                      isSelected
                        ? 'white'
                        : isCurrentMonth
                          ? 'gray.800'
                          : 'gray.300'
                    }
                    fontWeight={isToday || isSelected ? 'bold' : 'normal'}
                    fontSize="sm"
                    _hover={
                      isCurrentMonth && !isSelected ? { bg: 'gray.100' } : {}
                    }
                    transition="background 0.15s"
                  >
                    {date.getDate()}
                  </Flex>
                </Flex>
              );
            })}
          </Box>
        </Box>
      </VStack>
    </VModal>
  );
}
