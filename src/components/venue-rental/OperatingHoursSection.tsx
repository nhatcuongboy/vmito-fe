'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Copy, Plus, Save, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { toaster } from '@/components/ui/toaster';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import { VenueOperatingPeriod } from '@/lib/api/types';
import ConfirmDialog from './ConfirmDialog';
import SectionCard from './SectionCard';
import {
  minuteToTime,
  timeToMinute,
  validatePeriods,
} from './schedule-validation';

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

interface OperatingHoursSectionProps {
  venueId: string;
  periods: VenueOperatingPeriod[];
  needsReview: boolean;
  onReload: () => Promise<void>;
}

export default function OperatingHoursSection({
  venueId,
  periods: serverPeriods,
  needsReview,
  onReload,
}: OperatingHoursSectionProps) {
  const t = useTranslations('venueRental.courts');
  const [drafts, setDrafts] = useState<VenueOperatingPeriod[]>(serverPeriods);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirmAction<'copyMonday'>();

  useEffect(() => setDrafts(serverPeriods), [serverPeriods]);

  const isDirty = useMemo(
    () => JSON.stringify(drafts) !== JSON.stringify(serverPeriods),
    [drafts, serverPeriods]
  );
  useUnsavedChanges(isDirty);

  const errors = useMemo(() => validatePeriods(drafts), [drafts]);
  const hasErrors = Object.keys(errors).length > 0;

  const invalidDayLabels = useMemo(
    () =>
      [
        ...new Set(
          Object.keys(errors).map((index) => drafts[Number(index)].dayOfWeek)
        ),
      ]
        .sort()
        .map((day) => t(`day.${day}`))
        .join(', '),
    [drafts, errors, t]
  );

  const mondayPeriods = drafts.filter((item) => item.dayOfWeek === 1);
  const otherDaysHavePeriods = drafts.some((item) => item.dayOfWeek !== 1);

  const updatePeriod = (index: number, data: Partial<VenueOperatingPeriod>) =>
    setDrafts((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...data } : item
      )
    );

  const applyCopyMonday = () => {
    setDrafts(
      DAYS.flatMap((day) =>
        mondayPeriods.map((period) => ({ ...period, dayOfWeek: day }))
      )
    );
    confirm.close();
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      await VenueRentalService.replaceOperatingPeriods(
        venueId,
        drafts.map(({ dayOfWeek, startMinute, endMinute }) => ({
          dayOfWeek,
          startMinute,
          endMinute,
        })),
        true
      );
      await onReload();
      toaster.success({ title: t('scheduleSaved') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionCard
        title={t('hoursTitle')}
        headerRight={
          <HStack gap={2}>
            {isDirty && (
              <Badge colorPalette="orange" size="sm">
                {t('unsavedBadge')}
              </Badge>
            )}
            <Badge colorPalette={needsReview ? 'orange' : 'green'} size="sm">
              {needsReview ? t('needsReviewBadge') : t('reviewedBadge')}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={mondayPeriods.length === 0}
              onClick={() => {
                if (otherDaysHavePeriods) confirm.request('copyMonday');
                else applyCopyMonday();
              }}
            >
              <Copy size={15} aria-hidden="true" />
              {t('copyMonday')}
            </Button>
          </HStack>
        }
        footer={
          <HStack gap={3} align="center" flexWrap="wrap" w="full">
            <Button
              colorPalette="green"
              disabled={hasErrors || drafts.length === 0}
              loading={saving}
              onClick={saveSchedule}
            >
              <Save size={16} aria-hidden="true" />
              {t('saveSchedule')}
            </Button>
            <Box aria-live="polite" flex="1" minW={0}>
              {hasErrors && (
                <Text fontSize="sm" color="red.600">
                  {t('errors.fixBeforeSave', { days: invalidDayLabels })}
                </Text>
              )}
            </Box>
          </HStack>
        }
      >
        <VStack align="stretch" gap={3}>
          {DAYS.map((day) => {
            const dayPeriods = drafts
              .map((period, originalIndex) => ({ period, originalIndex }))
              .filter(({ period }) => period.dayOfWeek === day);

            return (
              <Box key={day} borderBottomWidth="1px" pb={3}>
                <HStack justify="space-between" mb={2}>
                  <Heading as="h3" size="sm">
                    {t(`day.${day}`)}
                  </Heading>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={t('addPeriod')}
                    onClick={() =>
                      setDrafts((current) => [
                        ...current,
                        { dayOfWeek: day, startMinute: 480, endMinute: 1320 },
                      ])
                    }
                  >
                    <Plus size={15} aria-hidden="true" />
                  </Button>
                </HStack>

                {dayPeriods.length === 0 ? (
                  <Text fontSize="xs" color="gray.400" fontStyle="italic">
                    {t('errors.emptyDay')}
                  </Text>
                ) : (
                  <VStack align="stretch" gap={2}>
                    {dayPeriods.map(({ period, originalIndex }) => {
                      const errorKey = errors[originalIndex];
                      return (
                        <Box key={`${day}-${originalIndex}`}>
                          <HStack>
                            <Input
                              type="time"
                              step={1800}
                              aria-label={t('from')}
                              aria-invalid={!!errorKey}
                              borderColor={errorKey ? 'red.400' : undefined}
                              value={minuteToTime(period.startMinute)}
                              onChange={(event) =>
                                updatePeriod(originalIndex, {
                                  startMinute: timeToMinute(event.target.value),
                                })
                              }
                            />
                            <Text aria-hidden="true">–</Text>
                            <Input
                              type="time"
                              step={1800}
                              aria-label={t('to')}
                              aria-invalid={!!errorKey}
                              borderColor={errorKey ? 'red.400' : undefined}
                              value={minuteToTime(period.endMinute)}
                              onChange={(event) =>
                                updatePeriod(originalIndex, {
                                  endMinute: timeToMinute(event.target.value),
                                })
                              }
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              colorPalette="red"
                              aria-label={t('removePeriod')}
                              onClick={() =>
                                setDrafts((current) =>
                                  current.filter(
                                    (_, index) => index !== originalIndex
                                  )
                                )
                              }
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </Button>
                          </HStack>
                          {errorKey && (
                            <Text fontSize="xs" color="red.600" mt={1}>
                              {t(`errors.${errorKey}`)}
                            </Text>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            );
          })}
        </VStack>
      </SectionCard>

      <ConfirmDialog
        isOpen={confirm.target !== null}
        title={t('confirmCopyMondayTitle')}
        body={t('confirmCopyMondayBody')}
        actionText={t('copyMonday')}
        cancelText={t('cancel')}
        isDestructive={false}
        onClose={confirm.close}
        onConfirm={applyCopyMonday}
      />
    </>
  );
}
