'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Collapsible,
  Flex,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { VButton } from '@/components/ui/VButton';
import VDrawer from '@/components/ui/VDrawer';
import { VSwitch } from '@/components/ui/VSwitch';
import { EImageCategory, VenuePriceBook } from '@/lib/api/types';
import {
  createEmptyPriceBook,
  createPriceBookSchema,
  PriceBookFormValues,
  priceBookToForm,
} from './pricing-utils';
import { UnsavedChangesModal } from './UnsavedChangesModal';

interface PriceBookEditorDrawerProps {
  isOpen: boolean;
  book: VenuePriceBook | null;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSave: (
    values: PriceBookFormValues,
    book: VenuePriceBook | null
  ) => Promise<void>;
  onDelete: () => void;
}

export function PriceBookEditorDrawer({
  isOpen,
  book,
  mode,
  onClose,
  onSave,
  onDelete,
}: PriceBookEditorDrawerProps) {
  const t = useTranslations('adminVenuePricing');
  const schema = useMemo(() => createPriceBookSchema(t), [t]);
  const [showDiscard, setShowDiscard] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const form = useForm<PriceBookFormValues>({
    resolver: zodResolver(schema),
    defaultValues: createEmptyPriceBook(),
  });
  const { errors, isDirty, isSubmitting } = form.formState;

  useEffect(() => {
    if (!isOpen) return;
    form.reset(
      mode === 'edit' && book ? priceBookToForm(book) : createEmptyPriceBook()
    );
    setSubmitError('');
    setShowDiscard(false);
  }, [book, form, isOpen, mode]);

  useEffect(() => {
    if (!isOpen || !isDirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) =>
      event.preventDefault();
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty, isOpen]);

  const requestClose = () => {
    if (isDirty) setShowDiscard(true);
    else onClose();
  };

  const submit = async (values: PriceBookFormValues) => {
    setSubmitError('');
    try {
      await onSave(values, mode === 'edit' ? book : null);
      form.reset(values);
      onClose();
    } catch {
      setSubmitError(t('errors.saveBook'));
    }
  };

  return (
    <>
      <VDrawer
        isOpen={isOpen}
        onClose={requestClose}
        title={mode === 'edit' ? t('editBookTitle') : t('createBookTitle')}
        description={t('bookDrawerDescription')}
        closeButtonAriaLabel={t('closeDrawer')}
        size="lg"
        footer={
          <Flex justify="space-between" align="center" gap={3} w="full">
            <Box>
              {mode === 'edit' && (
                <VButton
                  type="button"
                  variant="ghost"
                  colorPalette="red"
                  leftIcon={<Trash2 size={16} aria-hidden="true" />}
                  onClick={onDelete}
                  disabled={isSubmitting}
                >
                  {t('deleteBook')}
                </VButton>
              )}
            </Box>
            <Flex gap={3}>
              <VButton
                type="button"
                variant="outline"
                onClick={requestClose}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </VButton>
              <VButton
                type="button"
                onClick={() => form.handleSubmit(submit)()}
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {mode === 'edit' ? t('saveBook') : t('createBook')}
              </VButton>
            </Flex>
          </Flex>
        }
      >
        <VStack
          as="form"
          align="stretch"
          gap={5}
          onSubmit={form.handleSubmit(submit)}
        >
          <Field
            label={t('bookName')}
            required
            invalid={Boolean(errors.name)}
            errorText={errors.name?.message}
          >
            <Input autoComplete="off" {...form.register('name')} />
          </Field>

          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
            <Field
              label={t('effectiveStart')}
              required
              invalid={Boolean(errors.effectiveFrom)}
              errorText={errors.effectiveFrom?.message}
            >
              <Input
                type="date"
                autoComplete="off"
                {...form.register('effectiveFrom')}
              />
            </Field>
            <Field
              label={t('effectiveEnd')}
              invalid={Boolean(errors.effectiveTo)}
              errorText={errors.effectiveTo?.message}
            >
              <Input
                type="date"
                autoComplete="off"
                {...form.register('effectiveTo')}
              />
            </Field>
          </SimpleGrid>

          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <VSwitch
                checked={field.value}
                onCheckedChange={(details) => field.onChange(details.checked)}
                label={t('isActive')}
                colorPalette="green"
              />
            )}
          />

          <Field
            label={t('referenceImage')}
            helperText={t('referenceImageHelp')}
          >
            <Controller
              control={form.control}
              name="priceImageUrl"
              render={({ field }) => (
                <AppSingleImageUpload
                  value={field.value}
                  publicId={form.getValues('priceImagePublicId')}
                  category={EImageCategory.OTHER}
                  alt={t('referenceImageAlt')}
                  uploadText={t('uploadImage')}
                  emptyTitle={t('noReferenceImage')}
                  urlPlaceholder={t('imageUrlPlaceholder')}
                  onChange={(image) => {
                    field.onChange(image.url);
                    form.setValue('priceImagePublicId', image.publicId || '', {
                      shouldDirty: true,
                    });
                  }}
                  onClear={() => {
                    field.onChange('');
                    form.setValue('priceImagePublicId', '', {
                      shouldDirty: true,
                    });
                  }}
                />
              )}
            />
          </Field>

          <Field label={t('notes')}>
            <Textarea rows={4} autoComplete="off" {...form.register('notes')} />
          </Field>

          <Collapsible.Root>
            <Collapsible.Trigger asChild>
              <VButton
                type="button"
                variant="ghost"
                w="full"
                justifyContent="space-between"
              >
                {t('advancedSettings')}
                <ChevronDown size={18} aria-hidden="true" />
              </VButton>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4} pt={4}>
                <Field
                  label={t('priority')}
                  helperText={t('bookPriorityHelp')}
                  invalid={Boolean(errors.priority)}
                  errorText={errors.priority?.message}
                >
                  <Controller
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Input
                        name={field.name}
                        ref={field.ref}
                        type="number"
                        inputMode="numeric"
                        value={field.value}
                        onBlur={field.onBlur}
                        autoComplete="off"
                        onChange={(event) =>
                          field.onChange(Number(event.target.value || 0))
                        }
                      />
                    )}
                  />
                </Field>
                <Field
                  label={t('currency')}
                  required
                  invalid={Boolean(errors.currency)}
                  errorText={errors.currency?.message}
                >
                  <Input
                    translate="no"
                    autoComplete="off"
                    {...form.register('currency')}
                  />
                </Field>
              </SimpleGrid>
            </Collapsible.Content>
          </Collapsible.Root>

          {submitError && (
            <Text color="red.600" fontSize="sm" role="alert" aria-live="polite">
              {submitError}
            </Text>
          )}
        </VStack>
      </VDrawer>

      <UnsavedChangesModal
        isOpen={showDiscard}
        onCancel={() => setShowDiscard(false)}
        onDiscard={() => {
          setShowDiscard(false);
          form.reset();
          onClose();
        }}
      />
    </>
  );
}
