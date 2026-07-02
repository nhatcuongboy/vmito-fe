'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { IconButton, Button, VStack } from '@/components/ui/chakra-compat';
import { MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament, TournamentVenue } from '@/lib/api/types';
import { useState, useEffect, useCallback } from 'react';
import VenueConfigModal from './VenueConfigModal';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import VenueMapPin from '@/components/venue/VenueMapPin';
import { VModal } from '@/components/ui/VModal';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

interface VenuePanelProps {
  tournament: Tournament;
  onTournamentChanged?: () => void;
}

export default function VenuePanel({
  tournament,
  onTournamentChanged,
}: VenuePanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.venues');

  const [venues, setVenues] = useState<TournamentVenue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<TournamentVenue | undefined>(
    undefined
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveVenue, setConfirmRemoveVenue] =
    useState<TournamentVenue | null>(null);

  const loadVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await TournamentService.getVenues(tournament.id);
      setVenues(data);
    } catch {
      toaster.error({ title: t('loadError') });
    } finally {
      setIsLoading(false);
    }
  }, [t, tournament.id]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const handleSaved = async () => {
    // Reload from server to get fresh data after add/edit
    await loadVenues();
    setIsConfigModalOpen(false);
    setEditingVenue(undefined);
    onTournamentChanged?.();
  };

  const handleRemove = async (tournamentVenue: TournamentVenue) => {
    setConfirmRemoveVenue(tournamentVenue);
  };

  const handleConfirmRemove = async () => {
    if (!confirmRemoveVenue) return;
    try {
      setRemovingId(confirmRemoveVenue.id);
      await TournamentService.removeVenue(
        tournament.id,
        confirmRemoveVenue.venueId ?? confirmRemoveVenue.id
      );
      setVenues((prev) => prev.filter((v) => v.id !== confirmRemoveVenue.id));
      onTournamentChanged?.();
    } catch {
      toaster.error({ title: t('removeError') });
    } finally {
      setRemovingId(null);
      setConfirmRemoveVenue(null);
    }
  };

  const handleEdit = (tournamentVenue: TournamentVenue) => {
    setEditingVenue(tournamentVenue);
    setIsConfigModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingVenue(undefined);
    setIsConfigModalOpen(true);
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">{t('title')}</Heading>
        <Button
          variant="outline"
          style={{
            borderRadius: '9999px',
            background: '#1a202c',
            color: 'white',
            border: 'none',
          }}
          px={4}
          size="sm"
          display="flex"
          alignItems="center"
          gap={2}
          onClick={handleAddNew}
        >
          <Plus size={16} />
          {t('addVenue')}
        </Button>
      </Flex>

      {isLoading ? (
        <TournamentMatchListSkeleton count={3} />
      ) : venues.length === 0 ? (
        <VStack gap={6} align="center" py={10}>
          <Box p={4} bg="red.50" borderRadius="full" _dark={{ bg: 'red.900' }}>
            <MapPin size={48} color="#F56565" />
          </Box>
          <Text
            fontSize="md"
            color="gray.500"
            textAlign="center"
            maxW="300px"
            _dark={{ color: 'gray.400' }}
          >
            {t('noLinkedVenues')}
          </Text>
          <Button
            style={{
              background: '#1a202c',
              color: 'white',
              borderRadius: '9999px',
            }}
            px={6}
            display="flex"
            alignItems="center"
            gap={2}
            onClick={handleAddNew}
          >
            <Plus size={18} />
            {t('addVenue')}
          </Button>
        </VStack>
      ) : (
        <VStack gap={4} align="stretch">
          {venues.map((tv) => (
            <Box
              key={tv.id}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="2xl"
              overflow="hidden"
              bg="white"
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            >
              {/* Map Section */}
              <Box
                h="200px"
                position="relative"
                w="full"
                borderRadius="2xl"
                overflow="hidden"
              >
                {(tv.venue?.lat ?? tv.lat) && (tv.venue?.lng ?? tv.lng) ? (
                  <VenueMapPin
                    lat={(tv.venue?.lat ?? tv.lat)!}
                    lng={(tv.venue?.lng ?? tv.lng)!}
                    height="200px"
                    zoom={15}
                  />
                ) : (
                  <Flex
                    h="full"
                    w="full"
                    align="center"
                    justify="center"
                    bg="gray.100"
                    _dark={{ bg: 'gray.900' }}
                  >
                    <MapPin size={40} color="#A0AEC0" />
                  </Flex>
                )}
              </Box>

              {/* Venue Info */}
              <Flex justify="space-between" align="start" p={4}>
                <Box flex="1">
                  <Flex align="center" gap={2} mb={1}>
                    <Text
                      fontWeight="bold"
                      fontSize="md"
                      color="gray.800"
                      _dark={{ color: 'gray.100' }}
                    >
                      {tv.venue?.name ?? tv.name}
                    </Text>
                    {(tv.venue?.acronym ?? tv.acronym) && (
                      <Box
                        bg="gray.100"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                        _dark={{ bg: 'gray.700' }}
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.600"
                          _dark={{ color: 'gray.300' }}
                        >
                          {tv.venue?.acronym ?? tv.acronym}
                        </Text>
                      </Box>
                    )}
                  </Flex>
                  {(tv.venue?.address ?? tv.address) && (
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      mb={1}
                      _dark={{ color: 'gray.400' }}
                    >
                      {tv.venue?.address ?? tv.address}
                      {(tv.venue?.city ?? tv.city)
                        ? `, ${tv.venue?.city ?? tv.city}`
                        : ''}
                    </Text>
                  )}
                  {tv.courts && tv.courts.length > 0 && (
                    <Text
                      fontSize="xs"
                      color="gray.400"
                      mb={2}
                      _dark={{ color: 'gray.500' }}
                    >
                      {tv.courts.length} {t('courtsCount')}:{' '}
                      {tv.courts
                        .map(
                          (c) => c.courtName || `${t('court')} ${c.courtNumber}`
                        )
                        .join(', ')}
                    </Text>
                  )}
                  {(tv.venue?.lat ?? tv.lat) && (tv.venue?.lng ?? tv.lng) && (
                    <Button
                      as="a"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${tv.venue?.lat ?? tv.lat},${tv.venue?.lng ?? tv.lng}`}
                      variant="outline"
                      size="xs"
                      colorPalette="green"
                      mt={2}
                      onClick={(event) => {
                        event.preventDefault();
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${tv.venue?.lat ?? tv.lat},${tv.venue?.lng ?? tv.lng}`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                    >
                      <MapPin size={14} />
                      {t('viewOnGoogleMaps')}
                    </Button>
                  )}
                </Box>

                <Flex align="center" gap={1}>
                  <IconButton
                    aria-label={t('editVenue')}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(tv)}
                  >
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton
                    aria-label={t('removeVenue')}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(tv)}
                    loading={removingId === tv.id}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Flex>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}

      <VenueConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setEditingVenue(undefined);
        }}
        tournamentId={tournament.id}
        existingTournamentVenue={editingVenue}
        onSaved={handleSaved}
      />

      {/* Confirm Remove Modal */}
      <VModal
        isOpen={!!confirmRemoveVenue}
        onClose={() => setConfirmRemoveVenue(null)}
        title={t('removeVenue')}
        size="sm"
        primaryActionText={t('remove')}
        primaryColorScheme="red"
        onPrimaryAction={handleConfirmRemove}
        isPrimaryLoading={!!removingId}
        secondaryActionText={t('cancel')}
        isCentered
      >
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
          {t('removeConfirmPrefix')}{' '}
          <Text
            as="span"
            fontWeight="semibold"
            color="gray.800"
            _dark={{ color: 'gray.100' }}
          >
            {confirmRemoveVenue?.venue?.name ?? confirmRemoveVenue?.name}
          </Text>{' '}
          {t('removeConfirmSuffix')}
        </Text>
      </VModal>
    </Box>
  );
}
