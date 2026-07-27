import { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { IClub } from '@/types/club';
import AppLightbox from '@/components/ui/AppLightbox';

interface IClubPhotosTabProps {
  clubName: string;
  images: IClub['images'];
}

export const ClubPhotosTab = ({ clubName, images }: IClubPhotosTabProps) => {
  const t = useTranslations();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const safeImages = images || [];

  return (
    <Tabs.Content value="photos" pt={0}>
      <Box
        p={6}
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.100"
        shadow="sm"
      >
        <Heading size="md" mb={5}>
          {t('clubs.clubImage')}
        </Heading>
        {safeImages.length > 0 ? (
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
            {safeImages.map((imageUrl, index) => (
              <Box
                key={index}
                aspectRatio={1}
                borderRadius="2xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor="gray.100"
                _dark={{ borderColor: 'gray.700' }}
                transition="all 0.2s"
                _hover={{ shadow: 'lg', transform: 'scale(1.02)' }}
                cursor="pointer"
                onClick={() => setSelectedIndex(index)}
              >
                <Image
                  src={imageUrl}
                  alt={`${clubName} photo ${index + 1}`}
                  w="full"
                  h="full"
                  objectFit="cover"
                />
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={10}
            color="gray.400"
            gap={2}
          >
            <ImageIcon size={40} strokeWidth={1.2} />
            <Text fontSize="sm" fontStyle="italic">
              {t('clubs.noImages')}
            </Text>
          </Flex>
        )}
      </Box>

      {selectedIndex !== null && (
        <AppLightbox
          images={safeImages}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          alt={clubName}
        />
      )}
    </Tabs.Content>
  );
};
