'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { MapPin, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament, TournamentVenue } from '@/lib/api/types';
import { useState, useEffect, useCallback } from 'react';
import VenueConfigModal from './VenueConfigModal';
import VenueCard from './venues/VenueCard';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
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
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
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

  const handleSetPrimary = async (tournamentVenue: TournamentVenue) => {
    try {
      setSettingPrimaryId(tournamentVenue.id);
      await TournamentService.setPrimaryVenue(
        tournament.id,
        tournamentVenue.id
      );
      setVenues((prev) =>
        prev.map((v) => ({ ...v, isPrimary: v.id === tournamentVenue.id }))
      );
      toaster.success({ title: t('primaryUpdated') });
      onTournamentChanged?.();
    } catch {
      toaster.error({ title: t('primaryError') });
    } finally {
      setSettingPrimaryId(null);
    }
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
            <VenueCard
              key={tv.id}
              tournamentVenue={tv}
              isRemoving={removingId === tv.id}
              isSettingPrimary={settingPrimaryId === tv.id}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onSetPrimary={handleSetPrimary}
            />
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
