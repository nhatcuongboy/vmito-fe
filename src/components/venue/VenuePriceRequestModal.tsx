'use client';

import { useEffect, useState } from 'react';
import { Text, Textarea, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';
import { Field } from '@/components/ui/Field';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { VenueRequestService } from '@/lib/api/venue-request.service';
import { EImageCategory, VenueRequestType } from '@/lib/api/types';

interface VenuePriceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  onSubmitted?: () => void;
}

export default function VenuePriceRequestModal({
  isOpen,
  onClose,
  venueId,
  onSubmitted,
}: VenuePriceRequestModalProps) {
  const t = useTranslations('venueRequests');
  const [priceImageUrl, setPriceImageUrl] = useState('');
  const [priceImagePublicId, setPriceImagePublicId] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPriceImageUrl('');
    setPriceImagePublicId('');
    setNote('');
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!priceImageUrl) {
      toaster.error({ title: t('priceImageRequired') });
      return;
    }

    try {
      setIsSubmitting(true);
      await VenueRequestService.create({
        type: VenueRequestType.PRICE_CORRECTION,
        venueId,
        payload: {
          priceImageUrl,
          priceImagePublicId: priceImagePublicId || undefined,
          note: note.trim() || undefined,
        },
      });
      toaster.success({ title: t('submitSuccess') });
      onSubmitted?.();
      onClose();
    } catch (error) {
      console.error('Failed to submit price correction:', error);
      toaster.error({ title: t('submitError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('priceTitle')}
      description={t('priceDescription')}
      size="lg"
      maxBodyHeight={{ base: '70vh', md: '75vh' }}
      primaryActionText={t('submitUpdate')}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={!priceImageUrl}
      secondaryActionText={t('cancel')}
    >
      <VStack align="stretch" gap={4}>
        <Field label={t('fields.priceImage')} required>
          <AppSingleImageUpload
            value={priceImageUrl}
            publicId={priceImagePublicId}
            category={EImageCategory.OTHER}
            alt={t('fields.priceImage')}
            onChange={(image) => {
              setPriceImageUrl(image.url);
              setPriceImagePublicId(image.publicId ?? '');
            }}
            onClear={() => {
              setPriceImageUrl('');
              setPriceImagePublicId('');
            }}
          />
        </Field>
        <Text fontSize="sm" color="gray.500">
          {t('priceHint')}
        </Text>

        <Field label={t('fields.note')}>
          <Textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('placeholders.priceNote')}
          />
        </Field>
      </VStack>
    </VModal>
  );
}
