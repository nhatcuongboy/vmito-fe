'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Images, MapPin, X } from 'lucide-react';
import { Box, Flex, IconButton, Text, Textarea } from '@chakra-ui/react';
import { PostAvatar } from '@/components/post/PostAvatar';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { postsService } from '@/lib/api/posts.service';
import LocationAutocomplete from '@/components/common/LocationAutocomplete';
import VModal from '@/components/ui/VModal';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog';
import { Button } from '@/components/ui/chakra-compat';
import AppMultiImageUpload, {
  type AppMultiImageUploadHandle,
  type ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import { EImageCategory } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

type ComposerPanel = 'composer' | 'location';

export function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const t = useTranslations('posts');
  const currentUser = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<{
    name: string;
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [images, setImages] = useState<ISessionImage[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<ComposerPanel>('composer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageUploadRef = useRef<AppMultiImageUploadHandle>(null);

  const authorName = currentUser?.name || currentUser?.email || 'User';
  const selectedImageCount = images.length;
  const hasDraft = content.length > 0 || images.length > 0 || location !== null;

  const resetDraft = useCallback(() => {
    setContent('');
    setLocation(null);
    setImages([]);
    setBannerIndex(0);
    setActivePanel('composer');
    setIsSubmitting(false);
    setIsUploadingImages(false);
    setIsDiscardConfirmOpen(false);
  }, []);

  useLayoutEffect(() => {
    resetDraft();
  }, [isOpen, resetDraft]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isOpen) return;

    textarea.style.height = 'auto';
    const borderHeight = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + borderHeight + 2}px`;
  }, [content, isOpen]);

  const handleSubmit = async () => {
    if (!content.trim() || isUploadingImages) {
      if (isUploadingImages) return;

      toaster.create({
        title: t('error'),
        description: t('contentRequired'),
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await postsService.createPost({
        content: content.trim(),
        location: location || undefined,
        images: images.map((image, index) => ({
          url: normalizeImageUrl(image.url) ?? image.url,
          publicId: image.publicId,
          order: index,
        })),
      });

      resetDraft();
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

  const handleClose = () => {
    if (isDiscardConfirmOpen) return;

    if (hasDraft) {
      setIsDiscardConfirmOpen(true);
      return;
    }

    resetDraft();
    onClose();
  };

  const handleDiscard = () => {
    resetDraft();
    onClose();
  };

  const panelTitle =
    activePanel === 'location' ? t('addLocation') : t('createPost');

  const title =
    activePanel === 'composer' ? (
      panelTitle
    ) : (
      <Flex align="center" gap={2}>
        <IconButton
          aria-label={t('backToPost')}
          type="button"
          size="sm"
          variant="ghost"
          colorPalette="gray"
          onClick={() => setActivePanel('composer')}
        >
          <ArrowLeft size={20} />
        </IconButton>
        <Text as="span" fontSize="inherit" fontWeight="inherit">
          {panelTitle}
        </Text>
      </Flex>
    );

  const footer =
    activePanel === 'composer' ? (
      <Button
        type="button"
        colorPalette="green"
        size="lg"
        w="full"
        borderRadius="xl"
        loading={isSubmitting}
        disabled={!content.trim() || isSubmitting || isUploadingImages}
        onClick={handleSubmit}
      >
        {isUploadingImages ? t('uploadingImages') : t('post')}
      </Button>
    ) : (
      <Button
        type="button"
        colorPalette="green"
        w="full"
        onClick={() => setActivePanel('composer')}
      >
        {t('done')}
      </Button>
    );

  return (
    <>
      <VModal
        isOpen={isOpen}
        onClose={handleClose}
        title={title}
        titleAlign={activePanel === 'composer' ? 'center' : 'left'}
        titleSize="lg"
        size="xl"
        maxBodyHeight={{ base: '72vh', md: '74vh' }}
        closeButtonAriaLabel={t('closeModal')}
        closeButtonVariant="circle"
        showFooterDivider={false}
        footer={footer}
      >
        {activePanel === 'composer' ? (
          <Box display="flex" flexDirection="column" gap={4}>
            <Flex align="center" gap={3}>
              <PostAvatar
                name={authorName}
                image={currentUser?.image}
                size={44}
              />

              <Box minW={0}>
                <Text
                  fontSize="md"
                  fontWeight="semibold"
                  color={{ base: 'gray.900', _dark: 'gray.50' }}
                >
                  {authorName}
                </Text>
              </Box>
            </Flex>

            <Box minH={{ base: '160px', md: '190px' }}>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={(event) => {
                  const clipboardImages = Array.from(
                    event.clipboardData.items
                  ).flatMap((item) => {
                    const file = item.kind === 'file' ? item.getAsFile() : null;
                    return file?.type.startsWith('image/') ? [file] : [];
                  });

                  if (clipboardImages.length > 0) {
                    void imageUploadRef.current?.uploadFiles(clipboardImages);
                  }
                }}
                placeholder={t('composerPlaceholderWithName', {
                  name: authorName,
                })}
                aria-label={t('contentLabel')}
                minH={{ base: '160px', md: '190px' }}
                h="auto"
                overflow="hidden"
                resize="none"
                borderWidth={1}
                borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
                p={4}
                bg="transparent"
                borderRadius="xl"
                fontSize={{ base: 'md', md: 'lg' }}
                lineHeight="1.6"
                whiteSpace="pre-wrap"
                overflowWrap="break-word"
                wordBreak="normal"
                color={{ base: 'gray.900', _dark: 'gray.50' }}
                caretColor={{ base: 'gray.900', _dark: 'gray.50' }}
                _placeholder={{
                  color: { base: 'gray.500', _dark: 'gray.400' },
                }}
                _focusVisible={{
                  boxShadow: 'none',
                  outline: 'none',
                  borderColor: { base: 'green.400', _dark: 'green.500' },
                }}
              />
            </Box>

            <AppMultiImageUpload
              ref={imageUploadRef}
              images={images}
              bannerIndex={bannerIndex}
              onImagesChange={setImages}
              onBannerChange={setBannerIndex}
              onUploadingChange={setIsUploadingImages}
              disabled={isSubmitting}
              maxImages={5}
              category={EImageCategory.OTHER}
              label={null}
              variant="post-preview"
              showBannerControls={false}
            />

            <Flex
              align="center"
              justify="space-between"
              gap={3}
              borderWidth={1}
              borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
              borderRadius="xl"
              bg={{ base: 'white', _dark: 'gray.800' }}
              px={{ base: 3, md: 4 }}
              py={3}
              boxShadow="sm"
            >
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                fontWeight="semibold"
                color={{ base: 'gray.900', _dark: 'gray.50' }}
              >
                {t('addToPost')}
              </Text>

              <Flex align="center" gap={{ base: 1, sm: 2 }}>
                <IconButton
                  aria-label={t('addPhoto')}
                  type="button"
                  size="sm"
                  variant={selectedImageCount > 0 ? 'subtle' : 'ghost'}
                  colorPalette="green"
                  borderRadius="full"
                  disabled={isSubmitting || isUploadingImages}
                  onClick={() => imageUploadRef.current?.openFilePicker()}
                >
                  <ImagePlus size={22} />
                </IconButton>

                <IconButton
                  aria-label={t('selectFromGallery')}
                  type="button"
                  size="sm"
                  variant="ghost"
                  colorPalette="green"
                  borderRadius="full"
                  disabled={isSubmitting || isUploadingImages}
                  onClick={() => imageUploadRef.current?.openGallery()}
                >
                  <Images size={22} />
                </IconButton>

                <IconButton
                  aria-label={t('addLocation')}
                  type="button"
                  size="sm"
                  variant={location ? 'subtle' : 'ghost'}
                  colorPalette="red"
                  borderRadius="full"
                  onClick={() => setActivePanel('location')}
                >
                  <MapPin size={22} />
                </IconButton>
              </Flex>
            </Flex>

            {location && (
              <Flex direction="column" gap={2}>
                <Flex
                  align="center"
                  justify="space-between"
                  gap={3}
                  borderWidth={1}
                  borderColor={{ base: 'green.200', _dark: 'green.800' }}
                  borderRadius="lg"
                  bg={{ base: 'green.50', _dark: 'green.950' }}
                  px={3}
                  py={2}
                >
                  <Flex align="center" gap={2} minW={0}>
                    <MapPin size={16} color="currentColor" />
                    <Box minW={0}>
                      <Text
                        lineClamp={1}
                        fontSize="sm"
                        fontWeight="semibold"
                        color={{ base: 'gray.800', _dark: 'gray.100' }}
                      >
                        {location.name}
                      </Text>
                      {location.address &&
                        location.address !== location.name && (
                          <Text
                            lineClamp={1}
                            fontSize="xs"
                            color={{ base: 'gray.500', _dark: 'gray.400' }}
                          >
                            {location.address}
                          </Text>
                        )}
                    </Box>
                  </Flex>

                  <IconButton
                    aria-label={t('removeLocation')}
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    flexShrink={0}
                    onClick={() => setLocation(null)}
                  >
                    <X size={14} />
                  </IconButton>
                </Flex>
              </Flex>
            )}
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            <LocationAutocomplete
              key={location ? location.name : 'empty-location'}
              onSelect={(place) => {
                setLocation({
                  name: place.name,
                  lat: place.lat,
                  lng: place.lng,
                  address: place.address,
                });
              }}
              placeholder={t('locationPlaceholder')}
              suggestionsPlacement="inline"
              suggestionsMaxH="260px"
            />

            {location && (
              <Flex
                align="center"
                justify="space-between"
                gap={3}
                borderWidth={1}
                borderColor={{ base: 'green.200', _dark: 'green.800' }}
                borderRadius="lg"
                bg={{ base: 'green.50', _dark: 'green.950' }}
                px={3}
                py={2}
              >
                <Flex align="center" gap={2} minW={0}>
                  <MapPin size={16} color="currentColor" />
                  <Box minW={0}>
                    <Text
                      lineClamp={1}
                      fontSize="sm"
                      fontWeight="semibold"
                      color={{ base: 'gray.800', _dark: 'gray.100' }}
                    >
                      {location.name}
                    </Text>
                    {location.address && location.address !== location.name && (
                      <Text
                        lineClamp={1}
                        fontSize="xs"
                        color={{ base: 'gray.500', _dark: 'gray.400' }}
                      >
                        {location.address}
                      </Text>
                    )}
                  </Box>
                </Flex>

                <IconButton
                  aria-label={t('removeLocation')}
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  flexShrink={0}
                  onClick={() => setLocation(null)}
                >
                  <X size={14} />
                </IconButton>
              </Flex>
            )}
          </Box>
        )}
      </VModal>

      <AppConfirmDialog
        isOpen={isDiscardConfirmOpen}
        title={t('discardConfirmTitle')}
        body={t('discardConfirmDescription')}
        confirmLabel={t('discardPost')}
        cancelLabel={t('keepEditing')}
        colorPalette="red"
        onConfirm={handleDiscard}
        onClose={() => setIsDiscardConfirmOpen(false)}
        zIndex={1600}
      />
    </>
  );
}
