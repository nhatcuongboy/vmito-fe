'use client';

import { useEffect, useState } from 'react';
import { Textarea, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import { Field } from '@/components/ui/Field';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { VenueRequestService } from '@/lib/api/venue-request.service';
import { EImageCategory, VenueRequestType } from '@/lib/api/types';

interface VenueImageRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  onSubmitted?: () => void;
}

export default function VenueImageRequestModal({
  isOpen,
  onClose,
  venueId,
  onSubmitted,
}: VenueImageRequestModalProps) {
  const t = useTranslations('venueRequests');
  const [images, setImages] = useState<ISessionImage[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setImages([]);
    setBannerIndex(0);
    setNote('');
  }, [isOpen]);

  const handleSubmit = async () => {
    if (images.length === 0) {
      toaster.error({ title: t('imageRequired') });
      return;
    }

    try {
      setIsSubmitting(true);
      await VenueRequestService.create({
        type: VenueRequestType.IMAGE_CORRECTION,
        venueId,
        payload: {
          suggestedImages: images.map((image) => ({
            url: image.url,
            publicId: image.publicId,
          })),
          note: note.trim() || undefined,
        },
      });
      toaster.success({ title: t('submitSuccess') });
      onSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Failed to submit image correction:', error);
      toaster.error({ title: t('submitError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('imageTitle')}
      description={t('imageDescription')}
      size="lg"
      maxBodyHeight={{ base: '70vh', md: '75vh' }}
      primaryActionText={t('submitUpdate')}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={images.length === 0}
      secondaryActionText={t('cancel')}
    >
      <VStack align="stretch" gap={4}>
        <Field label={t('fields.suggestedImages')} required>
          <AppMultiImageUpload
            images={images}
            bannerIndex={bannerIndex}
            onImagesChange={setImages}
            onBannerChange={setBannerIndex}
            maxImages={10}
            category={EImageCategory.OTHER}
            label={null}
          />
        </Field>

        <Field label={t('fields.note')}>
          <Textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('placeholders.imageNote')}
          />
        </Field>
      </VStack>
    </VModal>
  );
}
