'use client';

import { Box, Flex, Text, Portal } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { ChevronRight, MapPin, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';

interface SelectVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
  onSelectVenue: (venue: Venue) => void;
}

export default function SelectVenueModal({
  isOpen,
  onClose,
  onCreateNew,
  onSelectVenue,
}: SelectVenueModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVenues();
    }
  }, [isOpen]);

  const loadVenues = async () => {
    try {
      setIsLoading(true);
      const data = await VenueService.getAllVenues();
      setVenues(data.slice(0, 5)); // Just show a few recommended ones
    } catch (error) {
      console.error('Failed to load venues', error);
      toaster.error({ title: 'Failed to load recommended venues' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        inset="0"
        bg="blackAlpha.600"
        zIndex={1400}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        onClick={onClose}
      >
        <Box
          bg="white"
          borderRadius="2xl"
          w="full"
          maxW="md"
          boxShadow="xl"
          onClick={(e) => e.stopPropagation()}
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          {/* Header */}
          <Flex
            justify="space-between"
            align="center"
            px={5}
            py={4}
            borderBottomWidth="1px"
            borderColor="gray.100"
          >
            <Text fontWeight="bold" fontSize="lg">
              {t('panels.venues.selectVenue')}
            </Text>
            <Box
              as="button"
              onClick={onClose}
              p={1}
              borderRadius="md"
              _hover={{ bg: 'gray.100' }}
              transition="all 0.2s"
            >
              <X size={20} color="#4A5568" />
            </Box>
          </Flex>

          {/* Body */}
          <Box p={5} flex={1} overflowY="auto">
            <VStack gap={6} align="stretch">
              {/* Create Venue Option */}
              <Box
                bg="gray.50"
                borderRadius="xl"
                p={4}
                cursor="pointer"
                onClick={onCreateNew}
                _hover={{ bg: 'gray.100' }}
                transition="all 0.2s"
              >
                <Flex align="center" justify="space-between">
                  <Box>
                    <Text fontWeight="semibold" fontSize="md" mb={1}>
                      {t('panels.venues.createVenue')}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {t('panels.venues.createVenueDesc')}
                    </Text>
                  </Box>
                  <ChevronRight size={20} color="#4A5568" />
                </Flex>
              </Box>

              {/* Recommended Venues */}
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={3}>
                  {t('panels.venues.recommendedVenues')}
                </Text>

                {isLoading ? (
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    py={4}
                    textAlign="center"
                  >
                    Loading...
                  </Text>
                ) : venues.length === 0 ? (
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    py={4}
                    textAlign="center"
                  >
                    No recommendations found
                  </Text>
                ) : (
                  <VStack gap={3} align="stretch">
                    {venues.map((venue) => (
                      <Box
                        key={venue.id}
                        bg="gray.50"
                        borderRadius="xl"
                        p={4}
                        cursor="pointer"
                        _hover={{ bg: 'gray.100' }}
                        transition="all 0.2s"
                      >
                        <Flex align="center" gap={4}>
                          <Box flexShrink={0}>
                            <MapPin size={24} color="#4A5568" />
                          </Box>
                          <Box flex={1}>
                            <Text fontWeight="semibold" fontSize="md">
                              {venue.name}
                            </Text>
                            {venue.numberOfCourts ? (
                              <Text fontSize="sm" color="gray.600">
                                {venue.numberOfCourts}{' '}
                                {t('panels.venues.court').toLowerCase()}
                                {venue.numberOfCourts > 1 ? 's' : ''}
                              </Text>
                            ) : null}
                          </Box>
                          <Box
                            as="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectVenue(venue);
                            }}
                            p={2}
                            borderRadius="full"
                            _hover={{ bg: 'gray.200' }}
                            transition="all 0.2s"
                          >
                            <Plus size={20} color="#1A202C" />
                          </Box>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Portal>
  );
}
