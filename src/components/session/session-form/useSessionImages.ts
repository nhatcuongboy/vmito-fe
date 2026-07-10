import { useState } from 'react';

import { ISession } from '@/lib/api/types';
import { ISessionImage } from '@/components/session/AppMultiImageUpload';

export function useSessionImages(initialData?: ISession) {
  // Session images state (multi-image support)
  const [sessionImages, setSessionImages] = useState<ISessionImage[]>(() => {
    const imgs: ISessionImage[] = [];
    // Add banner image first if it exists
    if (initialData?.coverPhoto && initialData?.coverPhotoPublicId) {
      imgs.push({
        url: initialData.coverPhoto,
        publicId: initialData.coverPhotoPublicId,
      });
    }
    // Add other images
    if (initialData?.images && initialData?.imagePublicIds) {
      initialData.images.forEach((url, i) => {
        const publicId = initialData.imagePublicIds?.[i];
        if (publicId && !imgs.some((img) => img.publicId === publicId)) {
          imgs.push({ url, publicId });
        }
      });
    }
    return imgs;
  });
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  return {
    sessionImages,
    setSessionImages,
    bannerIndex,
    setBannerIndex,
    isUploadingImages,
    setIsUploadingImages,
  };
}
