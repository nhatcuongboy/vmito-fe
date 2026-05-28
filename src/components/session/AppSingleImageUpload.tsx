'use client';

import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import {
  Box,
  Flex,
  Image as ChakraImage,
  IconButton,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { ImagePlus, Link, Upload, X } from 'lucide-react';
import AppImageGalleryPicker from '@/components/AppImageGalleryPicker';
import { Input } from '@/components/ui/Input';
import { toaster } from '@/components/ui/toaster';
import { EImageCategory } from '@/lib/api/types';
import { UserImageService } from '@/lib/api/user-image.service';
import { compressImage } from '@/lib/utils/image';

interface AppSingleImageUploadProps {
  value?: string;
  publicId?: string;
  onChange: (image: { url: string; publicId?: string }) => void;
  onClear?: () => void;
  category?: EImageCategory;
  alt?: string;
  uploadText?: string;
  galleryText?: string;
  emptyTitle?: string;
  dropText?: string;
  urlPlaceholder?: string;
}

const AppSingleImageUpload = ({
  value,
  publicId,
  onChange,
  onClear,
  category = EImageCategory.OTHER,
  alt = 'Uploaded image',
  uploadText = 'Tải ảnh mới',
  galleryText = 'Chọn từ thư viện',
  emptyTitle = 'Chưa có ảnh nào. Hãy tải ảnh lên!',
  dropText = 'hoặc kéo ảnh vào đây',
  urlPlaceholder = 'Dán URL hình ảnh...',
}: AppSingleImageUploadProps) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState(value ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(value ?? '');
  }, [value]);

  const clearImage = () => {
    onClear?.();
    if (!onClear) onChange({ url: '', publicId: '' });
  };

  const applyUrlInput = () => {
    const nextUrl = urlInput.trim();
    if (nextUrl) {
      onChange({ url: nextUrl, publicId: '' });
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (isUploading || files.length === 0) return;

    const imageFile = files.find((file) => file.type.startsWith('image/'));
    if (!imageFile) {
      toaster.error({ title: 'Vui lòng chọn file hình ảnh' });
      return;
    }

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(imageFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });
      const uploadedImage = await UserImageService.uploadImage(
        compressedFile,
        category
      );
      onChange({
        url: uploadedImage.url,
        publicId: uploadedImage.publicId,
      });
    } catch {
      toaster.error({ title: 'Không thể xử lý hình ảnh' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    await uploadFiles(Array.from(event.target.files ?? []));
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (isUploading) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    if (isUploading) return;
    event.preventDefault();
    setIsDragActive(false);
    await uploadFiles(Array.from(event.dataTransfer.files ?? []));
  };

  return (
    <VStack align="stretch" gap={3} width="full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />

      {value ? (
        <Box
          position="relative"
          borderRadius="lg"
          overflow="hidden"
          borderWidth="1px"
          borderColor="gray.200"
          bg="gray.50"
          _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
        >
          <ChakraImage
            src={value}
            alt={alt}
            width="100%"
            maxH="260px"
            objectFit="contain"
          />
          <Flex position="absolute" top={2} right={2} gap={2}>
            <IconButton
              aria-label="Xóa ảnh"
              size="sm"
              colorPalette="red"
              onClick={clearImage}
              type="button"
            >
              <X size={14} />
            </IconButton>
            <IconButton
              aria-label="Tải ảnh mới"
              size="sm"
              colorPalette="green"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              type="button"
            >
              {isUploading ? <Spinner size="xs" /> : <Upload size={14} />}
            </IconButton>
            <IconButton
              aria-label="Chọn từ thư viện"
              size="sm"
              variant="outline"
              colorPalette="green"
              bg="white"
              onClick={() => setIsGalleryOpen(true)}
              disabled={isUploading}
              type="button"
            >
              <ImagePlus size={14} />
            </IconButton>
          </Flex>
        </Box>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          minH={{ base: '170px', md: '190px' }}
          borderWidth={2}
          borderStyle="dashed"
          borderColor={isDragActive ? 'green.400' : 'gray.300'}
          borderRadius="xl"
          bg={isDragActive ? 'green.50' : 'gray.50'}
          _dark={{
            bg: isDragActive ? 'green.950' : 'gray.800',
            borderColor: isDragActive ? 'green.500' : 'gray.600',
          }}
          px={4}
          py={6}
          textAlign="center"
          transition="all 0.2s"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Flex
            w={12}
            h={12}
            align="center"
            justify="center"
            borderRadius="full"
            bg={{ base: 'green.100', _dark: 'green.900' }}
            color={{ base: 'green.700', _dark: 'green.200' }}
            mb={3}
          >
            <ImagePlus size={24} />
          </Flex>
          <Text color="gray.700" fontSize="sm" fontWeight="semibold">
            {emptyTitle}
          </Text>
          <Text mt={1} color="gray.500" fontSize="sm">
            {dropText}
          </Text>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            gap={2}
            mt={4}
            justify="center"
          >
            <Button
              type="button"
              size="sm"
              colorPalette="green"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              leftIcon={
                isUploading ? <Spinner size="sm" /> : <Upload size={16} />
              }
            >
              {isUploading ? 'Đang tải...' : uploadText}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              colorPalette="green"
              onClick={() => setIsGalleryOpen(true)}
              disabled={isUploading}
            >
              {galleryText}
            </Button>
          </Flex>
        </Flex>
      )}

      <Flex gap={2} align="center">
        <Input
          value={urlInput}
          placeholder={urlPlaceholder}
          onChange={(event) => setUrlInput(event.target.value)}
          onBlur={applyUrlInput}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyUrlInput();
            }
          }}
        />
        <IconButton
          aria-label="Áp dụng URL"
          type="button"
          variant="outline"
          colorPalette="green"
          onClick={applyUrlInput}
        >
          <Link size={16} />
        </IconButton>
      </Flex>

      <AppImageGalleryPicker
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        maxSelect={1}
        category={category}
        selectedImages={
          value && publicId
            ? [
                {
                  url: value,
                  publicId,
                },
              ]
            : []
        }
        onSelect={(images) => {
          if (images[0]) {
            onChange(images[0]);
          }
          setIsGalleryOpen(false);
        }}
      />
    </VStack>
  );
};

export default AppSingleImageUpload;
