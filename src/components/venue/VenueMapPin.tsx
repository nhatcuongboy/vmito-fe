'use client';

import { useMemo } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { Box, Center, Spinner } from '@chakra-ui/react';
import useMapPinIcon from '@/hooks/useMapPinIcon';

const LIBRARIES: 'places'[] = ['places'];

interface VenueMapPinProps {
  lat: number;
  lng: number;
  /** Height of the map. Default: '180px' */
  height?: string;
  /** Zoom level. Default: 16 */
  zoom?: number;
}

export default function VenueMapPin({
  lat,
  lng,
  height = '180px',
  zoom = 16,
}: VenueMapPinProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });

  const { iconOptions } = useMapPinIcon({ isLoaded });

  const containerStyle = useMemo(() => ({ width: '100%', height }), [height]);

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  if (!isLoaded) {
    return (
      <Center h={height}>
        <Spinner size="sm" colorPalette="green" />
      </Center>
    );
  }

  return (
    <Box w="full" h={height} borderRadius="xl" overflow="hidden">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          scrollwheel: false,
          draggable: false,
          gestureHandling: 'none',
          clickableIcons: false,
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        <MarkerF position={center} icon={iconOptions ?? undefined} />
      </GoogleMap>
    </Box>
  );
}
