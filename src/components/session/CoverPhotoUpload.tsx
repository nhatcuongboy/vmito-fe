'use client';

import { useState, useRef } from 'react';
import { Box, Flex, Text, Image as ChakraImage, IconButton } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CoverPhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoSelect: (file: File) => void;
  onPhotoRemove: () => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export default function CoverPhotoUpload({
  currentPhotoUrl,
  onPhotoSelect,
  onPhotoRemove,
  isUploading = false,
  disabled = false,
}: CoverPhotoUploadProps) {
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize and compress image
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Target dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 630;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const aspectRatio = width / height;

            if (width > height) {
              width = MAX_WIDTH;
              height = Math.round(width / aspectRatio);

              if (height > MAX_HEIGHT) {
                height = MAX_HEIGHT;
                width = Math.round(height * aspectRatio);
              }
            } else {
              height = MAX_HEIGHT;
              width = Math.round(height * aspectRatio);

              if (width > MAX_WIDTH) {
                width = MAX_WIDTH;
                height = Math.round(width / aspectRatio);
              }
            }
          }

          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              // Create new file from blob
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(resizedFile);
            },
            file.type,
            0.85 // Quality: 85%
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(tc('pleaseSelectImageFile') || 'Please select an image file');
      return;
    }

    try {
      // Resize and compress image
      const resizedFile = await resizeImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(resizedFile);

      // Pass resized file to parent
      onPhotoSelect(resizedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert(tc('imageProcessingFailed') || 'Failed to process image. Please try another file.');
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onPhotoRemove();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentPhotoUrl;

  return (
    <Box>
      <Text fontSize="sm" fontWeight="medium" mb={2}>
        {t('coverPhoto')}
      </Text>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />

      {displayUrl ? (
        <Box position="relative" borderRadius="lg" overflow="hidden">
          <ChakraImage
            src={displayUrl}
            alt="Cover photo"
            width="100%"
            height="200px"
            objectFit="cover"
            borderRadius="lg"
          />
          {!disabled && !isUploading && (
            <Flex
              position="absolute"
              top={2}
              right={2}
              gap={2}
            >
              <IconButton
                aria-label="Remove photo"
                size="sm"
                colorPalette="red"
                onClick={handleRemove}
              >
                <X size={16} />
              </IconButton>
              <Button
                size="sm"
                colorPalette="blue"
                onClick={handleClick}
                leftIcon={<Upload size={16} />}
              >
                {tc('change')}
              </Button>
            </Flex>
          )}
          {isUploading && (
            <Flex
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.600"
              align="center"
              justify="center"
            >
              <Text color="white" fontWeight="medium">
                {tc('uploading')}
              </Text>
            </Flex>
          )}
        </Box>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          height="200px"
          borderWidth={2}
          borderStyle="dashed"
          borderColor="gray.300"
          borderRadius="lg"
          cursor={disabled || isUploading ? 'not-allowed' : 'pointer'}
          onClick={disabled || isUploading ? undefined : handleClick}
          bg="gray.50"
          _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
          _hover={
            disabled || isUploading
              ? {}
              : { borderColor: 'blue.400', bg: 'gray.100' }
          }
          transition="all 0.2s"
        >
          <ImageIcon size={48} color="gray" />
          <Text mt={2} fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            {t('clickToUploadCoverPhoto')}
          </Text>
          <Text fontSize="xs" color="gray.500" mt={1}>
            {t('coverPhotoHint')}
          </Text>
        </Flex>
      )}
    </Box>
  );
}
