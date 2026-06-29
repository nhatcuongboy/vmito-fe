'use client';

import { Box, Flex, Text, Input, HStack } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { VenueService } from '@/lib/api/venue.service';
import { TournamentService } from '@/lib/api/tournament.service';
import { TournamentVenue, Venue } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';
import LocationAutocomplete from '@/components/common/LocationAutocomplete';

interface VenueConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  existingTournamentVenue?: TournamentVenue;
  onSaved: () => void;
}

interface CourtInput {
  courtNumber: number;
  courtName: string;
}

interface LocationData {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  district?: string;
  city?: string;
}

export default function VenueConfigModal({
  isOpen,
  onClose,
  tournamentId,
  existingTournamentVenue,
  onSaved,
}: VenueConfigModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.venues');

  // Venue search / select
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);

  // Extra fields
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');

  // Courts config
  const [courtCount, setCourtCount] = useState(1);
  const [courts, setCourts] = useState<CourtInput[]>([
    { courtNumber: 1, courtName: '' },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingTournamentVenue) {
        setSelectedVenue(existingTournamentVenue.venue);
        setLocation(null);
        setName(existingTournamentVenue.venue.name ?? '');
        setAcronym(existingTournamentVenue.venue.acronym ?? '');
        const existingCourts = existingTournamentVenue.courts ?? [];
        if (existingCourts.length > 0) {
          setCourtCount(existingCourts.length);
          setCourts(
            existingCourts.map((c) => ({
              courtNumber: c.courtNumber,
              courtName: c.courtName ?? '',
            }))
          );
        } else {
          setCourtCount(1);
          setCourts([{ courtNumber: 1, courtName: '' }]);
        }
      } else {
        setSelectedVenue(null);
        setLocation(null);
        setName('');
        setAcronym('');
        setCourtCount(1);
        setCourts([{ courtNumber: 1, courtName: '' }]);
      }
    }
  }, [isOpen, existingTournamentVenue]);

  const handleLocationSelect = (nextLocation: LocationData) => {
    setSelectedVenue(null);
    setLocation(nextLocation);
    setName(nextLocation.name);
    setAcronym('');
  };

  const handleCourtCountChange = (delta: number) => {
    const newCount = Math.max(1, courtCount + delta);
    setCourtCount(newCount);
    setCourts((prev) => {
      const updated = [...prev];
      if (newCount > updated.length) {
        for (let i = updated.length + 1; i <= newCount; i++) {
          updated.push({ courtNumber: i, courtName: '' });
        }
      } else {
        updated.splice(newCount);
      }
      return updated;
    });
  };

  const handleCourtNameChange = (index: number, value: string) => {
    setCourts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], courtName: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedVenue && !location) {
      toaster.error({ title: t('nameRequired') });
      return;
    }

    try {
      setIsSaving(true);

      const venue =
        selectedVenue ??
        (await VenueService.findOrCreateVenue({
          placeId: location!.placeId,
          name: location!.name,
          address: location!.address,
          lat: location!.lat,
          lng: location!.lng,
          district: location!.district,
          city: location!.city,
        }));
      const venueId = venue.id;

      // If editing and venue changed, remove old venue first
      if (
        existingTournamentVenue &&
        existingTournamentVenue.venueId !== venueId
      ) {
        await TournamentService.removeVenue(
          tournamentId,
          existingTournamentVenue.venueId
        );
      }

      // Update name/acronym if changed
      if (
        name.trim() !== venue.name ||
        acronym.trim() !== (venue.acronym ?? '')
      ) {
        await VenueService.updateVenue(venueId, {
          name: name.trim() || venue.name,
          acronym: acronym.trim() || undefined,
        });
      }

      await TournamentService.addVenue(tournamentId, {
        venueId,
        courts: courts.map((c) => ({
          courtNumber: c.courtNumber,
          courtName: c.courtName || undefined,
        })),
      });

      toaster.success({ title: t('venueSaved') });
      onSaved();
      onClose();
    } catch {
      toaster.error({ title: t('saveError') });
    } finally {
      setIsSaving(false);
    }
  };

  const title = existingTournamentVenue ? t('editVenue') : t('addVenue');

  const inputProps = {
    borderWidth: '1px',
    borderColor: 'gray.200',
    borderRadius: '12px',
    px: 4,
    py: 3,
    fontSize: '14px',
    width: '100%',
    height: 'auto',
    bg: 'white',
    color: 'gray.800',
    _placeholder: { color: 'gray.400' },
    _dark: {
      bg: 'gray.700',
      borderColor: 'gray.600',
      color: 'gray.100',
      _placeholder: { color: 'gray.400' },
    },
  } as const;

  const counterBtnProps = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    borderWidth: '1px',
    borderColor: 'gray.200',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    bg: 'white',
    color: 'gray.700',
    _dark: { bg: 'gray.700', borderColor: 'gray.600', color: 'gray.100' },
  } as const;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      primaryActionText={t('save')}
      onPrimaryAction={handleSave}
      isPrimaryLoading={isSaving}
    >
      <VStack gap={4} align="stretch">
        {/* Inline suggestions stay visible inside the modal scroll container. */}
        <LocationAutocomplete
          onSelect={handleLocationSelect}
          defaultValue={
            existingTournamentVenue?.venue.address ||
            existingTournamentVenue?.venue.name
          }
          placeholder={t('address')}
          suggestionsPlacement="inline"
          suggestionsMaxH="220px"
        />

        {/* Name */}
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('name')}
          {...inputProps}
          _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1px #3182ce' }}
        />

        {/* Acronym */}
        <Box>
          <Input
            value={acronym}
            onChange={(e) => setAcronym(e.target.value)}
            placeholder={t('acronym')}
            {...inputProps}
            maxW="160px"
            _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1px #3182ce' }}
          />
        </Box>

        {/* Court counter */}
        <Flex justify="space-between" align="center">
          <Text fontWeight="semibold" fontSize="sm">
            {t('howManyCourts')}
          </Text>
          <HStack gap={3} align="center">
            <Box
              as="button"
              onClick={() => handleCourtCountChange(-1)}
              {...counterBtnProps}
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.600' } }}
            >
              <Minus size={14} />
            </Box>
            <Text
              fontSize="md"
              fontWeight="semibold"
              minW="20px"
              textAlign="center"
            >
              {courtCount}
            </Text>
            <Box
              as="button"
              onClick={() => handleCourtCountChange(1)}
              {...counterBtnProps}
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.600' } }}
            >
              <Plus size={14} />
            </Box>
          </HStack>
        </Flex>

        {/* Court name inputs */}
        <VStack gap={3} align="stretch">
          {courts.map((court, index) => (
            <Input
              key={index}
              value={court.courtName}
              onChange={(e) => handleCourtNameChange(index, e.target.value)}
              placeholder={`${t('court')} ${index + 1}`}
              {...inputProps}
              _focus={{
                borderColor: '#3182ce',
                boxShadow: '0 0 0 1px #3182ce',
              }}
            />
          ))}
        </VStack>
      </VStack>
    </VModal>
  );
}
