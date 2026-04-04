'use client';

import {
  Box,
  Flex,
  Text,
  Portal,
  Input as ChakraInput,
} from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { X, Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { VenueService } from '@/lib/api/venue.service';
import { TournamentService } from '@/lib/api/tournament.service';
import { Venue } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import LocationAutocomplete from '@/components/common/LocationAutocomplete';

interface LocationData {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  district?: string;
  city?: string;
}

interface CreateVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  onCreated: (venue: Venue) => void;
  onBack: () => void;
}

export default function CreateVenueModal({
  isOpen,
  onClose,
  tournamentId,
  onCreated,
  onBack,
}: CreateVenueModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  console.log('CreateVenueModal');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [courtsCount, setCourtsCount] = useState(2);
  const [courtNames, setCourtNames] = useState<string[]>([
    'Court 1',
    'Court 2',
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or adjust court names array when courts count changes
  useEffect(() => {
    setCourtNames((prev) => {
      const newNames = [...prev];
      if (courtsCount > newNames.length) {
        for (let i = newNames.length; i < courtsCount; i++) {
          newNames.push(`Court ${i + 1}`);
        }
      } else if (courtsCount < newNames.length) {
        newNames.splice(courtsCount);
      }
      return newNames;
    });
  }, [courtsCount]);

  const handleLocationSelect = (loc: LocationData) => {
    setLocation(loc);
    if (!name) {
      setName(loc.name);
    }
  };

  const handleCourtNameChange = (index: number, val: string) => {
    const newNames = [...courtNames];
    newNames[index] = val;
    setCourtNames(newNames);
  };

  const handleSave = async () => {
    if (!location) {
      toaster.error({ title: 'Please select an address' });
      return;
    }
    if (!name.trim()) {
      toaster.error({ title: 'Please enter a name for the venue' });
      return;
    }

    try {
      setIsSaving(true);

      // 1. Create Venue
      const venuePayload = {
        placeId: location.placeId,
        name: name,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        district: location.district,
        city: location.city,
        numberOfCourts: courtsCount,
      };
      const newVenue = await VenueService.createVenue(venuePayload);

      // 2. Assign to Tournament
      await TournamentService.updateTournament(tournamentId, {
        venueId: newVenue.id,
      });

      // 3. Create Courts for Tournament
      // We process them sequentially or parallel
      await Promise.all(
        courtNames.map((cName, idx) =>
          TournamentService.addCourt(tournamentId, {
            courtNumber: idx + 1,
            courtName: cName,
          })
        )
      );

      toaster.success({ title: 'Venue created successfully' });

      // We pass the new venue up so VenuePanel can use it temporarily or mutate SWR
      onCreated(newVenue);
      onClose();
    } catch (error) {
      console.error('Failed to create venue', error);
      toaster.error({ title: 'Failed to create venue' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        inset="0"
        bg="blackAlpha.600"
        zIndex={1400}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        onClick={onClose}
      >
        <Box
          bg="white"
          borderRadius="2xl"
          w="full"
          maxW="md"
          boxShadow="xl"
          onClick={(e) => e.stopPropagation()}
          display="flex"
          flexDirection="column"
          maxH="90vh"
        >
          {/* Header */}
          <Flex
            justify="space-between"
            align="center"
            px={5}
            py={4}
            borderBottomWidth="1px"
            borderColor="gray.100"
            flexShrink={0}
          >
            <Text fontWeight="bold" fontSize="lg">
              {t('panels.venues.createVenue')}
            </Text>
            <Box
              as="button"
              onClick={onClose}
              p={1}
              borderRadius="md"
              _hover={{ bg: 'gray.100' }}
              transition="all 0.2s"
            >
              <X size={20} color="#4A5568" />
            </Box>
          </Flex>

          {/* Body */}
          <Box p={5} flex={1} overflowY="auto" pb={8}>
            <VStack gap={5} align="stretch">
              {/* Optional Map Preview Banner above Address */}
              {location && location.lat && location.lng && (
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  h="140px"
                  bg="gray.100"
                  position="relative"
                  mx={-5}
                  mt={-5}
                  mb={2}
                >
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${location.lat},${location.lng}`}
                  />
                  {/* Fade out map bottom into white */}
                  <Box
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    height="20px"
                    bgGradient="to-t"
                    gradientFrom="white"
                    gradientTo="transparent"
                  />
                </Box>
              )}

              {/* Address */}
              <Box>
                <LocationAutocomplete
                  onSelect={handleLocationSelect}
                  placeholder={t('panels.venues.address')}
                />
              </Box>

              {/* Name */}
              <Box>
                <ChakraInput
                  h="44px"
                  placeholder={t('panels.venues.name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  borderColor="gray.200"
                  _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
                />
              </Box>

              {/* Acronym */}
              <Box>
                <ChakraInput
                  h="44px"
                  placeholder={t('panels.venues.acronym')}
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value)}
                  borderColor="gray.200"
                  _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
                  w="40%"
                />
              </Box>

              {/* Courts Count Config */}
              <Flex align="center" justify="space-between" mt={2}>
                <Text fontWeight="medium">
                  {t('panels.venues.howManyCourts')}
                </Text>
                <Flex align="center" gap={3}>
                  <Box
                    as="button"
                    onClick={() => setCourtsCount(Math.max(1, courtsCount - 1))}
                    w="36px"
                    h="36px"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor="gray.200"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    _hover={{ bg: 'gray.50' }}
                  >
                    <Minus size={16} />
                  </Box>
                  <Text fontWeight="medium" w="20px" textAlign="center">
                    {courtsCount}
                  </Text>
                  <Box
                    as="button"
                    onClick={() =>
                      setCourtsCount(Math.min(20, courtsCount + 1))
                    }
                    w="36px"
                    h="36px"
                    borderRadius="full"
                    borderWidth="1px"
                    borderColor="gray.200"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    _hover={{ bg: 'gray.50' }}
                  >
                    <Plus size={16} />
                  </Box>
                </Flex>
              </Flex>

              {/* Court Names List */}
              <VStack gap={3} align="stretch" mt={1}>
                {courtNames.map((cName, idx) => (
                  <ChakraInput
                    key={`court-${idx}`}
                    h="44px"
                    value={cName}
                    onChange={(e) => handleCourtNameChange(idx, e.target.value)}
                    placeholder={`${t('panels.venues.court')} ${idx + 1}`}
                    borderColor="gray.200"
                    _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
                  />
                ))}
              </VStack>
            </VStack>
          </Box>

          {/* Footer */}
          <Flex
            justify="space-between"
            align="center"
            px={5}
            py={4}
            borderTopWidth="1px"
            borderColor="gray.100"
            flexShrink={0}
          >
            <Button variant="ghost" onClick={onBack} px={6} fontWeight="bold">
              {t('panels.venues.back')}
            </Button>
            <Button
              style={{ background: '#1a202c', color: 'white' }}
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving || !name || !location}
              px={8}
            >
              {t('panels.venues.save')}
            </Button>
          </Flex>
        </Box>
      </Box>
    </Portal>
  );
}
