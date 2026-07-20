'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Center,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import { Venue, VenueRentalRequest, VenueRentalStatus } from '@/lib/api/types';
import RentalRequestCard from './RentalRequestCard';
import VenueManagerSchedule from './VenueManagerSchedule';

export default function RentalListPage({
  manage = false,
}: {
  manage?: boolean;
}) {
  const t = useTranslations('venueRental');
  const [rentals, setRentals] = useState<VenueRentalRequest[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [status, setStatus] = useState('');
  const [venueId, setVenueId] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'schedule'>('list');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = manage
        ? await VenueRentalService.getManaged({
            venueId: venueId || undefined,
            status: (status || undefined) as VenueRentalStatus | undefined,
          })
        : await VenueRentalService.getMine({
            status: (status || undefined) as VenueRentalStatus | undefined,
          });
      setRentals(result.data);
    } catch (error) {
      console.error(error);
      toaster.error({ title: t('errors.load') });
    } finally {
      setLoading(false);
    }
  }, [manage, status, t, venueId]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (manage)
      VenueRentalService.getManagedVenues()
        .then((items) => {
          setVenues(items);
          if (items.length === 1) setVenueId(items[0].id);
        })
        .catch(() => setVenues([]));
  }, [manage]);

  return (
    <VStack align="stretch" gap={5}>
      <HStack gap={3} flexWrap="wrap">
        {manage && (
          <HStack p={1} bg="gray.100" borderRadius="md" gap={1}>
            <Button
              size="sm"
              variant={view === 'list' ? 'solid' : 'ghost'}
              onClick={() => setView('list')}
            >
              {t('views.requests')}
            </Button>
            <Button
              size="sm"
              variant={view === 'schedule' ? 'solid' : 'ghost'}
              onClick={() => setView('schedule')}
            >
              {t('views.schedule')}
            </Button>
          </HStack>
        )}
        <SearchableSelect
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: t('filters.allStatuses') },
            ...Object.values(VenueRentalStatus).map((value) => ({
              value,
              label: t(`status.${value}`),
            })),
          ]}
        />
        {manage && (
          <SearchableSelect
            value={venueId}
            onChange={setVenueId}
            options={[
              { value: '', label: t('filters.allVenues') },
              ...venues.map((venue) => ({
                value: venue.id,
                label: venue.name,
              })),
            ]}
          />
        )}
      </HStack>
      {manage && view === 'schedule' ? (
        venueId ? (
          <VenueManagerSchedule
            venue={venues.find((venue) => venue.id === venueId)!}
          />
        ) : (
          <Center py={16}>
            <Text color="gray.500">{t('filters.selectVenue')}</Text>
          </Center>
        )
      ) : loading ? (
        <Center py={16}>
          <Spinner />
        </Center>
      ) : rentals.length ? (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
          {rentals.map((request) => (
            <RentalRequestCard
              key={request.id}
              request={request}
              manage={manage}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Center py={16}>
          <Text color="gray.500">{t('empty')}</Text>
        </Center>
      )}
    </VStack>
  );
}
