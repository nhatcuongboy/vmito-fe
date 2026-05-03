'use client';

import { useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Image as ChakraImage,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Plus, X, Star, GripVertical, Image as ImageIcon } from 'lucide-react';
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
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

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

  return (
    <Box>
      {label !== null && (
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" fontWeight="medium">
            {label || t('sessionImages')}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {t('maxImages', { max: maxImages })} — {images.length}/{maxImages}
          </Text>
        </Flex>
      )}

      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.publicId)}
            strategy={rectSortingStrategy}
          >
            <Flex wrap="wrap" gap={3} mb={3}>
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
            </Flex>
          </SortableContext>
        </DndContext>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          height="150px"
          borderWidth={2}
          borderStyle="dashed"
          borderColor="gray.300"
          borderRadius="lg"
          bg="gray.50"
          _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
          mb={3}
        >
          <ImageIcon size={40} color="gray" />
          <Text mt={2} color="gray.500" fontSize="sm">
            {t('noImagesYet')}
          </Text>
        </Flex>
      )}

      {images.length > 1 && !disabled && (
        <Text fontSize="xs" color="gray.400" mb={2}>
          {t('dragToReorder')}
        </Text>
      )}

      {!disabled && images.length < maxImages && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          colorPalette="green"
          onClick={() => setIsGalleryOpen(true)}
          disabled={isUploading}
          leftIcon={<Plus size={16} />}
        >
          {t('addImages')}
        </Button>
      )}

      <AppImageGalleryPicker
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
        selectedImages={images}
        maxSelect={maxImages}
        category={category}
      />
    </Box>
  );
};

export default AppMultiImageUpload;
