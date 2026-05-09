'use client';

import { Box, Flex, Text, Input, HStack, Spinner } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { Minus, Plus, MapPin, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo, useRef } from 'react';
import { VenueService } from '@/lib/api/venue.service';
import { TournamentService } from '@/lib/api/tournament.service';
import { TournamentVenue, Venue } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';

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

export default function VenueConfigModal({
  isOpen,
  onClose,
  tournamentId,
  existingTournamentVenue,
  onSaved,
}: VenueConfigModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.venues');

  // Venue search / select
  const [allVenues, setAllVenues] = useState<Venue[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extra fields
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');

  // Courts config
  const [courtCount, setCourtCount] = useState(1);
  const [courts, setCourts] = useState<CourtInput[]>([
    { courtNumber: 1, courtName: '' },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadVenues();
      if (existingTournamentVenue) {
        setSelectedVenue(existingTournamentVenue.venue);
        setSearch(existingTournamentVenue.venue.name);
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
        setSearch('');
        setName('');
        setAcronym('');
        setCourtCount(1);
        setCourts([{ courtNumber: 1, courtName: '' }]);
      }
      setShowDropdown(false);
    }
  }, [isOpen, existingTournamentVenue]);

  const loadVenues = async () => {
    try {
      setIsLoadingVenues(true);
      const data = await VenueService.getAllVenues();
      setAllVenues(data);
    } catch {
      toaster.error({ title: 'Failed to load venues' });
    } finally {
      setIsLoadingVenues(false);
    }
  };

  const filteredVenues = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allVenues.slice(0, 20);
    return allVenues
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.address ?? '').toLowerCase().includes(q) ||
          (v.city ?? '').toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [allVenues, search]);

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setSearch(venue.name);
    setName(venue.name);
    setAcronym(venue.acronym ?? '');
    setShowDropdown(false);
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
    if (!selectedVenue) {
      toaster.error({ title: t('nameRequired') });
      return;
    }

    try {
      setIsSaving(true);

      const venueId = selectedVenue.id;

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
        name.trim() !== selectedVenue.name ||
        acronym.trim() !== (selectedVenue.acronym ?? '')
      ) {
        await VenueService.updateVenue(venueId, {
          name: name.trim() || selectedVenue.name,
          acronym: acronym.trim() || undefined,
        });
      }

      const result = await TournamentService.addVenue(tournamentId, {
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

  const inputStyle = {
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    background: 'white',
  };

  const counterBtnStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'white',
  };

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
        {/* Address — venue search select */}
        <Box position="relative" ref={dropdownRef}>
          <Flex
            align="center"
            gap={2}
            px={4}
            style={{
              border: showDropdown ? '1px solid #3182ce' : '1px solid #E2E8F0',
              borderRadius: '12px',
              background: 'white',
            }}
          >
            <Search size={15} color="#A0AEC0" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedVenue(null);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Address"
              border="none"
              outline="none"
              p={0}
              py={3}
              flex={1}
              fontSize="14px"
              _focus={{ outline: 'none', boxShadow: 'none' }}
            />
            {isLoadingVenues && <Spinner size="sm" color="gray.400" />}
          </Flex>

          {showDropdown && (
            <Box
              position="absolute"
              top="calc(100% + 4px)"
              left={0}
              right={0}
              bg="white"
              border="1px solid #E2E8F0"
              borderRadius="12px"
              boxShadow="lg"
              zIndex={200}
              maxH="220px"
              overflowY="auto"
            >
              {filteredVenues.length === 0 ? (
                <Box px={4} py={3}>
                  <Text fontSize="sm" color="gray.400">
                    {search ? t('noResults') : t('noVenues')}
                  </Text>
                </Box>
              ) : (
                filteredVenues.map((venue) => (
                  <Box
                    key={venue.id}
                    px={4}
                    py={3}
                    cursor="pointer"
                    bg={selectedVenue?.id === venue.id ? 'blue.50' : 'white'}
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => handleSelectVenue(venue)}
                    borderBottom="1px solid #F7FAFC"
                  >
                    <Flex align="center" gap={2}>
                      <MapPin size={13} color="#A0AEC0" />
                      <Box>
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color="gray.800"
                        >
                          {venue.name}
                        </Text>
                        {venue.address && (
                          <Text fontSize="xs" color="gray.500">
                            {venue.address}
                            {venue.city ? `, ${venue.city}` : ''}
                          </Text>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>

        {/* Name */}
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          style={inputStyle}
          _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1px #3182ce' }}
        />

        {/* Acronym */}
        <Box>
          <Input
            value={acronym}
            onChange={(e) => setAcronym(e.target.value)}
            placeholder="Acronym"
            style={{ ...inputStyle, maxWidth: '160px' }}
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
              style={counterBtnStyle}
              _hover={{ bg: 'gray.50' }}
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
              style={counterBtnStyle}
              _hover={{ bg: 'gray.50' }}
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
              placeholder={`Court ${index + 1}`}
              style={inputStyle}
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
