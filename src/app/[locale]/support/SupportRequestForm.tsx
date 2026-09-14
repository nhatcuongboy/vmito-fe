'use client';

import { Button } from '@/components/primitives/button';
import { Field, Input, Textarea } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@/i18n/config';
import { FeedbackService } from '@/lib/api/feedback.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { EFeedbackType } from '@/types/feedback';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toaster } from '@/components/ui/toaster';
import { LogIn, Send } from 'lucide-react';

type TSupportRequestForm = {
  title: string;
  description: string;
};

export default function SupportRequestForm() {
  const t = useTranslations('pages.support.ticket');
  const { isAuthenticated, accessToken, isHydrated } = useAuthStore();
  const isSignedIn = isAuthenticated && Boolean(accessToken);
  const schema = useMemo(
    () =>
      z.object({
        title: z.string().trim().min(1, t('validation.required')).max(200),
        description: z
          .string()
          .trim()
          .min(1, t('validation.required'))
          .max(5000),
      }),
    [t]
  );
  const form = useForm<TSupportRequestForm>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = async (data: TSupportRequestForm) => {
    try {
      await FeedbackService.create({
        type: EFeedbackType.CONTACT,
        title: data.title.trim(),
        description: data.description.trim(),
      });
      toaster.success({
        title: t('successTitle'),
        description: t('successMessage'),
      });
      form.reset();
    } catch {
      toaster.error({ title: t('errorTitle'), description: t('errorMessage') });
    }
  };

  if (!isHydrated) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-hidden />
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <h3 className="text-xl! font-bold!">{t('loginRequiredTitle')}</h3>
        <p className="mt-2 text-muted-foreground">
          {t('loginRequiredDescription')}
        </p>
        <Button asChild className="mt-5 bg-green-600 hover:bg-green-700">
          <Link
            href={`/auth/signin?returnUrl=${encodeURIComponent('/support#support-request')}`}
          >
            <LogIn aria-hidden className="size-4" />
            {t('loginCta')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border bg-background p-6 shadow-sm"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <h3 className="text-xl! font-bold!">{t('title')}</h3>
      <p className="mt-2 text-muted-foreground">{t('description')}</p>
      <div className="mt-6 space-y-4">
        <Field.Root invalid={Boolean(form.formState.errors.title)}>
          <Field.Label>{t('subjectLabel')}</Field.Label>
          <Input
            placeholder={t('subjectPlaceholder')}
            {...form.register('title')}
          />
          {form.formState.errors.title && (
            <Field.ErrorText>
              {form.formState.errors.title.message}
            </Field.ErrorText>
          )}
        </Field.Root>
        <Field.Root invalid={Boolean(form.formState.errors.description)}>
          <Field.Label>{t('messageLabel')}</Field.Label>
          <Textarea
            rows={6}
            placeholder={t('messagePlaceholder')}
            {...form.register('description')}
          />
          {form.formState.errors.description && (
            <Field.ErrorText>
              {form.formState.errors.description.message}
            </Field.ErrorText>
          )}
        </Field.Root>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send aria-hidden className="size-4" />
          {form.formState.isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
