'use client';

import { Box, Flex, Text, Input as ChakraInput } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Venue } from '@/lib/api/types';
import { VenueService } from '@/lib/api/venue.service';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';

interface EditVenueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue;
  tournamentId: string;
  onSaved: (venue: Venue) => void;
}

export default function EditVenueDetailsModal({
  isOpen,
  onClose,
  venue,
  tournamentId,
  onSaved,
}: EditVenueDetailsModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [courtsCount, setCourtsCount] = useState(2);
  const [courtNames, setCourtNames] = useState<string[]>([
    `${t('panels.venues.court')} 1`,
    `${t('panels.venues.court')} 2`,
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && venue) {
      setName(venue.name ?? '');
      setAcronym(venue.acronym ?? venue.name?.charAt(0).toUpperCase() ?? '');
      const count = venue.numberOfCourts ?? 2;
      setCourtsCount(count);
      setCourtNames(
        Array.from(
          { length: count },
          (_, i) => `${t('panels.venues.court')} ${i + 1}`
        )
      );
    }
  }, [isOpen, t, venue]);

  useEffect(() => {
    setCourtNames((prev) => {
      const next = [...prev];
      if (courtsCount > next.length) {
        for (let i = next.length; i < courtsCount; i++) {
          next.push(`${t('panels.venues.court')} ${i + 1}`);
        }
      } else {
        next.splice(courtsCount);
      }
      return next;
    });
  }, [courtsCount, t]);

  const handleCourtNameChange = (index: number, val: string) => {
    const next = [...courtNames];
    next[index] = val;
    setCourtNames(next);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toaster.error({ title: t('panels.venues.nameRequired') });
      return;
    }

    try {
      setIsSaving(true);

      // Update venue details
      const updatedVenue = await VenueService.updateVenue(venue.id, {
        name: name.trim(),
        acronym: acronym.trim() || undefined,
        numberOfCourts: courtsCount,
      });

      // Link venue to tournament
      await TournamentService.updateTournament(tournamentId, {
        venueId: updatedVenue.id,
      });

      toaster.success({ title: t('panels.venues.venueSaved') });
      onSaved(updatedVenue);
      onClose();
    } catch (error) {
      console.error('Failed to save venue', error);
      toaster.error({ title: t('panels.venues.saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('panels.venues.editVenue')}
      size="md"
      maxBodyHeight="70vh"
      primaryActionText={
        isSaving ? t('panels.venues.saving') : t('panels.venues.save')
      }
      onPrimaryAction={handleSave}
      isPrimaryLoading={isSaving}
      secondaryActionText={t('panels.venues.back')}
      onSecondaryAction={onClose}
    >
      <VStack gap={4} align="stretch">
        {/* Venue address (read-only) */}
        {venue.address && (
          <Box bg="gray.50" borderRadius="lg" px={4} py={3}>
            <Text fontSize="xs" color="gray.400" mb={1}>
              {t('panels.venues.address')}
            </Text>
            <Text fontSize="sm" color="gray.700">
              {venue.address}
            </Text>
          </Box>
        )}

        {/* Name */}
        <Box position="relative">
          <ChakraInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('panels.venues.name')}
            borderRadius="lg"
            pt={6}
            pb={2}
            fontSize="sm"
          />
          <Text
            position="absolute"
            top={2}
            left={4}
            fontSize="xs"
            color="gray.400"
            pointerEvents="none"
          >
            {t('panels.venues.name')}
          </Text>
        </Box>

        {/* Acronym */}
        <Box position="relative" maxW="120px">
          <ChakraInput
            value={acronym}
            onChange={(e) => setAcronym(e.target.value)}
            placeholder={t('panels.venues.acronym')}
            borderRadius="lg"
            pt={6}
            pb={2}
            fontSize="sm"
          />
          <Text
            position="absolute"
            top={2}
            left={4}
            fontSize="xs"
            color="gray.400"
            pointerEvents="none"
          >
            {t('panels.venues.acronym')}
          </Text>
        </Box>

        {/* Court count */}
        <Flex align="center" justify="space-between" py={2}>
          <Text fontWeight="semibold" fontSize="sm">
            {t('panels.venues.howManyCourts')}
          </Text>
          <Flex align="center" gap={3}>
            <Box
              as="button"
              w="32px"
              h="32px"
              borderRadius="full"
              border="1px solid"
              borderColor="gray.300"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={() => setCourtsCount((c) => Math.max(1, c - 1))}
              _hover={{ bg: 'gray.100' }}
            >
              <Minus size={14} />
            </Box>
            <Text fontWeight="semibold" minW="20px" textAlign="center">
              {courtsCount}
            </Text>
            <Box
              as="button"
              w="32px"
              h="32px"
              borderRadius="full"
              border="1px solid"
              borderColor="gray.300"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={() => setCourtsCount((c) => c + 1)}
              _hover={{ bg: 'gray.100' }}
            >
              <Plus size={14} />
            </Box>
          </Flex>
        </Flex>

        {/* Court names */}
        <VStack gap={2} align="stretch">
          {courtNames.map((cName, idx) => (
            <ChakraInput
              key={idx}
              value={cName}
              onChange={(e) => handleCourtNameChange(idx, e.target.value)}
              placeholder={`${t('panels.venues.court')} ${idx + 1}`}
              borderRadius="lg"
              fontSize="sm"
            />
          ))}
        </VStack>
      </VStack>
    </VModal>
  );
}
