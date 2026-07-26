'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Field,
  Input,
  Textarea,
  VStack,
  Box,
  Text,
  HStack,
  Link,
  Separator,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Phone, Mail } from 'lucide-react';
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
      {/* Contact info */}
      <Box
        bg="gray.50"
        _dark={{ bg: 'gray.800' }}
        borderRadius="md"
        p={3}
        mb={4}
      >
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          Tác giả: Nhật Cường
        </Text>
        <VStack align="stretch" gap={1.5}>
          <HStack gap={2} fontSize="sm" color="fg.muted">
            <Phone size={14} />
            <Link
              href="tel:0914810765"
              color="green.600"
              _hover={{ textDecoration: 'underline' }}
            >
              0914810765
            </Link>
          </HStack>
          <HStack gap={2} fontSize="sm" color="fg.muted">
            <Mail size={14} />
            <Link
              href="mailto:nhatcuongboy@gmail.com"
              color="green.600"
              _hover={{ textDecoration: 'underline' }}
            >
              nhatcuongboy@gmail.com
            </Link>
          </HStack>
          <HStack gap={2} fontSize="sm" color="fg.muted">
            {/* Facebook icon */}
            <Box flexShrink={0} color="#1877F2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </Box>
            <Link
              href="https://www.facebook.com/profile.php?id=61592222922510"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.600"
              _hover={{ textDecoration: 'underline' }}
            >
              Fanpage
            </Link>
          </HStack>
          <HStack gap={2} fontSize="sm" color="fg.muted">
            {/* Zalo icon */}
            <Box flexShrink={0} color="#0068FF">
              <svg
                width="14"
                height="14"
                viewBox="0 0 48 48"
                fill="currentColor"
              >
                <path d="M24 4C12.954 4 4 12.954 4 24c0 4.357 1.34 8.404 3.627 11.748L4 44l8.573-3.556A19.93 19.93 0 0 0 24 44c11.046 0 20-8.954 20-20S35.046 4 24 4zm-6.5 13h2.25v7.5c.69-.84 1.71-1.5 3-1.5 2.485 0 4.25 2.015 4.25 5s-1.765 5-4.25 5c-1.29 0-2.31-.66-3-1.5V33H17.5V17zm10.75 4.75c0-1.52-.91-2.75-2.25-2.75s-2.25 1.23-2.25 2.75V28c0 1.52.91 2.75 2.25 2.75s2.25-1.23 2.25-2.75v-6.25z" />
              </svg>
            </Box>
            <Link
              href="https://zalo.me/84914810765"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.600"
              _hover={{ textDecoration: 'underline' }}
            >
              Zalo
            </Link>
          </HStack>
        </VStack>
      </Box>

      <Separator mb={4} />

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
