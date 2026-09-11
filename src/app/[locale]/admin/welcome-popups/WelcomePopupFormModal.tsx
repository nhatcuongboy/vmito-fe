'use client';

import { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HStack, Input, Textarea, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

import { Field } from '@/components/ui/Field';
import { VModal } from '@/components/ui/VModal';
import { VSwitch } from '@/components/ui/VSwitch';
import ImageUploader from '@/components/cloudinary/ImageUploader';
import { toaster } from '@/components/ui/toaster';
import { compressImage } from '@/lib/utils/image';
import { WelcomePopupService } from '@/lib/api/welcome-popup.service';
import { IWelcomePopup } from '@/lib/api/types';

const schema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(1000),
    imageUrl: z.string().optional(),
    imagePublicId: z.string().optional(),
    ctaLabel: z.string().max(50).optional(),
    ctaUrl: z.string().optional(),
    isActive: z.boolean(),
    displayOrder: z.coerce.number().int(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine((v) => !!v.ctaLabel === !!v.ctaUrl, {
    message: 'ctaBothRequired',
    path: ['ctaUrl'],
  })
  .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
    message: 'endDateAfterStart',
    path: ['endDate'],
  });

type TFormData = z.infer<typeof schema>;

interface WelcomePopupFormModalProps {
  isOpen: boolean;
  popup: IWelcomePopup | null;
  onClose: () => void;
  onSaved: (popup: IWelcomePopup) => void;
}

const toFormValues = (popup: IWelcomePopup | null): TFormData => ({
  title: popup?.title ?? '',
  description: popup?.description ?? '',
  imageUrl: popup?.imageUrl ?? undefined,
  imagePublicId: popup?.imagePublicId ?? undefined,
  ctaLabel: popup?.ctaLabel ?? undefined,
  ctaUrl: popup?.ctaUrl ?? undefined,
  isActive: popup?.isActive ?? true,
  displayOrder: popup?.displayOrder ?? 0,
  startDate: popup?.startDate ? popup.startDate.slice(0, 10) : undefined,
  endDate: popup?.endDate ? popup.endDate.slice(0, 10) : undefined,
});

export default function WelcomePopupFormModal({
  isOpen,
  popup,
  onClose,
  onSaved,
}: WelcomePopupFormModalProps) {
  const t = useTranslations('welcomePopup.admin.form');
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TFormData>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(popup),
  });

  useEffect(() => {
    if (isOpen) reset(toFormValues(popup));
  }, [isOpen, popup, reset]);

  const handleUploadImage = useCallback(
    async (file: File): Promise<string> => {
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });
      const result = await WelcomePopupService.uploadBanner(compressedFile);
      setValue('imagePublicId', result.publicId);
      return result.url;
    },
    [setValue]
  );

  const onSubmit = async (data: TFormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        ctaLabel: data.ctaLabel || undefined,
        ctaUrl: data.ctaUrl || undefined,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      };
      const saved = popup
        ? await WelcomePopupService.update(popup.id, payload)
        : await WelcomePopupService.create(payload);
      toaster.success({
        title: popup ? t('updateSuccess') : t('createSuccess'),
      });
      onSaved(saved);
    } catch (error) {
      console.error('Failed to save welcome popup:', error);
      toaster.error({ title: t('saveError') });
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={popup ? t('editTitle') : t('createTitle')}
      size="lg"
      primaryActionText={t('save')}
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryLoading={isSubmitting}
    >
      <VStack gap={4} align="stretch">
        <Field label={t('titleLabel')} errorText={errors.title?.message}>
          <Input {...register('title')} maxLength={200} />
        </Field>

        <Field
          label={t('descriptionLabel')}
          errorText={errors.description?.message}
        >
          <Textarea {...register('description')} rows={4} maxLength={1000} />
        </Field>

        <Field label={t('imageLabel')} optionalText={t('optional')}>
          <ImageUploader
            value={watch('imageUrl')}
            onChange={(url) => {
              setValue('imageUrl', url || undefined);
              if (!url) setValue('imagePublicId', undefined);
            }}
            onUpload={handleUploadImage}
            maxWidth={400}
            maxHeight={220}
          />
        </Field>

        <HStack gap={3} align="start">
          <Field
            label={t('ctaLabelLabel')}
            errorText={errors.ctaLabel?.message}
            optionalText={t('optional')}
          >
            <Input {...register('ctaLabel')} maxLength={50} />
          </Field>
          <Field
            label={t('ctaUrlLabel')}
            errorText={
              errors.ctaUrl?.message && t(errors.ctaUrl.message as string)
            }
            optionalText={t('optional')}
          >
            <Input {...register('ctaUrl')} placeholder="/tournaments/..." />
          </Field>
        </HStack>

        <HStack gap={6} align="start">
          <Field
            label={t('displayOrderLabel')}
            helperText={t('displayOrderHelp')}
          >
            <Input type="number" {...register('displayOrder')} w="120px" />
          </Field>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <VSwitch
                mt={7}
                checked={field.value}
                onCheckedChange={(details) => field.onChange(details.checked)}
                label={t('isActiveLabel')}
                colorPalette="green"
              />
            )}
          />
        </HStack>

        <HStack gap={3} align="start">
          <Field label={t('startDateLabel')} optionalText={t('optional')}>
            <Input type="date" {...register('startDate')} />
          </Field>
          <Field
            label={t('endDateLabel')}
            optionalText={t('optional')}
            errorText={
              errors.endDate?.message && t(errors.endDate.message as string)
            }
          >
            <Input type="date" {...register('endDate')} />
          </Field>
        </HStack>
      </VStack>
    </VModal>
  );
}
