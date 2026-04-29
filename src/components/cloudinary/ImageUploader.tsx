'use client';

import { Box, Flex, Text, VStack, Image } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useRef, useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { compressImage } from '@/lib/utils/image';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
  maxSizeMB?: number;
  label?: string;
  acceptedFormats?: string[];
  maxWidth?: number;
  maxHeight?: number;
  showPreview?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  onUpload,
  disabled = false,
  maxSizeMB = 5,
  label,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxWidth = 300,
  maxHeight = 300,
  showPreview = true,
}: ImageUploaderProps) {
  const t = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!acceptedFormats.includes(file.type)) {
      setError(t('invalidFileType'));
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(t('fileTooLarge', { maxSize: maxSizeMB }));
      return;
    }

    setError(null);

    if (showPreview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    setIsUploading(true);

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1, // Aim for < 1MB
        maxWidthOrHeight: 1920,
      });

      const url = await onUpload(compressedFile);
      onChange(url);
    } catch (err) {
      setError(t('uploadFailed'));
      console.error('Upload failed:', err);
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setPreview(null);
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayImage = value || preview;

  return (
    <VStack gap={2} align="stretch">
      {label && (
        <Text fontSize="sm" fontWeight="medium">
          {label}
        </Text>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {displayImage ? (
        <Box position="relative" borderRadius="lg" overflow="hidden">
          <Image
            src={displayImage}
            alt="Upload preview"
            maxW={`${maxWidth}px`}
            maxH={`${maxHeight}px`}
            mx="auto"
            objectFit="contain"
            borderRadius="md"
          />
          {!disabled && (
            <Button
              size="sm"
              colorPalette="red"
              variant="solid"
              position="absolute"
              top={2}
              right={2}
              onClick={handleRemove}
            >
              <X size={16} />
            </Button>
          )}
        </Box>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          p={8}
          border="2px dashed"
          borderColor={error ? 'red.300' : 'gray.300'}
          borderRadius="lg"
          bg={error ? 'red.50' : 'gray.50'}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          opacity={disabled ? 0.6 : 1}
          transition="all 0.2s"
          _hover={{
            borderColor: disabled ? undefined : 'blue.400',
            bg: disabled ? undefined : 'blue.50',
          }}
          onClick={handleClick}
        >
          {isUploading ? (
            <>
              <Box
                w={8}
                h={8}
                border="3px solid"
                borderColor="blue.500"
                borderTopColor="transparent"
                borderRadius="full"
                animation="spin 1s linear infinite"
                css={{
                  '@keyframes spin': {
                    from: { transform: 'rotate(0deg)' },
                    to: { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Text mt={2} fontSize="sm" color="gray.600">
                {t('uploading')}
              </Text>
            </>
          ) : (
            <>
              <Box color="gray.400" mb={2}>
                {error ? <X size={32} /> : <ImageIcon size={32} />}
              </Box>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                {t('uploadImage')}
              </Text>
              <Flex align="center" gap={1} mt={2}>
                <Upload size={14} />
                <Text fontSize="xs" color="gray.500">
                  {t('clickToUpload')}
                </Text>
              </Flex>
              <Text fontSize="xs" color="gray.400" mt={1}>
                {t('maxSize')}: {maxSizeMB}MB
              </Text>
            </>
          )}
        </Flex>
      )}

      {error && (
        <Text fontSize="sm" color="red.500">
          {error}
        </Text>
      )}
    </VStack>
  );
}
