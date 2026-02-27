'use client';
import { Input } from '@/components/ui/Input';

import { useState, useEffect, ChangeEvent } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Grid,
  Field,
} from '@chakra-ui/react';
import { Radio } from '@/components/ui/radio';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Calendar as CalendarIcon, Plus, CalendarRange } from 'lucide-react';
import dayjs from '@/lib/dayjs';
import { useTranslations } from 'next-intl';
import {
  BulkCreationMode,
  SpecificDatesConfig,
  RecurringWeekdaysConfig,
} from '@/lib/api/types';

const CustomCheckbox = ({
  isChecked,
  onChange,
}: {
  isChecked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
  const boxSize = '24px';
  const iconSize = 16;

  return (
    <Box as="label" cursor="pointer" display="inline-flex" alignItems="center">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      <Box
        w={boxSize}
        h={boxSize}
        border="2px solid"
        borderColor={isChecked ? 'green.500' : 'border'}
        bg={isChecked ? 'green.500' : 'transparent'}
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition="all 0.2s"
        _hover={{ borderColor: 'green.600' }}
      >
        {isChecked && (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={3}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </Box>
    </Box>
  );
};

interface BulkSessionDateSelectorProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  baseStartTime?: Date;
  onModeChange: (mode: BulkCreationMode) => void;
  onSpecificDatesChange: (config: SpecificDatesConfig | undefined) => void;
  onRecurringWeekdaysChange: (
    config: RecurringWeekdaysConfig | undefined
  ) => void;
}

export function BulkSessionDateSelector({
  enabled,
  onEnabledChange,
  baseStartTime,
  onModeChange,
  onSpecificDatesChange,
  onRecurringWeekdaysChange,
}: BulkSessionDateSelectorProps) {
  const t = useTranslations('session.bulkCreation');

  const WEEKDAYS = [
    { value: 1, label: t('weekdays.monday'), short: t('weekdays.mon') },
    { value: 2, label: t('weekdays.tuesday'), short: t('weekdays.tue') },
    { value: 3, label: t('weekdays.wednesday'), short: t('weekdays.wed') },
    { value: 4, label: t('weekdays.thursday'), short: t('weekdays.thu') },
    { value: 5, label: t('weekdays.friday'), short: t('weekdays.fri') },
    { value: 6, label: t('weekdays.saturday'), short: t('weekdays.sat') },
    { value: 0, label: t('weekdays.sunday'), short: t('weekdays.sun') },
  ];

  const [mode, setMode] = useState<BulkCreationMode>('single');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(4);
  const [tempDate, setTempDate] = useState<string>('');

  // Reset to single mode when disabled
  useEffect(() => {
    if (!enabled) {
      setMode('single');
      setSelectedDates([]);
      setSelectedWeekdays([]);
      setNumberOfWeeks(4);
      setTempDate('');
      onModeChange('single');
      onSpecificDatesChange(undefined);
      onRecurringWeekdaysChange(undefined);
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeChange = (newMode: BulkCreationMode) => {
    setMode(newMode);
    onModeChange(newMode);

    if (newMode !== 'specific-dates') {
      setSelectedDates([]);
      onSpecificDatesChange(undefined);
    }
    if (newMode !== 'recurring-weekdays') {
      setSelectedWeekdays([]);
      setNumberOfWeeks(4);
      onRecurringWeekdaysChange(undefined);
    }
  };

  const handleAddDate = () => {
    if (!tempDate) return;
    const date = new Date(tempDate);
    if (isNaN(date.getTime())) return;

    const dateString = dayjs(date).format('YYYY-MM-DD');
    const isAlreadySelected = selectedDates.some(
      (d) => dayjs(d).format('YYYY-MM-DD') === dateString
    );

    if (!isAlreadySelected) {
      const newDates = [...selectedDates, date];
      setSelectedDates(newDates);
      onSpecificDatesChange({ dates: newDates });
    }
    setTempDate('');
  };

  const handleRemoveDate = (dateToRemove: Date) => {
    const newDates = selectedDates.filter(
      (d) =>
        dayjs(d).format('YYYY-MM-DD') !==
        dayjs(dateToRemove).format('YYYY-MM-DD')
    );
    setSelectedDates(newDates);
    onSpecificDatesChange(
      newDates.length > 0 ? { dates: newDates } : undefined
    );
  };

  const handleWeekdayToggle = (weekday: number) => {
    const newWeekdays = selectedWeekdays.includes(weekday)
      ? selectedWeekdays.filter((w) => w !== weekday)
      : [...selectedWeekdays, weekday].sort((a, b) => a - b);

    setSelectedWeekdays(newWeekdays);
    onRecurringWeekdaysChange(
      newWeekdays.length > 0
        ? {
            weekdays: newWeekdays,
            numberOfWeeks,
            startDate: baseStartTime,
          }
        : undefined
    );
  };

  const handleWeeksChange = (weeks: number) => {
    const validWeeks = Math.max(1, Math.min(52, weeks));
    setNumberOfWeeks(validWeeks);
    if (selectedWeekdays.length > 0) {
      onRecurringWeekdaysChange({
        weekdays: selectedWeekdays,
        numberOfWeeks: validWeeks,
        startDate: baseStartTime,
      });
    }
  };

  const calculateTotalSessions = () => {
    if (mode === 'specific-dates') {
      return selectedDates.length + 1;
    }
    if (mode === 'recurring-weekdays') {
      return selectedWeekdays.length * numberOfWeeks + 1;
    }
    return 1;
  };

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="lg"
      p={4}
      bg={{ base: 'white', _dark: 'gray.800' }}
    >
      {/* Header with toggle */}
      <Flex justify="space-between" align="center" mb={enabled ? 4 : 0}>
        <HStack gap={2}>
          <CalendarRange size={20} color="#38a169" />
          <Text fontWeight="semibold" fontSize="md">
            {t('title')}
          </Text>
        </HStack>
        <HStack gap={2}>
          <CustomCheckbox
            isChecked={enabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onEnabledChange(e.target.checked)
            }
          />
          <Text fontSize="sm" color="fg.muted">
            {enabled ? t('disable') : t('enable')}
          </Text>
        </HStack>
      </Flex>

      {enabled && (
        <VStack align="stretch" gap={6}>
          <Radio.Root
            value={mode}
            onValueChange={(details: { value: string | null }) => {
              if (details.value) {
                handleModeChange(details.value as BulkCreationMode);
              }
            }}
          >
            <VStack align="stretch" gap={4}>
              {/* Specific dates mode */}
              <Box>
                <Radio.Item value="specific-dates" cursor="pointer">
                  <VStack align="start" gap={1} ml={2}>
                    <Text fontWeight="medium" fontSize="sm">
                      {t('specificDatesMode')}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {t('specificDatesDesc')}
                    </Text>
                  </VStack>
                </Radio.Item>

                {mode === 'specific-dates' && (
                  <Box mt={4} ml={8}>
                    <VStack align="stretch" gap={4}>
                      <HStack gap={2}>
                        <Input
                          type="date"
                          value={tempDate}
                          onChange={(e) => setTempDate(e.target.value)}
                          size="sm"
                          min={dayjs().format('YYYY-MM-DD')}
                          leftElement={<CalendarIcon size={16} />}
                        />
                        <Button
                          size="sm"
                          colorPalette="green"
                          onClick={handleAddDate}
                          disabled={!tempDate}
                        >
                          <Plus size={16} style={{ marginRight: '4px' }} />
                          {t('addDate') || 'Add'}
                        </Button>
                      </HStack>

                      {selectedDates.length > 0 && (
                        <Box>
                          <Text
                            fontSize="xs"
                            fontWeight="medium"
                            mb={2}
                            color="fg.muted"
                          >
                            {t('selectedDates', {
                              count: selectedDates.length,
                            })}
                          </Text>
                          <Flex flexWrap="wrap" gap={2}>
                            {selectedDates
                              .sort((a, b) => a.getTime() - b.getTime())
                              .map((date) => (
                                <HStack
                                  key={dayjs(date).format('YYYY-MM-DD')}
                                  gap={1}
                                  px={2}
                                  py={1}
                                  bg="brand.50"
                                  _dark={{
                                    bg: 'brand.900/30',
                                    color: 'brand.300',
                                  }}
                                  color="green.600"
                                  borderRadius="md"
                                  fontSize="xs"
                                >
                                  <Text>
                                    {dayjs(date).format('DD/MM/YYYY')}
                                  </Text>
                                  <Box
                                    as="button"
                                    onClick={() => handleRemoveDate(date)}
                                    color="green.400"
                                    _hover={{ color: 'brand.600' }}
                                  >
                                    <X size={14} />
                                  </Box>
                                </HStack>
                              ))}
                          </Flex>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}
              </Box>

              {/* Recurring weekdays mode */}
              <Box>
                <Radio.Item value="recurring-weekdays" cursor="pointer">
                  <VStack align="start" gap={1} ml={2}>
                    <Text fontWeight="medium" fontSize="sm">
                      {t('recurringMode')}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {t('recurringModeDesc')}
                    </Text>
                  </VStack>
                </Radio.Item>

                {mode === 'recurring-weekdays' && (
                  <Box mt={4} ml={8}>
                    <VStack align="stretch" gap={4}>
                      <Box>
                        <Text fontSize="xs" fontWeight="medium" mb={2}>
                          {t('selectWeekdays')}
                        </Text>
                        <Grid templateColumns="repeat(7, 1fr)" gap={2}>
                          {WEEKDAYS.map((weekday) => (
                            <VStack key={weekday.value} gap={1}>
                              <Checkbox
                                colorPalette="green"
                                checked={selectedWeekdays.includes(
                                  weekday.value
                                )}
                                onCheckedChange={() =>
                                  handleWeekdayToggle(weekday.value)
                                }
                              />
                              <Text fontSize="2xs" color="fg.muted">
                                {weekday.short}
                              </Text>
                            </VStack>
                          ))}
                        </Grid>
                      </Box>

                      <Field.Root>
                        <Field.Label fontSize="xs">
                          {t('numberOfWeeks')}
                        </Field.Label>
                        <HStack gap={3}>
                          <Input
                            type="number"
                            min={1}
                            max={52}
                            value={numberOfWeeks}
                            onChange={(e) =>
                              handleWeeksChange(parseInt(e.target.value) || 1)
                            }
                            width="80px"
                            size="sm"
                          />
                          <Text fontSize="xs" color="fg.muted">
                            {t('weeksUnit')}
                          </Text>
                        </HStack>
                      </Field.Root>

                      {selectedWeekdays.length > 0 && (
                        <Box
                          p={3}
                          bg="gray.50"
                          _dark={{ bg: 'whiteAlpha.50' }}
                          borderRadius="md"
                          fontSize="xs"
                        >
                          <Text mb={1}>
                            <strong>{t('selectedWeekdays')}</strong>:{' '}
                            {selectedWeekdays
                              .map(
                                (w) =>
                                  WEEKDAYS.find((wd) => wd.value === w)?.label
                              )
                              .join(', ')}
                          </Text>
                          <Text>
                            <strong>{t('totalSessions')}</strong>:{' '}
                            {t('totalSessionsCalc', {
                              perWeek: selectedWeekdays.length,
                              weeks: numberOfWeeks,
                              total: selectedWeekdays.length * numberOfWeeks,
                            })}
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}
              </Box>
            </VStack>
          </Radio.Root>

          {/* Summary */}
          <Box pt={4} borderTopWidth="1px" borderColor="border">
            <Flex align="center" justify="space-between">
              <Text fontSize="sm" fontWeight="medium">
                {t('totalSessions')}
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                {calculateTotalSessions()}
              </Text>
            </Flex>
          </Box>
        </VStack>
      )}
    </Box>
  );
}
