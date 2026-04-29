'use client';

import React, { useState, useMemo } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from '@react-google-maps/api';
import { Venue } from '@/lib/api/types';
import {
  Box,
  Text,
  Image,
  Button,
  VStack,
  HStack,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { MapPin, Info, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';

const containerStyle = {
  width: '100%',
  height: 'calc(100vh - 250px)',
  minHeight: '400px',
  borderRadius: '16px',
};

const defaultCenter = {
  lat: 10.762622, // Ho Chi Minh City
  lng: 106.660172,
};

const LIBRARIES: 'places'[] = ['places'];

interface VenueMapProps {
  venues: Venue[];
  userLocation?: { lat: number; lng: number } | null;
}

export default function VenueMap({ venues, userLocation }: VenueMapProps) {
  const router = useRouter();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });

  const center = useMemo(() => {
    if (userLocation) return userLocation;
    if (venues.length > 0 && venues[0].lat && venues[0].lng) {
      return { lat: venues[0].lat, lng: venues[0].lng };
    }
    return defaultCenter;
  }, [userLocation, venues]);

  if (loadError) {
    return (
      <Center p={10} bg="red.50" borderRadius="xl" color="red.500">
        <VStack>
          <Info size={40} />
          <Text fontWeight="bold">Lỗi tải bản đồ</Text>
          <Text fontSize="sm">
            Vui lòng kiểm tra kết nối mạng hoặc API Key.
          </Text>
        </VStack>
      </Center>
    );
  }

  if (!isLoaded) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="green.500" />
      </Center>
    );
  }

  return (
    <Box
      borderRadius="2xl"
      overflow="hidden"
      shadow="xl"
      border="1px solid"
      borderColor="gray.100"
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'off' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text',
              stylers: [{ visibility: 'on' }],
            },
          ],
        }}
      >
        {/* User Location Marker */}
        {userLocation && (
          <MarkerF
            position={userLocation}
            icon={{
              path: 0, // google.maps.SymbolPath.CIRCLE
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: 'white',
            }}
            title="Vị trí của bạn"
          />
        )}

        {/* Venue Markers */}
        {venues.map((venue) => (
          <MarkerF
            key={venue.id}
            position={{ lat: venue.lat || 0, lng: venue.lng || 0 }}
            onClick={() => setSelectedVenue(venue)}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }}
          />
        ))}

        {/* Info Window */}
        {selectedVenue && selectedVenue.lat && selectedVenue.lng && (
          <InfoWindowF
            position={{ lat: selectedVenue.lat, lng: selectedVenue.lng }}
            onCloseClick={() => setSelectedVenue(null)}
          >
            <Box p={1} maxW="240px">
              <VStack align="stretch" gap={2}>
                {selectedVenue.coverPhoto && (
                  <Image
                    src={selectedVenue.coverPhoto}
                    alt={selectedVenue.name}
                    borderRadius="md"
                    objectFit="cover"
                    h="100px"
                    w="100%"
                  />
                )}
                <Box>
                  <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                    {selectedVenue.name}
                  </Text>
                  <HStack gap={1} mt={1}>
                    <MapPin size={12} color="#718096" />
                    <Text fontSize="xs" color="gray.600" noOfLines={2}>
                      {selectedVenue.address}
                    </Text>
                  </HStack>
                </Box>

                <HStack gap={2}>
                  <Button
                    size="xs"
                    colorPalette="green"
                    flex={1}
                    onClick={() =>
                      router.push(
                        `/venues/${selectedVenue.slug || selectedVenue.id}`
                      )
                    }
                  >
                    Chi tiết
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.lat},${selectedVenue.lng}`,
                        '_blank'
                      );
                    }}
                  >
                    <Navigation size={12} />
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </InfoWindowF>
        )}
      </GoogleMap>
    </Box>
  );
}
