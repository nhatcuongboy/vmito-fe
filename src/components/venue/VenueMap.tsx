'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Button,
  VStack,
  HStack,
  Spinner,
  Center,
  IconButton,
} from '@chakra-ui/react';
import { MapPin, Info, Navigation, Locate } from 'lucide-react';
import { useRouter } from 'next/navigation';
import useMapPinIcon from '@/hooks/useMapPinIcon';
import { toaster } from '@/components/ui/toaster';
import { Image } from '@/components/ui/chakra-compat';
import {
  TOP_BAR_HEIGHT_MOBILE,
  CONTENT_PT_OFFSET,
  BOTTOM_TAB_HEIGHT,
} from '@/constants';

const defaultCenter = {
  lat: 10.762622, // Ho Chi Minh City
  lng: 106.660172,
};

const LIBRARIES: 'places'[] = ['places'];

interface VenueMapProps {
  venues: Venue[];
  userLocation?: { lat: number; lng: number } | null;
}

export default function VenueMap({
  venues,
  userLocation: initialUserLocation,
}: VenueMapProps) {
  const router = useRouter();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [hoveredVenueId, setHoveredVenueId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(initialUserLocation || null);
  const [isDesktop, setIsDesktop] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Request user location on mount if not provided
  useEffect(() => {
    if (!initialUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Could not get user location:', error);
        }
      );
    }
  }, [initialUserLocation]);

  // Update current location when prop changes
  useEffect(() => {
    if (initialUserLocation) {
      setCurrentUserLocation(initialUserLocation);
    }
  }, [initialUserLocation]);

  const containerStyle = {
    width: '100%',
    height: `calc(100vh - ${TOP_BAR_HEIGHT_MOBILE}px - env(safe-area-inset-top) - ${CONTENT_PT_OFFSET} - ${BOTTOM_TAB_HEIGHT}px - env(safe-area-inset-bottom) - 80px)`,
    minHeight: '300px',
    borderRadius: '16px',
  };

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });

  const { iconOptions: markerIconOptions } = useMapPinIcon({ isLoaded });

  const center = useMemo(() => {
    if (currentUserLocation) return currentUserLocation;
    if (venues.length > 0 && venues[0].lat && venues[0].lng) {
      return { lat: venues[0].lat, lng: venues[0].lng };
    }
    return defaultCenter;
  }, [currentUserLocation, venues]);

  const handleLocationClick = useCallback(() => {
    if (!mapInstance) return;

    setIsLocating(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentUserLocation(userPos);
          mapInstance.panTo(userPos);
          mapInstance.setZoom(15);
          setIsLocating(false);
          toaster.create({
            title: 'Đã tìm thấy vị trí của bạn',
            type: 'success',
            duration: 2000,
          });
        },
        (error) => {
          setIsLocating(false);
          let errorMessage = 'Không thể lấy vị trí của bạn';
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage =
              'Vui lòng cho phép truy cập vị trí trong cài đặt trình duyệt';
          }
          toaster.create({
            title: 'Lỗi',
            description: errorMessage,
            type: 'error',
            duration: 3000,
          });
        }
      );
    } else {
      setIsLocating(false);
      toaster.create({
        title: 'Lỗi',
        description: 'Trình duyệt không hỗ trợ định vị',
        type: 'error',
        duration: 3000,
      });
    }
  }, [mapInstance]);

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
      position="relative"
    >
      {/* Custom styles for venue marker labels on desktop */}
      <style>{`
        .venue-marker-label {
          white-space: nowrap !important;
          font-family: inherit;
          text-shadow: 1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white !important;
        }
      `}</style>

      {/* Location Button */}
      <IconButton
        aria-label="Vị trí của bạn"
        position="absolute"
        bottom={48}
        right={3}
        zIndex={10}
        size="md"
        colorPalette="green"
        onClick={handleLocationClick}
        loading={isLocating}
        variant="solid"
        boxShadow="lg"
      >
        <Locate size={20} />
      </IconButton>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={(map) => setMapInstance(map)}
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
          ],
        }}
      >
        {/* User Location Marker */}
        {currentUserLocation && (
          <MarkerF
            position={currentUserLocation}
            icon={{
              path: 0,
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
            onMouseOver={() => setHoveredVenueId(venue.id)}
            onMouseOut={() => setHoveredVenueId(null)}
            label={
              isDesktop && hoveredVenueId === venue.id
                ? {
                    text: venue.name,
                    color: '#15803d',
                    fontWeight: '700',
                    fontSize: '13px',
                    className: 'venue-marker-label',
                  }
                : undefined
            }
            icon={markerIconOptions ?? undefined}
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
                  <Text fontWeight="bold" fontSize="md" lineClamp={1}>
                    {selectedVenue.name}
                  </Text>
                  <HStack gap={1} mt={1}>
                    <MapPin size={12} color="#718096" />
                    <Text fontSize="xs" color="gray.600" lineClamp={2}>
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
