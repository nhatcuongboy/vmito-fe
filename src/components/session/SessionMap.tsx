'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Button,
  VStack,
  HStack,
  Spinner,
  Center,
  Badge,
  Separator,
  IconButton,
} from '@chakra-ui/react';
import {
  MapPin,
  Info,
  Navigation,
  Users,
  Clock,
  Calendar,
  Locate,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
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

// Unused - kept for reference
// const createShuttlecockMarkerIcon = () => {};

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
  userLocation: initialUserLocation,
}: SessionMapProps) {
  const router = useRouter();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [hoveredVenueId, setHoveredVenueId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(initialUserLocation || null);
  const [markerIcon, setMarkerIcon] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Detect desktop viewport
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Create custom pin marker icon with shuttlecock
  useEffect(() => {
    const W = 48;
    const H = 56; // Reduced from 64 to 56
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const cx = W / 2;
    const circleR = 18;
    const circleCy = circleR + 4;
    const tipY = H - 4;

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // White border - teardrop shape (rounder bottom)
    ctx.beginPath();
    // Start at top center
    ctx.moveTo(cx, circleCy - circleR - 2);
    // Right curve (top half)
    ctx.bezierCurveTo(
      cx + (circleR + 2) * 0.55,
      circleCy - circleR - 2,
      cx + circleR + 2,
      circleCy - (circleR + 2) * 0.55,
      cx + circleR + 2,
      circleCy
    );
    // Right curve (bottom half) - gentler curve toward tip for rounder appearance
    ctx.bezierCurveTo(
      cx + circleR + 2,
      circleCy + (circleR + 2) * 0.5,
      cx + 10,
      circleCy + circleR + 4,
      cx,
      tipY
    );
    // Left curve (bottom half) - gentler curve from tip for rounder appearance
    ctx.bezierCurveTo(
      cx - 10,
      circleCy + circleR + 4,
      cx - circleR - 2,
      circleCy + (circleR + 2) * 0.5,
      cx - circleR - 2,
      circleCy
    );
    // Left curve (top half)
    ctx.bezierCurveTo(
      cx - circleR - 2,
      circleCy - (circleR + 2) * 0.55,
      cx - (circleR + 2) * 0.55,
      circleCy - circleR - 2,
      cx,
      circleCy - circleR - 2
    );
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Green teardrop shape (rounder bottom)
    ctx.beginPath();
    // Start at top center
    ctx.moveTo(cx, circleCy - circleR);
    // Right curve (top half)
    ctx.bezierCurveTo(
      cx + circleR * 0.55,
      circleCy - circleR,
      cx + circleR,
      circleCy - circleR * 0.55,
      cx + circleR,
      circleCy
    );
    // Right curve (bottom half) - gentler curve toward tip for rounder appearance
    ctx.bezierCurveTo(
      cx + circleR,
      circleCy + circleR * 0.5,
      cx + 8,
      circleCy + circleR + 2,
      cx,
      tipY - 2
    );
    // Left curve (bottom half) - gentler curve from tip for rounder appearance
    ctx.bezierCurveTo(
      cx - 8,
      circleCy + circleR + 2,
      cx - circleR,
      circleCy + circleR * 0.5,
      cx - circleR,
      circleCy
    );
    // Left curve (top half)
    ctx.bezierCurveTo(
      cx - circleR,
      circleCy - circleR * 0.55,
      cx - circleR * 0.55,
      circleCy - circleR,
      cx,
      circleCy - circleR
    );
    ctx.closePath();
    ctx.fillStyle = '#16a34a';
    ctx.fill();

    // Simple shuttlecock icon (white)
    ctx.save();
    ctx.translate(cx, circleCy);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Cork (small circle)
    ctx.beginPath();
    ctx.arc(0, 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // 3 feather lines
    const feathers = [-0.4, 0, 0.4];
    const featherLen = 10;
    ctx.lineWidth = 2;
    feathers.forEach((angle) => {
      const x = Math.sin(angle) * featherLen;
      const y = -Math.cos(angle) * featherLen + 2;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    // Arc connecting feather tips
    ctx.beginPath();
    ctx.arc(0, 2, featherLen, -Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4);
    ctx.stroke();

    ctx.restore();

    setMarkerIcon(canvas.toDataURL('image/png'));
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

  // Container style for GoogleMap with responsive height calculation
  // Calculate proper height to fit within viewport and not overflow below bottom tabs
  // Formula: 100vh - top bar - safe area top - content padding - bottom tabs - safe area bottom - extra margin
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

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const center = useMemo(() => {
    // If user location is available and there are venues, find nearby venues
    if (currentUserLocation && venueGroups.length > 0) {
      const NEARBY_RADIUS_KM = 10; // Consider venues within 10km as nearby

      // Find venues within the nearby radius
      const nearbyVenues = venueGroups.filter((group) => {
        const distance = calculateDistance(
          currentUserLocation.lat,
          currentUserLocation.lng,
          group.venue.lat!,
          group.venue.lng!
        );
        return distance <= NEARBY_RADIUS_KM;
      });

      // If there are nearby venues, calculate center point between user and nearest venue
      if (nearbyVenues.length > 0) {
        // Find the nearest venue
        const nearest = nearbyVenues.reduce((prev, curr) => {
          const prevDist = calculateDistance(
            currentUserLocation.lat,
            currentUserLocation.lng,
            prev.venue.lat!,
            prev.venue.lng!
          );
          const currDist = calculateDistance(
            currentUserLocation.lat,
            currentUserLocation.lng,
            curr.venue.lat!,
            curr.venue.lng!
          );
          return currDist < prevDist ? curr : prev;
        });

        // Calculate midpoint between user and nearest venue
        return {
          lat: (currentUserLocation.lat + nearest.venue.lat!) / 2,
          lng: (currentUserLocation.lng + nearest.venue.lng!) / 2,
        };
      }

      // If no nearby venues, just use user location
      return currentUserLocation;
    }

    // Fallback to user location if available
    if (currentUserLocation) return currentUserLocation;

    // Fallback to first venue if available
    if (venueGroups.length > 0) {
      return { lat: venueGroups[0].venue.lat!, lng: venueGroups[0].venue.lng! };
    }

    // Final fallback to default center
    return defaultCenter;
  }, [currentUserLocation, venueGroups, calculateDistance]);

  // Handle location button click
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

      {/* Location Button - positioned above zoom controls on the right */}
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
        {markerIcon &&
          venueGroups.map((group) => (
            <MarkerF
              key={group.venue.id}
              position={{ lat: group.venue.lat!, lng: group.venue.lng! }}
              onClick={() => setSelectedVenueId(group.venue.id)}
              onMouseOver={() => {
                setHoveredVenueId(group.venue.id);
              }}
              onMouseOut={() => {
                setHoveredVenueId(null);
              }}
              label={
                isDesktop && hoveredVenueId === group.venue.id
                  ? {
                      text: group.venue.name,
                      color: '#16a34a',
                      fontWeight: '700',
                      fontSize: '15px',
                      className: 'venue-marker-label',
                    }
                  : undefined
              }
              icon={{
                url: markerIcon,
                scaledSize: new google.maps.Size(48, 56),
                anchor: new google.maps.Point(24, 56),
                labelOrigin: new google.maps.Point(24, -8),
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
                    <Text fontSize="xs" color="gray.600" lineClamp={1}>
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
                            lineClamp={1}
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
                </Button>
              </VStack>
            </Box>
          </InfoWindowF>
        )}
      </GoogleMap>
    </Box>
  );
}
