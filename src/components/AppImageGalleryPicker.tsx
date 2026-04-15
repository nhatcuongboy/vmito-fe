'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Text, Spinner, Badge } from '@chakra-ui/react';
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

  const fetchImages = useCallback(
    async (pageNum: number, append = false) => {
      setIsLoading(true);
      try {
        const response = await UserImageService.getMyImages(
          category,
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
    },
    [category]
  );

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
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toaster.error({ title: tc('pleaseSelectImageFile') });
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await UserImageService.uploadImage(file, category);
      setGalleryImages((prev) => [uploaded, ...prev]);

      // Auto-select newly uploaded image if within limit
      if (selected.length < maxSelect) {
        setSelected((prev) => [
          ...prev,
          { url: uploaded.url, publicId: uploaded.publicId },
        ]);
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
          <ModalCloseButton />
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
              <SimpleGrid columns={3} gap={3}>
                {galleryImages.map((img) => {
                  const imgSelected = isSelected(img);
                  const isDisabled =
                    !imgSelected && selected.length >= maxSelect;
                  return (
                    <Box
                      key={img.id}
                      position="relative"
                      cursor={isDisabled ? 'not-allowed' : 'pointer'}
                      opacity={isDisabled ? 0.5 : 1}
                      borderRadius="md"
                      overflow="hidden"
                      borderWidth={imgSelected ? 3 : 1}
                      borderColor={imgSelected ? 'green.500' : 'gray.200'}
                      transition="all 0.2s"
                      role="group"
                      _hover={isDisabled ? {} : { borderColor: 'green.300' }}
                      onClick={() => !isDisabled && handleToggleSelect(img)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.originalName || 'Gallery image'}
                        style={{
                          width: '100%',
                          height: '100px',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />

                      {/* Selected checkmark — always visible when selected */}
                      {imgSelected && (
                        <Flex
                          position="absolute"
                          top={1}
                          right={1}
                          bg="green.500"
                          borderRadius="full"
                          p={1}
                        >
                          <Check size={12} color="white" />
                        </Flex>
                      )}

                      {/* Preview (expand) button — appears on hover */}
                      <Box
                        position="absolute"
                        top={1}
                        left={1}
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.15s"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(img.url);
                        }}
                        cursor="pointer"
                        bg="blackAlpha.700"
                        borderRadius="full"
                        p={1}
                        _hover={{ bg: 'blackAlpha.900' }}
                      >
                        <Expand size={12} color="white" />
                      </Box>

                      {/* Delete button — appears on hover */}
                      <Box
                        position="absolute"
                        bottom={1}
                        right={1}
                        opacity={0}
                        _groupHover={{ opacity: 1 }}
                        transition="opacity 0.15s"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(t('deleteImageConfirm'))) {
                            handleDeleteImage(img);
                          }
                        }}
                        cursor="pointer"
                        bg="red.500"
                        borderRadius="full"
                        p={1}
                        _hover={{ bg: 'red.600' }}
                      >
                        <Trash2 size={12} color="white" />
                      </Box>

                      {img.format && (
                        <Badge
                          position="absolute"
                          bottom={1}
                          left={1}
                          fontSize="2xs"
                          colorPalette="gray"
                        >
                          {img.format.toUpperCase()}
                        </Badge>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
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

      {/* Fullscreen image preview lightbox */}
      {previewUrl && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1400}
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
              maxWidth: '90vw',
              maxHeight: '90vh',
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
    </>
  );
};

export default AppImageGalleryPicker;
