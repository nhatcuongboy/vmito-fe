'use client';

import { Box, Flex, Grid, IconButton, Text, VStack } from '@chakra-ui/react';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Clock3, MapPin, Plus, Trash2 } from 'lucide-react';
import {
  ClubVenueGroupDraft,
  ClubVenueScheduleValidation,
  createClubScheduleDraft,
  createClubVenueGroupDraft,
} from '@/components/club/club-venue-schedule';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import {
  SearchableSelect,
  SearchableSelectOption,
} from '@/components/ui/SearchableSelect';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { LegacySelect } from '@/components/ui/VSelect';

const EMPTY_VALIDATION: ClubVenueScheduleValidation = {
  isValid: true,
  venueErrors: {},
  scheduleErrors: {},
};

export interface ClubVenueScheduleEditorHandle {
  focusFirstError: () => void;
}

interface ClubVenueScheduleEditorProps {
  value: ClubVenueGroupDraft[];
  venueOptions: SearchableSelectOption[];
  onChange: (groups: ClubVenueGroupDraft[]) => void;
  onVenueSelected?: (venueId: string) => void;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  validation?: ClubVenueScheduleValidation;
}

const ClubVenueScheduleEditor = forwardRef<
  ClubVenueScheduleEditorHandle,
  ClubVenueScheduleEditorProps
