'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Field, Input, Textarea, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { VModal } from '@/components/ui/VModal';
import { FeedbackService } from '@/lib/api/feedback.service';
import { EFeedbackType } from '@/types/feedback';

const contactSchema = z.object({
  title: z.string().min(1, 'required').max(200),
  description: z.string().min(1, 'required').max(5000),
});

type TContactForm = z.infer<typeof contactSchema>;

interface IContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal = ({ isOpen, onClose }: IContactModalProps) => {
  const t = useTranslations('feedback');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { title: '', description: '' },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: TContactForm) => {
    try {
      await FeedbackService.create({
        type: EFeedbackType.CONTACT,
        title: data.title,
        description: data.description,
      });
      toaster.success({
        title: t('successTitle'),
        description: t('successMessage'),
      });
      reset();
      onClose();
    } catch {
      toaster.error({
        title: t('errorTitle'),
        description: t('errorMessage'),
      });
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('contactTab')}
      primaryActionText={t('submit')}
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryLoading={isSubmitting}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack gap={4} align="stretch">
          <Field.Root invalid={!!errors.title}>
            <Field.Label>{t('title')}</Field.Label>
            <Input placeholder={t('titlePlaceholder')} {...register('title')} />
            {errors.title && (
              <Field.ErrorText>{errors.title.message}</Field.ErrorText>
            )}
          </Field.Root>

          <Field.Root invalid={!!errors.description}>
            <Field.Label>{t('description')}</Field.Label>
            <Textarea
              placeholder={t('contactDescPlaceholder')}
              rows={5}
              {...register('description')}
            />
            {errors.description && (
              <Field.ErrorText>{errors.description.message}</Field.ErrorText>
            )}
          </Field.Root>
        </VStack>
      </form>
    </VModal>
  );
};

export default ContactModal;
