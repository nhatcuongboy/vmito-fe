'use client';

import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';
import { Field } from '@/components/ui/Field';
import { EImageCategory } from '@/lib/api/types';

interface ClubMediaEditorProps {
  images: ISessionImage[];
  bannerIndex: number;
  logo?: string;
  logoPublicId?: string;
  onImagesChange: (images: ISessionImage[]) => void;
  onBannerChange: (index: number) => void;
  onLogoChange: (image: { url: string; publicId?: string }) => void;
  onLogoClear: () => void;
}

export default function ClubMediaEditor({
  images,
  bannerIndex,
  logo,
  logoPublicId,
  onImagesChange,
  onBannerChange,
  onLogoChange,
  onLogoClear,
}: ClubMediaEditorProps) {
  const t = useTranslations('clubs.mediaEditor');

  return (
    <Field label={t('title')}>
      <Box
        w="full"
        minW={0}
        overflow="hidden"
        borderWidth="1px"
        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
        borderRadius="xl"
        bg={{ base: 'white', _dark: 'gray.900' }}
      >
        <Grid
          w="full"
          templateColumns={{
            base: 'minmax(0, 1fr)',
            lg: 'minmax(0, 2fr) minmax(320px, 0.7fr)',
          }}
          alignItems="stretch"
        >
          <Box minW={0} p={{ base: 3, md: 4 }}>
            <Flex justify="space-between" align="start" gap={3} mb={3}>
              <Text minW={0} fontSize="xs" color="gray.500" textWrap="pretty">
                {t('photosDescription')}
              </Text>
              <Text
                flexShrink={0}
                fontSize="xs"
                color="gray.500"
                fontVariantNumeric="tabular-nums"
              >
                {images.length}/10
              </Text>
            </Flex>

            <AppMultiImageUpload
              images={images}
              bannerIndex={bannerIndex}
              onImagesChange={onImagesChange}
              onBannerChange={onBannerChange}
              maxImages={10}
              category={EImageCategory.CLUB}
              label={null}
              compact
            />
          </Box>

          <Box
            minW={0}
            borderTopWidth={{ base: '1px', lg: 0 }}
            borderInlineStartWidth={{ base: 0, lg: '1px' }}
            borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
            p={{ base: 3, md: 4, lg: 5 }}
            bg={{ base: 'gray.50', _dark: 'gray.900' }}
          >
            <Text fontWeight="semibold">{t('logoTitle')}</Text>
            <Text mb={3} fontSize="xs" color="gray.500" textWrap="pretty">
              {t('logoDescription')}
            </Text>

            <AppSingleImageUpload
              value={logo}
              publicId={logoPublicId}
              onChange={onLogoChange}
              onClear={onLogoClear}
              category={EImageCategory.CLUB}
              alt={t('logoAlt')}
              uploadText={t('uploadLogo')}
              galleryText={t('selectFromGallery')}
              emptyTitle={t('emptyLogo')}
              dropText={t('dropLogo')}
              showUrlInput={false}
              compact
            />
          </Box>
        </Grid>
      </Box>
    </Field>
  );
}
