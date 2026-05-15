'use client';

import { useRef, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Image as ChakraImage,
  Badge,
  IconButton,
  Spinner,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { ImagePlus, Plus, X, Star, GripVertical, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext as SortableContextBase,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppImageGalleryPicker from '@/components/AppImageGalleryPicker';
import { EImageCategory } from '@/lib/api/types';
import { UserImageService } from '@/lib/api/user-image.service';
import { compressImage } from '@/lib/utils/image';
import { toaster } from '@/components/ui/toaster';

// Workaround for @dnd-kit type incompatibility with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SortableContext = SortableContextBase as any;

export interface ISessionImage {
  url: string;
  publicId: string;
}

interface IAppMultiImageUploadProps {
  images: ISessionImage[];
  bannerIndex: number;
  onImagesChange: (images: ISessionImage[]) => void;
  onBannerChange: (index: number) => void;
  disabled?: boolean;
  isUploading?: boolean;
  maxImages?: number;
  category?: EImageCategory;
  label?: string | null;
}

const SortableImageItem = ({
  image,
  index,
  isBanner,
  onRemove,
  onSetBanner,
  disabled,
  t,
}: {
  image: ISessionImage;
  index: number;
  isBanner: boolean;
  onRemove: (index: number) => void;
  onSetBanner: (index: number) => void;
  disabled?: boolean;
  t: ReturnType<typeof useTranslations>;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.publicId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      position="relative"
      borderRadius="lg"
      overflow="hidden"
      borderWidth={isBanner ? 3 : 1}
      borderColor={isBanner ? 'green.500' : 'gray.200'}
      _dark={{ borderColor: isBanner ? 'green.400' : 'gray.600' }}
      w={{ base: 'calc(50% - 6px)', sm: '120px' }}
      flexShrink={0}
    >
      <ChakraImage
        src={image.url}
        alt={`Session image ${index + 1}`}
        width="100%"
        height="120px"
        objectFit="cover"
      />

      {/* Drag handle */}
      {!disabled && (
        <Box
          position="absolute"
          top={1}
          left={1}
          bg="blackAlpha.600"
          borderRadius="md"
          p={0.5}
          cursor="grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} color="white" />
        </Box>
      )}

      {/* Banner badge */}
      {isBanner && (
        <Badge
          position="absolute"
          top={1}
          left={1}
          ml={7}
          colorPalette="green"
          fontSize="2xs"
        >
          <Star size={10} /> {t('currentBanner')}
        </Badge>
      )}

      {/* Actions */}
      {!disabled && (
        <Flex position="absolute" bottom={1} right={1} gap={1}>
          {!isBanner && (
            <IconButton
              aria-label={t('setAsBanner')}
              size="2xs"
              variant="solid"
              colorPalette="green"
              onClick={() => onSetBanner(index)}
              title={t('setAsBanner')}
              type="button"
            >
              <Star size={12} />
            </IconButton>
          )}
          <IconButton
            aria-label={t('removeImage')}
            size="2xs"
            variant="solid"
            colorPalette="red"
            onClick={() => onRemove(index)}
            type="button"
          >
            <X size={12} />
          </IconButton>
        </Flex>
      )}
    </Box>
  );
};

const AppMultiImageUpload = ({
  images,
  bannerIndex,
  onImagesChange,
  onBannerChange,
  disabled = false,
  isUploading = false,
  maxImages = 5,
  category = EImageCategory.SESSION_COVER,
  label,
}: IAppMultiImageUploadProps) => {
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusy = disabled || isUploading || isDirectUploading;
  const hasImages = images.length > 0;
  const canAddImages = !disabled && images.length < maxImages;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.publicId === active.id);
    const newIndex = images.findIndex((img) => img.publicId === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newImages = arrayMove(images, oldIndex, newIndex);
    onImagesChange(newImages);

    // Update banner index if the banner was moved
    if (bannerIndex === oldIndex) {
      onBannerChange(newIndex);
    } else if (bannerIndex === newIndex) {
      onBannerChange(oldIndex);
    } else if (
      (bannerIndex > oldIndex && bannerIndex <= newIndex) ||
      (bannerIndex < oldIndex && bannerIndex >= newIndex)
    ) {
      // Banner between old and new position shifts
      const newBannerIndex = images.findIndex(
        (img) => img.publicId === images[bannerIndex].publicId
      );
      const adjustedBanner = newImages.findIndex(
        (img) => img.publicId === images[bannerIndex].publicId
      );
      if (adjustedBanner !== -1) onBannerChange(adjustedBanner);
      else onBannerChange(newBannerIndex);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Adjust banner index
    if (newImages.length === 0) {
      onBannerChange(0);
    } else if (index === bannerIndex) {
      onBannerChange(0);
    } else if (index < bannerIndex) {
      onBannerChange(bannerIndex - 1);
    }
  };

  const handleSetBanner = (index: number) => {
    onBannerChange(index);
  };

  const handleGallerySelect = (
    selectedImages: { url: string; publicId: string }[]
  ) => {
    onImagesChange(selectedImages);
    // Keep banner at 0 if current banner was removed
    if (bannerIndex >= selectedImages.length) {
      onBannerChange(0);
    }
  };

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
  };

  const handleUploadFiles = async (incomingFiles: File[]) => {
    if (isBusy || incomingFiles.length === 0) return;

    const imageFiles = incomingFiles.filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toaster.error({ title: tc('pleaseSelectImageFile') });
      return;
    }

    const availableSlots = Math.max(0, maxImages - images.length);
    if (availableSlots === 0) {
      toaster.error({ title: tc('tooManyFiles', { max: maxImages }) });
      return;
    }

    const filesToUpload = imageFiles.slice(0, availableSlots);
    if (filesToUpload.length < imageFiles.length) {
      toaster.error({ title: tc('tooManyFiles', { max: maxImages }) });
    }

    setIsDirectUploading(true);
    try {
      const uploadedImages = await Promise.all(
        filesToUpload.map(async (file) => {
          const compressedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
          });

          return await UserImageService.uploadImage(compressedFile, category);
        })
      );

      onImagesChange([
        ...images,
        ...uploadedImages.map((img) => ({
          url: img.url,
          publicId: img.publicId,
        })),
      ]);
    } catch {
      toaster.error({ title: tc('imageProcessingFailed') });
    } finally {
      setIsDirectUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    await handleUploadFiles(files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (isBusy) return;
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
    if (isBusy) return;
    event.preventDefault();
    setIsDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer.files ?? []);
    await handleUploadFiles(droppedFiles);
  };

  return (
    <Box w="full" maxW="full" minW={0} overflowX="clip">
      {label !== null && (
        <Flex justify="space-between" align="center" mb={2} w="full">
          <Text fontSize="sm" fontWeight="medium">
            {label || t('sessionImages')}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {t('maxImages', { max: maxImages })} — {images.length}/{maxImages}
          </Text>
        </Flex>
      )}

      <Box w="full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          disabled={isBusy}
        />

        {hasImages ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.publicId)}
              strategy={rectSortingStrategy}
            >
              <Flex wrap="wrap" gap={3} mb={3} align="stretch">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={image.publicId}
                    image={image}
                    index={index}
                    isBanner={index === bannerIndex}
                    onRemove={handleRemoveImage}
                    onSetBanner={handleSetBanner}
                    disabled={disabled}
                    t={t}
                  />
                ))}

                {canAddImages && (
                  <Flex
                    as="button"
                    {...({ type: 'button', disabled: isBusy } as object)}
                    direction="column"
                    align="center"
                    justify="center"
                    gap={2}
                    w={{ base: 'calc(50% - 6px)', sm: '120px' }}
                    h="126px"
                    flexShrink={0}
                    borderWidth={1}
                    borderStyle="dashed"
                    borderColor="green.300"
                    borderRadius="lg"
                    bg="green.50"
                    color="green.700"
                    cursor={isBusy ? 'not-allowed' : 'pointer'}
                    opacity={isBusy ? 0.6 : 1}
                    transition="all 0.2s"
                    _hover={
                      isBusy
                        ? undefined
                        : { bg: 'green.100', borderColor: 'green.500' }
                    }
                    _dark={{
                      bg: 'green.950',
                      color: 'green.200',
                      borderColor: 'green.700',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t('addImages')}
                  >
                    {isDirectUploading ? (
                      <Spinner size="sm" />
                    ) : (
                      <ImagePlus size={24} />
                    )}
                    <Text fontSize="xs" fontWeight="semibold">
                      {isDirectUploading ? tc('uploading') : t('uploadNew')}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </SortableContext>
          </DndContext>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            w="full"
            maxW="full"
            minW={0}
            boxSizing="border-box"
            minH={{ base: '150px', md: '180px' }}
            borderWidth={2}
            borderStyle="dashed"
            borderColor={isDragActive ? 'green.400' : 'gray.300'}
            borderRadius="xl"
            bg={isDragActive ? 'green.50' : 'gray.50'}
            _dark={{
              bg: isDragActive ? 'green.950' : 'gray.800',
              borderColor: isDragActive ? 'green.500' : 'gray.600',
            }}
            mb={3}
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
              <Upload size={24} />
            </Flex>
            <Text color="gray.700" fontSize="sm" fontWeight="semibold">
              {t('noImagesYet')}
            </Text>
            <Text mt={1} color="gray.500" fontSize="sm">
              {t('orDropItHere')}
            </Text>
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              gap={2}
              mt={4}
              w="full"
              maxW="360px"
              justify="center"
            >
              <Button
                type="button"
                size="sm"
                colorPalette="green"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                w={{ base: 'full', sm: 'auto' }}
                leftIcon={
                  isDirectUploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Upload size={16} />
                  )
                }
              >
                {isDirectUploading ? tc('uploading') : t('uploadNew')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                colorPalette="green"
                onClick={handleOpenGallery}
                disabled={isBusy}
                w={{ base: 'full', sm: 'auto' }}
              >
                {t('selectFromGallery')}
              </Button>
            </Flex>
          </Flex>
        )}

        <Flex
          justify="space-between"
          align="center"
          gap={3}
          flexWrap="wrap"
          w="full"
        >
          {images.length > 1 && !disabled ? (
            <Text fontSize="xs" color="gray.400">
              {t('dragToReorder')}
            </Text>
          ) : (
            <Box />
          )}

          {hasImages && canAddImages && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              colorPalette="green"
              onClick={handleOpenGallery}
              disabled={isBusy}
              leftIcon={<Plus size={16} />}
            >
              {t('selectFromGallery')}
            </Button>
          )}
        </Flex>
      </Box>

      <AppImageGalleryPicker
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        onSelect={handleGallerySelect}
        selectedImages={images}
        maxSelect={maxImages}
        category={category}
      />
    </Box>
  );
};

export default AppMultiImageUpload;
