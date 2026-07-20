'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Ban, CalendarPlus, Check, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toaster } from '@/components/ui/toaster';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  Venue,
  VenueCourtBlock,
  VenueCourtBlockType,
  VenueCourtSchedule,
  VenueCustomerType,
  VenueRentalSelectionMode,
} from '@/lib/api/types';
import {
  venueDateTimeToIso,
  venueDateValue,
  venueTimeValue,
} from './date-time';
import VenueCourtScheduleGrid from './VenueCourtScheduleGrid';

const toTime = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

export default function VenueManagerSchedule({ venue }: { venue: Venue }) {
  const t = useTranslations('venueRental.managerSchedule');
  const router = useRouter();
  const [date, setDate] = useState(
    venueDateValue(new Date().toISOString(), venue.timezone)
  );
  const [schedule, setSchedule] = useState<VenueCourtSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState({
    start: '18:00',
    end: '20:00',
    customerType: VenueCustomerType.WALK_IN,
    contactName: '',
    contactPhone: '',
    notes: '',
  });
  const [courtIds, setCourtIds] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<VenueCourtBlock[]>([]);
  const [block, setBlock] = useState({
    courtId: '',
    type: VenueCourtBlockType.MAINTENANCE,
    start: '12:00',
    end: '13:00',
    reason: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextSchedule, nextBlocks] = await Promise.all([
        VenueRentalService.getManagerCourtSchedule(venue.id, date),
        VenueRentalService.getCourtBlocks(venue.id),
      ]);
      setSchedule(nextSchedule);
      setBlocks(
        nextBlocks.filter(
          (item) => venueDateValue(item.startTime, venue.timezone) === date
        )
      );
    } catch {
      setSchedule(null);
      toaster.error({ title: t('loadError') });
    } finally {
      setLoading(false);
    }
  }, [date, t, venue.id, venue.timezone]);

  useEffect(() => {
    load();
  }, [load]);

  const availableCourtIds = useMemo(() => {
    if (!schedule) return [];
    const [startHour, startMinute] = manual.start.split(':').map(Number);
    const [endHour, endMinute] = manual.end.split(':').map(Number);
    const from = startHour * 60 + startMinute;
    const to = endHour * 60 + endMinute;
    return schedule.courts
      .filter((court) => {
        const relevant = court.slots.filter(
          (slot) => slot.startMinute < to && slot.endMinute > from
        );
        return (
          relevant.length > 0 &&
          relevant.every((slot) => slot.status === 'AVAILABLE')
        );
      })
      .map((court) => court.id);
  }, [manual.end, manual.start, schedule]);

  return (
    <VStack align="stretch" gap={5}>
      <HStack gap={3} flexWrap="wrap">
        <Input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          maxW="220px"
        />
        <Button variant="outline" onClick={load} loading={loading}>
          <RefreshCw size={16} />
          {t('refresh')}
        </Button>
      </HStack>
      {schedule && (
        <VenueCourtScheduleGrid
          schedule={schedule}
          manager
          onSlotClick={(courtId, slot) => {
            if (slot.requestId) {
              router.push(`/manage/venues/rentals/${slot.requestId}`);
              return;
            }
            if (slot.status === 'AVAILABLE') {
              setCourtIds([courtId]);
              setManual((current) => ({
                ...current,
                start: toTime(slot.startMinute),
                end: toTime(slot.endMinute),
              }));
            }
          }}
        />
      )}

      <Box borderTopWidth="1px" pt={5}>
        <HStack mb={4}>
          <CalendarPlus size={18} />
          <Text fontWeight="bold">{t('manualTitle')}</Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <Field label={t('start')}>
            <Input
              type="time"
              step={1800}
              value={manual.start}
              onChange={(event) => {
                setManual((current) => ({
                  ...current,
                  start: event.target.value,
                }));
                setCourtIds([]);
              }}
            />
          </Field>
          <Field label={t('end')}>
            <Input
              type="time"
              step={1800}
              value={manual.end}
              onChange={(event) => {
                setManual((current) => ({
                  ...current,
                  end: event.target.value,
                }));
                setCourtIds([]);
              }}
            />
          </Field>
          <Field label={t('customerType')}>
            <SearchableSelect
              value={manual.customerType}
              onChange={(customerType) =>
                setManual((current) => ({
                  ...current,
                  customerType: customerType as VenueCustomerType,
                }))
              }
              options={Object.values(VenueCustomerType).map((value) => ({
                value,
                label: t(`customerTypeValue.${value}`),
              }))}
            />
          </Field>
          <Field label={t('contactName')} required>
            <Input
              value={manual.contactName}
              onChange={(event) =>
                setManual((current) => ({
                  ...current,
                  contactName: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t('contactPhone')} required>
            <Input
              value={manual.contactPhone}
              onChange={(event) =>
                setManual((current) => ({
                  ...current,
                  contactPhone: event.target.value,
                }))
              }
            />
          </Field>
          <Field label={t('notes')}>
            <Input
              value={manual.notes}
              onChange={(event) =>
                setManual((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </Field>
        </SimpleGrid>
        <Text fontWeight="semibold" mt={4} mb={2}>
          {t('selectCourts')}
        </Text>
        <HStack gap={2} flexWrap="wrap">
          {schedule?.courts
            .filter((court) => availableCourtIds.includes(court.id))
            .map((court) => {
              const selected = courtIds.includes(court.id);
              return (
                <Button
                  key={court.id}
                  size="sm"
                  variant={selected ? 'solid' : 'outline'}
                  colorPalette={selected ? 'green' : 'gray'}
                  onClick={() =>
                    setCourtIds((current) =>
                      selected
                        ? current.filter((id) => id !== court.id)
                        : [...current, court.id]
                    )
                  }
                >
                  {selected && <Check size={15} />}
                  {court.name}
                </Button>
              );
            })}
        </HStack>
        <Button
          mt={4}
          colorPalette="green"
          loading={saving}
          disabled={
            !courtIds.length ||
            !manual.contactName.trim() ||
            !manual.contactPhone.trim()
          }
          onClick={async () => {
            setSaving(true);
            try {
              await VenueRentalService.createManualRental({
                venueId: venue.id,
                startTime: venueDateTimeToIso(
                  date,
                  manual.start,
                  venue.timezone
                ),
                endTime: venueDateTimeToIso(date, manual.end, venue.timezone),
                numberOfCourts: courtIds.length,
                customerType: manual.customerType,
                selectionMode: VenueRentalSelectionMode.SELECT_COURTS,
                courtIds,
                contactName: manual.contactName.trim(),
                contactPhone: manual.contactPhone.trim(),
                notes: manual.notes.trim() || undefined,
              });
              setCourtIds([]);
              setManual((current) => ({
                ...current,
                contactName: '',
                contactPhone: '',
                notes: '',
              }));
              await load();
              toaster.success({ title: t('created') });
            } catch {
              toaster.error({ title: t('saveError') });
            } finally {
              setSaving(false);
            }
          }}
        >
          <CalendarPlus size={16} />
          {t('confirmManual')}
        </Button>
      </Box>

      <Box borderTopWidth="1px" pt={5}>
        <HStack mb={4}>
          <Ban size={18} />
          <Text fontWeight="bold">{t('blockTitle')}</Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <Field label={t('blockScope')}>
            <SearchableSelect
              value={block.courtId}
              onChange={(courtId) =>
                setBlock((current) => ({ ...current, courtId }))
              }
              options={[
                { value: '', label: t('wholeVenue') },
                ...(schedule?.courts.map((court) => ({
                  value: court.id,
                  label: court.name,
                })) || []),
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
          <Field label={t('start')}>
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
          <Field label={t('end')}>
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
        </SimpleGrid>
        <Button
          mt={4}
          variant="outline"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await VenueRentalService.createCourtBlock(venue.id, {
                courtId: block.courtId || undefined,
                type: block.type,
                startTime: venueDateTimeToIso(
                  date,
                  block.start,
                  venue.timezone
                ),
                endTime: venueDateTimeToIso(date, block.end, venue.timezone),
                reason: block.reason.trim() || undefined,
              });
              setBlock((current) => ({ ...current, reason: '' }));
              await load();
              toaster.success({ title: t('blockCreated') });
            } catch {
              toaster.error({ title: t('blockError') });
            } finally {
              setSaving(false);
            }
          }}
        >
          <Ban size={16} />
          {t('createBlock')}
        </Button>
        <VStack align="stretch" gap={2} mt={4}>
          {blocks.map((item) => (
            <HStack
              key={item.id}
              justify="space-between"
              borderWidth="1px"
              p={3}
              borderRadius="md"
            >
              <Box>
                <Text fontSize="sm" fontWeight="semibold">
                  {item.court?.name || t('wholeVenue')} ·{' '}
                  {t(`blockTypeValue.${item.type}`)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {venueTimeValue(item.startTime, venue.timezone)} -{' '}
                  {venueTimeValue(item.endTime, venue.timezone)}
                  {item.reason ? ` · ${item.reason}` : ''}
                </Text>
              </Box>
              <Button
                size="sm"
                variant="ghost"
                colorPalette="red"
                aria-label={t('removeBlock')}
                onClick={async () => {
                  await VenueRentalService.removeCourtBlock(venue.id, item.id);
                  await load();
                }}
              >
                <Trash2 size={16} />
              </Button>
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}
