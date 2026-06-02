'use client';

import { Box, Flex, Text, Input, Spinner } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { MapPin, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';

interface SelectVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVenue: (venue: Venue) => void;
}

export default function SelectVenueModal({
  isOpen,
  onClose,
  onSelectVenue,
}: SelectVenueModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isSelecting, setIsSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      loadVenues();
    }
  }, [isOpen]);

  const loadVenues = async () => {
    try {
      setIsLoading(true);
      const data = await VenueService.getAllVenues();
      setVenues(data);
    } catch (error) {
      console.error('Failed to load venues', error);
      toaster.error({ title: t('panels.venues.loadError') });
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.address ?? '').toLowerCase().includes(q) ||
        (v.city ?? '').toLowerCase().includes(q)
    );
  }, [venues, search]);

  const handleSelect = async (venue: Venue) => {
    setIsSelecting(venue.id);
    try {
      await onSelectVenue(venue);
    } finally {
      setIsSelecting(null);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('panels.venues.selectVenue')}
      size="md"
      maxBodyHeight="60vh"
      hideSecondaryAction
      showFooterDivider={false}
    >
      {/* Search */}
      <Box mb={4} position="relative">
        <Box
          position="absolute"
          left={3}
          top="50%"
          transform="translateY(-50%)"
          pointerEvents="none"
          color="gray.400"
        >
          <Search size={16} />
        </Box>
        <Input
          pl={9}
          placeholder={t('panels.venues.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          borderRadius="lg"
          fontSize="sm"
        />
      </Box>

      {/* List */}
      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="md" />
        </Flex>
      ) : filtered.length === 0 ? (
        <Flex direction="column" align="center" py={10} gap={2}>
          <MapPin size={32} color="#CBD5E0" />
          <Text fontSize="sm" color="gray.400">
            {search
              ? t('panels.venues.noResults')
              : t('panels.venues.noVenues')}
          </Text>
        </Flex>
      ) : (
        <VStack gap={2} align="stretch">
          {filtered.map((venue) => (
            <Flex
              key={venue.id}
              align="center"
              gap={3}
              p={3}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.100"
              cursor="pointer"
              _hover={{ bg: 'gray.50', borderColor: 'gray.200' }}
              transition="all 0.15s"
              onClick={() => handleSelect(venue)}
              opacity={isSelecting === venue.id ? 0.6 : 1}
            >
              <Flex
                w="40px"
                h="40px"
                bg="gray.100"
                borderRadius="lg"
                align="center"
                justify="center"
                flexShrink={0}
              >
                {isSelecting === venue.id ? (
                  <Spinner size="sm" />
                ) : (
                  <MapPin size={18} color="#4A5568" />
                )}
              </Flex>
              <Box flex={1} minW={0}>
                <Text fontWeight="semibold" fontSize="sm" truncate>
                  {venue.name}
                </Text>
                {venue.address && (
                  <Text fontSize="xs" color="gray.500" truncate>
                    {venue.address}
                  </Text>
                )}
              </Box>
              {venue.numberOfCourts ? (
                <Text fontSize="xs" color="gray.400" flexShrink={0}>
                  {venue.numberOfCourts}{' '}
                  {t('panels.venues.court').toLowerCase()}
                  {venue.numberOfCourts > 1 ? 's' : ''}
                </Text>
              ) : null}
            </Flex>
          ))}
        </VStack>
      )}
    </VModal>
  );
}
