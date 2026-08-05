'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  HStack,
  Portal,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { CalendarClock, Calculator, Check, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toaster } from '@/components/ui/toaster';
import { SessionService } from '@/lib/api/session.service';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  ISession,
  Venue,
  VenueCustomerType,
  VenueCourtSchedule,
  VenueRentalAvailability,
  VenueRentalQuote,
  VenueRentalSelectionMode,
} from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { venueDateTimeToIso, venueDateValue } from './date-time';
import VenueCourtScheduleGrid from './VenueCourtScheduleGrid';
import { SESSION_LINK_ENABLED } from './feature-flags';

const pad = (value: number) => String(value).padStart(2, '0');

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(
    amount
  );

const minuteToTime = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;

export default function VenueRentalForm({ venue }: { venue: Venue }) {
  const t = useTranslations('venueRental');
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const defaultDate = () =>
    venueDateValue(
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      venue.timezone
    );
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState('18:00');
  const [end, setEnd] = useState('20:00');
  const [numberOfCourts, setNumberOfCourts] = useState(1);
  const [customerType, setCustomerType] = useState(VenueCustomerType.WALK_IN);
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [availability, setAvailability] =
    useState<VenueRentalAvailability | null>(null);
  const [quote, setQuote] = useState<VenueRentalQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [schedule, setSchedule] = useState<VenueCourtSchedule | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectionMode, setSelectionMode] = useState(
    VenueRentalSelectionMode.AUTO_ASSIGN
  );
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace(
        `/auth/signin?returnUrl=${encodeURIComponent(`/venues/${venue.slug || venue.id}/rent`)}`
      );
    }
  }, [isAuthenticated, isHydrated, router, venue.id, venue.slug]);

  useEffect(() => {
    if (!user?.id) return;
    SessionService.getAllSessions({
      hostId: user.id,
      startTimeFrom: new Date().toISOString(),
      limit: 100,
      sortBy: 'date',
      sortOrder: 'asc',
    })
      .then((result) =>
        setSessions(result.data.filter((item) => item.venue?.id === venue.id))
      )
      .catch(() => setSessions([]));
  }, [user?.id, venue.id]);

  useEffect(() => {
    if (!quote) return;
    const update = () => {
      const seconds = Math.max(
        0,
        Math.floor((new Date(quote.expiresAt).getTime() - Date.now()) / 1000)
      );
      setRemainingSeconds(seconds);
      if (!seconds) setQuote(null);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [quote]);

  useEffect(
    () => setQuote(null),
    [date, start, end, numberOfCourts, customerType, selectionMode]
  );

  useEffect(() => {
    if (!venue.courtSelectionEnabled) return;
    setLoadingSchedule(true);
    VenueRentalService.getCourtSchedule(venue.id, date, customerType)
      .then(setSchedule)
      .catch(() => {
        setSchedule(null);
        toaster.error({ title: t('errors.schedule') });
      })
      .finally(() => setLoadingSchedule(false));
  }, [customerType, date, t, venue.courtSelectionEnabled, venue.id]);

  const sessionOptions = useMemo(
    () => [
      { value: '', label: t('form.noSession') },
      ...sessions.map((item) => ({ value: item.id, label: item.name })),
    ],
    [sessions, t]
  );
  const selectedStartMinute =
    Number(start.split(':')[0]) * 60 + Number(start.split(':')[1]);
  const selectedEndMinute =
    Number(end.split(':')[0]) * 60 + Number(end.split(':')[1]);
  const mobileAvailableCourts = useMemo(
    () =>
      (schedule?.courts || []).filter((court) => {
        const relevant = court.slots.filter(
          (slot) =>
            slot.startMinute < selectedEndMinute &&
            slot.endMinute > selectedStartMinute
        );
        return (
          relevant.length > 0 &&
          relevant.every((slot) => slot.status === 'AVAILABLE')
        );
      }),
    [schedule, selectedEndMinute, selectedStartMinute]
  );

  const calculate = async () => {
    try {
      setLoadingQuote(true);
      const startTime = venueDateTimeToIso(date, start, venue.timezone);
      const endTime = venueDateTimeToIso(date, end, venue.timezone);
      if (
        venue.courtSelectionEnabled &&
        selectionMode === VenueRentalSelectionMode.SELECT_COURTS &&
        !selectedCourtIds.length
      ) {
        toaster.error({ title: t('errors.selectCourt') });
        return;
      }
      const quotePromise = VenueRentalService.createQuote(venue.id, {
        startTime,
        endTime,
        numberOfCourts:
          selectionMode === VenueRentalSelectionMode.SELECT_COURTS
            ? selectedCourtIds.length
            : numberOfCourts,
        customerType,
        selectionMode,
        courtIds:
          selectionMode === VenueRentalSelectionMode.SELECT_COURTS
            ? selectedCourtIds
            : undefined,
      });
      if (venue.courtSelectionEnabled) {
        const nextQuote = await quotePromise;
        setSelectedCourtIds(nextQuote.requestedCourtIds);
        setQuote(nextQuote);
        return;
      }
      const [nextAvailability, nextQuote] = await Promise.all([
        VenueRentalService.getAvailability(venue.id, startTime, endTime),
        quotePromise,
      ]);
      setAvailability(nextAvailability);
      if (nextAvailability.availableCourts < numberOfCourts) {
        setQuote(null);
        toaster.error({ title: t('errors.capacity') });
        return;
      }
      setQuote(nextQuote);
    } catch (error) {
      console.error(error);
      setQuote(null);
      toaster.error({ title: t('errors.quote') });
    } finally {
      setLoadingQuote(false);
    }
  };

  const submit = async () => {
    if (!quote || !contactName.trim() || !contactPhone.trim()) return;
    try {
      setSubmitting(true);
      const request = await VenueRentalService.createRequest({
        quoteId: quote.id,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes.trim() || undefined,
        sessionId: sessionId || undefined,
      });
      toaster.success({ title: t('messages.created') });
      router.push(`/my/rentals/${request.id}`);
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('errors.submit') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VStack
      align="stretch"
      gap={5}
      maxW={venue.courtSelectionEnabled ? '1280px' : '760px'}
      mx="auto"
      pb={{ base: quote ? '104px' : 0, md: 0 }}
    >
      <Box
        borderWidth="1px"
        borderRadius="md"
        p={4}
        bg={{ base: 'white', _dark: 'gray.900' }}
      >
        <HStack gap={3} align="start">
          <MapPin size={20} />
          <Box>
            <Text fontWeight="bold">{venue.name}</Text>
            <Text fontSize="sm" color="gray.500">
              {venue.address}
            </Text>
          </Box>
        </HStack>
      </Box>

      <Box
        borderWidth="1px"
        borderRadius="md"
        p={{ base: 4, md: 5 }}
        bg={{ base: 'white', _dark: 'gray.900' }}
      >
        <HStack mb={4}>
          <CalendarClock size={19} />
          <Text fontWeight="semibold">{t('form.schedule')}</Text>
        </HStack>
        <SimpleGrid
          columns={{ base: 1, md: SESSION_LINK_ENABLED ? 3 : 2 }}
          gap={4}
        >
          <Field label={t('form.date')}>
            <Input
              type="date"
              value={date}
              min={defaultDate()}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label={t('form.customerType')}>
            <SearchableSelect
              value={customerType}
              onChange={(value) => setCustomerType(value as VenueCustomerType)}
              options={Object.values(VenueCustomerType).map((value) => ({
                value,
                label: t(`customerType.${value}`),
              }))}
            />
          </Field>
          {SESSION_LINK_ENABLED && (
            <Field label={t('form.session')}>
              <SearchableSelect
                value={sessionId}
                onChange={setSessionId}
                options={sessionOptions}
              />
            </Field>
          )}
        </SimpleGrid>
        {venue.courtSelectionEnabled && (
          <HStack
            mt={4}
            p={1}
            gap={1}
            bg="gray.100"
            borderRadius="md"
            w="fit-content"
          >
            {Object.values(VenueRentalSelectionMode).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={selectionMode === mode ? 'solid' : 'ghost'}
                colorPalette={selectionMode === mode ? 'green' : 'gray'}
                onClick={() => {
                  setSelectionMode(mode);
                  setSelectedCourtIds([]);
                  setQuote(null);
                }}
              >
                {t(`selectionMode.${mode}`)}
              </Button>
            ))}
          </HStack>
        )}
        {(!venue.courtSelectionEnabled ||
          selectionMode === VenueRentalSelectionMode.AUTO_ASSIGN) && (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mt={4}>
            <Field label={t('form.start')}>
              <Input
                type="time"
                step={1800}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field label={t('form.end')}>
              <Input
                type="time"
                step={1800}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
            <Field label={t('form.courts')}>
              <Input
                type="number"
                min={1}
                max={venue.numberOfCourts || 1}
                value={numberOfCourts}
                onChange={(e) => setNumberOfCourts(Number(e.target.value))}
              />
            </Field>
          </SimpleGrid>
        )}
        {venue.courtSelectionEnabled && loadingSchedule && (
          <Text mt={5} color="gray.500" fontSize="sm">
            {t('schedule.loading')}
          </Text>
        )}
        {venue.courtSelectionEnabled && schedule && (
          <>
            <Box display={{ base: 'none', md: 'block' }} mt={5}>
              <VenueCourtScheduleGrid
                schedule={schedule}
                selection={
                  selectedCourtIds.length
                    ? {
                        courtIds: selectedCourtIds,
                        startMinute: selectedStartMinute,
                        endMinute: selectedEndMinute,
                      }
                    : null
                }
                onSelectionChange={
                  selectionMode === VenueRentalSelectionMode.SELECT_COURTS
                    ? (selection) => {
                        setSelectedCourtIds(selection.courtIds);
                        setNumberOfCourts(selection.courtIds.length);
                        setStart(minuteToTime(selection.startMinute));
                        setEnd(minuteToTime(selection.endMinute));
                        setQuote(null);
                      }
                    : undefined
                }
              />
            </Box>
            {selectionMode === VenueRentalSelectionMode.SELECT_COURTS && (
              <Box display={{ base: 'block', md: 'none' }} mt={4}>
                <SimpleGrid columns={2} gap={3}>
                  <Field label={t('form.start')}>
                    <Input
                      type="time"
                      step={1800}
                      value={start}
                      onChange={(event) => {
                        setStart(event.target.value);
                        setSelectedCourtIds([]);
                      }}
                    />
                  </Field>
                  <Field label={t('form.end')}>
                    <Input
                      type="time"
                      step={1800}
                      value={end}
                      onChange={(event) => {
                        setEnd(event.target.value);
                        setSelectedCourtIds([]);
                      }}
                    />
                  </Field>
                </SimpleGrid>
                <Text fontWeight="semibold" mt={4} mb={2}>
                  {t('schedule.availableCourts')}
                </Text>
                <SimpleGrid columns={2} gap={2}>
                  {mobileAvailableCourts.map((court) => {
                    const selected = selectedCourtIds.includes(court.id);
                    return (
                      <Button
                        key={court.id}
                        variant={selected ? 'solid' : 'outline'}
                        colorPalette={selected ? 'green' : 'gray'}
                        justifyContent="flex-start"
                        onClick={() => {
                          setSelectedCourtIds((current) =>
                            selected
                              ? current.filter((id) => id !== court.id)
                              : [...current, court.id]
                          );
                          setQuote(null);
                        }}
                      >
                        {selected && <Check size={16} />}
                        {court.name}
                      </Button>
                    );
                  })}
                </SimpleGrid>
              </Box>
            )}
          </>
        )}
        <Button
          mt={4}
          onClick={calculate}
          loading={loadingQuote}
          colorPalette="green"
        >
          <Calculator size={17} />
          {t('actions.calculate')}
        </Button>
        {availability && (
          <Text
            mt={3}
            fontSize="sm"
            color={
              availability.availableCourts >= numberOfCourts
                ? 'green.600'
                : 'red.600'
            }
          >
            {t('form.available', { count: availability.availableCourts })}
          </Text>
        )}
      </Box>

      {quote && (
        <Box
          borderWidth="1px"
          borderColor="green.300"
          borderRadius="md"
          p={{ base: 4, md: 5 }}
          bg={{ base: 'green.50', _dark: 'green.950' }}
        >
          <HStack justify="space-between" mb={3}>
            <Text fontWeight="semibold">{t('quote.title')}</Text>
            <Text fontSize="sm">
              {t('quote.expires', {
                minutes: pad(Math.floor(remainingSeconds / 60)),
                seconds: pad(remainingSeconds % 60),
              })}
            </Text>
          </HStack>
          <VStack align="stretch" gap={2}>
            {quote.breakdown.items.map((item, index) => (
              <HStack key={`${item.from}-${index}`} justify="space-between">
                <Text fontSize="sm">
                  {item.from} - {item.to}
                </Text>
                <Text fontSize="sm">{money(item.amount, quote.currency)}</Text>
              </HStack>
            ))}
          </VStack>
          <HStack justify="space-between" borderTopWidth="1px" mt={3} pt={3}>
            <Text fontWeight="bold">{t('quote.total')}</Text>
            <Text fontSize="xl" fontWeight="bold" color="green.700">
              {money(quote.totalAmount, quote.currency)}
            </Text>
          </HStack>
        </Box>
      )}

      {quote && (
        <Box
          borderWidth="1px"
          borderRadius="md"
          p={{ base: 4, md: 5 }}
          bg={{ base: 'white', _dark: 'gray.900' }}
        >
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field label={t('form.contactName')} required>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </Field>
            <Field label={t('form.contactPhone')} required>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </Field>
          </SimpleGrid>
          <Field label={t('form.notes')} mt={4}>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          {venue.bookingPolicy && (
            <Box
              mt={4}
              p={3}
              bg="gray.50"
              _dark={{ bg: 'whiteAlpha.100' }}
              borderRadius="md"
            >
              <Text fontSize="xs" color="gray.500">
                {t('form.policy')}
              </Text>
              <Text fontSize="sm" whiteSpace="pre-wrap">
                {venue.bookingPolicy}
              </Text>
            </Box>
          )}
          <Button
            w="full"
            mt={5}
            colorPalette="green"
            onClick={submit}
            loading={submitting}
            disabled={!contactName.trim() || !contactPhone.trim()}
          >
            {t('actions.submit')}
          </Button>
        </Box>
      )}
      {quote && (
        <Portal>
          <HStack
            display={{ base: 'flex', md: 'none' }}
            position="fixed"
            left="0"
            right="0"
            bottom="0"
            zIndex="sticky"
            justify="space-between"
            bg={{ base: 'white', _dark: 'gray.900' }}
            borderTopWidth="1px"
            px={4}
            py={3}
            boxShadow="0 -4px 16px rgba(0, 0, 0, 0.08)"
          >
            <Box minW="0">
              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                {date} · {start}-{end} ·{' '}
                {t('card.courts', {
                  count: quote.numberOfCourts,
                })}
              </Text>
              <Text fontWeight="bold" color="green.700">
                {money(quote.totalAmount, quote.currency)}
              </Text>
            </Box>
            <Text fontSize="sm" flexShrink={0}>
              {pad(Math.floor(remainingSeconds / 60))}:
              {pad(remainingSeconds % 60)}
            </Text>
          </HStack>
        </Portal>
      )}
    </VStack>
  );
}
