import { useCallback, useRef, useState } from 'react';
import { compressImage, CompressionOptions } from '@/lib/utils/image';

export interface UploadResult {
  url: string;
  publicId: string;
}

type Uploader = (
  file: File,
  onProgress?: (percent: number) => void
) => Promise<UploadResult>;

export interface UseImageUploadOptions {
  /** The service call that uploads the file and reports progress. */
  uploader: Uploader;
  /** Client-side compression applied before upload. */
  compression?: CompressionOptions;
  onSuccess?: (result: UploadResult) => void | Promise<void>;
  onError?: (error: unknown) => void;
}

/**
 * Encapsulates the pick → compress → upload flow with a real progress value,
 * so both avatar and cover uploads can surface a visible progress indicator.
 */
export function useImageUpload({
  uploader,
  compression,
  onSuccess,
  onError,
}: UseImageUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const openFilePicker = useCallback(() => {
    if (isUploading) return;
    inputRef.current?.click();
  }, [isUploading]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Always reset the input so re-selecting the same file fires onChange.
      if (inputRef.current) inputRef.current.value = '';
      if (!file) return;

      setIsUploading(true);
      setProgress(0);
      try {
        const compressed = await compressImage(file, compression);
        const result = await uploader(compressed, (percent) =>
          setProgress(percent)
        );
        await onSuccess?.(result);
      } catch (error) {
        console.error('Image upload failed:', error);
        onError?.(error);
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [uploader, compression, onSuccess, onError]
  );

  return {
    inputRef,
    isUploading,
    progress,
    openFilePicker,
    handleFileChange,
  };
}
