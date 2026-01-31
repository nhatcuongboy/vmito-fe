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

  const downloadSessionImage = useCallback(async (session: ISession, elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      setIsDownloading(true);
      
      // Wait a bit for images to load if needed, though they should be cached
      // html-to-image usually handles this well
      const dataUrl = await toPng(element, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        // Ensure fonts are loaded and included
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `session-${session.id}.png`;
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
  }, [t]);

  return { downloadSessionImage, isDownloading };
};
