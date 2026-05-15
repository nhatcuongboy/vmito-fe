'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Text, Spinner } from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  SimpleGrid,
} from '@/components/ui/chakra-compat';
import {
  Upload,
  Trash2,
  Check,
  Image as ImageIcon,
  Expand,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserImageService } from '@/lib/api/user-image.service';
import { IUserImage, EImageCategory } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { compressImage } from '@/lib/utils/image';

interface ISelectedImage {
  url: string;
  publicId: string;
}

interface IAppImageGalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (images: ISelectedImage[]) => void;
  selectedImages?: ISelectedImage[];
  maxSelect?: number;
  category?: EImageCategory;
}

const AppImageGalleryPicker = ({
  isOpen,
  onClose,
  onSelect,
  selectedImages = [],
  maxSelect = 5,
  category = EImageCategory.SESSION_COVER,
}: IAppImageGalleryPickerProps) => {
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const [galleryImages, setGalleryImages] = useState<IUserImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selected, setSelected] = useState<ISelectedImage[]>(selectedImages);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchImages = useCallback(async (pageNum: number, append = false) => {
    setIsLoading(true);
    try {
      // Fetch all images regardless of category
      const response = await UserImageService.getMyImages(
        undefined,
        pageNum,
        20
      );
      const items = Array.isArray(response?.data) ? response.data : [];
      if (append) {
        setGalleryImages((prev) => [...prev, ...items]);
      } else {
        setGalleryImages(items);
      }
      setHasMore(pageNum < (response?.meta?.totalPages ?? 0));
    } catch {
      console.error('Failed to fetch images');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelected(selectedImages);
      setPage(1);
      fetchImages(1);
    }
  }, [isOpen, fetchImages, selectedImages]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchImages(nextPage, true);
      }
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, isLoading, page, fetchImages]);

  const isSelected = (img: IUserImage) =>
    selected.some((s) => s.publicId === img.publicId);

  const handleToggleSelect = (img: IUserImage) => {
    if (isSelected(img)) {
      setSelected((prev) => prev.filter((s) => s.publicId !== img.publicId));
    } else {
      if (selected.length >= maxSelect) return;
      setSelected((prev) => [
        ...prev,
        { url: img.url, publicId: img.publicId },
      ]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    // Check if total selected + new uploads exceed maxSelect
    if (selected.length + fileList.length > maxSelect) {
      toaster.error({ title: tc('tooManyFiles', { max: maxSelect }) });
      // We can still process up to the limit if we want, but usually better to just warn
      // For now, let's just proceed with all but warn
    }

    setIsUploading(true);
    try {
      let hasNonImage = false;
      const uploadPromises = fileList.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          hasNonImage = true;
          return null;
        }

        // Compress image before upload
        const compressedFile = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });

        return await UserImageService.uploadImage(compressedFile, category);
      });

      if (hasNonImage) {
        toaster.error({ title: tc('pleaseSelectImageFile') });
      }

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(
        (img): img is IUserImage => img !== null
      );

      if (successfulUploads.length > 0) {
        setGalleryImages((prev) => [...successfulUploads, ...prev]);
        // Không tự động chọn ảnh mới upload nữa
      }
    } catch {
      toaster.error({ title: tc('imageProcessingFailed') });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (img: IUserImage) => {
    try {
      await UserImageService.deleteImage(img.id);
      setGalleryImages((prev) => prev.filter((g) => g.id !== img.id));
      setSelected((prev) => prev.filter((s) => s.publicId !== img.publicId));
      toaster.success({ title: t('imageDeleted') });
    } catch {
      toaster.error({ title: t('imageDeleteFailed') });
    }
  };

  return (
    <>
      <Modal isOpen={isMounted && isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>{t('selectFromGallery')}</ModalHeader>
          <ModalCloseButton onClose={onClose} />
          <ModalBody overflow="auto" pb={4}>
            {/* Toolbar: status text + upload button */}
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="sm" color="gray.500">
                {t('maxImages', { max: maxSelect })} — {selected.length}/
                {maxSelect} {tc('selected')}
              </Text>
              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  colorPalette="green"
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  disabled={isUploading}
                  leftIcon={
                    isUploading ? <Spinner size="xs" /> : <Upload size={14} />
                  }
                >
                  {isUploading ? tc('uploading') : t('uploadNew')}
                </Button>
              </Box>
            </Flex>

            {/* Gallery grid */}
            {galleryImages.length === 0 && !isLoading ? (
              <Flex direction="column" align="center" justify="center" py={10}>
                <ImageIcon size={48} color="gray" />
                <Text mt={2} color="gray.500">
                  {t('noImagesYet')}
                </Text>
              </Flex>
            ) : (
              <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
                {galleryImages.map((img) => {
                  const selectedIndex = selected.findIndex(
                    (s) => s.publicId === img.publicId
                  );
                  const imgSelected = selectedIndex !== -1;
                  const isDisabled =
                    !imgSelected && selected.length >= maxSelect;
                  return (
                    <Box
                      key={img.id}
                      position="relative"
                      cursor={isDisabled ? 'not-allowed' : 'pointer'}
                      borderRadius="md"
                      overflow="hidden"
                      borderWidth={imgSelected ? 3 : 1}
                      borderColor={imgSelected ? 'green.500' : 'gray.200'}
                      boxShadow={
                        imgSelected
                          ? '0 0 0 1px green.500, 0 0 10px rgba(72, 187, 120, 0.5)'
                          : 'none'
                      }
                      transform={imgSelected ? 'scale(1.02)' : 'scale(1)'}
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      role="group"
                      zIndex={imgSelected ? 1 : 0}
                      _hover={
                        isDisabled
                          ? {}
                          : {
                              borderColor: imgSelected
                                ? 'green.500'
                                : 'green.300',
                              transform: 'scale(1.02)',
                            }
                      }
                      onClick={() => !isDisabled && handleToggleSelect(img)}
                    >
                      <Box
                        position="relative"
                        w="100%"
                        aspectRatio="4/3"
                        overflow="hidden"
                        opacity={isDisabled ? 0.5 : 1}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.originalName || 'Gallery image'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </Box>

                      {/* Selection Number Overlay */}
                      {imgSelected && (
                        <Flex
                          position="absolute"
                          top={2}
                          left={2}
                          bg="blue.500"
                          color="white"
                          w={5}
                          h={5}
                          borderRadius="full"
                          align="center"
                          justify="center"
                          fontSize="xs"
                          fontWeight="bold"
                          boxShadow="md"
                          pointerEvents="none"
                        >
                          {selectedIndex + 1}
                        </Flex>
                      )}

                      {/* Category Badge đã bị xoá theo yêu cầu UX */}

                      {/* Selected checkmark circle — top right */}
                      {imgSelected && (
                        <Flex
                          position="absolute"
                          top={2}
                          right={2}
                          bg="green.500"
                          borderRadius="full"
                          p={1}
                          boxShadow="md"
                          pointerEvents="none"
                        >
                          <Check size={12} color="white" />
                        </Flex>
                      )}

                      {/* Cover Photo Label */}
                      {selectedIndex === 0 && (
                        <Box
                          position="absolute"
                          bottom={1}
                          right={1}
                          bg="green.500"
                          color="white"
                          fontSize="2xs"
                          px={1.5}
                          py={0.5}
                          borderRadius="sm"
                          fontWeight="bold"
                          boxShadow="md"
                          pointerEvents="none"
                          zIndex={1}
                        >
                          {t('coverPhoto')}
                        </Box>
                      )}

                      {/* View Action Buttons (Always visible at the bottom center) */}
                      <Flex
                        position="absolute"
                        bottom={2}
                        left="50%"
                        transform="translateX(-50%)"
                        gap={2}
                        zIndex={2}
                      >
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewUrl(img.url);
                          }}
                          cursor="pointer"
                          bg="white"
                          color="gray.800"
                          borderRadius="full"
                          p={2}
                          _hover={{ bg: 'gray.100', transform: 'scale(1.1)' }}
                          transition="all 0.2s"
                          boxShadow="lg"
                          title={tc('view')}
                        >
                          <Expand size={16} />
                        </Box>
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t('deleteImageConfirm'))) {
                              handleDeleteImage(img);
                            }
                          }}
                          cursor="pointer"
                          bg="white"
                          color="red.500"
                          borderRadius="full"
                          p={2}
                          _hover={{ bg: 'red.50', transform: 'scale(1.1)' }}
                          transition="all 0.2s"
                          boxShadow="lg"
                          title={tc('delete')}
                        >
                          <Trash2 size={16} />
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}

            {/* Fullscreen image preview lightbox — render inside ModalBody */}
            {previewUrl && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                zIndex={500}
                bg="blackAlpha.900"
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={() => setPreviewUrl(null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '85vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 0 40px rgba(0,0,0,0.8)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <Box
                  position="absolute"
                  top={4}
                  right={4}
                  cursor="pointer"
                  bg="blackAlpha.700"
                  borderRadius="full"
                  p={2}
                  _hover={{ bg: 'blackAlpha.900' }}
                  onClick={() => setPreviewUrl(null)}
                >
                  <X size={20} color="white" />
                </Box>
              </Box>
            )}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} style={{ height: 1 }} />
            {isLoading && (
              <Flex justify="center" py={4}>
                <Spinner size="sm" />
              </Flex>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr={2}>
              {tc('cancel') || 'Cancel'}
            </Button>
            <Button
              colorPalette="green"
              onClick={handleConfirm}
              disabled={selected.length === 0}
            >
              {tc('confirm') || 'Confirm'} ({selected.length})
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AppImageGalleryPicker;
