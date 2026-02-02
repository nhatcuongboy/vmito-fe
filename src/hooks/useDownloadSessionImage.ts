'use client';

import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { ISession } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useTranslations } from 'next-intl';

interface UseDownloadSessionImageReturn {
  downloadSessionImage: (session: ISession, elementId: string) => Promise<void>;
  isDownloading: boolean;
}

export const useDownloadSessionImage = (): UseDownloadSessionImageReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  const t = useTranslations('session');

  const downloadSessionImage = useCallback(
    async (session: ISession, elementId: string) => {
      const element = document.getElementById(elementId);
      if (!element) return;

      try {
        setIsDownloading(true);

        // Wait for all images inside the element to be loaded
        const images = element.getElementsByTagName('img');
        const imagePromises = Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        });
        await Promise.all(imagePromises);

        // Safari workaround: sometimes the first call doesn't render images correctly
        // We call it once to "warm up" and then once more for the actual data
        await toPng(element, { cacheBust: true });
        
        const dataUrl = await toPng(element, {
          quality: 1,
          backgroundColor: '#ffffff',
          cacheBust: true,
          pixelRatio: 2, // Ensure good quality on mobile/high-DPI screens
        });

        const link = document.createElement('a');
        const shortId = session.id.slice(0, 8);
        link.download = `TuyenVangLai-${shortId}.png`;
        link.href = dataUrl;
        link.click();

        toaster.success({
          title: t('imageDownloadSuccess'),
        });
      } catch (error) {
        console.error('Error generating image:', error);
        toaster.error({
          title: t('error') || 'Error downloading image',
        });
      } finally {
        setIsDownloading(false);
      }
    },
    [t]
  );

  return { downloadSessionImage, isDownloading };
};
