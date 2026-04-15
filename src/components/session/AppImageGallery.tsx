'use client';

import { useState, useRef, useCallback } from 'react';
import { Box, Flex, Image, Text } from '@chakra-ui/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface IAppImageGalleryProps {
  images: string[];
  coverPhoto?: string;
  alt?: string;
}

const AppImageGallery = ({
  images,
  coverPhoto,
  alt = '',
}: IAppImageGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine coverPhoto with images, coverPhoto first (deduplicated)
  const allImages = (() => {
    const imgs: string[] = [];
    if (coverPhoto) imgs.push(coverPhoto);
    for (const img of images) {
      if (img !== coverPhoto) imgs.push(img);
    }
    return imgs;
  })();

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setCurrentSlide(index);
  }, []);

  const handleLightboxPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleLightboxNext = () => {
    if (lightboxIndex !== null && lightboxIndex < allImages.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const handleLightboxKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handleLightboxPrev();
    else if (e.key === 'ArrowRight') handleLightboxNext();
    else if (e.key === 'Escape') setLightboxIndex(null);
  };

  if (allImages.length === 0) return null;

  // Single image — simple display
  if (allImages.length === 1) {
    return (
      <Box mb={8} borderRadius="xl" overflow="hidden" boxShadow="md">
        <Image
          src={allImages[0]}
          alt={alt}
          w="100%"
          h={{ base: '200px', md: '300px' }}
          objectFit="cover"
          cursor="pointer"
          onClick={() => setLightboxIndex(0)}
        />
        {lightboxIndex !== null && (
          <Lightbox
            images={allImages}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={handleLightboxPrev}
            onNext={handleLightboxNext}
            onKeyDown={handleLightboxKeyDown}
          />
        )}
      </Box>
    );
  }

  return (
    <Box mb={8}>
      {/* Mobile: Carousel with scroll-snap */}
      <Box display={{ base: 'block', md: 'none' }}>
        <Box
          ref={scrollRef}
          overflow="auto"
          onScroll={handleScroll}
          borderRadius="xl"
          boxShadow="md"
          css={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <Flex w={`${allImages.length * 100}%`}>
            {allImages.map((img, i) => (
              <Box
                key={i}
                w={`${100 / allImages.length}%`}
                flexShrink={0}
                css={{ scrollSnapAlign: 'start' }}
              >
                <Image
                  src={img}
                  alt={`${alt} ${i + 1}`}
                  w="100%"
                  h="200px"
                  objectFit="cover"
                  cursor="pointer"
                  onClick={() => setLightboxIndex(i)}
                />
              </Box>
            ))}
          </Flex>
        </Box>
        {/* Dot indicators + counter */}
        <Flex justifyContent="center" alignItems="center" gap={1} mt={2}>
          {allImages.map((_, i) => (
            <Box
              key={i}
              w={currentSlide === i ? '8px' : '6px'}
              h={currentSlide === i ? '8px' : '6px'}
              borderRadius="full"
              bg={currentSlide === i ? 'blue.500' : 'gray.300'}
              transition="all 0.2s"
            />
          ))}
          <Text ml={2} fontSize="xs" color="gray.500">
            {currentSlide + 1}/{allImages.length}
          </Text>
        </Flex>
      </Box>

      {/* Desktop: Airbnb-style asymmetric grid */}
      <Box
        display={{ base: 'none', md: 'grid' }}
        borderRadius="xl"
        overflow="hidden"
        boxShadow="md"
        gridTemplateColumns={allImages.length >= 3 ? '1fr 1fr' : '1fr 1fr'}
        gridTemplateRows={
          allImages.length >= 3
            ? `repeat(${Math.min(allImages.length - 1, 2)}, 1fr)`
            : '1fr'
        }
        gap="4px"
        h="360px"
      >
        {/* Main large image (left side, spanning all rows) */}
        <Box
          gridRow={allImages.length >= 3 ? '1 / -1' : '1'}
          gridColumn="1"
          overflow="hidden"
          cursor="pointer"
          position="relative"
          onClick={() => setLightboxIndex(0)}
          _hover={{ '& img': { transform: 'scale(1.02)' } }}
        >
          <Image
            src={allImages[0]}
            alt={`${alt} 1`}
            w="100%"
            h="100%"
            objectFit="cover"
            transition="transform 0.3s"
          />
        </Box>

        {/* Right side smaller images */}
        {allImages.slice(1, 5).map((img, i) => (
          <Box
            key={i + 1}
            overflow="hidden"
            cursor="pointer"
            position="relative"
            onClick={() => setLightboxIndex(i + 1)}
            _hover={{ '& img': { transform: 'scale(1.02)' } }}
          >
            <Image
              src={img}
              alt={`${alt} ${i + 2}`}
              w="100%"
              h="100%"
              objectFit="cover"
              transition="transform 0.3s"
            />
            {/* "Show all" overlay on last visible image if more exist */}
            {i === Math.min(allImages.length - 2, 3) &&
              allImages.length > 5 && (
                <Flex
                  position="absolute"
                  inset="0"
                  bg="blackAlpha.500"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontWeight="bold" fontSize="lg">
                    +{allImages.length - 5}
                  </Text>
                </Flex>
              )}
          </Box>
        ))}
      </Box>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={allImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
          onKeyDown={handleLightboxKeyDown}
        />
      )}
    </Box>
  );
};

// Lightbox component
interface ILightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const Lightbox = ({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onKeyDown,
}: ILightboxProps) => (
  <Flex
    position="fixed"
    inset="0"
    zIndex="modal"
    bg="blackAlpha.900"
    alignItems="center"
    justifyContent="center"
    onClick={onClose}
    onKeyDown={onKeyDown}
    tabIndex={0}
    ref={(el) => el?.focus()}
  >
    {/* Close button */}
    <Box
      position="absolute"
      top={4}
      right={4}
      cursor="pointer"
      color="white"
      onClick={onClose}
      zIndex={1}
      p={2}
      borderRadius="full"
      _hover={{ bg: 'whiteAlpha.200' }}
    >
      <X size={24} />
    </Box>

    {/* Counter */}
    <Text
      position="absolute"
      top={4}
      left="50%"
      transform="translateX(-50%)"
      color="white"
      fontSize="sm"
      fontWeight="medium"
    >
      {currentIndex + 1} / {images.length}
    </Text>

    {/* Prev button */}
    {currentIndex > 0 && (
      <Box
        position="absolute"
        left={4}
        cursor="pointer"
        color="white"
        p={2}
        borderRadius="full"
        _hover={{ bg: 'whiteAlpha.200' }}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
      >
        <ChevronLeft size={32} />
      </Box>
    )}

    {/* Next button */}
    {currentIndex < images.length - 1 && (
      <Box
        position="absolute"
        right={4}
        cursor="pointer"
        color="white"
        p={2}
        borderRadius="full"
        _hover={{ bg: 'whiteAlpha.200' }}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      >
        <ChevronRight size={32} />
      </Box>
    )}

    {/* Image */}
    <Image
      src={images[currentIndex]}
      alt={`Image ${currentIndex + 1}`}
      maxW="90vw"
      maxH="90vh"
      objectFit="contain"
      onClick={(e) => e.stopPropagation()}
      borderRadius="md"
    />
  </Flex>
);

export default AppImageGallery;
