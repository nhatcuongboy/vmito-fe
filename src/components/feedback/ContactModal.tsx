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
  Image,
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

const FacebookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const MessengerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.371 0 0 5.007 0 11.184c0 3.517 1.798 6.61 4.578 8.628V24l4.248-2.331c1.073.288 2.198.451 3.174.451 6.629 0 12-5.007 12-11.184C24 5.007 18.629 0 12 0zm1.191 15.093l-3.055-3.26-5.963 3.26L10.732 8l3.13 3.259L19.752 8l-6.561 7.093z" />
  </svg>
);

/** A labeled contact detail with a colored icon badge — phone / email / fanpage. */
const InfoRow = ({
  icon,
  iconBg,
  href,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  href: string;
  children: React.ReactNode;
}) => (
  <HStack gap={2.5}>
    <Box
      flexShrink={0}
      w="24px"
      h="24px"
      borderRadius="full"
      bg={iconBg}
      color="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {icon}
    </Box>
    <Link
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      fontSize="sm"
      color="fg.default"
      _hover={{ color: 'green.600', textDecoration: 'underline' }}
    >
      {children}
    </Link>
  </HStack>
);

/** A prominent brand-colored CTA button — Zalo / Messenger. */
const ContactCta = ({
  href,
  bg,
  hoverBg,
  icon,
  label,
}: {
  href: string;
  bg: string;
  hoverBg: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    flex={1}
    display="flex"
    alignItems="center"
    justifyContent="center"
    gap={2}
    bg={bg}
    color="white"
    fontWeight="semibold"
    fontSize="sm"
    borderRadius="lg"
    py={2.5}
    boxShadow="sm"
    _hover={{ bg: hoverBg, textDecoration: 'none' }}
  >
    {icon}
    {label}
  </Link>
);

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
        borderRadius="lg"
        p={3}
        mb={3}
      >
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          Tác giả: Nhật Cường
        </Text>

        <VStack align="stretch" gap={1.5}>
          <InfoRow
            icon={<Phone size={13} />}
            iconBg="green.500"
            href="tel:0914810765"
          >
            0914810765
          </InfoRow>
          <InfoRow
            icon={<Mail size={13} />}
            iconBg="green.500"
            href="mailto:admin@vmito.com"
          >
            admin@vmito.com
          </InfoRow>
          <InfoRow
            icon={<FacebookIcon />}
            iconBg="#1877F2"
            href="https://www.facebook.com/vmitovn"
          >
            Fanpage
          </InfoRow>
        </VStack>

        <Separator my={2.5} />

        {/* Prominent Zalo / Messenger CTAs — fastest way to reach us */}
        <HStack gap={2}>
          <ContactCta
            href="https://zalo.me/84914810765"
            bg="#0068FF"
            hoverBg="#0055D4"
            label="Zalo"
            icon={<Image src="/icons/zalo-32.png" alt="Zalo" boxSize="18px" />}
          />
          <ContactCta
            href="https://m.me/vmitovn"
            bg="#0084FF"
            hoverBg="#006FD6"
            label="Messenger"
            icon={<MessengerIcon />}
          />
        </HStack>
      </Box>

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
