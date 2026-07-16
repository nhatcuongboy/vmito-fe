'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { MapPin, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament, TournamentVenue } from '@/lib/api/types';
import { useState, useEffect, useCallback } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import VenueMapPin from '@/components/venue/VenueMapPin';
import { getTournamentVenueDisplay } from '@/utils';
import { useRouter } from '@/i18n/config';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

interface LocationPanelProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

/**
 * Primary-venue picker: chooses which of the tournament's linked venues is
 * shown as the main location on public pages (tournament.venueId). Venues are
 * managed in the Venues panel; inline (address-only) venues cannot be primary
 * because the pointer references a directory Venue record.
 */
export default function LocationPanel({
  tournament,
  onTournamentUpdate,
}: LocationPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.location');
  const router = useRouter();

  const [venues, setVenues] = useState<TournamentVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    tournament.venueId || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await TournamentService.getVenues(tournament.id);
      setVenues(data);
    } catch {
      toaster.error({ title: t('errors.loadFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [t, tournament.id]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const hasChanges = selectedVenueId !== (tournament.venueId || '');

  const handleSubmit = async () => {
    if (!hasChanges) {
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

  const goToVenuesPanel = () => {
    router.push(`/tournament/${tournament.slug}/manage?option=venues`);
  };

  const selectedVenue = venues.find(
    (tv) => tv.venueId && tv.venueId === selectedVenueId
  );
  const selectedDisplay = selectedVenue
    ? getTournamentVenueDisplay(selectedVenue)
    : null;

  return (
    <Box>
      <Heading size="md" mb={2}>
        {t('title')}
      </Heading>
      <Text color="gray.600" mb={6} _dark={{ color: 'gray.300' }}>
        {t('description')}
      </Text>

      {isLoading ? (
        <TournamentMatchListSkeleton count={2} />
      ) : venues.length === 0 ? (
        <VStack gap={5} align="center" py={10}>
          <Box
            p={4}
            bg="gray.50"
            borderRadius="full"
            _dark={{ bg: 'gray.700' }}
          >
            <MapPin size={40} color="#A0AEC0" />
          </Box>
          <Text
            fontSize="md"
            color="gray.500"
            textAlign="center"
            maxW="320px"
            _dark={{ color: 'gray.400' }}
          >
            {t('empty')}
          </Text>
          <Button
            style={{
              background: '#1a202c',
              color: 'white',
              borderRadius: '9999px',
            }}
            px={6}
            onClick={goToVenuesPanel}
          >
            {t('goToVenues')}
          </Button>
        </VStack>
      ) : (
        <Box>
          <VStack gap={3} align="stretch" mb={6}>
            {venues.map((tv) => {
              const display = getTournamentVenueDisplay(tv);
              const isLinked = !!tv.venueId;
              const isSelected = isLinked && tv.venueId === selectedVenueId;

              return (
                <Box
                  key={tv.id}
                  as="button"
                  textAlign="left"
                  onClick={() => {
                    if (isLinked) setSelectedVenueId(tv.venueId!);
                  }}
                  p={4}
                  borderWidth="2px"
                  borderRadius="xl"
                  borderColor={isSelected ? 'blue.500' : 'gray.200'}
                  bg={isSelected ? 'blue.50' : 'white'}
                  opacity={isLinked ? 1 : 0.6}
                  cursor={isLinked ? 'pointer' : 'not-allowed'}
                  _dark={{
                    borderColor: isSelected ? 'blue.400' : 'gray.700',
                    bg: isSelected ? 'blue.900' : 'gray.800',
                  }}
                  transition="all 0.15s"
                >
                  <Flex justify="space-between" align="start" gap={3}>
                    <Box flex="1" minW={0}>
                      <Flex align="center" gap={2}>
                        <Text fontWeight="bold">{display.name}</Text>
                        {display.acronym && (
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="gray.500"
                            _dark={{ color: 'gray.400' }}
                          >
                            {display.acronym}
                          </Text>
                        )}
                      </Flex>
                      {display.address && (
                        <Text
                          fontSize="sm"
                          color="gray.500"
                          _dark={{ color: 'gray.400' }}
                          mt={1}
                        >
                          {display.address}
                          {display.city ? `, ${display.city}` : ''}
                        </Text>
                      )}
                      {!isLinked && (
                        <Text
                          fontSize="xs"
                          color="orange.500"
                          mt={1}
                          _dark={{ color: 'orange.300' }}
                        >
                          {t('inlineHint')}
                        </Text>
                      )}
                    </Box>
                    {isSelected && (
                      <Box color="blue.500" flexShrink={0} mt={1}>
                        <Check size={18} />
                      </Box>
                    )}
                  </Flex>
                </Box>
              );
            })}
          </VStack>

          {/* Selected Venue Map Preview */}
          {selectedDisplay?.lat && selectedDisplay?.lng && (
            <Box mb={6} borderRadius="md" overflow="hidden" h="300px">
              <VenueMapPin
                lat={selectedDisplay.lat}
                lng={selectedDisplay.lng}
                height="300px"
              />
            </Box>
          )}

          {/* Clear Selection */}
          {selectedVenueId && (
            <Box mb={6}>
              <Button
                variant="ghost"
                colorScheme="red"
                size="sm"
                onClick={() => setSelectedVenueId('')}
              >
                {t('clearSelection')}
              </Button>
            </Box>
          )}

          <Flex justify="flex-end" gap={3}>
            <Button
              variant="outline"
              onClick={() => setSelectedVenueId(tournament.venueId || '')}
              disabled={!hasChanges || isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button
              colorScheme="green"
              onClick={handleSubmit}
              disabled={!hasChanges || isSubmitting}
              loading={isSubmitting}
            >
              {t('save')}
            </Button>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
