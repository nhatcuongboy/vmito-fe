'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { MapPin, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament, Venue } from '@/lib/api/types';
import { useState } from 'react';
import SelectVenueModal from './SelectVenueModal';
import CreateVenueModal from './CreateVenueModal';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';

interface VenuePanelProps {
  tournament: Tournament;
  onTournamentChanged?: () => void;
}

export default function VenuePanel({
  tournament,
  onTournamentChanged,
}: VenuePanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [currentVenue, setCurrentVenue] = useState<Venue | undefined>(
    tournament.venue
  );

  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Helper deriving acronym from name if not stored in DB (since we discarded it in Create form technically)
  const getAcronym = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleCreateNew = () => {
    setIsSelectModalOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleVenueSelected = async (venue: Venue) => {
    try {
      await TournamentService.updateTournament(tournament.id, {
        venueId: venue.id,
      });
      setCurrentVenue(venue);
      setIsSelectModalOpen(false);
      onTournamentChanged?.();
      toaster.success({ title: 'Venue assigned successfully' });
    } catch (error) {
      console.error(error);
      toaster.error({ title: 'Failed to assign venue' });
    }
  };

  const handleVenueCreated = (venue: Venue) => {
    setCurrentVenue(venue);
    onTournamentChanged?.();
  };

  const handleRemoveVenue = async () => {
    if (!currentVenue) return;
    try {
      setIsRemoving(true);
      await TournamentService.updateTournament(tournament.id, {
        venueId: null as unknown as string, // Remove venue
      });
      setCurrentVenue(undefined);
      onTournamentChanged?.();
      toaster.success({ title: 'Venue removed successfully' });
    } catch (error) {
      console.error(error);
      toaster.error({ title: 'Failed to remove venue' });
    } finally {
      setIsRemoving(false);
    }
  };

  const EmptyState = () => (
    <VStack gap={6} align="center" py={10}>
      {/* Hand drawn / custom map icon representation in mockup, we use Image or Box, 
          since we don't have the exact svg, we will use a styled box with MapPin for now */}
      <Box p={4} bg="red.50" borderRadius="full" mb={2}>
        <MapPin size={48} color="#F56565" />
      </Box>

      <Text fontSize="md" color="gray.500" textAlign="center" maxW="300px">
        {t('panels.venues.noVenue')}
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
        onClick={() => setIsSelectModalOpen(true)}
      >
        <Plus size={18} />
        {t('panels.venues.addVenue')}
      </Button>
    </VStack>
  );

  const FullState = () => {
    if (!currentVenue) return null;
    return (
      <Box>
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          overflow="hidden"
          bg="white"
        >
          {/* Map Image Section */}
          <Box h="180px" bg="gray.100" position="relative" w="full">
            {currentVenue.lat && currentVenue.lng ? (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0, pointerEvents: 'none' }} // disabled interaction like an image banner
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${currentVenue.lat},${currentVenue.lng}&zoom=14`}
              />
            ) : (
              <Flex h="full" w="full" align="center" justify="center">
                <MapPin size={40} color="#A0AEC0" />
              </Flex>
            )}
          </Box>

          {/* Venue Info Section */}
          <Flex justify="space-between" align="center" p={5}>
            <Box>
              <Flex align="center" gap={2} mb={1}>
                <Text fontWeight="bold" fontSize="lg" color="gray.800">
                  {currentVenue.name}
                </Text>
                <Box bg="gray.100" px={2} py={0.5} borderRadius="md">
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                    {getAcronym(currentVenue.name)}
                  </Text>
                </Box>
              </Flex>
              <Text fontSize="sm" color="gray.600">
                {currentVenue.address}
              </Text>
            </Box>

            {/* Actions */}
            <Flex align="center" gap={1}>
              <IconButton
                aria-label="Edit venue"
                variant="ghost"
                size="sm"
                color="gray.600"
                _hover={{ bg: 'gray.100' }}
              >
                <Edit2 size={18} />
              </IconButton>
              <IconButton
                aria-label="Remove venue"
                variant="ghost"
                size="sm"
                color="gray.600"
                _hover={{ bg: 'gray.100' }}
                onClick={handleRemoveVenue}
                loading={isRemoving}
              >
                <Trash2 size={18} />
              </IconButton>
              <Box px={1} cursor="grab" color="gray.400">
                <GripVertical size={20} />
              </Box>
            </Flex>
          </Flex>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="md">{t('panels.venues.title')}</Heading>
        {currentVenue && (
          <Button
            variant="outline"
            style={{
              borderRadius: '9999px',
              background: '#e2e8f0',
              color: '#1a202c',
              border: 'none',
            }}
            px={4}
            size="sm"
            display="flex"
            alignItems="center"
            gap={2}
            onClick={() => setIsSelectModalOpen(true)}
          >
            <Plus size={16} />
            {t('panels.venues.addVenue')}
          </Button>
        )}
      </Flex>

      {!currentVenue ? <EmptyState /> : <FullState />}

      <SelectVenueModal
        isOpen={isSelectModalOpen}
        onClose={() => setIsSelectModalOpen(false)}
        onCreateNew={handleCreateNew}
        onSelectVenue={handleVenueSelected}
      />

      <CreateVenueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        tournamentId={tournament.id}
        onCreated={handleVenueCreated}
        onBack={() => {
          setIsCreateModalOpen(false);
          setIsSelectModalOpen(true);
        }}
      />
    </Box>
  );
}
