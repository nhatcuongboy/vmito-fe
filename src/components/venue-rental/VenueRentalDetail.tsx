'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Center,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import {
  CalendarClock,
  Check,
  LayoutGrid,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import { SessionService } from '@/lib/api/session.service';
import {
  ISession,
  VenueCourt,
  VenueCustomerType,
  VenueRentalProposalStatus,
  VenueRentalRequest,
  VenueRentalSelectionMode,
  VenueRentalStatus,
} from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  venueDateTimeToIso,
  venueDateValue,
  venueTimeValue,
} from './date-time';
import RentalStatusBadge from './RentalStatusBadge';

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(
    amount
  );

export default function VenueRentalDetail({
  id,
  manage = false,
}: {
  id: string;
  manage?: boolean;
}) {
  const t = useTranslations('venueRental');
  const user = useAuthStore((state) => state.user);
  const [request, setRequest] = useState<VenueRentalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [reasonMode, setReasonMode] = useState<'reject' | 'cancel' | null>(
    null
  );
  const [reason, setReason] = useState('');
  const [counterOpen, setCounterOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [reallocateOpen, setReallocateOpen] = useState(false);
  const [venueCourts, setVenueCourts] = useState<VenueCourt[]>([]);
  const [reallocateIds, setReallocateIds] = useState<string[]>([]);
  const [counter, setCounter] = useState({
    date: '',
    start: '',
    end: '',
    numberOfCourts: 1,
    customerType: VenueCustomerType.WALK_IN,
    selectionMode: VenueRentalSelectionMode.AUTO_ASSIGN,
    courtIds: [] as string[],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRequest(await VenueRentalService.getById(id));
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('errors.load') });
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!request) return;
    const startTime = request.confirmedStartTime || request.quote?.startTime;
    const endTime = request.confirmedEndTime || request.quote?.endTime;
    if (!startTime || !endTime) return;
    const timezone = request.venue.timezone;
    setCounter({
      date: venueDateValue(startTime, timezone),
      start: venueTimeValue(startTime, timezone),
      end: venueTimeValue(endTime, timezone),
      numberOfCourts:
        request.confirmedNumberOfCourts || request.quote?.numberOfCourts || 1,
      customerType:
        request.confirmedCustomerType ||
        request.quote?.customerType ||
        VenueCustomerType.WALK_IN,
      selectionMode:
        request.selectionMode || VenueRentalSelectionMode.AUTO_ASSIGN,
      courtIds: request.requestedCourtIds || [],
    });
  }, [request]);

  const openSessionLink = async () => {
    if (!request || !user?.id) return;
    try {
      setSessionsLoading(true);
      const startTime = request.confirmedStartTime || request.quote?.startTime;
      const endTime = request.confirmedEndTime || request.quote?.endTime;
      if (!startTime || !endTime) return;
      const result = await SessionService.getAllSessions({
        hostId: user.id,
        startTimeFrom: startTime,
        startTimeTo: endTime,
        limit: 100,
        sortBy: 'date',
        sortOrder: 'asc',
      });
      setSessions(
        result.data.filter((session) => {
          const sessionStart = session.startTime
            ? new Date(session.startTime).getTime()
            : 0;
          const sessionEnd = session.endTime
            ? new Date(session.endTime).getTime()
            : 0;
          return (
            session.venue?.id === request.venueId &&
            sessionStart >= new Date(startTime).getTime() &&
            sessionEnd <= new Date(endTime).getTime()
          );
        })
      );
      setSessionOpen(true);
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('errors.loadSessions') });
    } finally {
      setSessionsLoading(false);
    }
  };

  const run = async (name: string, operation: () => Promise<unknown>) => {
    try {
      setAction(name);
      await operation();
      toaster.success({ title: t('messages.updated') });
      await load();
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('errors.action') });
    } finally {
      setAction(null);
    }
  };

  if (loading)
    return (
      <Center py={20}>
        <Spinner />
      </Center>
    );
  if (!request)
    return (
      <Center py={20}>
        <Text>{t('errors.notFound')}</Text>
      </Center>
    );

  const startTime =
    request.confirmedStartTime || request.quote?.startTime || request.createdAt;
  const endTime =
    request.confirmedEndTime || request.quote?.endTime || request.createdAt;
  const numberOfCourts =
    request.confirmedNumberOfCourts || request.quote?.numberOfCourts || 0;
  const amount = request.confirmedAmount ?? request.quote?.totalAmount ?? 0;
  const currency =
    request.confirmedCurrency || request.quote?.currency || 'VND';
  const pendingProposal = request.proposals.find(
    (item) => item.status === VenueRentalProposalStatus.PENDING
  );
  const canCancel = ![
    VenueRentalStatus.REJECTED,
    VenueRentalStatus.CANCELLED,
    VenueRentalStatus.COMPLETED,
  ].includes(request.status);

  return (
    <VStack align="stretch" gap={5} maxW="860px" mx="auto">
      <Box
        borderWidth="1px"
        borderRadius="md"
        p={{ base: 4, md: 5 }}
        bg={{ base: 'white', _dark: 'gray.900' }}
      >
        <HStack justify="space-between" align="start">
          <Box>
            <Text fontSize="xl" fontWeight="bold">
              {request.venue.name}
            </Text>
            <HStack color="gray.500">
              <MapPin size={14} />
              <Text fontSize="sm">{request.venue.address}</Text>
            </HStack>
          </Box>
          <RentalStatusBadge status={request.status} />
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={5}>
          <HStack align="start">
            <CalendarClock size={18} />
            <Box>
              <Text fontSize="xs" color="gray.500">
                {t('detail.schedule')}
              </Text>
              <Text>
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: request.venue.timezone,
                }).format(new Date(startTime))}{' '}
                - {venueTimeValue(endTime, request.venue.timezone)}
              </Text>
            </Box>
          </HStack>
          <Box>
            <Text fontSize="xs" color="gray.500">
              {t('detail.total')}
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="green.700">
              {money(amount, currency)}
            </Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">
              {t('detail.courts')}
            </Text>
            <Text>{numberOfCourts}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">
              {t('detail.customerType')}
            </Text>
            <Text>
              {t(
                `customerType.${request.confirmedCustomerType || request.quote?.customerType || VenueCustomerType.WALK_IN}`
              )}
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      {request.courtAllocations?.length ? (
        <Box borderWidth="1px" borderRadius="md" p={{ base: 4, md: 5 }}>
          <HStack justify="space-between" flexWrap="wrap">
            <Box>
              <Text fontWeight="semibold">{t('detail.allocatedCourts')}</Text>
              <Text mt={1}>
                {request.courtAllocations
                  .map((allocation) => allocation.court.name)
                  .join(', ')}
              </Text>
            </Box>
            {manage && request.status === VenueRentalStatus.CONFIRMED && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const courts = await VenueRentalService.getCourts(
                      request.venueId
                    );
                    setVenueCourts(courts);
                    setReallocateIds(
                      request.courtAllocations?.map(
                        (allocation) => allocation.courtId
                      ) || []
                    );
                    setReallocateOpen(true);
                  } catch {
                    toaster.error({ title: t('errors.action') });
                  }
                }}
              >
                <LayoutGrid size={16} />
                {t('actions.reallocate')}
              </Button>
            )}
          </HStack>
        </Box>
      ) : null}

      {!manage && request.status === VenueRentalStatus.CONFIRMED && (
        <Box
          borderWidth="1px"
          borderRadius="md"
          p={{ base: 4, md: 5 }}
          bg={{ base: 'white', _dark: 'gray.900' }}
        >
          <Text fontWeight="semibold">{t('detail.session')}</Text>
          {request.session ? (
            <Text mt={2}>{request.session.name}</Text>
          ) : (
            <Button
              mt={3}
              variant="outline"
              loading={sessionsLoading}
              onClick={openSessionLink}
            >
              {t('actions.linkSession')}
            </Button>
          )}
        </Box>
      )}

      <Box
        borderWidth="1px"
        borderRadius="md"
        p={{ base: 4, md: 5 }}
        bg={{ base: 'white', _dark: 'gray.900' }}
      >
        <Text fontWeight="semibold" mb={3}>
          {t('detail.contact')}
        </Text>
        <VStack align="stretch" gap={2}>
          <HStack>
            <UserRound size={16} />
            <Text>{request.contactName}</Text>
          </HStack>
          <HStack>
            <Phone size={16} />
            <Text>{request.contactPhone}</Text>
          </HStack>
          {request.notes && (
            <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">
              {request.notes}
            </Text>
          )}
        </VStack>
      </Box>

      {pendingProposal && (
        <Box
          borderWidth="1px"
          borderColor="blue.300"
          bg={{ base: 'blue.50', _dark: 'blue.950' }}
          borderRadius="md"
          p={4}
        >
          <Text fontWeight="semibold">{t('proposal.title')}</Text>
          <Text mt={1}>
            {new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: request.venue.timezone,
            }).format(new Date(pendingProposal.startTime))}{' '}
            - {venueTimeValue(pendingProposal.endTime, request.venue.timezone)}
          </Text>
          <Text fontWeight="bold" mt={1}>
            {money(pendingProposal.totalAmount, pendingProposal.currency)}
          </Text>
          {!manage && (
            <HStack mt={4}>
              <Button
                colorPalette="green"
                loading={action === 'accept'}
                onClick={() =>
                  run('accept', () =>
                    VenueRentalService.acceptProposal(id, pendingProposal.id)
                  )
                }
              >
                {t('actions.accept')}
              </Button>
              <Button
                variant="outline"
                loading={action === 'decline'}
                onClick={() =>
                  run('decline', () =>
                    VenueRentalService.declineProposal(id, pendingProposal.id)
                  )
                }
              >
                {t('actions.decline')}
              </Button>
            </HStack>
          )}
        </Box>
      )}

      <HStack gap={3} flexWrap="wrap">
        {manage && request.status === VenueRentalStatus.PENDING && (
          <Button
            colorPalette="green"
            loading={action === 'approve'}
            onClick={() => run('approve', () => VenueRentalService.approve(id))}
          >
            {t('actions.approve')}
          </Button>
        )}
        {manage &&
          (request.status === VenueRentalStatus.PENDING ||
            request.status === VenueRentalStatus.COUNTER_OFFERED) && (
            <>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setVenueCourts(
                      await VenueRentalService.getCourts(request.venueId)
                    );
                  } catch {
                    setVenueCourts([]);
                  }
                  setCounterOpen(true);
                }}
              >
                {t('actions.counter')}
              </Button>
              <Button
                colorPalette="red"
                variant="outline"
                onClick={() => setReasonMode('reject')}
              >
                {t('actions.reject')}
              </Button>
            </>
          )}
        {canCancel && (
          <Button
            variant="outline"
            colorPalette="gray"
            onClick={() => setReasonMode('cancel')}
          >
            {t('actions.cancel')}
          </Button>
        )}
      </HStack>

      <Box
        borderWidth="1px"
        borderRadius="md"
        p={{ base: 4, md: 5 }}
        bg={{ base: 'white', _dark: 'gray.900' }}
      >
        <Text fontWeight="semibold" mb={4}>
          {t('timeline.title')}
        </Text>
        <VStack align="stretch" gap={3}>
          {request.events.map((event) => (
            <HStack key={event.id} align="start">
              <Box
                w="8px"
                h="8px"
                mt={2}
                bg="green.500"
                borderRadius="full"
                flexShrink={0}
              />
              <Box>
                <Text fontSize="sm" fontWeight="medium">
                  {t(`event.${event.type}`)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(event.createdAt))}
                  {event.actor?.name ? ` · ${event.actor.name}` : ''}
                </Text>
              </Box>
            </HStack>
          ))}
        </VStack>
      </Box>

      <VModal
        isOpen={reallocateOpen}
        onClose={() => setReallocateOpen(false)}
        title={t('modal.reallocateTitle')}
        primaryActionText={t('actions.reallocate')}
        onPrimaryAction={() =>
          run('reallocate', () =>
            VenueRentalService.reallocateCourts(id, reallocateIds)
          ).then(() => setReallocateOpen(false))
        }
        isPrimaryLoading={action === 'reallocate'}
        isPrimaryDisabled={reallocateIds.length !== numberOfCourts}
      >
        <SimpleGrid columns={2} gap={2}>
          {venueCourts.map((court) => {
            const selected = reallocateIds.includes(court.id);
            return (
              <Button
                key={court.id}
                variant={selected ? 'solid' : 'outline'}
                colorPalette={selected ? 'green' : 'gray'}
                onClick={() =>
                  setReallocateIds((current) =>
                    selected
                      ? current.filter((courtId) => courtId !== court.id)
                      : [...current, court.id]
                  )
                }
              >
                {court.name}
              </Button>
            );
          })}
        </SimpleGrid>
      </VModal>

      <VModal
        isOpen={!!reasonMode}
        onClose={() => setReasonMode(null)}
        title={
          reasonMode === 'reject'
            ? t('modal.rejectTitle')
            : t('modal.cancelTitle')
        }
        primaryActionText={t('actions.confirm')}
        onPrimaryAction={() =>
          run(reasonMode || '', () =>
            reasonMode === 'reject'
              ? VenueRentalService.reject(id, reason)
              : VenueRentalService.cancel(id, reason)
          ).then(() => {
            setReasonMode(null);
            setReason('');
          })
        }
        isPrimaryLoading={!!action}
        primaryColorScheme="red"
      >
        <Field label={t('modal.reason')} required={manage}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </VModal>

      <VModal
        isOpen={counterOpen}
        onClose={() => setCounterOpen(false)}
        title={t('modal.counterTitle')}
        primaryActionText={t('actions.sendProposal')}
        onPrimaryAction={() =>
          run('counter', () =>
            VenueRentalService.propose(id, {
              startTime: venueDateTimeToIso(
                counter.date,
                counter.start,
                request.venue.timezone
              ),
              endTime: venueDateTimeToIso(
                counter.date,
                counter.end,
                request.venue.timezone
              ),
              numberOfCourts: counter.numberOfCourts,
              customerType: counter.customerType,
              selectionMode: counter.selectionMode,
              courtIds:
                counter.selectionMode === VenueRentalSelectionMode.SELECT_COURTS
                  ? counter.courtIds
                  : undefined,
            })
          ).then(() => setCounterOpen(false))
        }
        isPrimaryLoading={action === 'counter'}
        size="lg"
      >
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Field label={t('form.date')}>
            <Input
              type="date"
              value={counter.date}
              onChange={(e) => setCounter({ ...counter, date: e.target.value })}
            />
          </Field>
          <Field label={t('form.courts')}>
            <Input
              type="number"
              min={1}
              value={counter.numberOfCourts}
              onChange={(e) =>
                setCounter({
                  ...counter,
                  numberOfCourts: Number(e.target.value),
                })
              }
            />
          </Field>
          <Field label={t('form.start')}>
            <Input
              type="time"
              value={counter.start}
              onChange={(e) =>
                setCounter({ ...counter, start: e.target.value })
              }
            />
          </Field>
          <Field label={t('form.end')}>
            <Input
              type="time"
              value={counter.end}
              onChange={(e) => setCounter({ ...counter, end: e.target.value })}
            />
          </Field>
          <Field label={t('form.customerType')}>
            <SearchableSelect
              value={counter.customerType}
              onChange={(value) =>
                setCounter({
                  ...counter,
                  customerType: value as VenueCustomerType,
                })
              }
              options={Object.values(VenueCustomerType).map((value) => ({
                value,
                label: t(`customerType.${value}`),
              }))}
            />
          </Field>
          <Field label={t('form.selectionMode')}>
            <SearchableSelect
              value={counter.selectionMode}
              onChange={(value) =>
                setCounter({
                  ...counter,
                  selectionMode: value as VenueRentalSelectionMode,
                  courtIds: [],
                })
              }
              options={Object.values(VenueRentalSelectionMode).map((value) => ({
                value,
                label: t(`selectionMode.${value}`),
              }))}
            />
          </Field>
        </SimpleGrid>
        {counter.selectionMode === VenueRentalSelectionMode.SELECT_COURTS && (
          <Box mt={4}>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              {t('form.selectCourts')}
            </Text>
            <HStack gap={2} flexWrap="wrap">
              {venueCourts
                .filter((court) => court.status === 'ACTIVE')
                .map((court) => {
                  const selected = counter.courtIds.includes(court.id);
                  return (
                    <Button
                      key={court.id}
                      size="sm"
                      variant={selected ? 'solid' : 'outline'}
                      colorPalette={selected ? 'green' : 'gray'}
                      onClick={() => {
                        const courtIds = selected
                          ? counter.courtIds.filter((id) => id !== court.id)
                          : [...counter.courtIds, court.id];
                        setCounter({
                          ...counter,
                          courtIds,
                          numberOfCourts: courtIds.length,
                        });
                      }}
                    >
                      {selected && <Check size={15} />}
                      {court.name}
                    </Button>
                  );
                })}
            </HStack>
          </Box>
        )}
      </VModal>

      <VModal
        isOpen={sessionOpen}
        onClose={() => setSessionOpen(false)}
        title={t('modal.linkSessionTitle')}
        primaryActionText={t('actions.linkSession')}
        onPrimaryAction={() =>
          run('link-session', () =>
            VenueRentalService.linkSession(id, sessionId)
          ).then(() => {
            setSessionOpen(false);
            setSessionId('');
          })
        }
        isPrimaryLoading={action === 'link-session'}
        isPrimaryDisabled={!sessionId}
      >
        <Field label={t('form.session')}>
          <SearchableSelect
            value={sessionId}
            onChange={setSessionId}
            options={sessions.map((session) => ({
              value: session.id,
              label: session.name,
            }))}
            placeholder={
              sessions.length
                ? t('form.selectSession')
                : t('form.noMatchingSession')
            }
          />
        </Field>
      </VModal>
    </VStack>
  );
}
