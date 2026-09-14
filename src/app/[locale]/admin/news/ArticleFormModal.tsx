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
import { VSelect } from '@/components/ui/chakra-compat';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/cloudinary/ImageUploader';
import { toaster } from '@/components/ui/toaster';
import { compressImage } from '@/lib/utils/image';
import { NewsService } from '@/lib/api/news.service';
import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';
import {
  ARTICLE_CATEGORIES,
  EArticleCategory,
  EArticleStatus,
  IAdminArticle,
} from '@/types/news';

const schema = z.object({
  title: z.string().min(3).max(200),
  // Left blank, the backend derives one from the title.
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slugFormat')
    .max(120)
    .optional()
    .or(z.literal('')),
  locale: z.nativeEnum(Locale),
  translationGroupId: z.string().max(64).optional(),
  excerpt: z.string().min(10).max(320),
  content: z.string().min(1),
  coverImage: z.string().optional(),
  coverImagePublicId: z.string().optional(),
  category: z.nativeEnum(EArticleCategory),
  tagsText: z.string().optional(),
  status: z.nativeEnum(EArticleStatus),
  isFeatured: z.boolean(),
  publishedAt: z.string().optional(),
});

type TFormData = z.infer<typeof schema>;

interface ArticleFormModalProps {
  isOpen: boolean;
  article: IAdminArticle | null;
  onClose: () => void;
  onSaved: (article: IAdminArticle) => void;
}

const toFormValues = (article: IAdminArticle | null): TFormData => ({
  title: article?.title ?? '',
  slug: article?.slug ?? '',
  locale: article?.locale ?? Locale.VI,
  translationGroupId: article?.translationGroupId ?? undefined,
  excerpt: article?.excerpt ?? '',
  content: article?.content ?? '',
  coverImage: article?.coverImage ?? undefined,
  coverImagePublicId: article?.coverImagePublicId ?? undefined,
  category: article?.category ?? EArticleCategory.NEWS,
  tagsText: article?.tags.join(', ') ?? '',
  status: article?.status ?? EArticleStatus.DRAFT,
  isFeatured: article?.isFeatured ?? false,
  publishedAt: article?.publishedAt ? article.publishedAt.slice(0, 10) : '',
});

export default function ArticleFormModal({
  isOpen,
  article,
  onClose,
  onSaved,
}: ArticleFormModalProps) {
  const t = useTranslations('admin.news.form');
  const tNews = useTranslations('pages.news');
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
    defaultValues: toFormValues(article),
  });

  useEffect(() => {
    if (isOpen) reset(toFormValues(article));
  }, [isOpen, article, reset]);

  const handleUploadCover = useCallback(
    async (file: File): Promise<string> => {
      const compressed = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
      });
      const result = await NewsService.uploadCover(compressed);
      setValue('coverImagePublicId', result.publicId);
      return result.url;
    },
    [setValue]
  );

  const onSubmit = async (data: TFormData) => {
    try {
      const payload = {
        title: data.title,
        // An empty slug means "derive it" — sending '' would fail validation.
        slug: data.slug || undefined,
        locale: data.locale,
        translationGroupId: data.translationGroupId || undefined,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        coverImagePublicId: data.coverImagePublicId,
        category: data.category,
        tags: parseTags(data.tagsText),
        status: data.status,
        isFeatured: data.isFeatured,
        publishedAt: data.publishedAt
          ? new Date(data.publishedAt).toISOString()
          : undefined,
      };

      const saved = article
        ? await NewsService.update(article.id, payload)
        : await NewsService.create(payload);

      toaster.success({
        title: article ? t('updateSuccess') : t('createSuccess'),
      });
      onSaved(saved);
    } catch (error) {
      console.error('Failed to save article:', error);
      toaster.error({ title: t('saveError') });
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={article ? t('editTitle') : t('createTitle')}
      size="xl"
      primaryActionText={t('save')}
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryLoading={isSubmitting}
    >
      <VStack gap={4} align="stretch">
        <Field label={t('titleLabel')} errorText={errors.title?.message}>
          <Input {...register('title')} maxLength={200} />
        </Field>

        <HStack gap={3} align="start">
          <Field
            label={t('slugLabel')}
            helperText={t('slugHelp')}
            optionalText={t('optional')}
            errorText={errors.slug?.message && t(errors.slug.message as string)}
          >
            <Input {...register('slug')} placeholder="huong-dan-chon-vot" />
          </Field>
          <Controller
            control={control}
            name="locale"
            render={({ field }) => (
              <Field label={t('localeLabel')}>
                <VSelect
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value as Locale)
                  }
                >
                  {SUPPORTED_LOCALES.map((locale) => (
                    <option key={locale} value={locale}>
                      {t(`locales.${locale}`)}
                    </option>
                  ))}
                </VSelect>
              </Field>
            )}
          />
        </HStack>

        <Field label={t('excerptLabel')} errorText={errors.excerpt?.message}>
          <Textarea {...register('excerpt')} rows={3} maxLength={320} />
        </Field>

        <Field label={t('coverLabel')} optionalText={t('optional')}>
          <ImageUploader
            value={watch('coverImage')}
            onChange={(url) => {
              setValue('coverImage', url || undefined);
              if (!url) setValue('coverImagePublicId', undefined);
            }}
            onUpload={handleUploadCover}
            maxWidth={480}
            maxHeight={270}
          />
        </Field>

        <HStack gap={3} align="start">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Field label={t('categoryLabel')}>
                <VSelect
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value as EArticleCategory)
                  }
                >
                  {ARTICLE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {tNews(`categories.${category}`)}
                    </option>
                  ))}
                </VSelect>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Field label={t('statusLabel')}>
                <VSelect
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value as EArticleStatus)
                  }
                >
                  {Object.values(EArticleStatus).map((status) => (
                    <option key={status} value={status}>
                      {t(`statuses.${status}`)}
                    </option>
                  ))}
                </VSelect>
              </Field>
            )}
          />
        </HStack>

        <HStack gap={3} align="start">
          <Field
            label={t('publishedAtLabel')}
            helperText={t('publishedAtHelp')}
            optionalText={t('optional')}
          >
            <Input type="date" {...register('publishedAt')} />
          </Field>
          <Field
            label={t('translationGroupLabel')}
            helperText={t('translationGroupHelp')}
            optionalText={t('optional')}
          >
            <Input {...register('translationGroupId')} maxLength={64} />
          </Field>
        </HStack>

        <Field label={t('tagsLabel')} helperText={t('tagsHelp')}>
          <Input {...register('tagsText')} placeholder="vot, thiet-bi" />
        </Field>

        <Controller
          control={control}
          name="isFeatured"
          render={({ field }) => (
            <VSwitch
              checked={field.value}
              onCheckedChange={(details) => field.onChange(details.checked)}
              label={t('isFeaturedLabel')}
              colorPalette="green"
            />
          )}
        />

        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <Field
              label={t('contentLabel')}
              errorText={errors.content?.message}
            >
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                minHeight="320px"
              />
            </Field>
          )}
        />
      </VStack>
    </VModal>
  );
}

/** "Vợt, Thiết Bị" -> ["vợt", "thiết bị"]; the backend normalizes casing too. */
const parseTags = (tagsText?: string): string[] =>
  Array.from(
    new Set(
      (tagsText ?? '')
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
