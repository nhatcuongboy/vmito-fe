'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { IconButton, Button } from '@/components/ui/chakra-compat';
import { MapPin, Edit2, Trash2, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TournamentVenue } from '@/lib/api/types';
import VenueMapPin from '@/components/venue/VenueMapPin';
import { getTournamentVenueDisplay } from '@/utils';

interface VenueCardProps {
  tournamentVenue: TournamentVenue;
  isRemoving: boolean;
  isSettingPrimary: boolean;
  onEdit: (tournamentVenue: TournamentVenue) => void;
  onRemove: (tournamentVenue: TournamentVenue) => void;
  onSetPrimary: (tournamentVenue: TournamentVenue) => void;
}

export default function VenueCard({
  tournamentVenue,
  isRemoving,
  isSettingPrimary,
  onEdit,
  onRemove,
  onSetPrimary,
}: VenueCardProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.venues');

  const display = getTournamentVenueDisplay(tournamentVenue);
  const { lat, lng } = display;
  const isPrimary = !!tournamentVenue.isPrimary;
  const directionsUrl =
    lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : null;

  return (
    <Box
      borderWidth="1px"
      borderColor={isPrimary ? 'green.400' : 'gray.200'}
      borderRadius="2xl"
      overflow="hidden"
      bg="white"
      _dark={{
        bg: 'gray.800',
        borderColor: isPrimary ? 'green.500' : 'gray.700',
      }}
    >
      <Box
        h="200px"
        position="relative"
        w="full"
        borderRadius="2xl"
        overflow="hidden"
      >
        {lat && lng ? (
          <VenueMapPin lat={lat} lng={lng} height="200px" zoom={15} />
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

      <Flex justify="space-between" align="start" p={4}>
        <Box flex="1" minW={0}>
          <Flex align="center" gap={2} mb={1} wrap="wrap">
            <Text
              fontWeight="bold"
              fontSize="md"
              color="gray.800"
              _dark={{ color: 'gray.100' }}
            >
              {display.name}
            </Text>
            {display.acronym && (
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
                  {display.acronym}
                </Text>
              </Box>
            )}
            {isPrimary && (
              <Flex
                align="center"
                gap={1}
                bg="green.50"
                px={2}
                py={0.5}
                borderRadius="md"
                _dark={{ bg: 'green.900' }}
              >
                <Star size={12} fill="currentColor" color="#38A169" />
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="green.700"
                  _dark={{ color: 'green.200' }}
                >
                  {t('primaryBadge')}
                </Text>
              </Flex>
            )}
          </Flex>

          {display.address && (
            <Text
              fontSize="sm"
              color="gray.500"
              mb={1}
              _dark={{ color: 'gray.400' }}
            >
              {display.address}
              {display.city ? `, ${display.city}` : ''}
            </Text>
          )}

          {tournamentVenue.courts && tournamentVenue.courts.length > 0 && (
            <Text
              fontSize="xs"
              color="gray.400"
              mb={2}
              _dark={{ color: 'gray.500' }}
            >
              {tournamentVenue.courts.length} {t('courtsCount')}:{' '}
              {tournamentVenue.courts
                .map((c) => c.courtName || `${t('court')} ${c.courtNumber}`)
                .join(', ')}
            </Text>
          )}

          <Flex gap={2} mt={2} wrap="wrap">
            {directionsUrl && (
              <Button
                as="a"
                href={directionsUrl}
                variant="outline"
                size="xs"
                colorPalette="green"
                onClick={(event) => {
                  event.preventDefault();
                  window.open(directionsUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                <MapPin size={14} />
                {t('viewOnGoogleMaps')}
              </Button>
            )}
            {!isPrimary && (
              <Button
                variant="outline"
                size="xs"
                loading={isSettingPrimary}
                onClick={() => onSetPrimary(tournamentVenue)}
              >
                <Star size={14} />
                {t('setAsPrimary')}
              </Button>
            )}
          </Flex>
        </Box>

        <Flex align="center" gap={1}>
          <IconButton
            aria-label={t('editVenue')}
            variant="ghost"
            size="sm"
            onClick={() => onEdit(tournamentVenue)}
          >
            <Edit2 size={16} />
          </IconButton>
          <IconButton
            aria-label={t('removeVenue')}
            variant="ghost"
            size="sm"
            onClick={() => onRemove(tournamentVenue)}
            loading={isRemoving}
          >
            <Trash2 size={16} />
          </IconButton>
        </Flex>
      </Flex>
    </Box>
  );
}
