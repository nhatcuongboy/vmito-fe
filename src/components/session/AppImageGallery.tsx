'use client';

import { useState, useRef, useCallback } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import AppLightbox from '@/components/ui/AppLightbox';

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

  if (allImages.length === 0) return null;

  // Single image — simple display
  if (allImages.length === 1) {
    return (
      <Box
        mb={{ base: 4, md: 8 }}
        borderRadius="xl"
        overflow="hidden"
        boxShadow="md"
      >
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
          <AppLightbox
            images={allImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            alt={alt}
          />
        )}
      </Box>
    );
  }

  return (
    <Box mb={{ base: 4, md: 8 }}>
      {/* Mobile: Carousel with scroll-snap */}
      <Box display={{ base: 'block', md: 'none' }} position="relative">
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
        {/* Dot indicators overlay */}
        <Flex
          position="absolute"
          bottom={3}
          left="50%"
          transform="translateX(-50%)"
          justifyContent="center"
          alignItems="center"
          gap={1.5}
        >
          {allImages.map((_, i) => (
            <Box
              key={i}
              w={currentSlide === i ? '20px' : '6px'}
              h="6px"
              borderRadius="full"
              bg={currentSlide === i ? 'white' : 'whiteAlpha.600'}
              transition="all 0.3s ease-in-out"
              boxShadow="0 1px 2px rgba(0,0,0,0.3)"
            />
          ))}
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
        <AppLightbox
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          alt={alt}
        />
      )}
    </Box>
  );
};

export default AppImageGallery;
