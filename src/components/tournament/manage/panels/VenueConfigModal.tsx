'use client';

import { Box, Flex, Text, Input } from '@chakra-ui/react';
import { VStack, IconButton, Button } from '@/components/ui/chakra-compat';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
  /** Existing TournamentCourt id; absent for courts added in this session. */
  id?: string;
  /** Real court number for existing courts; new courts are numbered on save. */
  courtNumber?: number;
  courtName: string;
  /** Assigned matches + schedule slots — used to warn before deletion. */
  usageCount: number;
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
  /** Raw text in the address box. Controlled so re-opening the modal for a
   *  different venue never shows the previous one's address. */
  const [addressQuery, setAddressQuery] = useState('');
  /** True only after the host asked to change the address, so the search box
   *  grabs focus then but not when the modal simply opens. */
  const [shouldFocusAddress, setShouldFocusAddress] = useState(false);

  // Extra fields
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');

  // Courts config
  const [courts, setCourts] = useState<CourtInput[]>([
    { courtName: '', usageCount: 0 },
  ]);
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(
    null
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingTournamentVenue) {
        const isLinked = !!existingTournamentVenue.venue;
        if (isLinked) {
          // Linked mode: venue is a proper Venue record
          setSelectedVenue(existingTournamentVenue.venue!);
          setLocation(null);
          setName(existingTournamentVenue.venue!.name ?? '');
          setAcronym(existingTournamentVenue.venue!.acronym ?? '');
          setAddressQuery(existingTournamentVenue.venue!.address ?? '');
        } else {
          // Inline mode: address stored directly on TournamentVenue
          setSelectedVenue(null);
          setLocation({
            placeId: existingTournamentVenue.placeId ?? '',
            name: existingTournamentVenue.name ?? '',
            address: existingTournamentVenue.address ?? '',
            lat: existingTournamentVenue.lat ?? 0,
            lng: existingTournamentVenue.lng ?? 0,
            district: existingTournamentVenue.district,
            city: existingTournamentVenue.city,
          });
          setName(existingTournamentVenue.name ?? '');
          setAcronym(existingTournamentVenue.acronym ?? '');
          setAddressQuery(existingTournamentVenue.address ?? '');
        }
        const existingCourts = existingTournamentVenue.courts ?? [];
        if (existingCourts.length > 0) {
          setCourts(
            existingCourts.map((c) => ({
              id: c.id,
              courtNumber: c.courtNumber,
              courtName: c.courtName ?? '',
              usageCount:
                (c._count?.matches ?? 0) + (c._count?.courtTimeSlots ?? 0),
            }))
          );
        } else {
          setCourts([{ courtName: '', usageCount: 0 }]);
        }
      } else {
        setSelectedVenue(null);
        setLocation(null);
        setAddressQuery('');
        setName('');
        setAcronym('');
        setCourts([{ courtName: '', usageCount: 0 }]);
      }
      setShouldFocusAddress(false);
      setConfirmRemoveIndex(null);
    }
  }, [isOpen, existingTournamentVenue]);

  const handleLocationSelect = (nextLocation: LocationData) => {
    setSelectedVenue(null);
    setLocation(nextLocation);
    setAddressQuery(nextLocation.address);
    setShouldFocusAddress(false);
    setName(nextLocation.name);
    setAcronym('');
  };

  /** Backs the "change location" action: an address search box only helps when
   *  it is empty, and name, acronym and courts are left untouched. */
  const handleClearAddress = () => {
    setSelectedVenue(null);
    setLocation(null);
    setAddressQuery('');
    setShouldFocusAddress(true);
  };

  const handleAddCourt = () => {
    setCourts((prev) => [...prev, { courtName: '', usageCount: 0 }]);
  };

  const handleRemoveCourt = (index: number) => {
    if (courts.length <= 1) return;
    const court = courts[index];
    // Existing court with assigned matches / schedule slots — confirm first,
    // since saving will drop those assignments.
    if (court.id && court.usageCount > 0) {
      setConfirmRemoveIndex(index);
      return;
    }
    setCourts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmRemoveCourt = () => {
    if (confirmRemoveIndex === null) return;
    setCourts((prev) => prev.filter((_, i) => i !== confirmRemoveIndex));
    setConfirmRemoveIndex(null);
  };

  const handleCourtNameChange = (index: number, value: string) => {
    setCourts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], courtName: value };
      return updated;
    });
  };

  const hasAddress = !!selectedVenue || !!location;
  /** Typed something but never picked a suggestion — no coordinates to save. */
  const isAddressUnconfirmed = !hasAddress && addressQuery.trim().length > 0;

  const handleSave = async () => {
    if (!hasAddress) {
      toaster.error({
        title: isAddressUnconfirmed
          ? t('selectFromSuggestions')
          : t('nameRequired'),
      });
      return;
    }
    if (!name.trim()) {
      toaster.error({ title: t('nameRequired') });
      return;
    }

    // New courts need a placeholder courtNumber for the DTO; the server
    // assigns the real number (next free in the tournament) on create.
    let nextNumber = Math.max(0, ...courts.map((c) => c.courtNumber ?? 0)) + 1;
    const courtPayload = courts.map((c) => ({
      id: c.id,
      courtNumber: c.courtNumber ?? nextNumber++,
      courtName: c.courtName || undefined,
    }));

    try {
      setIsSaving(true);

      if (selectedVenue) {
        // --- Linked mode: user selected an existing verified venue ---
        const venueId = selectedVenue.id;

        // If editing and the venue changed, remove the old record first.
        // `venueId` is only set for a previously-linked venue — an inline
        // one is identified by its own TournamentVenue id instead.
        if (
          existingTournamentVenue &&
          existingTournamentVenue.venueId !== venueId
        ) {
          await TournamentService.removeVenue(
            tournamentId,
            existingTournamentVenue.venueId ?? existingTournamentVenue.id
          );
        }

        await TournamentService.addVenue(tournamentId, {
          venueId,
          courts: courtPayload,
        });
      } else {
        // --- Inline mode: store address directly, no venues table record ---
        // addVenue always creates a fresh TournamentVenue here (no in-place
        // update for inline data), so the previous record — linked or
        // inline — must always be removed first to avoid leaving a
        // duplicate/orphaned venue behind.
        if (existingTournamentVenue) {
          await TournamentService.removeVenue(
            tournamentId,
            existingTournamentVenue.venueId ?? existingTournamentVenue.id
          );
        }

        await TournamentService.addVenue(tournamentId, {
          name: name.trim() || location!.name,
          acronym: acronym.trim() || undefined,
          placeId: location!.placeId,
          address: location!.address,
          lat: location!.lat,
          lng: location!.lng,
          district: location!.district,
          city: location!.city,
          courts: courtPayload,
        });
      }

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

  const courtPendingRemoval =
    confirmRemoveIndex !== null ? courts[confirmRemoveIndex] : null;

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
        {hasAddress ? (
          <Flex
            align="flex-start"
            gap={3}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="12px"
            px={4}
            py={3}
            bg="gray.50"
            _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
          >
            <Box color="gray.500" mt="2px" flexShrink={0}>
              <MapPin size={18} />
            </Box>
            <Box flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                {selectedVenue?.name ?? location?.name}
              </Text>
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                lineClamp={2}
              >
                {selectedVenue?.address ?? location?.address}
              </Text>
              <Button
                variant="plain"
                size="xs"
                px={0}
                mt={1}
                height="auto"
                color="brand.500"
                onClick={handleClearAddress}
              >
                {t('changeAddress')}
              </Button>
            </Box>
          </Flex>
        ) : (
          <Box>
            {/* Inline suggestions stay visible inside the modal scroll container. */}
            <LocationAutocomplete
              onSelect={handleLocationSelect}
              value={addressQuery}
              onInputChange={setAddressQuery}
              onClear={handleClearAddress}
              isClearable
              clearAriaLabel={t('clearAddress')}
              autoFocus={shouldFocusAddress}
              placeholder={t('address')}
              suggestionsPlacement="inline"
              suggestionsMaxH="220px"
            />
            {isAddressUnconfirmed && (
              <Text fontSize="xs" color="orange.500" mt={1}>
                {t('selectFromSuggestions')}
              </Text>
            )}
          </Box>
        )}

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

        {/* Courts */}
        <Flex justify="space-between" align="center">
          <Text fontWeight="semibold" fontSize="sm">
            {t('howManyCourts')}
          </Text>
          <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
            {courts.length}
          </Text>
        </Flex>

        <VStack gap={3} align="stretch">
          {courts.map((court, index) => (
            <Flex key={court.id ?? `new-${index}`} gap={2} align="center">
              <Input
                value={court.courtName}
                onChange={(e) => handleCourtNameChange(index, e.target.value)}
                placeholder={
                  court.courtNumber !== undefined
                    ? `${t('court')} ${court.courtNumber}`
                    : t('newCourt')
                }
                {...inputProps}
                _focus={{
                  borderColor: '#3182ce',
                  boxShadow: '0 0 0 1px #3182ce',
                }}
              />
              <IconButton
                aria-label={t('removeCourt')}
                variant="ghost"
                size="sm"
                flexShrink={0}
                disabled={courts.length <= 1}
                onClick={() => handleRemoveCourt(index)}
              >
                <Trash2 size={16} />
              </IconButton>
            </Flex>
          ))}

          <Button
            variant="outline"
            size="sm"
            alignSelf="flex-start"
            display="flex"
            alignItems="center"
            gap={2}
            onClick={handleAddCourt}
          >
            <Plus size={14} />
            {t('addCourt')}
          </Button>
        </VStack>
      </VStack>

      {/* Confirm removing a court that has matches / schedule slots */}
      <VModal
        isOpen={confirmRemoveIndex !== null}
        onClose={() => setConfirmRemoveIndex(null)}
        title={t('removeCourt')}
        size="sm"
        zIndex={1600}
        primaryActionText={t('removeCourtConfirm')}
        primaryColorScheme="red"
        onPrimaryAction={handleConfirmRemoveCourt}
        secondaryActionText={t('cancel')}
        isCentered
      >
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
          {t('removeCourtWarning', {
            name:
              courtPendingRemoval?.courtName ||
              `${t('court')} ${courtPendingRemoval?.courtNumber ?? ''}`,
            count: courtPendingRemoval?.usageCount ?? 0,
          })}
        </Text>
      </VModal>
    </VModal>
  );
}
