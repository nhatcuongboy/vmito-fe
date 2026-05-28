'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, Field, Input, Textarea, VStack, Image } from '@chakra-ui/react';
import { Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { FeedbackService } from '@/lib/api/feedback.service';
import { EFeedbackType } from '@/types/feedback';

const bugReportSchema = z.object({
  title: z.string().min(1, 'required').max(200),
  description: z.string().min(1, 'required').max(5000),
});

type TBugReportForm = z.infer<typeof bugReportSchema>;

interface IBugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BugReportModal = ({ isOpen, onClose }: IBugReportModalProps) => {
  const t = useTranslations('feedback');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    imageUrl: string;
    imagePublicId: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TBugReportForm>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: { title: '', description: '' },
  });

  const handleClose = () => {
    reset();
    setUploadedImage(null);
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await FeedbackService.uploadImage(file);
      setUploadedImage(result);
    } catch {
      toaster.error({ title: t('errorTitle') });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: TBugReportForm) => {
    try {
      await FeedbackService.create({
        type: EFeedbackType.BUG_REPORT,
        title: data.title,
        description: data.description,
        ...(uploadedImage
          ? {
              imageUrl: uploadedImage.imageUrl,
              imagePublicId: uploadedImage.imagePublicId,
            }
          : {}),
      });
      toaster.success({
        title: t('successTitle'),
        description: t('successMessage'),
      });
      reset();
      setUploadedImage(null);
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
      title={t('bugReportTab')}
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
              placeholder={t('descriptionPlaceholder')}
              rows={5}
              {...register('description')}
            />
            {errors.description && (
              <Field.ErrorText>{errors.description.message}</Field.ErrorText>
            )}
          </Field.Root>

          {/* Screenshot Upload */}
          <Field.Root>
            <Field.Label>{t('screenshot')}</Field.Label>
            {uploadedImage ? (
              <Box position="relative" display="inline-block">
                <Image
                  src={uploadedImage.imageUrl}
                  alt="Screenshot"
                  maxH="200px"
                  borderRadius="md"
                />
                <Button
                  size="xs"
                  colorPalette="red"
                  position="absolute"
                  top={1}
                  right={1}
                  onClick={() => setUploadedImage(null)}
                >
                  <X size={14} />
                </Button>
              </Box>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  loading={isUploading}
                >
                  <Upload size={16} />
                  {t('uploadImage')}
                </Button>
              </>
            )}
          </Field.Root>
        </VStack>
      </form>
    </VModal>
  );
};

export default BugReportModal;
