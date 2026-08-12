'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  Image,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  Car,
  ChevronDown,
  ChevronUp,
  Info,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Venue } from '@/lib/api/types';

/** Collapsed height of the description, in px. */
const DESCRIPTION_CLAMP_HEIGHT = 160;

interface VenueAboutCardProps {
  venue: Venue;
}

/**
 * Description, court layout and amenities in a single card separated by rules —
 * three stacked cards made the page needlessly long on mobile.
 */
const VenueAboutCard = ({ venue }: VenueAboutCardProps) => {
  const t = useTranslations('venue');
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionClamped, setIsDescriptionClamped] = useState(false);

  useEffect(() => {
    const node = descriptionRef.current;
    if (!node) return;
    setIsDescriptionClamped(node.scrollHeight > DESCRIPTION_CLAMP_HEIGHT + 24);
  }, [venue.description]);

  const hasAmenities =
    venue.hasCarParking !== undefined ||
    venue.hasCanteen !== undefined ||
    !!venue.wifiName ||
    !!venue.bookingPolicy;

  return (
    <Box
      p={{ base: 4, md: 6 }}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.100"
      shadow="sm"
    >
      <Heading size="md" mb={4} fontWeight="bold">
        {t('detail.aboutHeading')}
      </Heading>
      {venue.description ? (
        <>
          <Box position="relative">
            <Box
              ref={descriptionRef}
              fontSize="md"
              color="gray.700"
              _dark={{ color: 'gray.300' }}
              lineHeight="tall"
              wordBreak="break-word"
              maxH={
                isDescriptionExpanded
                  ? undefined
                  : `${DESCRIPTION_CLAMP_HEIGHT}px`
              }
              overflow={isDescriptionExpanded ? undefined : 'hidden'}
              dangerouslySetInnerHTML={{ __html: venue.description }}
              css={{
                '& p': { marginBottom: '0.75em' },
                '& p:last-child': { marginBottom: 0 },
                '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.75em' },
                '& li': { marginBottom: '0.25em' },
                '& a': {
                  color: 'var(--chakra-colors-green-600)',
                  textDecoration: 'underline',
                },
                '& strong, & b': { fontWeight: 'bold' },
              }}
            />
            {isDescriptionClamped && !isDescriptionExpanded && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h="56px"
                bgGradient="to-t"
                gradientFrom="white"
                gradientTo="transparent"
                _dark={{ gradientFrom: 'gray.800' }}
                pointerEvents="none"
              />
            )}
          </Box>
          {isDescriptionClamped && (
            <Button
              variant="ghost"
              size="sm"
              colorPalette="green"
              mt={1}
              onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
            >
              {isDescriptionExpanded ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              {isDescriptionExpanded
                ? t('detail.readLess')
                : t('detail.readMore')}
            </Button>
          )}
        </>
      ) : (
        <Text fontSize="sm" color="gray.400" fontStyle="italic">
          {t('detail.noDescription')}
        </Text>
      )}

      {venue.courtLayoutImage && (
        <>
          <Separator my={5} />
          <Heading size="md" mb={4} fontWeight="bold">
            {t('detail.courtLayout')}
          </Heading>
          <Box
            borderRadius="xl"
            overflow="hidden"
            borderWidth="1px"
            borderColor="gray.200"
            _dark={{ borderColor: 'gray.600' }}
            cursor="pointer"
            onClick={() => window.open(venue.courtLayoutImage, '_blank')}
          >
            <Image
              src={venue.courtLayoutImage}
              alt={t('detail.courtLayout')}
              w="100%"
              objectFit="contain"
              maxH="320px"
              loading="lazy"
            />
          </Box>
        </>
      )}

      {hasAmenities && (
        <>
          <Separator my={5} />
          <Heading size="md" mb={5} fontWeight="bold">
            {t('detail.amenitiesHeading')}
          </Heading>
          <VStack gap={5} align="stretch">
            {(venue.hasCarParking !== undefined ||
              venue.hasCanteen !== undefined) && (
              <Flex gap={2} flexWrap="wrap">
                {venue.hasCarParking !== undefined && (
                  <Badge
                    colorPalette={venue.hasCarParking ? 'green' : 'red'}
                    variant="subtle"
                    size="lg"
                    borderRadius="lg"
                    px={3}
                    py={1.5}
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                  >
                    <Car size={14} />
                    {t('detail.carParking')}
                  </Badge>
                )}
                {venue.hasCanteen !== undefined && (
                  <Badge
                    colorPalette={venue.hasCanteen ? 'green' : 'red'}
                    variant="subtle"
                    size="lg"
                    borderRadius="lg"
                    px={3}
                    py={1.5}
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                  >
                    <UtensilsCrossed size={14} />
                    {t('detail.canteen')}
                  </Badge>
                )}
              </Flex>
            )}

            {venue.wifiName && (
              <Flex align="center" gap={4}>
                <Box
                  p={3}
                  borderRadius="xl"
                  bg="cyan.50"
                  _dark={{ bg: 'cyan.900/30' }}
                  flexShrink={0}
                >
                  <Wifi size={22} color="#0987A0" />
                </Box>
                <Box flex="1" minW={0}>
                  <Text fontSize="xs" color="gray.500" mb={0.5}>
                    WiFi
                  </Text>
                  <Text
                    fontSize="md"
                    fontWeight="semibold"
                    wordBreak="break-all"
                  >
                    {venue.wifiName}
                  </Text>
                  {venue.wifiPassword && (
                    <Text fontSize="sm" color="gray.500" wordBreak="break-all">
                      {t('detail.wifiPasswordLabel')} {venue.wifiPassword}
                    </Text>
                  )}
                </Box>
              </Flex>
            )}

            {venue.bookingPolicy && (
              <Flex align="flex-start" gap={4}>
                <Box
                  p={3}
                  borderRadius="xl"
                  bg="yellow.50"
                  _dark={{ bg: 'yellow.900/30' }}
                  flexShrink={0}
                >
                  <Info size={22} color="#D69E2E" />
                </Box>
                <Box flex="1" minW={0}>
                  <Text fontSize="xs" color="gray.500" mb={0.5}>
                    {t('detail.bookingPolicy')}
                  </Text>
                  <Text
                    fontSize="md"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                  >
                    {venue.bookingPolicy}
                  </Text>
                </Box>
              </Flex>
            )}
          </VStack>
        </>
      )}
    </Box>
  );
};

export default VenueAboutCard;
