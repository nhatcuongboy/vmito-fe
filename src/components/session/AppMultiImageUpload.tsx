'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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
  sortableKeyboardCoordinates,
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

export interface AppMultiImageUploadHandle {
  openFilePicker: () => void;
  openGallery: () => void;
  uploadFiles: (files: File[]) => Promise<void>;
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
  compact?: boolean;
  variant?: 'default' | 'post-preview';
  showBannerControls?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
}

const SortableImageItem = ({
  image,
  index,
  isBanner,
  onRemove,
  onSetBanner,
  disabled,
  t,
  compact,
  variant,
  showBannerControls,
  totalImages,
}: {
  image: ISessionImage;
  index: number;
  isBanner: boolean;
  onRemove: (index: number) => void;
  onSetBanner: (index: number) => void;
  disabled?: boolean;
  t: ReturnType<typeof useTranslations>;
  compact?: boolean;
  variant: 'default' | 'post-preview';
  showBannerControls: boolean;
  totalImages: number;
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

  const isPostPreview = variant === 'post-preview';

  return (
    <Box
      ref={setNodeRef}
      style={style}
      position="relative"
      borderRadius="lg"
      overflow="hidden"
      borderWidth={showBannerControls && isBanner ? 3 : 1}
      borderColor={showBannerControls && isBanner ? 'green.500' : 'gray.200'}
      _dark={{
        borderColor: showBannerControls && isBanner ? 'green.400' : 'gray.600',
      }}
      w={
        isPostPreview
          ? 'full'
          : compact
            ? { base: '72px', sm: '84px' }
            : { base: 'calc(50% - 6px)', sm: '120px' }
      }
      minW={0}
      flexShrink={0}
      bg={{ base: 'gray.100', _dark: 'gray.900' }}
    >
      <ChakraImage
        src={image.url}
        alt={t('imagePreviewAlt', { index: index + 1 })}
        width="100%"
        height={
          isPostPreview
            ? totalImages === 1
              ? { base: '200px', md: '300px' }
              : { base: '140px', md: '190px' }
            : compact
              ? '84px'
              : '120px'
        }
        objectFit={isPostPreview ? 'contain' : 'cover'}
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
          touchAction="none"
          {...attributes}
          {...listeners}
          aria-label={t('reorderImage', { index: index + 1 })}
        >
          <GripVertical size={14} color="white" aria-hidden="true" />
        </Box>
      )}

      {/* Banner badge */}
      {showBannerControls && isBanner && (
        <Badge
          position="absolute"
          top={1}
          left={1}
          ml={7}
          colorPalette="green"
          fontSize="2xs"
        >
          <Star size={10} aria-hidden="true" /> {t('currentBanner')}
        </Badge>
      )}

      {/* Actions */}
      {!disabled && (
        <Flex position="absolute" bottom={1} right={1} gap={1}>
          {showBannerControls && !isBanner && (
            <IconButton
              aria-label={t('setAsBanner')}
              size="2xs"
              variant="solid"
              colorPalette="green"
              onClick={() => onSetBanner(index)}
              title={t('setAsBanner')}
              type="button"
            >
              <Star size={12} aria-hidden="true" />
            </IconButton>
          )}
          <IconButton
            aria-label={t('removeImageAt', { index: index + 1 })}
            size="2xs"
            variant="solid"
            colorPalette="red"
            onClick={() => onRemove(index)}
            type="button"
          >
            <X size={12} aria-hidden="true" />
          </IconButton>
        </Flex>
      )}
    </Box>
  );
};

const AppMultiImageUpload = forwardRef<
  AppMultiImageUploadHandle,
  IAppMultiImageUploadProps
