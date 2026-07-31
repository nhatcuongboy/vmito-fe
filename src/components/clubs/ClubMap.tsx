'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from '@react-google-maps/api';
import { IClub, IClubVenue } from '@/types/club';
import {
  Box,
  Text,
  VStack,
  HStack,
  Spinner,
  Center,
  Badge,
  Separator,
  IconButton,
} from '@chakra-ui/react';
import { MapPin, Info, Navigation, Users, Locate } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import useMapPinIcon from '@/hooks/useMapPinIcon';
import { toaster } from '@/components/ui/toaster';
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

interface ClubMapProps {
  clubs: IClub[];
  userLocation?: { lat: number; lng: number } | null;
}

interface VenueGroup {
  venue: IClubVenue;
  clubs: IClub[];
}

export default function ClubMap({
  clubs,
  userLocation: initialUserLocation,
}: ClubMapProps) {
  const t = useTranslations('common');
  const router = useRouter();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
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

  // Group clubs by venue (including scheduleVenues)
  const venueGroups = useMemo(() => {
    const groups: Record<string, VenueGroup> = {};

    clubs.forEach((club) => {
      const venues: IClubVenue[] = [];

      if (club.defaultVenue && club.defaultVenue.lat && club.defaultVenue.lng) {
        venues.push(club.defaultVenue);
      }

      if (club.scheduleVenues && club.scheduleVenues.length > 0) {
        club.scheduleVenues.forEach((venue) => {
          if (venue.lat && venue.lng) {
            venues.push(venue);
          }
        });
      }

      venues.forEach((venue) => {
        if (!groups[venue.id]) {
          groups[venue.id] = {
            venue,
            clubs: [],
          };
        }
        if (!groups[venue.id].clubs.find((c) => c.id === club.id)) {
          groups[venue.id].clubs.push(club);
        }
      });
    });

    return Object.values(groups);
  }, [clubs]);

  const selectedGroup = useMemo(() => {
    return venueGroups.find((g) => g.venue.id === selectedVenueId);
  }, [venueGroups, selectedVenueId]);

  const center = useMemo(() => {
    if (currentUserLocation) return currentUserLocation;
    if (venueGroups.length > 0) {
      return { lat: venueGroups[0].venue.lat!, lng: venueGroups[0].venue.lng! };
    }
    return defaultCenter;
  }, [currentUserLocation, venueGroups]);

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
            title: t('error'),
            description: errorMessage,
            type: 'error',
            duration: 3000,
          });
        }
      );
    } else {
      setIsLocating(false);
      toaster.create({
        title: t('error'),
        description: t('browserNotSupportLocation'),
        type: 'error',
        duration: 3000,
      });
    }
  }, [mapInstance, t]);

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
        {venueGroups.map((group) => (
          <MarkerF
            key={group.venue.id}
            position={{ lat: group.venue.lat!, lng: group.venue.lng! }}
            onClick={() => setSelectedVenueId(group.venue.id)}
            onMouseOver={() => setHoveredVenueId(group.venue.id)}
            onMouseOut={() => setHoveredVenueId(null)}
            label={
              isDesktop && hoveredVenueId === group.venue.id
                ? {
                    text: group.venue.name,
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
        {selectedGroup && (
          <InfoWindowF
            position={{
              lat: selectedGroup.venue.lat!,
              lng: selectedGroup.venue.lng!,
            }}
            onCloseClick={() => setSelectedVenueId(null)}
          >
            <Box p={1} maxW="300px" maxH="400px" overflowY="auto">
              <VStack align="stretch" gap={3}>
                <Box>
                  <Text fontWeight="bold" fontSize="md" color="green.600">
                    {selectedGroup.venue.name}
                  </Text>
                  <HStack gap={1} mt={1}>
                    <MapPin size={12} color="#718096" />
                    <Text fontSize="xs" color="gray.600" lineClamp={1}>
                      {selectedGroup.venue.address}
                    </Text>
                  </HStack>
                </Box>

                <Separator />

                <VStack align="stretch" gap={3}>
                  {selectedGroup.clubs.map((club) => (
                    <Box
                      key={club.id}
                      p={2}
                      borderRadius="md"
                      bg="gray.50"
                      _hover={{ bg: 'gray.100' }}
                      cursor="pointer"
                      onClick={() =>
                        router.push(`/clubs/${club.slug || club.id}`)
                      }
                    >
                      <HStack justify="space-between" mb={1}>
                        <Text
                          fontWeight="semibold"
                          fontSize="sm"
                          lineClamp={1}
                          flex={1}
                        >
                          {club.name}
                        </Text>
                        <Badge colorPalette="green" size="sm">
                          <Users size={12} />
                          {club.memberCount}
                        </Badge>
                      </HStack>

                      {club.description && (
                        <Text fontSize="xs" color="gray.600" lineClamp={2}>
                          {club.description}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>

                <button
                  style={{
                    fontSize: '12px',
                    padding: '6px 12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedGroup.venue.lat},${selectedGroup.venue.lng}`,
                      '_blank'
                    );
                  }}
                >
                  <Navigation size={12} />
                  Chỉ đường đến sân
                </button>
              </VStack>
            </Box>
          </InfoWindowF>
        )}
      </GoogleMap>
    </Box>
  );
}
