'use client';

import { useCallback, useRef, useState } from 'react';
// See useDownloadSessionImage.ts for why modern-screenshot over html-to-image
import { domToBlob, type Options } from 'modern-screenshot';
import { toaster } from '@/components/ui/toaster';
import {
  getElementCaptureSize,
  isIOS,
  needsWarmupRender,
  normalizeClonedNode,
} from '@/utils/dom-capture';

interface DownloadMessages {
  success: string;
  error: string;
}

interface UseDownloadElementImageReturn {
  downloadElementImage: (
    elementId: string,
    filename: string,
    messages: DownloadMessages
  ) => Promise<void>;
  isDownloading: boolean;
}

/** Generic sibling of useDownloadSessionImage for non-session DOM captures (e.g. profile share cards). */
export const useDownloadElementImage = (): UseDownloadElementImageReturn => {
  const [isDownloading, setIsDownloading] = useState(false);
  // Ref-based guard: rendering blocks the main thread long enough that
  // repeated taps land before React re-renders the disabled button state
  const isDownloadingRef = useRef(false);

  const downloadElementImage = useCallback(
    async (elementId: string, filename: string, messages: DownloadMessages) => {
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

        const images = element.getElementsByTagName('img');
        const imagePromises = Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        });
        await Promise.all(imagePromises);

        const hasRemoteImages = Array.from(images).some(
          (img) => img.src && !img.src.startsWith('data:')
        );
        const captureSize = getElementCaptureSize(element);
        const baseCaptureOptions: Options = {
          ...captureSize,
          fetch: { bypassingCache: true },
          style: {
            maxWidth: 'none',
          },
          onCloneEachNode: normalizeClonedNode,
        };

        if (needsWarmupRender() && hasRemoteImages) {
          await domToBlob(element, baseCaptureOptions);
        }

        const elementBackgroundColor =
          window.getComputedStyle(element).backgroundColor || '#ffffff';

        const blob = await domToBlob(element, {
          ...baseCaptureOptions,
          backgroundColor: elementBackgroundColor,
          scale: 2,
          type: 'image/png',
        });
        if (!blob) {
          throw new Error('Image generation returned no data');
        }

        // iOS can't reliably save via <a download> (and in-app browsers ignore
        // it entirely) — the native share sheet with "Save Image" is the only
        // dependable path there
        if (isIOS() && typeof navigator.share === 'function') {
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({ files: [file] });
              toaster.success({ title: messages.success });
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

        toaster.success({ title: messages.success });
      } catch (error) {
        console.error('Error generating image:', error);
        toaster.error({ title: messages.error });
      } finally {
        isDownloadingRef.current = false;
        setIsDownloading(false);
      }
    },
    []
  );

  return { downloadElementImage, isDownloading };
};