>(function AppMultiImageUpload(
  {
    images,
    bannerIndex,
    onImagesChange,
    onBannerChange,
    disabled = false,
    isUploading = false,
    maxImages = 5,
    category = EImageCategory.SESSION_COVER,
    label,
    compact = false,
    variant = 'default',
    showBannerControls = true,
    onUploadingChange,
  },
  ref
) {
  const t = useTranslations('session');
  const tc = useTranslations('common');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDirectUploading, setIsDirectUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const directUploadingRef = useRef(false);
  const isBusy = disabled || isUploading || isDirectUploading;
  const hasImages = images.length > 0;
  const canAddImages = !disabled && images.length < maxImages;
  const isPostPreview = variant === 'post-preview';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(
    () => () => {
      onUploadingChange?.(false);
    },
    [onUploadingChange]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.publicId === active.id);
    const newIndex = images.findIndex((img) => img.publicId === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newImages = arrayMove(images, oldIndex, newIndex);
    onImagesChange(newImages);

    if (showBannerControls) {
      const bannerPublicId = images[bannerIndex]?.publicId;
      const nextBannerIndex = newImages.findIndex(
        (image) => image.publicId === bannerPublicId
      );
      onBannerChange(nextBannerIndex === -1 ? 0 : nextBannerIndex);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    if (showBannerControls) {
      if (newImages.length === 0 || index === bannerIndex) {
        onBannerChange(0);
      } else if (index < bannerIndex) {
        onBannerChange(bannerIndex - 1);
      }
    }
  };

  const handleSetBanner = (index: number) => {
    onBannerChange(index);
  };

  const handleGallerySelect = (
    selectedImages: { url: string; publicId: string }[]
  ) => {
    onImagesChange(selectedImages);
    if (showBannerControls && bannerIndex >= selectedImages.length) {
      onBannerChange(0);
    }
  };

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
  };

  const handleUploadFiles = useCallback(
    async (incomingFiles: File[]) => {
      if (isBusy || directUploadingRef.current || incomingFiles.length === 0) {
        return;
      }

      const imageFiles = incomingFiles.filter((file) =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length < incomingFiles.length) {
        toaster.error({ title: tc('pleaseSelectImageFile') });
      }

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

      directUploadingRef.current = true;
      setIsDirectUploading(true);
      onUploadingChange?.(true);
      try {
        const uploadResults = await Promise.allSettled(
          filesToUpload.map(async (file) => {
            const compressedFile = await compressImage(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
            });

            return UserImageService.uploadImage(compressedFile, category);
          })
        );

        const uploadedImages = uploadResults.flatMap((result) =>
          result.status === 'fulfilled'
            ? [
                {
                  url: result.value.url,
                  publicId: result.value.publicId,
                },
              ]
            : []
        );

        if (uploadedImages.length > 0) {
          onImagesChange([...images, ...uploadedImages]);
        }

        if (uploadedImages.length < filesToUpload.length) {
          toaster.error({ title: tc('imageProcessingFailed') });
        }
      } finally {
        directUploadingRef.current = false;
        setIsDirectUploading(false);
        onUploadingChange?.(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [category, images, isBusy, maxImages, onImagesChange, onUploadingChange, tc]
  );

  useImperativeHandle(
    ref,
    () => ({
      openFilePicker: () => {
        if (!isBusy) fileInputRef.current?.click();
      },
      openGallery: () => {
        if (!isBusy) setIsGalleryOpen(true);
      },
      uploadFiles: handleUploadFiles,
    }),
    [handleUploadFiles, isBusy]
  );

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
        <Flex
          justify="space-between"
          align="center"
          mb={compact ? 1 : 2}
          w="full"
        >
          <Text fontSize="sm" fontWeight="medium">
            {label || t('sessionImages')}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {images.length}/{maxImages}
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
              <Flex
                display={isPostPreview ? 'grid' : 'flex'}
                gridTemplateColumns={
                  isPostPreview && images.length > 1
                    ? 'repeat(2, minmax(0, 1fr))'
                    : 'minmax(0, 1fr)'
                }
                wrap={isPostPreview ? undefined : 'wrap'}
                gap={isPostPreview ? 2 : 3}
                mb={3}
                align="stretch"
              >
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
                    compact={compact}
                    variant={variant}
                    showBannerControls={showBannerControls}
                    totalImages={images.length}
                  />
                ))}

                {canAddImages && !isPostPreview && (
                  <Flex
                    as="button"
                    {...({ type: 'button', disabled: isBusy } as object)}
                    direction="column"
                    align="center"
                    justify="center"
                    gap={compact ? 1 : 2}
                    w={
                      compact
                        ? { base: '72px', sm: '84px' }
                        : { base: 'calc(50% - 6px)', sm: '120px' }
                    }
                    h={compact ? '90px' : '126px'}
                    flexShrink={0}
                    borderWidth={1}
                    borderStyle="dashed"
                    borderColor="green.300"
                    borderRadius="lg"
                    bg="green.50"
                    color="green.700"
                    cursor={isBusy ? 'not-allowed' : 'pointer'}
                    opacity={isBusy ? 0.6 : 1}
                    transitionProperty="background-color, border-color, color, opacity"
                    transitionDuration="0.2s"
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
                      <ImagePlus size={compact ? 18 : 24} aria-hidden="true" />
                    )}
                    <Text fontSize="xs" fontWeight="semibold">
                      {isDirectUploading ? tc('uploading') : t('uploadNew')}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </SortableContext>
          </DndContext>
        ) : isPostPreview ? null : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            w="full"
            maxW="full"
            minW={0}
            boxSizing="border-box"
            minH={
              compact
                ? { base: '104px', md: '116px' }
                : { base: '150px', md: '180px' }
            }
            borderWidth={2}
            borderStyle="dashed"
            borderColor={isDragActive ? 'green.400' : 'gray.300'}
            borderRadius={compact ? 'lg' : 'xl'}
            bg={isDragActive ? 'green.50' : 'gray.50'}
            _dark={{
              bg: isDragActive ? 'green.950' : 'gray.800',
              borderColor: isDragActive ? 'green.500' : 'gray.600',
            }}
            mb={3}
            px={compact ? 3 : 4}
            py={compact ? 3 : 6}
            textAlign="center"
            transitionProperty="background-color, border-color"
            transitionDuration="0.2s"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Flex
              w={compact ? 9 : 12}
              h={compact ? 9 : 12}
              align="center"
              justify="center"
              borderRadius="full"
              bg={{ base: 'green.100', _dark: 'green.900' }}
              color={{ base: 'green.700', _dark: 'green.200' }}
              mb={compact ? 2 : 3}
            >
              <ImagePlus size={compact ? 18 : 24} aria-hidden="true" />
            </Flex>
            <Text
              color="gray.700"
              _dark={{ color: 'gray.200' }}
              fontSize="sm"
              fontWeight="semibold"
            >
              {t('noImagesYet')}
            </Text>
            {!compact && (
              <Text mt={0.5} color="gray.500" fontSize="xs">
                {t('orDropItHere')}
              </Text>
            )}
            <Flex
              direction="row"
              gap={2}
              mt={compact ? 2 : 4}
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
                w={{ base: 'fit-content', sm: 'auto' }}
                alignSelf="center"
                leftIcon={
                  isDirectUploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <Upload size={16} aria-hidden="true" />
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
                w={{ base: 'fit-content', sm: 'auto' }}
                alignSelf="center"
              >
                {t('selectFromGallery')}
              </Button>
            </Flex>
          </Flex>
        )}

        {(images.length > 1 ||
          (!isPostPreview && hasImages && canAddImages)) && (
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

            {!isPostPreview && hasImages && canAddImages && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                colorPalette="green"
                onClick={handleOpenGallery}
                disabled={isBusy}
                leftIcon={<Plus size={16} aria-hidden="true" />}
              >
                {t('selectFromGallery')}
              </Button>
            )}
          </Flex>
        )}
      </Box>

      <AppImageGalleryPicker
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        onSelect={handleGallerySelect}
        selectedImages={images}
        maxSelect={maxImages}
        category={category}
        zIndex={isPostPreview ? 1700 : undefined}
      />
    </Box>
  );
});

export default AppMultiImageUpload;
