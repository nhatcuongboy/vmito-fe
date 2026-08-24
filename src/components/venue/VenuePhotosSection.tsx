'use client';

import { useState } from 'react';
import { Box, Heading, Image, Portal, SimpleGrid } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import AppLightbox from '@/components/ui/AppLightbox';

interface VenuePhotosSectionProps {
  images: string[];
  venueName: string;
}

const VenuePhotosSection = ({ images, venueName }: VenuePhotosSectionProps) => {
  const t = useTranslations('venue');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <Box
        p={{ base: 4, md: 6 }}
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.100"
        shadow="sm"
      >
        <Heading size="md" fontWeight="bold" mb={5}>
          {t('detail.photosHeading')}
        </Heading>
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
          {images.map((imgUrl, idx) => (
            <Box
              key={`${imgUrl}-${idx}`}
              aspectRatio={1}
              borderRadius="2xl"
              overflow="hidden"
              borderWidth="1px"
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
              transition="all 0.2s"
              _hover={{ shadow: 'lg', transform: 'scale(1.02)' }}
              cursor="pointer"
              onClick={() => setLightboxIndex(idx)}
            >
              <Image
                src={imgUrl}
                alt={t('detail.imageAlt', { name: venueName, index: idx + 1 })}
                w="full"
                h="full"
                objectFit="cover"
                loading="lazy"
              />
            </Box>
          ))}
        </SimpleGrid>
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

export default VenuePhotosSection;
