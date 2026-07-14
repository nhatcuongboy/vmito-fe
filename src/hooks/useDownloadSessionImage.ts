'use client';

import { useState, useCallback, useRef } from 'react';
import { toBlob } from 'html-to-image';
import { ISession } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useTranslations } from 'next-intl';

interface UseDownloadSessionImageReturn {
  downloadSessionImage: (
    session: ISession,
    elementId: string,
    filenamePrefix?: string,
    options?: {
      templateId?: string;
      ratio?: string;
    }
  ) => Promise<void>;
  isDownloading: boolean;
}

// Covers iPhone/iPod/iPad, including iPadOS 13+ which reports as MacIntel
const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// WebKit engines (all iOS browsers + desktop Safari) need a warm-up render
// before images come out correctly; Chromium/Firefox don't
const needsWarmupRender = () =>
  isIOS() ||
  (typeof navigator !== 'undefined' &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent));

export const useDownloadSessionImage = (): UseDownloadSessionImageReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  // Ref-based guard: rendering blocks the main thread long enough that
  // repeated taps land before React re-renders the disabled button state
  const isDownloadingRef = useRef(false);
  const t = useTranslations('session');

  const downloadSessionImage = useCallback(
    async (
      session: ISession,
      elementId: string,
      filenamePrefix: string = 'ThongKeTranDau',
      options?: {
        templateId?: string;
        ratio?: string;
      }
    ) => {
      if (isDownloadingRef.current) return;

      const element = document.getElementById(elementId);
      if (!element) return;

      isDownloadingRef.current = true;
      setIsDownloading(true);

      try {
        // Let the browser paint the loading state before the DOM cloning
        // below blocks the main thread for several seconds
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => setTimeout(resolve, 0))
        );

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

        // Safari workaround: the first render often misses images, so warm up
        // once and use the second render for the actual data. Only remote
        // images are affected — data: URLs (e.g. QR codes) render fine on the
        // first pass, so skip the extra render when there's nothing remote.
        const hasRemoteImages = Array.from(images).some(
          (img) => img.src && !img.src.startsWith('data:')
        );
        if (needsWarmupRender() && hasRemoteImages) {
          await toBlob(element, { cacheBust: true });
        }

        const elementBackgroundColor =
          window.getComputedStyle(element).backgroundColor || '#ffffff';

        const blob = await toBlob(element, {
          quality: 1,
          backgroundColor: elementBackgroundColor,
          cacheBust: true,
          pixelRatio: 2, // Ensure good quality on mobile/high-DPI screens
        });
        if (!blob) {
          throw new Error('Image generation returned no data');
        }

        const shortId = session.id.slice(0, 8);
        const templatePart = options?.templateId
          ? `-${options.templateId}`
          : '';
        const ratioPart = options?.ratio
          ? `-${options.ratio.replace(':', 'x')}`
          : '';
        const filename = `${filenamePrefix}${templatePart}${ratioPart}-${shortId}.png`;

        // iOS can't reliably save via <a download> (and in-app browsers ignore
        // it entirely) — the native share sheet with "Save Image" is the only
        // dependable path there
        if (isIOS() && typeof navigator.share === 'function') {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({ files: [file] });
              toaster.success({
                title: t('imageDownloadSuccess'),
              });
              return;
            } catch (shareError) {
              // User closed the share sheet — not an error, nothing to download
              if ((shareError as DOMException)?.name === 'AbortError') {
                return;
              }
              // NotAllowedError (expired user gesture) etc. — fall through to
              // the anchor download below
            }
          }
        }

        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = objectUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Keep the blob URL alive until the browser has started the download
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);

        toaster.success({
          title: t('imageDownloadSuccess'),
        });
      } catch (error) {
        console.error('Error generating image:', error);
        toaster.error({
          title: t('error') || 'Error downloading image',
        });
      } finally {
        isDownloadingRef.current = false;
        setIsDownloading(false);
      }
    },
    [t]
  );

  return { downloadSessionImage, isDownloading };
};
