'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import {
  ArrowDown,
  ArrowUp,
  CalendarX,
  Copy,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toaster } from '@/components/ui/toaster';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  Venue,
  VenueCourt,
  VenueCourtBlock,
  VenueCourtBlockType,
  VenueCourtStatus,
  VenueOperatingPeriod,
} from '@/lib/api/types';
import { venueDateTimeToIso, venueDateValue } from './date-time';

const toTime = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
const toMinute = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};
const TIME_OPTIONS = Array.from({ length: 49 }, (_, index) => ({
  value: toTime(index * 30),
  label: toTime(index * 30),
}));

export default function VenueCourtManagement({
  venue,
  enabled,
}: {
  venue: Venue;
  enabled: boolean;
}) {
  const t = useTranslations('venueRental.courts');
  const [courts, setCourts] = useState<VenueCourt[]>([]);
  const [periods, setPeriods] = useState<VenueOperatingPeriod[]>([]);
  const [blocks, setBlocks] = useState<VenueCourtBlock[]>([]);
  const [scheduleNeedsReview, setScheduleNeedsReview] = useState(true);
  const [busy, setBusy] = useState('');
  const [newCourt, setNewCourt] = useState({ name: '', code: '' });
  const defaultDate = venueDateValue(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    venue.timezone
  );
  const [block, setBlock] = useState({
    courtId: '',
    type: VenueCourtBlockType.MAINTENANCE,
    date: defaultDate,
    start: '08:00',
    end: '10:00',
    reason: '',
  });

  const load = useCallback(async () => {
    try {
      const [nextCourts, schedule, nextBlocks] = await Promise.all([
        VenueRentalService.getCourts(venue.id),
        VenueRentalService.getOperatingPeriods(venue.id),
        VenueRentalService.getCourtBlocks(venue.id),
      ]);
      setCourts(nextCourts);
      setPeriods(schedule.periods);
      setScheduleNeedsReview(schedule.scheduleNeedsReview);
      setBlocks(nextBlocks);
    } catch {
      toaster.error({ title: t('loadError') });
    }
  }, [t, venue.id]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  if (!enabled) return null;

  const updateLocalCourt = (id: string, data: Partial<VenueCourt>) =>
    setCourts((current) =>
      current.map((court) => (court.id === id ? { ...court, ...data } : court))
    );

  const moveCourt = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= courts.length) return;
    const first = courts[index];
    const second = courts[target];
    setBusy(first.id);
    try {
      await Promise.all([
        VenueRentalService.updateCourt(venue.id, first.id, {
          displayOrder: second.displayOrder,
        }),
        VenueRentalService.updateCourt(venue.id, second.id, {
          displayOrder: first.displayOrder,
        }),
      ]);
      await load();
    } catch {
      toaster.error({ title: t('saveError') });
    } finally {
      setBusy('');
    }
  };

  const addPeriod = (dayOfWeek: number) =>
    setPeriods((current) => [
      ...current,
      { dayOfWeek, startMinute: 480, endMinute: 1320 },
    ]);

  return (
    <VStack align="stretch" gap={8} pt={6} borderTopWidth="1px">
      <Box>
        <Text fontSize="lg" fontWeight="bold">
          {t('inventoryTitle')}
        </Text>
        <Text fontSize="sm" color="gray.500" mb={4}>
          {t('inventoryHelp')}
        </Text>
        <VStack align="stretch" gap={2}>
          {courts.map((court, index) => (
            <HStack
              key={court.id}
              gap={2}
              flexWrap={{ base: 'wrap', md: 'nowrap' }}
            >
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('moveUp')}
                disabled={index === 0}
                onClick={() => moveCourt(index, -1)}
              >
                <ArrowUp size={15} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('moveDown')}
                disabled={index === courts.length - 1}
                onClick={() => moveCourt(index, 1)}
              >
                <ArrowDown size={15} />
              </Button>
              <Input
                aria-label={t('name')}
                value={court.name}
                onChange={(event) =>
                  updateLocalCourt(court.id, { name: event.target.value })
                }
              />
              <Input
                aria-label={t('code')}
                value={court.code}
                onChange={(event) =>
                  updateLocalCourt(court.id, { code: event.target.value })
                }
              />
              <SearchableSelect
                value={court.status}
                onChange={(value) =>
                  updateLocalCourt(court.id, {
                    status: value as VenueCourtStatus,
                  })
                }
                options={Object.values(VenueCourtStatus).map((value) => ({
                  value,
                  label: t(`status.${value}`),
                }))}
              />
              <Button
                size="sm"
                aria-label={t('save')}
                loading={busy === court.id}
                onClick={async () => {
                  setBusy(court.id);
                  try {
                    await VenueRentalService.updateCourt(
                      venue.id,
                      court.id,
                      court
                    );
                    await load();
                  } catch {
                    toaster.error({ title: t('saveError') });
                  } finally {
                    setBusy('');
                  }
                }}
              >
                <Save size={16} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                colorPalette="red"
                aria-label={t('remove')}
                onClick={async () => {
                  try {
                    await VenueRentalService.removeCourt(venue.id, court.id);
                    await load();
                  } catch {
                    toaster.error({ title: t('saveError') });
                  }
                }}
              >
                <Trash2 size={16} />
              </Button>
            </HStack>
          ))}
        </VStack>
        <HStack mt={3} gap={2} flexWrap="wrap">
          <Input
            placeholder={t('name')}
            value={newCourt.name}
            onChange={(event) =>
              setNewCourt((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
          <Input
            placeholder={t('code')}
            value={newCourt.code}
            onChange={(event) =>
              setNewCourt((current) => ({
                ...current,
                code: event.target.value,
              }))
            }
          />
          <Button
            disabled={!newCourt.name.trim() || !newCourt.code.trim()}
            onClick={async () => {
              try {
                await VenueRentalService.createCourt(venue.id, {
                  ...newCourt,
                  displayOrder: courts.length + 1,
                });
                setNewCourt({ name: '', code: '' });
                await load();
              } catch {
                toaster.error({ title: t('saveError') });
              }
            }}
          >
            <Plus size={16} />
            {t('addCourt')}
          </Button>
        </HStack>
      </Box>

      <Box>
        <HStack justify="space-between" mb={1} flexWrap="wrap">
          <Text fontSize="lg" fontWeight="bold">
            {t('hoursTitle')}
          </Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const monday = periods.filter((item) => item.dayOfWeek === 1);
              setPeriods(
                Array.from({ length: 7 }, (_, day) =>
                  monday.map((period) => ({ ...period, dayOfWeek: day + 1 }))
                ).flat()
              );
            }}
          >
            <Copy size={15} />
            {t('copyMonday')}
          </Button>
        </HStack>
        <Text fontSize="sm" color="gray.500" mb={4}>
          {scheduleNeedsReview ? t('reviewRequired') : t('reviewed')}
        </Text>
        <VStack align="stretch" gap={3}>
          {Array.from({ length: 7 }, (_, index) => index + 1).map((day) => (
            <Box key={day} borderBottomWidth="1px" pb={3}>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="semibold">{t(`day.${day}`)}</Text>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={t('addPeriod')}
                  onClick={() => addPeriod(day)}
                >
                  <Plus size={15} />
                </Button>
              </HStack>
              <VStack align="stretch" gap={2}>
                {periods
                  .map((period, originalIndex) => ({ period, originalIndex }))
                  .filter(({ period }) => period.dayOfWeek === day)
                  .map(({ period, originalIndex }) => (
                    <HStack key={`${day}-${originalIndex}`}>
                      <SearchableSelect
                        value={toTime(period.startMinute)}
                        onChange={(value) =>
                          setPeriods((current) =>
                            current.map((item, index) =>
                              index === originalIndex
                                ? {
                                    ...item,
                                    startMinute: toMinute(value),
                                  }
                                : item
                            )
                          )
                        }
                        options={TIME_OPTIONS.slice(0, -1)}
                      />
                      <Text>-</Text>
                      <SearchableSelect
                        value={toTime(period.endMinute)}
                        onChange={(value) =>
                          setPeriods((current) =>
                            current.map((item, index) =>
                              index === originalIndex
                                ? {
                                    ...item,
                                    endMinute: toMinute(value),
                                  }
                                : item
                            )
                          )
                        }
                        options={TIME_OPTIONS.slice(1)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        aria-label={t('removePeriod')}
                        onClick={() =>
                          setPeriods((current) =>
                            current.filter(
                              (_, index) => index !== originalIndex
                            )
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    </HStack>
                  ))}
              </VStack>
            </Box>
          ))}
        </VStack>
        <Button
          mt={4}
          colorPalette="green"
          onClick={async () => {
            setBusy('periods');
            try {
              await VenueRentalService.replaceOperatingPeriods(
                venue.id,
                periods.map(({ dayOfWeek, startMinute, endMinute }) => ({
                  dayOfWeek,
                  startMinute,
                  endMinute,
                })),
                true
              );
              await load();
              toaster.success({ title: t('scheduleSaved') });
            } catch {
              toaster.error({ title: t('saveError') });
            } finally {
              setBusy('');
            }
          }}
          loading={busy === 'periods'}
        >
          <Save size={16} />
          {t('saveSchedule')}
        </Button>
      </Box>

      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          {t('blocksTitle')}
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <Field label={t('blockCourt')}>
            <SearchableSelect
              value={block.courtId}
              onChange={(courtId) =>
                setBlock((current) => ({ ...current, courtId }))
              }
              options={[
                { value: '', label: t('wholeVenue') },
                ...courts.map((court) => ({
                  value: court.id,
                  label: court.name,
                })),
              ]}
            />
          </Field>
          <Field label={t('blockType')}>
            <SearchableSelect
              value={block.type}
              onChange={(type) =>
                setBlock((current) => ({
                  ...current,
                  type: type as VenueCourtBlockType,
                }))
              }
              options={Object.values(VenueCourtBlockType).map((value) => ({
                value,
                label: t(`blockTypeValue.${value}`),
              }))}
            />
          </Field>
          <Field label={t('blockDate')}>
            <Input
              type="date"
              value={block.date}
              onChange={(event) =>
                setBlock((current) => ({
                  ...current,
                  date: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t('from')}>
            <Input
              type="time"
              step={1800}
              value={block.start}
              onChange={(event) =>
                setBlock((current) => ({
                  ...current,
                  start: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t('to')}>
            <Input
              type="time"
              step={1800}
              value={block.end}
              onChange={(event) =>
                setBlock((current) => ({
                  ...current,
                  end: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t('reason')}>
            <Input
              value={block.reason}
              onChange={(event) =>
                setBlock((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
            />
          </Field>
        </SimpleGrid>
        <Button
          mt={3}
          onClick={async () => {
            try {
              await VenueRentalService.createCourtBlock(venue.id, {
                courtId: block.courtId || undefined,
                type: block.type,
                startTime: venueDateTimeToIso(
                  block.date,
                  block.start,
                  venue.timezone
                ),
                endTime: venueDateTimeToIso(
                  block.date,
                  block.end,
                  venue.timezone
                ),
                reason: block.reason || undefined,
              });
              await load();
            } catch {
              toaster.error({ title: t('saveError') });
            }
          }}
        >
          <CalendarX size={16} />
          {t('addBlock')}
        </Button>
        <VStack align="stretch" mt={4} gap={2}>
          {blocks.map((item) => (
            <HStack key={item.id} borderBottomWidth="1px" py={2}>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="semibold">
                  {item.court?.name || t('wholeVenue')} -{' '}
                  {t(`blockTypeValue.${item.type}`)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: venue.timezone,
                  }).format(new Date(item.startTime))}
                  {item.reason ? ` - ${item.reason}` : ''}
                </Text>
              </Box>
              <Button
                size="sm"
                variant="ghost"
                colorPalette="red"
                aria-label={t('removeBlock')}
                onClick={async () => {
                  try {
                    await VenueRentalService.removeCourtBlock(
                      venue.id,
                      item.id
                    );
                    await load();
                  } catch {
                    toaster.error({ title: t('saveError') });
                  }
                }}
              >
                <Trash2 size={15} />
              </Button>
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}
