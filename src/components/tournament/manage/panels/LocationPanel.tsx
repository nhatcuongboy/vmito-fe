'use client';

import { Box, Flex, Heading, Text, Field } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Tournament, Venue } from '@/lib/api/types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import { VenueService } from '@/lib/api/venue.service';
import { toaster } from '@/components/ui/toaster';
import VenueMapPin from '@/components/venue/VenueMapPin';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { formatVenueName } from '@/utils';

interface LocationPanelProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

export default function LocationPanel({
  tournament,
  onTournamentUpdate,
}: LocationPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.location');
  const tVenue = useTranslations('venue');

  const [venues, setVenues] = useState<Venue[]>([]);
  const [isVenueLoading, setIsVenueLoading] = useState(false);
  const venueSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(
    tournament.venue || null
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    tournament.venueId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load venues on mount
  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const data = await VenueService.searchVenues({ limit: 100 });
      setVenues(data.data || []);
    } catch (error) {
      console.error('Failed to load venues:', error);
    }
  };

  // Debounced venue search handler
  const handleVenueSearch = useCallback((keyword: string) => {
    if (venueSearchTimerRef.current) clearTimeout(venueSearchTimerRef.current);
    venueSearchTimerRef.current = setTimeout(async () => {
      setIsVenueLoading(true);
      try {
        const result = await VenueService.searchVenues({
          keyword: keyword.trim() || undefined,
          limit: 100,
          sortBy: keyword.trim() ? 'relevance' : undefined,
        });
        setVenues(result.data || []);
      } catch (error) {
        console.error('Error searching venues:', error);
      } finally {
        setIsVenueLoading(false);
      }
    }, 300);
  }, []);

  // Venue options for SearchableSelect
  const venueOptions = venues.map((v) => ({
    value: v.id,
    label: formatVenueName(v.name, tVenue('nameFormat', { name: '{name}' })),
    sublabel: v.address,
  }));

  // Always include currently selected venue if not in list
  if (selectedVenue && !venues.find((v) => v.id === selectedVenue.id)) {
    venueOptions.unshift({
      value: selectedVenue.id,
      label: formatVenueName(
        selectedVenue.name,
        tVenue('nameFormat', { name: '{name}' })
      ),
      sublabel: selectedVenue.address,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if venue changed
    if (selectedVenueId === tournament.venueId) {
      toaster.info({ title: t('errors.noChanges') });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await TournamentService.updateTournament(tournament.id, {
        venueId: selectedVenueId || null,
      });
      onTournamentUpdate?.(updated);
      toaster.success({ title: t('success') });
    } catch {
      toaster.error({ title: t('errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = selectedVenueId !== tournament.venueId;

  const getLocationDisplay = (venue: Venue) => {
    return venue.newCity || venue.city || venue.address;
  };

  return (
    <Box>
      <Heading size="md" mb={2}>
        {t('title')}
      </Heading>
      <Text color="gray.600" mb={6} _dark={{ color: 'gray.300' }}>
        {t('description')}
      </Text>

      <form onSubmit={handleSubmit}>
        {/* Venue Select */}
        <Field.Root mb={6}>
          <Field.Label>{t('searchLabel')}</Field.Label>
          <SearchableSelect
            value={selectedVenueId}
            onChange={(value) => {
              setSelectedVenueId(value);
              const venue = venues.find((v) => v.id === value);
              setSelectedVenue(venue ?? null);
            }}
            options={venueOptions}
            placeholder={t('searchPlaceholder')}
            searchPlaceholder={t('searchPlaceholder')}
            onSearchChange={handleVenueSearch}
            isLoading={isVenueLoading}
          />
        </Field.Root>

        {/* Selected Venue Info */}
        {selectedVenue && (
          <Box
            mb={6}
            p={4}
            border="2px solid"
            borderColor="blue.500"
            borderRadius="md"
            bg="blue.50"
            _dark={{ bg: 'blue.900', borderColor: 'blue.400' }}
          >
            <Text fontWeight="bold" mb={1}>
              {selectedVenue.name}
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {getLocationDisplay(selectedVenue)}
            </Text>
            {selectedVenue.address && (
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                mt={1}
              >
                {selectedVenue.address}
              </Text>
            )}
          </Box>
        )}

        {/* Selected Venue Map Preview */}
        {selectedVenue && selectedVenue.lat && selectedVenue.lng && (
          <Box mb={6} borderRadius="md" overflow="hidden" h="300px">
            <VenueMapPin
              lat={selectedVenue.lat}
              lng={selectedVenue.lng}
              height="300px"
            />
          </Box>
        )}

        {/* Clear Selection */}
        {selectedVenue && (
          <Box mb={6}>
            <Button
              variant="ghost"
              colorScheme="red"
              size="sm"
              onClick={() => {
                setSelectedVenue(null);
                setSelectedVenueId('');
              }}
            >
              {t('clearSelection')}
            </Button>
          </Box>
        )}

        <Flex justify="flex-end" gap={3}>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedVenue(tournament.venue || null);
              setSelectedVenueId(tournament.venueId || '');
            }}
            disabled={!hasChanges || isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            colorScheme="green"
            disabled={!hasChanges || isSubmitting}
            loading={isSubmitting}
          >
            {t('save')}
          </Button>
        </Flex>
      </form>
    </Box>
  );
}
