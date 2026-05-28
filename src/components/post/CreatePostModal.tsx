'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Image as ImageIcon, MapPin } from 'lucide-react';
import { Box, Text, Textarea } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { postsService } from '@/lib/api/posts.service';
import LocationAutocomplete from '@/components/common/LocationAutocomplete';
import VModal from '@/components/ui/VModal';
import { Button } from '@/components/ui/chakra-compat';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const t = useTranslations('posts');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imagePreviews = useMemo(
    () =>
      images.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10);
      setImages((prev) => [...prev, ...files].slice(0, 10));
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toaster.create({
        title: t('error'),
        description: t('contentRequired'),
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const post = await postsService.createPost({
        content: content.trim(),
        location: location || undefined,
      });

      if (images.length > 0) {
        await postsService.uploadImages(post.id, images);
      }

      toaster.create({
        title: t('success'),
        description: t('createSuccess'),
        type: 'success',
      });

      setContent('');
      setLocation(null);
      setImages([]);
      onPostCreated?.();
      onClose();
    } catch {
      toaster.create({
        title: t('error'),
        description: t('createError'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createPost')}
      size="lg"
      maxBodyHeight={{ base: '70vh', md: '72vh' }}
      closeButtonAriaLabel={t('closeModal')}
      primaryActionText={t('post')}
      secondaryActionText={t('cancel')}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={!content.trim()}
      isSecondaryDisabled={isSubmitting}
    >
      <Box display="flex" flexDirection="column" gap={4}>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('composerPlaceholder')}
          aria-label={t('contentLabel')}
          minH="120px"
          resize="vertical"
          bg={{ base: 'white', _dark: 'gray.800' }}
        />

        <Box display="flex" flexDirection="column" gap={2}>
          <Text
            as="label"
            display="flex"
            alignItems="center"
            gap={2}
            fontSize="sm"
            fontWeight="medium"
          >
            <MapPin size={16} />
            {t('location')}
          </Text>
          <LocationAutocomplete
            onSelect={(place) => {
              setLocation({
                name: place.name,
                lat: place.lat,
                lng: place.lng,
                address: place.address,
              });
            }}
            placeholder={t('locationPlaceholder')}
          />
          {location && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={3}
              color={{ base: 'gray.600', _dark: 'gray.300' }}
              fontSize="sm"
            >
              <Text lineClamp={1}>{location.name}</Text>
              <Button
                type="button"
                variant="ghost"
                colorPalette="red"
                size="sm"
                onClick={() => setLocation(null)}
              >
                {t('removeLocation')}
              </Button>
            </Box>
          )}
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          <label
            htmlFor="post-images"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <ImageIcon size={16} />
            {t('imagesMax')}
          </label>
          <input
            id="post-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            aria-label={t('addImages')}
          />
          {imagePreviews.length > 0 && (
            <Box
              display="grid"
              gridTemplateColumns={{
                base: 'repeat(3, minmax(0, 1fr))',
                sm: 'repeat(4, minmax(0, 1fr))',
                md: 'repeat(5, minmax(0, 1fr))',
              }}
              gap={2}
            >
              {imagePreviews.map((preview, index) => (
                <Box key={`${preview.file.name}-${index}`} position="relative">
                  <img // eslint-disable-line @next/next/no-img-element
                    src={preview.url}
                    alt={t('imagePreview', { index: index + 1 })}
                    className="h-20 w-full rounded-md object-cover"
                  />
                  <button
                    type="button"
                    aria-label={t('removeImage', { index: index + 1 })}
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X size={12} />
                  </button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </VModal>
  );
}
