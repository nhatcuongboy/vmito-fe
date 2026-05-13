'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Flex,
  Heading,
  Tabs,
  Field,
  Input,
  Textarea,
  Button,
  VStack,
  Text,
  Image,
  Badge,
  Stack,
  Card,
} from '@chakra-ui/react';
import { MessageCircle, Bug, Upload, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';
import { FeedbackService } from '@/lib/api/feedback.service';
import { EFeedbackType, EFeedbackStatus } from '@/types/feedback';
import type { IFeedback } from '@/types/feedback';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import { useEffect } from 'react';

const contactSchema = z.object({
  title: z.string().min(1, 'required').max(200),
  description: z.string().min(1, 'required').max(5000),
});

const bugReportSchema = z.object({
  title: z.string().min(1, 'required').max(200),
  description: z.string().min(1, 'required').max(5000),
});

type TContactForm = z.infer<typeof contactSchema>;
type TBugReportForm = z.infer<typeof bugReportSchema>;

const STATUS_COLOR_MAP: Record<EFeedbackStatus, string> = {
  [EFeedbackStatus.PENDING]: 'yellow',
  [EFeedbackStatus.IN_PROGRESS]: 'blue',
  [EFeedbackStatus.RESOLVED]: 'green',
  [EFeedbackStatus.CLOSED]: 'gray',
};

const FeedbackClient = () => {
  const t = useTranslations('feedback');
  const { user } = useAuthStore();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    imageUrl: string;
    imagePublicId: string;
  } | null>(null);
  const [myFeedback, setMyFeedback] = useState<IFeedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contactForm = useForm<TContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { title: '', description: '' },
  });

  const bugForm = useForm<TBugReportForm>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: { title: '', description: '' },
  });

  useEffect(() => {
    if (!user) {
      router.push(ROUTES.AUTH.SIGNIN);
      return;
    }
    loadMyFeedback();
  }, [user]);

  const loadMyFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const data = await FeedbackService.getMyFeedback();
      setMyFeedback(data);
    } catch {
      // Silently fail
    } finally {
      setIsLoadingFeedback(false);
    }
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

  const handleRemoveImage = () => {
    setUploadedImage(null);
  };

  const handleContactSubmit = async (data: TContactForm) => {
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
      contactForm.reset();
      loadMyFeedback();
    } catch {
      toaster.error({
        title: t('errorTitle'),
        description: t('errorMessage'),
      });
    }
  };

  const handleBugSubmit = async (data: TBugReportForm) => {
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
      bugForm.reset();
      setUploadedImage(null);
      loadMyFeedback();
    } catch {
      toaster.error({
        title: t('errorTitle'),
        description: t('errorMessage'),
      });
    }
  };

  if (!user) return null;

  return (
    <Box maxW="720px" mx="auto" px={4} py={6}>
      <Heading size="lg" mb={6}>
        {t('pageTitle')}
      </Heading>

      <Tabs.Root defaultValue="contact">
        <Tabs.List mb={4}>
          <Tabs.Trigger value="contact">
            <Flex align="center" gap={2}>
              <MessageCircle size={16} />
              {t('contactTab')}
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="bug">
            <Flex align="center" gap={2}>
              <Bug size={16} />
              {t('bugReportTab')}
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Contact Form */}
        <Tabs.Content value="contact">
          <form onSubmit={contactForm.handleSubmit(handleContactSubmit)}>
            <VStack gap={4} align="stretch">
              <Field.Root invalid={!!contactForm.formState.errors.title}>
                <Field.Label>{t('title')}</Field.Label>
                <Input
                  placeholder={t('titlePlaceholder')}
                  {...contactForm.register('title')}
                />
                {contactForm.formState.errors.title && (
                  <Field.ErrorText>
                    {contactForm.formState.errors.title.message}
                  </Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!contactForm.formState.errors.description}>
                <Field.Label>{t('description')}</Field.Label>
                <Textarea
                  placeholder={t('contactDescPlaceholder')}
                  rows={5}
                  {...contactForm.register('description')}
                />
                {contactForm.formState.errors.description && (
                  <Field.ErrorText>
                    {contactForm.formState.errors.description.message}
                  </Field.ErrorText>
                )}
              </Field.Root>

              <Button
                type="submit"
                colorPalette="green"
                loading={contactForm.formState.isSubmitting}
                loadingText={t('submitting')}
                alignSelf="flex-start"
              >
                {t('submit')}
              </Button>
            </VStack>
          </form>
        </Tabs.Content>

        {/* Bug Report Form */}
        <Tabs.Content value="bug">
          <form onSubmit={bugForm.handleSubmit(handleBugSubmit)}>
            <VStack gap={4} align="stretch">
              <Field.Root invalid={!!bugForm.formState.errors.title}>
                <Field.Label>{t('title')}</Field.Label>
                <Input
                  placeholder={t('titlePlaceholder')}
                  {...bugForm.register('title')}
                />
                {bugForm.formState.errors.title && (
                  <Field.ErrorText>
                    {bugForm.formState.errors.title.message}
                  </Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!bugForm.formState.errors.description}>
                <Field.Label>{t('description')}</Field.Label>
                <Textarea
                  placeholder={t('descriptionPlaceholder')}
                  rows={5}
                  {...bugForm.register('description')}
                />
                {bugForm.formState.errors.description && (
                  <Field.ErrorText>
                    {bugForm.formState.errors.description.message}
                  </Field.ErrorText>
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
                      onClick={handleRemoveImage}
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

              <Button
                type="submit"
                colorPalette="green"
                loading={bugForm.formState.isSubmitting}
                loadingText={t('submitting')}
                alignSelf="flex-start"
              >
                {t('submit')}
              </Button>
            </VStack>
          </form>
        </Tabs.Content>
      </Tabs.Root>

      {/* My Feedback History */}
      <Box mt={10}>
        <Heading size="md" mb={4}>
          {t('myFeedback')}
        </Heading>
        {isLoadingFeedback ? (
          <Text color="fg.muted">Loading...</Text>
        ) : myFeedback.length === 0 ? (
          <Text color="fg.muted">{t('noFeedback')}</Text>
        ) : (
          <Stack gap={3}>
            {myFeedback.map((fb) => (
              <Card.Root key={fb.id} size="sm">
                <Card.Body>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Flex align="center" gap={2}>
                      <Badge
                        colorPalette={
                          fb.type === EFeedbackType.BUG_REPORT ? 'red' : 'blue'
                        }
                      >
                        {t(`type.${fb.type}`)}
                      </Badge>
                      <Badge colorPalette={STATUS_COLOR_MAP[fb.status]}>
                        {t(`status.${fb.status}`)}
                      </Badge>
                    </Flex>
                    <Text fontSize="xs" color="fg.muted">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </Text>
                  </Flex>
                  <Text fontWeight="semibold">{fb.title}</Text>
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    {fb.description}
                  </Text>
                  {fb.imageUrl && (
                    <Image
                      src={fb.imageUrl}
                      alt="Screenshot"
                      maxH="120px"
                      mt={2}
                      borderRadius="md"
                    />
                  )}
                  {fb.adminNote && (
                    <Box mt={2} p={2} bg="bg.subtle" borderRadius="md">
                      <Text fontSize="sm" fontWeight="medium">
                        Admin:
                      </Text>
                      <Text fontSize="sm">{fb.adminNote}</Text>
                    </Box>
                  )}
                </Card.Body>
              </Card.Root>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default FeedbackClient;
