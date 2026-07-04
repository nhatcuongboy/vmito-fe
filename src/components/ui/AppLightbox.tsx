'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface IAppLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  alt?: string;
}

const AppLightbox = ({
  images,
  initialIndex = 0,
  onClose,
  alt = 'Image',
}: IAppLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0))
  );

  const handlePrev = useCallback(() => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((index) => Math.min(index + 1, images.length - 1));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [handlePrev, handleNext, onClose]);

  if (images.length === 0) return null;

  return (
    <Flex
      position="fixed"
      inset="0"
      zIndex="modal"
      bg="blackAlpha.900"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
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
            handlePrev();
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
            handleNext();
          }}
        >
          <ChevronRight size={32} />
        </Box>
      )}

      {/* Image */}
      <Image
        src={images[currentIndex]}
        alt={`${alt} ${currentIndex + 1}`}
        maxW="90vw"
        maxH="90vh"
        objectFit="contain"
        onClick={(e) => e.stopPropagation()}
        borderRadius="md"
      />
    </Flex>
  );
};

export default AppLightbox;
