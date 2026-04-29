'use client';

import React, { useState, useMemo } from 'react';
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
} from '@chakra-ui/react';
import { MapPin, Info, Navigation, Users } from 'lucide-react';
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

interface ClubMapProps {
  clubs: IClub[];
  userLocation?: { lat: number; lng: number } | null;
}

interface VenueGroup {
  venue: IClubVenue;
  clubs: IClub[];
}

export default function ClubMap({ clubs, userLocation }: ClubMapProps) {
  const router = useRouter();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });

  // Group clubs by venue (including scheduleVenues)
  const venueGroups = useMemo(() => {
    const groups: Record<string, VenueGroup> = {};

    clubs.forEach((club) => {
      const venues: IClubVenue[] = [];

      // Add defaultVenue if exists
      if (club.defaultVenue && club.defaultVenue.lat && club.defaultVenue.lng) {
        venues.push(club.defaultVenue);
      }

      // Add scheduleVenues if exists
      if (club.scheduleVenues && club.scheduleVenues.length > 0) {
        club.scheduleVenues.forEach((venue) => {
          if (venue.lat && venue.lng) {
            venues.push(venue);
          }
        });
      }

      // Group by venue
      venues.forEach((venue) => {
        if (!groups[venue.id]) {
          groups[venue.id] = {
            venue,
            clubs: [],
          };
        }
        // Avoid duplicate clubs at same venue
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
    if (userLocation) return userLocation;
    if (venueGroups.length > 0) {
      return { lat: venueGroups[0].venue.lat!, lng: venueGroups[0].venue.lng! };
    }
    return defaultCenter;
  }, [userLocation, venueGroups]);

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
          ],
        }}
      >
        {/* User Location Marker */}
        {userLocation && (
          <MarkerF
            position={userLocation}
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
            label={{
              text: group.clubs.length.toString(),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            }}
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
                  <Text fontWeight="bold" fontSize="md" color="blue.600">
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
                        <Badge colorPalette="blue" size="sm">
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
