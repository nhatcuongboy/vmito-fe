'use client';

import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Upload, X, QrCode } from 'lucide-react';
import { useRef, useState, ChangeEvent } from 'react';
import { Button, Image } from '@/components/ui/chakra-compat';

interface QRCodeUploaderProps {
  value?: string; // URL of the uploaded QR code
  onChange: (url: string | undefined) => void;
  onUpload: (file: File) => Promise<string>; // Returns uploaded URL
  disabled?: boolean;
  maxSizeMB?: number;
}

export default function QRCodeUploader({
  value,
  onChange,
  onUpload,
  disabled = false,
  maxSizeMB = 5,
}: QRCodeUploaderProps) {
  const t = useTranslations('payment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('invalidFileType'));
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(t('fileTooLarge', { maxSize: maxSizeMB }));
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setError(t('uploadFailed'));
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <VStack gap={2} align="stretch">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {value ? (
        <Box position="relative" borderRadius="lg" overflow="hidden">
          <Image
            src={value}
            alt="QR Code"
            maxH="200px"
            mx="auto"
            objectFit="contain"
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
            borderColor: disabled ? undefined : 'green.400',
            bg: disabled ? undefined : 'green.50',
          }}
          onClick={handleClick}
        >
          {isUploading ? (
            <>
              <Box
                w={8}
                h={8}
                border="3px solid"
                borderColor="green.500"
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
                {error ? <X size={32} /> : <QrCode size={32} />}
              </Box>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                {t('uploadQrCode')}
              </Text>
              <Flex align="center" gap={1} mt={2}>
                <Upload size={14} />
                <Text fontSize="xs" color="gray.500">
                  {t('clickToUpload')}
                </Text>
              </Flex>
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
