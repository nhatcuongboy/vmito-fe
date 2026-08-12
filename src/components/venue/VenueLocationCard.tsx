'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { ExternalLink, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import { Button } from '@/components/ui/chakra-compat';
import VenueMapPin from '@/components/venue/VenueMapPin';
import { Venue } from '@/lib/api/types';
import { getGoogleMapsUrl } from '@/utils';

interface VenueLocationCardProps {
  venue: Venue;
  venueName: string;
}

const VenueLocationCard = ({ venue, venueName }: VenueLocationCardProps) => {
  const t = useTranslations('venue');

  const googleMapsUrl = getGoogleMapsUrl({
    address: venue.address,
    name: venueName,
    placeId: venue.placeId,
    lat: venue.lat,
    lng: venue.lng,
  });

  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      p={5}
      shadow="sm"
      borderWidth="1px"
      borderColor="gray.100"
    >
      <Heading size="sm" mb={3}>
        {t('detail.map')}
      </Heading>
      <Flex align="flex-start" gap={2} mb={3} minW={0}>
        <Box color="gray.500" _dark={{ color: 'gray.400' }} pt="2px">
          <MapPin size={16} aria-hidden="true" />
        </Box>
        <Box flex="1" minW={0}>
          <AppAddressDisplay
            address={venue.address}
            district={venue.district}
            city={venue.city}
            newAddress={venue.newAddress}
            newDistrict={venue.newDistrict}
            fontSize="sm"
            color="gray.600"
            _dark={{ color: 'gray.300' }}
          />
        </Box>
      </Flex>
      {venue.locatedWithin && (
        <Text
          fontSize="xs"
          color="gray.500"
          _dark={{ color: 'gray.400' }}
          mb={2}
        >
          {t('detail.locatedWithinLabel')}{' '}
          <strong>{venue.locatedWithin}</strong>
        </Text>
      )}
      {venue.lat && venue.lng && (
        <Box borderRadius="xl" overflow="hidden" mb={3}>
          <VenueMapPin lat={venue.lat} lng={venue.lng} height="180px" />
        </Box>
      )}
      {googleMapsUrl && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <Button variant="outline" w="full" size="sm" isWithinLink>
            <ExternalLink size={14} />
            {t('detail.googleMaps')}
          </Button>
        </a>
      )}
    </Box>
  );
};

export default VenueLocationCard;
