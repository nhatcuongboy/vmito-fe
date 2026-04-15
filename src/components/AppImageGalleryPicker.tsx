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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
} from '@/components/ui/chakra-compat';
import { Upload, Trash2, Check, Image as ImageIcon } from 'lucide-react';
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
  const [tabIndex, setTabIndex] = useState(0);
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
      setTabIndex(0);
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

      // Switch to "My Images" tab to show uploaded image
      setTabIndex(0);
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
    <Modal isOpen={isMounted && isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="80vh">
        <ModalHeader>{t('selectFromGallery')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflow="auto" pb={4}>
          <Tabs index={tabIndex} onChange={setTabIndex}>
            <TabList>
              <Tab>{t('myImages')}</Tab>
              <Tab>{t('uploadNew')}</Tab>
            </TabList>
            <TabPanels>
              {/* My Images Tab */}
              <TabPanel px={0}>
                <Text fontSize="sm" color="gray.500" mb={3}>
                  {t('maxImages', { max: maxSelect })} — {selected.length}/
                  {maxSelect} {tc('selected')}
                </Text>

                {galleryImages.length === 0 && !isLoading ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    py={10}
                  >
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
                          _hover={
                            isDisabled ? {} : { borderColor: 'green.300' }
                          }
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
                          <Box
                            position="absolute"
                            bottom={1}
                            right={1}
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
                              top={1}
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
              </TabPanel>

              {/* Upload New Tab */}
              <TabPanel px={0}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={isUploading}
                />
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  height="200px"
                  borderWidth={2}
                  borderStyle="dashed"
                  borderColor="gray.300"
                  borderRadius="lg"
                  cursor={isUploading ? 'not-allowed' : 'pointer'}
                  onClick={
                    isUploading
                      ? undefined
                      : () => fileInputRef.current?.click()
                  }
                  bg="gray.50"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
                  _hover={
                    isUploading
                      ? {}
                      : { borderColor: 'green.400', bg: 'gray.100' }
                  }
                  transition="all 0.2s"
                >
                  {isUploading ? (
                    <>
                      <Spinner size="lg" />
                      <Text mt={2} color="gray.500">
                        {tc('uploading')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Upload size={48} color="gray" />
                      <Text mt={2} color="gray.500" fontWeight="medium">
                        {tc('clickToUpload')}
                      </Text>
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {t('coverPhotoHint')}
                      </Text>
                    </>
                  )}
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
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
  );
};

export default AppImageGalleryPicker;
