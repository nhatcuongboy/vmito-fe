'use client';

import { useState } from 'react';
import { ISession, SessionStatus } from '@/lib/api/types';
import { Box, Badge, Flex, Icon, Image, Portal } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { ChevronLeft, Share2, Facebook } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { statusColors, getStatusLabel } from './BaseSessionCard';
import { toaster } from '@/components/ui/toaster';
import { motion, AnimatePresence } from 'framer-motion';
import { FavoriteEngagementControl } from '@/components/favorites/FavoriteEngagementControl';
import AppLightbox from '@/components/ui/AppLightbox';

interface ISessionDetailHeroProps {
  session: ISession;
  availableSlots: number;
  isFull: boolean;
  userRegistrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onBack?: () => void;
  showBackButton?: boolean;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%' }),
};

const SessionDetailHero = ({
  session,
  availableSlots,
  isFull,
  userRegistrationStatus,
  onBack,
  showBackButton = true,
}: ISessionDetailHeroProps) => {
  const t = useTranslations('session');

  const allImages: string[] =
    session.images && session.images.length > 0
      ? session.images
      : [session.coverPhoto || DEFAULT_COVER_PHOTO];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const goNext = () => {
    if (currentIndex < allImages.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  };

  // Track whether a drag has occurred so we don't open lightbox on swipe
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => setIsDragging(false);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 10) {
      setIsDragging(true);
      if (info.offset.x < -50) goNext();
      else if (info.offset.x > 50) goPrev();
    }
  };

  const handleImageClick = () => {
    if (!isDragging) {
      openLightbox(currentIndex);
    }
    setIsDragging(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: session.name,
      text: `${t('checkOutThisSession')}: ${session.name}`,
      url: `${window.location.origin}/sessions/${session.slug || session.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toaster.success({ title: t('linkCopied') });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const isPastEndTime = session.endTime
    ? new Date(session.endTime) < new Date()
    : false;
  const isClosed =
    session.status === SessionStatus.FINISHED ||
    session.status === SessionStatus.CANCELLED ||
    isPastEndTime;

  const statusColorPalette =
    session.status === 'PREPARING' && isPastEndTime
      ? 'gray'
      : statusColors[session.status] || 'gray';

  const approvedBadge =
    userRegistrationStatus === 'APPROVED' ? (
      <Badge
        colorPalette="yellow"
        variant="subtle"
        fontSize="sm"
        px={3}
        py={1}
        borderRadius="full"
        fontWeight="600"
        gap={1}
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
        backdropFilter="blur(8px)"
        borderWidth="1px"
        borderColor="yellow.200"
      >
        {t('registrationApproved')}
      </Badge>
    ) : null;

  return (
    <>
      <Box
        position="relative"
        w="full"
        h={{ base: 'clamp(170px, 29vh, 235px)', md: '350px' }}
        overflow="hidden"
        bg="gray.900"
      >
        {/* Carousel images */}
        <AnimatePresence custom={direction} initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            drag={allImages.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragStart={handleDragStart}
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
              src={allImages[currentIndex] || DEFAULT_COVER_PHOTO}
              alt={`${session.name} ${currentIndex + 1}`}
              w="100%"
              h="100%"
              objectFit="cover"
              draggable={false}
              pointerEvents="none"
              onError={(e) => {
                // Hotlinked Facebook images can expire — fall back to default
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== DEFAULT_COVER_PHOTO) {
                  img.src = DEFAULT_COVER_PHOTO;
                }
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Top gradient overlay for buttons */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="80px"
          bgGradient="to-b"
          gradientFrom="blackAlpha.500"
          gradientTo="transparent"
          pointerEvents="none"
        />

        {/* Bottom gradient overlay for badges */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="80px"
          bgGradient="to-t"
          gradientFrom="blackAlpha.500"
          gradientTo="transparent"
          pointerEvents="none"
        />

        {/* Back Button */}
        {showBackButton && onBack && (
          <IconButton
            aria-label="Back"
            variant="ghost"
            size="md"
            position="absolute"
            top="calc(env(safe-area-inset-top) + 8px)"
            left={2}
            color="white"
            bg="blackAlpha.500"
            backdropFilter="blur(6px)"
            borderRadius="full"
            _hover={{ bg: 'blackAlpha.700' }}
            zIndex={100}
            onClick={onBack}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </IconButton>
        )}

        {/* Favorite engagement + Share */}
        <Flex
          position="absolute"
          top="calc(env(safe-area-inset-top) + 12px)"
          right={3}
          gap={2}
          align="center"
          zIndex={100}
        >
          <FavoriteEngagementControl
            type="SESSION"
            targetId={session.id}
            initialIsFavorite={session.isFavorite}
            variant="overlay-dark"
            returnUrl={`/sessions/${session.slug || session.id}`}
          />
          <IconButton
            aria-label="Share"
            variant="ghost"
            size="sm"
            color="white"
            bg="blackAlpha.500"
            backdropFilter="blur(6px)"
            borderRadius="full"
            boxShadow="0 2px 8px rgba(0,0,0,0.45)"
            _hover={{ bg: 'blackAlpha.700' }}
            onClick={handleShare}
            icon={<Icon as={Share2} boxSize={5} />}
          />
        </Flex>

        {/* Dot indicators */}
        {allImages.length > 1 && (
          <Flex
            position="absolute"
            bottom={5}
            left="50%"
            transform="translateX(-50%)"
            gap={1.5}
            zIndex={100}
            align="center"
          >
            {allImages.map((_, i) => (
              <Box
                key={i}
                as="button"
                w={i === currentIndex ? '16px' : '6px'}
                h="6px"
                borderRadius="full"
                bg={i === currentIndex ? 'white' : 'whiteAlpha.600'}
                transition="width 0.25s ease, background-color 0.25s ease"
                onClick={() => {
                  setDirection(i > currentIndex ? 1 : -1);
                  setCurrentIndex(i);
                }}
                flexShrink={0}
              />
            ))}
          </Flex>
        )}

        {/* Bottom-left badge: crawled → "Facebook post"; else slot availability */}
        {session.isCrawled ? (
          <Badge
            position="absolute"
            bottom={5}
            left={3}
            bg="#1877F2"
            color="white"
            borderWidth="1px"
            borderColor="#8bb9ff"
            backdropFilter="blur(4px)"
            boxShadow="0 2px 8px rgba(24, 119, 242, 0.28)"
            fontSize="sm"
            px={3}
            py={1}
            borderRadius="full"
            fontWeight="medium"
            gap={1}
          >
            <Icon as={Facebook} boxSize={3.5} />
            {t('crawledBadge')}
          </Badge>
        ) : (
          <Flex position="absolute" bottom={5} left={3} gap={1} zIndex={100}>
            <Badge
              colorPalette={isClosed || isFull ? 'gray' : 'teal'}
              variant="solid"
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
              fontWeight="600"
              gap={1}
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
              backdropFilter="blur(8px)"
            >
              {isClosed
                ? t('registrationClosed')
                : isFull
                  ? t('slotsFull')
                  : t('slotsAvailable', { count: availableSlots })}
            </Badge>
            {approvedBadge}
          </Flex>
        )}

        {/* Status Badge - bottom right */}
        <Badge
          position="absolute"
          bottom={5}
          right={3}
          colorPalette={statusColorPalette}
          fontSize="sm"
          px={3}
          py={1}
          borderRadius="full"
          fontWeight="600"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
          backdropFilter="blur(8px)"
        >
          {getStatusLabel(session.status, t, session.endTime)}
        </Badge>
      </Box>

      {/* Lightbox */}
      {lightboxOpen && (
        <Portal>
          <AppLightbox
            images={allImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            alt={session.name}
          />
        </Portal>
      )}
    </>
  );
};

export default SessionDetailHero;
