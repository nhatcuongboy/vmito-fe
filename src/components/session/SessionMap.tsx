'use client';

import React, { useState, useMemo } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from '@react-google-maps/api';
import { ISession, Venue } from '@/lib/api/types';
import {
  Box,
  Text,
  Image,
  Button,
  VStack,
  HStack,
  Spinner,
  Center,
  Badge,
  Separator,
} from '@chakra-ui/react';
import { MapPin, Info, Navigation, Users, Clock, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

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

interface SessionMapProps {
  sessions: ISession[];
  userLocation?: { lat: number; lng: number } | null;
}

interface VenueGroup {
  venue: Venue;
  sessions: ISession[];
}

export default function SessionMap({
  sessions,
  userLocation,
}: SessionMapProps) {
  const router = useRouter();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
    libraries: LIBRARIES,
  });

  // Group sessions by venue
  const venueGroups = useMemo(() => {
    const groups: Record<string, VenueGroup> = {};

    sessions.forEach((session) => {
      if (session.venue && session.venue.lat && session.venue.lng) {
        const venueId = session.venue.id;
        if (!groups[venueId]) {
          groups[venueId] = {
            venue: session.venue,
            sessions: [],
          };
        }
        groups[venueId].sessions.push(session);
      }
    });

    return Object.values(groups);
  }, [sessions]);

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
        {venueGroups.map((group) => (
          <MarkerF
            key={group.venue.id}
            position={{ lat: group.venue.lat!, lng: group.venue.lng! }}
            onClick={() => setSelectedVenueId(group.venue.id)}
            label={{
              text: group.sessions.length.toString(),
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
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
                  <Text fontWeight="bold" fontSize="md" color="green.600">
                    {selectedGroup.venue.name}
                  </Text>
                  <HStack gap={1} mt={1}>
                    <MapPin size={12} color="#718096" />
                    <Text fontSize="xs" color="gray.600" noOfLines={1}>
                      {selectedGroup.venue.address}
                    </Text>
                  </HStack>
                </Box>

                <Separator />

                <VStack align="stretch" gap={3}>
                  {selectedGroup.sessions.map((session) => {
                    const availableSlots =
                      session.numberOfCourts * session.maxPlayersPerCourt -
                      (session._count?.players || 0);
                    const isFull = availableSlots <= 0;

                    return (
                      <Box
                        key={session.id}
                        p={2}
                        borderRadius="md"
                        bg="gray.50"
                        _hover={{ bg: 'gray.100' }}
                        cursor="pointer"
                        onClick={() =>
                          router.push(`/sessions/${session.slug || session.id}`)
                        }
                      >
                        <HStack justify="space-between" mb={1}>
                          <Text
                            fontWeight="semibold"
                            fontSize="sm"
                            noOfLines={1}
                            flex={1}
                          >
                            {session.name}
                          </Text>
                          <Badge
                            colorPalette={isFull ? 'red' : 'green'}
                            size="sm"
                          >
                            {isFull ? 'Hết chỗ' : `Còn ${availableSlots} chỗ`}
                          </Badge>
                        </HStack>

                        <HStack gap={3} fontSize="xs" color="gray.600">
                          <HStack gap={1}>
                            <Calendar size={12} />
                            <Text>
                              {session.startTime
                                ? format(new Date(session.startTime), 'dd/MM')
                                : '--/--'}
                            </Text>
                          </HStack>
                          <HStack gap={1}>
                            <Clock size={12} />
                            <Text>
                              {session.startTime
                                ? format(new Date(session.startTime), 'HH:mm')
                                : '--:--'}
                            </Text>
                          </HStack>
                          <HStack gap={1}>
                            <Users size={12} />
                            <Text>{session._count?.players || 0} người</Text>
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>

                <Button
                  size="xs"
                  variant="outline"
                  w="full"
                  leftIcon={<Navigation size={12} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedGroup.venue.lat},${selectedGroup.venue.lng}`,
                      '_blank'
                    );
                  }}
                >
                  Chỉ đường đến sân
                </Button>
              </VStack>
            </Box>
          </InfoWindowF>
        )}
      </GoogleMap>
    </Box>
  );
}
