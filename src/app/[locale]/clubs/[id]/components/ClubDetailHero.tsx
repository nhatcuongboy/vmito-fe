'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  Image,
  Text,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Share2 } from 'lucide-react';
import AppLightbox from '@/components/ui/AppLightbox';
import { IClub } from '@/types/club';
import { FavoriteEngagementControl } from '@/components/favorites/FavoriteEngagementControl';
import { IconButton } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { DETAIL_PAGE_MAX_W } from '@/constants';

interface IClubDetailHeroProps {
  club: IClub;
  clubDisplayImage: string;
}

export const ClubDetailHero = ({
  club,
  clubDisplayImage,
}: IClubDetailHeroProps) => {
  const tAdmin = useTranslations('admin');
  const t = useTranslations('clubs');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const firstVenue = club.scheduleVenues?.[0] || club.defaultVenue;
  // Use the old district/city as a pair, or the new ward/city as a pair —
  // never mix one old field with one new field.
  const usingOldLocation = !!(firstVenue?.district || firstVenue?.city);
  const locationParts = (
    usingOldLocation
      ? [firstVenue?.district, firstVenue?.city]
      : [firstVenue?.newDistrict, firstVenue?.newCity]
  ).filter(Boolean);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: club.name,
          text: t('shareText', { name: club.name }),
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toaster.success({ title: t('linkCopied') });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;

      console.error('Failed to share club:', error);
      toaster.error({ title: t('shareFailed') });
    }
  };

  return (
    <Container maxW={DETAIL_PAGE_MAX_W} px={0}>
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
        <Flex
          position="absolute"
          top={3}
          right={3}
          gap={2}
          align="center"
          zIndex={10}
        >
          <FavoriteEngagementControl
            type="CLUB"
            targetId={club.id}
            initialIsFavorite={club.isFavorite}
            returnUrl={`/clubs/${club.slug || club.id}`}
            variant="overlay-dark"
          />
          <IconButton
            aria-label={t('share')}
            title={t('share')}
            variant="ghost"
            size="sm"
            minW="40px"
            h="40px"
            color="white"
            bg="blackAlpha.500"
            backdropFilter="blur(6px)"
            borderRadius="full"
            boxShadow="0 2px 8px rgba(0,0,0,0.35)"
            touchAction="manipulation"
            _hover={{ bg: 'blackAlpha.700' }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'white',
              outlineOffset: '2px',
            }}
            onClick={handleShare}
            icon={<Icon as={Share2} boxSize={5} aria-hidden="true" />}
          />
        </Flex>
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
        <Flex
          gap={{ base: 3, md: 4 }}
          align="center"
          wrap={{ base: 'wrap', sm: 'nowrap' }}
        >
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
                {!usingOldLocation && ` (${tAdmin('newAddressBadge')})`}
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