>(function ClubVenueScheduleEditor(
  {
    value,
    venueOptions,
    onChange,
    onVenueSelected,
    onSearchChange,
    isLoading = false,
    validation = EMPTY_VALIDATION,
  },
  ref
) {
  const t = useTranslations('clubs.venueEditor');
  const tClubs = useTranslations('clubs');
  const rootRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focusFirstError: () => {
      requestAnimationFrame(() => {
        const firstInvalidControl = rootRef.current?.querySelector<HTMLElement>(
          '[aria-invalid="true"]'
        );
        firstInvalidControl?.focus();
        firstInvalidControl?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    },
  }));

  const selectedVenueIds = useMemo(
    () => new Set(value.map((group) => group.venueId).filter(Boolean)),
    [value]
  );

  const updateGroup = (
    groupId: string,
    updater: (group: ClubVenueGroupDraft) => ClubVenueGroupDraft
  ) => {
    onChange(
      value.map((group) => (group.id === groupId ? updater(group) : group))
    );
  };

  const updateVenue = (groupId: string, venueId: string) => {
    updateGroup(groupId, (group) => ({ ...group, venueId }));
    if (venueId) onVenueSelected?.(venueId);
  };

  const removeVenue = (groupId: string) => {
    onChange(value.filter((group) => group.id !== groupId));
  };

  const addSchedule = (groupId: string) => {
    updateGroup(groupId, (group) => ({
      ...group,
      schedules: [...group.schedules, createClubScheduleDraft()],
    }));
  };

  const updateSchedule = (
    groupId: string,
    scheduleId: string,
    update: Partial<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>
  ) => {
    updateGroup(groupId, (group) => ({
      ...group,
      schedules: group.schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, ...update } : schedule
      ),
    }));
  };

  const removeSchedule = (groupId: string, scheduleId: string) => {
    updateGroup(groupId, (group) => ({
      ...group,
      schedules: group.schedules.filter(
        (schedule) => schedule.id !== scheduleId
      ),
    }));
  };

  return (
    <Field
      ref={rootRef}
      label={t('title')}
      helperText={t('description')}
      invalid={!validation.isValid}
      errorText={!validation.isValid ? t('validationSummary') : undefined}
    >
      <VStack w="full" align="stretch" gap={3}>
        {value.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            minH="150px"
            borderWidth="1px"
            borderStyle="dashed"
            borderColor={{ base: 'gray.300', _dark: 'gray.600' }}
            borderRadius="xl"
            bg={{ base: 'gray.50', _dark: 'gray.800' }}
            px={4}
            py={6}
            textAlign="center"
          >
            <Flex
              w={10}
              h={10}
              align="center"
              justify="center"
              borderRadius="full"
              bg={{ base: 'green.100', _dark: 'green.900' }}
              color={{ base: 'green.700', _dark: 'green.200' }}
              mb={2}
            >
              <MapPin size={20} aria-hidden="true" />
            </Flex>
            <Text fontWeight="semibold">{t('emptyTitle')}</Text>
            <Text
              mt={1}
              mb={4}
              maxW="420px"
              fontSize="sm"
              color="gray.500"
              textWrap="pretty"
            >
              {t('emptyDescription')}
            </Text>
            <Button
              type="button"
              size="sm"
              colorPalette="green"
              onClick={() => onChange([createClubVenueGroupDraft()])}
            >
              <Plus size={16} aria-hidden="true" />
              {t('addVenue')}
            </Button>
          </Flex>
        ) : (
          value.map((group, groupIndex) => {
            const selectedVenue = venueOptions.find(
              (option) => option.value === group.venueId
            );
            const venueError = validation.venueErrors[group.id];
            const optionsForGroup = venueOptions.map((option) => ({
              ...option,
              disabled:
                option.value !== group.venueId &&
                selectedVenueIds.has(option.value),
            }));

            return (
              <Box
                key={group.id}
                borderWidth="1px"
                borderColor={
                  venueError
                    ? { base: 'red.300', _dark: 'red.600' }
                    : { base: 'gray.200', _dark: 'gray.700' }
                }
                borderRadius="xl"
                bg={{ base: 'white', _dark: 'gray.900' }}
                overflow="hidden"
              >
                <Flex
                  justify="space-between"
                  align="center"
                  gap={3}
                  px={{ base: 3, md: 4 }}
                  py={3}
                  bg={{ base: 'gray.50', _dark: 'gray.800' }}
                  borderBottomWidth="1px"
                  borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
                >
                  <Flex align="center" gap={2} minW={0}>
                    <Flex
                      w={7}
                      h={7}
                      flexShrink={0}
                      align="center"
                      justify="center"
                      borderRadius="full"
                      bg={{ base: 'green.100', _dark: 'green.900' }}
                      color={{ base: 'green.700', _dark: 'green.200' }}
                      fontSize="sm"
                      fontWeight="bold"
                      fontVariantNumeric="tabular-nums"
                    >
                      {groupIndex + 1}
                    </Flex>
                    <Text fontWeight="semibold" truncate>
                      {selectedVenue?.label ||
                        t('venueNumber', { number: groupIndex + 1 })}
                    </Text>
                  </Flex>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => removeVenue(group.id)}
                    flexShrink={0}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                    {t('removeVenue')}
                  </Button>
                </Flex>

                <VStack align="stretch" gap={4} p={{ base: 3, md: 4 }}>
                  <Box>
                    <Text
                      as="label"
                      display="block"
                      mb={1.5}
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      {t('selectVenueLabel')}
                    </Text>
                    <SearchableSelect
                      options={optionsForGroup}
                      value={group.venueId}
                      onChange={(venueId) => updateVenue(group.id, venueId)}
                      placeholder={tClubs('searchVenue')}
                      searchPlaceholder={tClubs('searchVenue')}
                      noOptionsMessage={tClubs('noVenueSelected')}
                      onSearchChange={onSearchChange}
                      isLoading={isLoading}
                      isInvalid={!!venueError}
                      ariaLabel={t('selectVenueAria', {
                        number: groupIndex + 1,
                      })}
                    />
                    {selectedVenue?.sublabel && (
                      <Flex mt={1.5} align="start" gap={1.5} color="gray.500">
                        <MapPin
                          size={14}
                          aria-hidden="true"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <Text fontSize="xs" lineClamp={2}>
                          {selectedVenue.sublabel}
                        </Text>
                      </Flex>
                    )}
                    {venueError && (
                      <Text
                        mt={1.5}
                        fontSize="sm"
                        color={{ base: 'red.600', _dark: 'red.300' }}
                        aria-live="polite"
                      >
                        {t(`errors.${venueError}`)}
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Flex justify="space-between" align="center" gap={3} mb={2}>
                      <Flex align="center" gap={2}>
                        <Clock3 size={16} aria-hidden="true" />
                        <Text fontSize="sm" fontWeight="semibold">
                          {t('scheduleTitle')}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          fontVariantNumeric="tabular-nums"
                        >
                          ({group.schedules.length})
                        </Text>
                      </Flex>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        colorPalette="green"
                        onClick={() => addSchedule(group.id)}
                      >
                        <Plus size={14} aria-hidden="true" />
                        {t('addSchedule')}
                      </Button>
                    </Flex>

                    {group.schedules.length === 0 ? (
                      <Box
                        borderWidth="1px"
                        borderStyle="dashed"
                        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
                        borderRadius="lg"
                        px={3}
                        py={4}
                        textAlign="center"
                      >
                        <Text mb={2} fontSize="sm" color="gray.500">
                          {t('noSchedules')}
                        </Text>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          colorPalette="green"
                          onClick={() => addSchedule(group.id)}
                        >
                          <Plus size={14} aria-hidden="true" />
                          {t('addSchedule')}
                        </Button>
                      </Box>
                    ) : (
                      <VStack align="stretch" gap={2}>
                        {group.schedules.map((schedule, scheduleIndex) => {
                          const scheduleError =
                            validation.scheduleErrors[schedule.id];
                          const dayInputId = `${schedule.id}-day`;
                          const startInputId = `${schedule.id}-start`;
                          const endInputId = `${schedule.id}-end`;

                          return (
                            <Grid
                              key={schedule.id}
                              templateColumns={{
                                base: 'minmax(0, 1fr) minmax(0, 1fr) 40px',
                                md: 'minmax(120px, 1.2fr) minmax(105px, 1fr) auto minmax(105px, 1fr) 40px',
                              }}
                              gap={2}
                              alignItems="end"
                              borderWidth="1px"
                              borderColor={
                                scheduleError
                                  ? {
                                      base: 'red.300',
                                      _dark: 'red.600',
                                    }
                                  : {
                                      base: 'gray.200',
                                      _dark: 'gray.700',
                                    }
                              }
                              borderRadius="lg"
                              bg={{ base: 'gray.50', _dark: 'gray.800' }}
                              p={3}
                            >
                              <Box
                                minW={0}
                                gridColumn={{ base: '1 / 3', md: 'auto' }}
                              >
                                <label htmlFor={dayInputId}>
                                  <Text
                                    as="span"
                                    display="block"
                                    mb={1}
                                    fontSize="xs"
                                    color="gray.600"
                                    _dark={{ color: 'gray.300' }}
                                  >
                                    {tClubs('dayOfWeek')}
                                  </Text>
                                </label>
                                <LegacySelect
                                  id={dayInputId}
                                  name={`venue-${group.id}-schedule-${schedule.id}-day`}
                                  size="sm"
                                  value={String(schedule.dayOfWeek)}
                                  aria-invalid={!!scheduleError}
                                  onChange={(
                                    event: React.ChangeEvent<HTMLSelectElement>
                                  ) =>
                                    updateSchedule(group.id, schedule.id, {
                                      dayOfWeek: Number(event.target.value),
                                    })
                                  }
                                >
                                  {Array.from({ length: 7 }, (_, day) => (
                                    <option key={day} value={day}>
                                      {tClubs(
                                        `dayNames.${day as 0 | 1 | 2 | 3 | 4 | 5 | 6}`
                                      )}
                                    </option>
                                  ))}
                                </LegacySelect>
                              </Box>

                              <Box minW={0}>
                                <label htmlFor={startInputId}>
                                  <Text
                                    as="span"
                                    display="block"
                                    mb={1}
                                    fontSize="xs"
                                    color="gray.600"
                                    _dark={{ color: 'gray.300' }}
                                  >
                                    {tClubs('startTime')}
                                  </Text>
                                </label>
                                <VDateTimeInput
                                  id={startInputId}
                                  name={`venue-${group.id}-schedule-${schedule.id}-start`}
                                  type="time"
                                  size="sm"
                                  value={schedule.startTime}
                                  aria-invalid={!!scheduleError}
                                  onChange={(event) =>
                                    updateSchedule(group.id, schedule.id, {
                                      startTime: event.target.value,
                                    })
                                  }
                                  placeholder="--:--"
                                />
                              </Box>

                              <Text
                                display={{ base: 'none', md: 'block' }}
                                pb={2}
                                color="gray.400"
                                aria-hidden="true"
                              >
                                –
                              </Text>

                              <Box minW={0}>
                                <label htmlFor={endInputId}>
                                  <Text
                                    as="span"
                                    display="block"
                                    mb={1}
                                    fontSize="xs"
                                    color="gray.600"
                                    _dark={{ color: 'gray.300' }}
                                  >
                                    {tClubs('endTime')}
                                  </Text>
                                </label>
                                <VDateTimeInput
                                  id={endInputId}
                                  name={`venue-${group.id}-schedule-${schedule.id}-end`}
                                  type="time"
                                  size="sm"
                                  value={schedule.endTime}
                                  aria-invalid={!!scheduleError}
                                  onChange={(event) =>
                                    updateSchedule(group.id, schedule.id, {
                                      endTime: event.target.value,
                                    })
                                  }
                                  placeholder="--:--"
                                />
                              </Box>

                              <IconButton
                                type="button"
                                size="sm"
                                variant="ghost"
                                colorPalette="red"
                                gridColumn={{ base: '3', md: 'auto' }}
                                gridRow={{ base: '1', md: 'auto' }}
                                aria-label={t('removeScheduleAria', {
                                  number: scheduleIndex + 1,
                                })}
                                onClick={() =>
                                  removeSchedule(group.id, schedule.id)
                                }
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </IconButton>

                              {scheduleError && (
                                <Text
                                  gridColumn="1 / -1"
                                  fontSize="sm"
                                  color={{
                                    base: 'red.600',
                                    _dark: 'red.300',
                                  }}
                                  aria-live="polite"
                                >
                                  {t(`errors.${scheduleError}`)}
                                </Text>
                              )}
                            </Grid>
                          );
                        })}
                      </VStack>
                    )}
                  </Box>
                </VStack>
              </Box>
            );
          })
        )}

        {value.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            colorPalette="green"
            borderStyle="dashed"
            w="full"
            onClick={() => onChange([...value, createClubVenueGroupDraft()])}
          >
            <Plus size={16} aria-hidden="true" />
            {t('addAnotherVenue')}
          </Button>
        )}
      </VStack>
    </Field>
  );
});

export default ClubVenueScheduleEditor;
