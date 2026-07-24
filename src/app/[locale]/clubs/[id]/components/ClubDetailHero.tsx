'use client';

import { useState } from 'react';
import { Box, Container, Flex, Heading, Image, Text } from '@chakra-ui/react';
import AppLightbox from '@/components/ui/AppLightbox';
import { IClub } from '@/types/club';

interface IClubDetailHeroProps {
  club: IClub;
  clubDisplayImage: string;
}

export const ClubDetailHero = ({
  club,
  clubDisplayImage,
}: IClubDetailHeroProps) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const firstVenue = club.scheduleVenues?.[0] || club.defaultVenue;
  const locationParts = [firstVenue?.district, firstVenue?.city].filter(
    Boolean
  );

  return (
    <Container maxW="container.xl" px={0}>
      <Box
        position="relative"
        // Full-bleed hero on mobile: cancel the PageLayout's 24px side
        // gutter so the cover photo runs edge-to-edge (matches venue
        // detail). Desktop keeps the rounded card inside the container.
        w={{ base: 'calc(100% + 48px)', md: 'full' }}
        h={{ base: 'clamp(180px, 30vh, 240px)', md: '300px' }}
        mx={{ base: '-24px', md: 0 }}
        borderRadius={{ base: 0, md: '2xl' }}
        overflow="hidden"
        mb={4}
      >
        <Image
          src={clubDisplayImage}
          alt={club.name}
          w="full"
          h="full"
          objectFit="cover"
          cursor="pointer"
          onClick={() => setLightboxImage(clubDisplayImage)}
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="100px"
          bgGradient="to-t"
          gradientFrom="blackAlpha.600"
          gradientTo="transparent"
          pointerEvents="none"
        />
      </Box>

      <Box
        w="full"
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        shadow="sm"
        px={{ base: 3, md: 5 }}
        py={{ base: 2, md: 3.5 }}
        borderWidth="1px"
        borderColor="gray.100"
        mb={4}
      >
        <Flex gap={{ base: 3, md: 4 }} align="center">
          <Box
            w="48px"
            h="48px"
            flexShrink={0}
            shadow="sm"
            borderRadius="lg"
            overflow="hidden"
            bg={club.logo ? 'gray.100' : 'green.50'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderColor={club.logo ? 'gray.100' : 'green.100'}
            cursor={club.logo ? 'pointer' : 'default'}
            onClick={club.logo ? () => setLightboxImage(club.logo!) : undefined}
          >
            {club.logo ? (
              <Image
                src={club.logo}
                alt={club.name}
                objectFit="cover"
                w="full"
                h="full"
              />
            ) : (
              <Text fontSize="xl" fontWeight="bold" color="green.600">
                {club.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </Box>
          <Box flex="1" minW="0">
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={0}
              letterSpacing="tight"
              lineClamp={2}
            >
              {club.name}
            </Heading>
            {locationParts.length > 0 ? (
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                mt={1}
              >
                {locationParts.join(', ')}
              </Text>
            ) : null}
          </Box>
        </Flex>
      </Box>

      {lightboxImage && (
        <AppLightbox
          images={[lightboxImage]}
          onClose={() => setLightboxImage(null)}
          alt={club.name}
        />
      )}
    </Container>
  );
};
