'use client';

import { useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  Image,
  Portal,
  Text,
} from '@chakra-ui/react';
import { BadgeCheck, ChevronLeft, Share2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui/chakra-compat';
import AppLightbox from '@/components/ui/AppLightbox';
import { FavoriteEngagementControl } from '@/components/favorites/FavoriteEngagementControl';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { ClosureStatus, Venue } from '@/lib/api/types';

const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%' }),
};

interface VenueDetailHeroProps {
  venue: Venue;
  venueName: string;
  canViewFavoriteUsers?: boolean;
  onBack: () => void;
  onShare: () => void;
}

const VenueDetailHero = ({
  venue,
  venueName,
  canViewFavoriteUsers,
  onBack,
  onShare,
}: VenueDetailHeroProps) => {
  const t = useTranslations('venue');
  const tCommon = useTranslations('common');

  const allImages: string[] = [
    ...new Set(
      [venue.coverPhoto, ...(venue.images ?? [])].filter(
        (image): image is string => !!image
      )
    ),
  ];
  const images = allImages.length > 0 ? allImages : [DEFAULT_COVER_PHOTO];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const goNext = () => {
    if (currentIndex < images.length - 1) {
      setDirection(1);
      setCurrentIndex((index) => index + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((index) => index - 1);
    }
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 10) {
      setIsDragging(true);
      if (info.offset.x < -50) goNext();
      else if (info.offset.x > 50) goPrev();
    }
  };

  const handleImageClick = () => {
    if (!isDragging) setLightboxIndex(currentIndex);
    setIsDragging(false);
  };

  const isClosed =
    venue.closureStatus && venue.closureStatus !== ClosureStatus.OPERATING;

  return (
    <>
      <Box
        position="relative"
        // Full-bleed hero on mobile: cancel the PageLayout's 24px side gutter so
        // the cover photo runs edge-to-edge. Desktop keeps the rounded card.
        w={{ base: 'calc(100% + 48px)', md: 'full' }}
        h={{ base: 'clamp(200px, 32vh, 220px)', md: '300px' }}
        mx={{ base: '-24px', md: 0 }}
        borderRadius={{ base: 0, md: '2xl' }}
        overflow="hidden"
        mb={4}
        bg="gray.900"
      >
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            drag={images.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragStart={() => setIsDragging(false)}
            onDragEnd={handleDragEnd}
            onClick={handleImageClick}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              cursor: 'zoom-in',
            }}
          >
            <Image
              src={images[currentIndex]}
              alt={`${venueName} ${currentIndex + 1}`}
              w="full"
              h="full"
              objectFit="cover"
              fetchPriority={currentIndex === 0 ? 'high' : undefined}
              draggable={false}
              pointerEvents="none"
            />
          </motion.div>
        </AnimatePresence>

        {/* Bottom gradient for the badges */}
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
        {/* Mobile header overlay. It sits on the hero so it never consumes
            vertical space, while keeping the Vmito mark readable on any cover. */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="max(90px, calc(50px + env(safe-area-inset-top)))"
          background="linear-gradient(to bottom, rgba(0, 0, 0, 0.55), transparent)"
          pointerEvents="none"
          display={{ base: 'block', md: 'none' }}
        />

        {/* Mobile brand header — replaces the TopBar hidden on this breakpoint */}
        <Flex
          display={{ base: 'flex', md: 'none' }}
          position="absolute"
          top="env(safe-area-inset-top)"
          left={2}
          h="50px"
          align="center"
          gap={2}
          zIndex={10}
        >
          <IconButton
            aria-label={tCommon('back')}
            variant="ghost"
            size="md"
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
            onClick={onBack}
            icon={<ChevronLeft size={24} strokeWidth={2.5} />}
          />
        </Flex>

        {/* Favourite + Share — top-right */}
        <Flex
          position="absolute"
          top={{ base: 'calc(env(safe-area-inset-top) + 10px)', md: 3 }}
          right={3}
          gap={2}
          align="center"
          zIndex={10}
        >
          <FavoriteEngagementControl
            type="VENUE"
            targetId={venue.id}
            initialIsFavorite={venue.isFavorite}
            returnUrl={`/venues/${venue.slug || venue.id}`}
            variant="overlay-dark"
            canViewUsersOverride={canViewFavoriteUsers}
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
            onClick={onShare}
            icon={<Icon as={Share2} boxSize={5} aria-hidden="true" />}
          />
        </Flex>

        {/* Dot indicators */}
        {images.length > 1 && (
          <Flex
            position="absolute"
            bottom={4}
            left="50%"
            transform="translateX(-50%)"
            gap={1.5}
            zIndex={3}
            align="center"
          >
            {images.map((image, index) => (
              <Box
                key={image}
                as="button"
                aria-label={`${index + 1}`}
                w={index === currentIndex ? '16px' : '6px'}
                h="6px"
                borderRadius="full"
                bg={index === currentIndex ? 'white' : 'whiteAlpha.600'}
                transition="width 0.25s ease, background-color 0.25s ease"
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                flexShrink={0}
              />
            ))}
          </Flex>
        )}

        {/* Status badges — bottom-left, away from the back button */}
        <Flex
          position="absolute"
          bottom={4}
          left={{ base: 3, md: 4 }}
          direction="column"
          align="flex-start"
          gap={2}
          zIndex={3}
        >
          {isClosed && (
            <Badge
              colorPalette={
                venue.closureStatus === ClosureStatus.PERMANENTLY_CLOSED
                  ? 'red'
                  : 'orange'
              }
              variant="solid"
              size="lg"
              borderRadius="full"
              px={4}
              py={2}
              display="flex"
              alignItems="center"
              gap={2}
              shadow="lg"
            >
              <XCircle size={16} />
              <Text fontSize="sm">
                {venue.closureStatus === ClosureStatus.PERMANENTLY_CLOSED
                  ? t('detail.permanentlyClosed')
                  : t('detail.temporarilyClosed')}
              </Text>
            </Badge>
          )}
          <HStack gap={1.5} flexWrap="wrap">
            {venue.isVerified && (
              <Badge
                colorPalette="green"
                variant="solid"
                size="lg"
                borderRadius="full"
                px={4}
                py={2}
                display="flex"
                alignItems="center"
                gap={2}
                shadow="lg"
              >
                <BadgeCheck size={16} />
                <Text fontSize="sm">{t('verified')}</Text>
              </Badge>
            )}
          </HStack>
        </Flex>
      </Box>

      {lightboxIndex !== null && (
        <Portal>
          <AppLightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            alt={venueName}
          />
        </Portal>
      )}
    </>
  );
};

export default VenueDetailHero;
