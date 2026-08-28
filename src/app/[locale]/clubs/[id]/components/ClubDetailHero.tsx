'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Image,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, MoreHorizontal, Share2, UserMinus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import AppLightbox from '@/components/ui/AppLightbox';
import { FavoriteEngagementControl } from '@/components/favorites/FavoriteEngagementControl';
import { IClub } from '@/types/club';
import { IconButton } from '@/components/ui/chakra-compat';
import { DETAIL_PAGE_MAX_W } from '@/constants';

const slideVariants = {
  enter: (direction: number) => ({ x: direction >= 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (direction: number) => ({ x: direction >= 0 ? '-100%' : '100%' }),
};

interface IClubDetailHeroProps {
  club: IClub;
  clubDisplayImage: string;
  onBack: () => void;
  onShare: () => void;
  canLeaveClub: boolean;
  isLeaving: boolean;
  onLeave: () => void;
}

export const ClubDetailHero = ({
  club,
  clubDisplayImage,
  onBack,
  onShare,
  canLeaveClub,
  isLeaving,
  onLeave,
}: IClubDetailHeroProps) => {
  const t = useTranslations('clubs');
  const tCommon = useTranslations('common');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = Array.from(
    new Set(
      [club.image, ...(club.images ?? []), clubDisplayImage].filter(
        (image): image is string => Boolean(image)
      )
    )
  );

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

  return (
    <Container maxW={DETAIL_PAGE_MAX_W} px={0}>
      <Box
        position="relative"
        w={{ base: 'calc(100% + 48px)', md: 'full' }}
        h={{ base: 'clamp(200px, 32vh, 240px)', md: '300px' }}
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
              alt={`${club.name} ${currentIndex + 1}`}
              w="full"
              h="full"
              objectFit="cover"
              fetchPriority={currentIndex === 0 ? 'high' : undefined}
              draggable={false}
              pointerEvents="none"
            />
          </motion.div>
        </AnimatePresence>

        <Box
          position="absolute"
          inset={0}
          background="linear-gradient(to bottom, rgba(0, 0, 0, 0.55), transparent 42%, rgba(0, 0, 0, 0.55))"
          pointerEvents="none"
        />

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

        <Flex
          position="absolute"
          top={{ base: 'calc(env(safe-area-inset-top) + 10px)', md: 3 }}
          right={3}
          gap={2}
          align="center"
          zIndex={10}
        >
          <Box order={1}>
            <FavoriteEngagementControl
              type="CLUB"
              targetId={club.id}
              initialIsFavorite={club.isFavorite}
              returnUrl={`/clubs/${club.slug || club.id}`}
              variant="overlay-dark"
            />
          </Box>
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
            icon={<Share2 size={20} aria-hidden="true" />}
            order={2}
          />
          {canLeaveClub && (
            <Box order={3}>
              <MenuRoot positioning={{ placement: 'bottom-end' }}>
                <MenuTrigger asChild>
                  <IconButton
                    aria-label={tCommon('moreActions')}
                    title={tCommon('moreActions')}
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
                    icon={<MoreHorizontal size={20} aria-hidden="true" />}
                  />
                </MenuTrigger>
                <Portal>
                  <MenuPositioner zIndex={2000}>
                    <MenuContent
                      bg="white"
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      borderWidth="1px"
                      borderColor="gray.200"
                      boxShadow="lg"
                    >
                      <MenuItem
                        value="leave-club"
                        color="red.600"
                        _dark={{ color: 'red.300' }}
                        disabled={isLeaving}
                        cursor="pointer"
                        onClick={onLeave}
                      >
                        <UserMinus size={18} aria-hidden="true" />
                        {t('leaveClub')}
                      </MenuItem>
                    </MenuContent>
                  </MenuPositioner>
                </Portal>
              </MenuRoot>
            </Box>
          )}
        </Flex>

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
                key={`${image}-${index}`}
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
      </Box>

      {lightboxIndex !== null && (
        <Portal>
          <AppLightbox
            images={images}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            alt={club.name}
          />
        </Portal>
      )}
    </Container>
  );
};
