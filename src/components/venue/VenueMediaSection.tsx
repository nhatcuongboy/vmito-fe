'use client';

import { Stack } from '@chakra-ui/react';
import { Field } from '@/components/ui/Field';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';
import { EImageCategory } from '@/lib/api/types';

interface IVenueImageValue {
  url: string;
  publicId?: string;
}

interface IVenueMediaSectionProps {
  images: ISessionImage[];
  bannerIndex: number;
  onImagesChange: (images: ISessionImage[]) => void;
  onBannerChange: (index: number) => void;
  courtLayoutImage?: string;
  courtLayoutImagePublicId?: string;
  onCourtLayoutChange: (image: IVenueImageValue) => void;
  onCourtLayoutClear: () => void;
  logo?: string;
  logoPublicId?: string;
  onLogoChange: (image: IVenueImageValue) => void;
  onLogoClear: () => void;
}

/**
 * Media inputs for a venue form: the multi-image gallery (with banner
 * selection) plus the two single-image fields (court layout diagram and
 * logo) laid out side by side. Shared by the admin create and edit venue
 * pages so both stay in sync.
 */
const VenueMediaSection = ({
  images,
  bannerIndex,
  onImagesChange,
  onBannerChange,
  courtLayoutImage,
  courtLayoutImagePublicId,
  onCourtLayoutChange,
  onCourtLayoutClear,
  logo,
  logoPublicId,
  onLogoChange,
  onLogoClear,
}: IVenueMediaSectionProps) => {
  return (
    <Stack gap={4} align="stretch">
      <Field label="Ảnh sân">
        <AppMultiImageUpload
          images={images}
          bannerIndex={bannerIndex}
          onImagesChange={onImagesChange}
          onBannerChange={onBannerChange}
          maxImages={10}
          category={EImageCategory.OTHER}
          label={null}
        />
      </Field>

      <Stack
        direction={{ base: 'column', md: 'row' }}
        width="full"
        gap={4}
        align="stretch"
      >
        <Field flex={1} minW={0} label="Sơ đồ sân">
          <AppSingleImageUpload
            compact
            value={courtLayoutImage}
            publicId={courtLayoutImagePublicId}
            onChange={onCourtLayoutChange}
            onClear={onCourtLayoutClear}
            category={EImageCategory.OTHER}
            alt="Sơ đồ sân"
            urlPlaceholder="Nhập URL hình ảnh sơ đồ sân..."
          />
        </Field>

        <Field flex={1} minW={0} label="Logo sân">
          <AppSingleImageUpload
            compact
            value={logo}
            publicId={logoPublicId}
            onChange={onLogoChange}
            onClear={onLogoClear}
            category={EImageCategory.OTHER}
            alt="Logo sân"
            urlPlaceholder="Nhập URL logo sân..."
          />
        </Field>
      </Stack>
    </Stack>
  );
};

export default VenueMediaSection;
