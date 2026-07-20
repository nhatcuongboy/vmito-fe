'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Collapsible,
  Flex,
  NativeSelect,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { VButton } from '@/components/ui/VButton';
import VDrawer from '@/components/ui/VDrawer';
import {
  VenueCustomerType,
  VenueDayType,
  VenuePriceRule,
} from '@/lib/api/types';
import {
  createEmptyPriceRule,
  createPriceRuleSchema,
  PriceRuleFormValues,
  priceRuleToForm,
} from './pricing-utils';
import { UnsavedChangesModal } from './UnsavedChangesModal';

interface PriceRuleEditorDrawerProps {
  isOpen: boolean;
  rule: VenuePriceRule | null;
  onClose: () => void;
  onSave: (
    values: PriceRuleFormValues,
    rule: VenuePriceRule | null
  ) => Promise<void>;
}

const dayTypes = Object.values(VenueDayType);
const customerTypes = Object.values(VenueCustomerType);
const weekdays = [1, 2, 3, 4, 5, 6, 7];

export function PriceRuleEditorDrawer({
  isOpen,
  rule,
  onClose,
  onSave,
}: PriceRuleEditorDrawerProps) {
  const t = useTranslations('adminVenuePricing');
  const schema = useMemo(() => createPriceRuleSchema(t), [t]);
  const [showDiscard, setShowDiscard] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const form = useForm<PriceRuleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: createEmptyPriceRule(),
  });
  const { errors, isDirty, isSubmitting } = form.formState;
  const dayType = form.watch('dayType');
  const selectedWeekdays = form.watch('daysOfWeek');

  useEffect(() => {
    if (!isOpen) return;
    form.reset(rule ? priceRuleToForm(rule) : createEmptyPriceRule());
    setSubmitError('');
    setShowDiscard(false);
  }, [form, isOpen, rule]);

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

  const submit = async (values: PriceRuleFormValues) => {
    setSubmitError('');
    try {
      await onSave(values, rule);
      form.reset(values);
      onClose();
    } catch {
      setSubmitError(t('errors.saveRule'));
    }
  };

  const toggleWeekday = (day: number) => {
    const next = selectedWeekdays.includes(day)
      ? selectedWeekdays.filter((item) => item !== day)
      : [...selectedWeekdays, day].sort();
    form.setValue('daysOfWeek', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <>
      <VDrawer
        isOpen={isOpen}
        onClose={requestClose}
        title={rule ? t('editRuleTitle') : t('createRuleTitle')}
        description={t('ruleDrawerDescription')}
        closeButtonAriaLabel={t('closeDrawer')}
        primaryActionText={rule ? t('saveRule') : t('addRule')}
        secondaryActionText={t('cancel')}
        onPrimaryAction={() => form.handleSubmit(submit)()}
        onSecondaryAction={requestClose}
        isPrimaryLoading={isSubmitting}
        isPrimaryDisabled={isSubmitting}
        size="lg"
      >
        <VStack
          as="form"
          align="stretch"
          gap={6}
          onSubmit={form.handleSubmit(submit)}
        >
          <Box>
            <Text fontWeight="semibold" mb={3}>
              {t('scopeSection')}
            </Text>
            <VStack align="stretch" gap={4}>
              <Field
                label={t('dayType')}
                required
                invalid={Boolean(errors.dayType)}
                errorText={errors.dayType?.message}
              >
                <NativeSelect.Root>
                  <NativeSelect.Field {...form.register('dayType')}>
                    {dayTypes.map((value) => (
                      <option key={value} value={value}>
                        {t(`dayTypes.${value}`)}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>

              {dayType === VenueDayType.WEEKDAY && (
                <Field
                  label={t('weekdaysLabel')}
                  required
                  invalid={Boolean(errors.daysOfWeek)}
                  errorText={errors.daysOfWeek?.message}
                >
                  <Flex gap={2} wrap="wrap">
                    {weekdays.map((day) => (
                      <Checkbox
                        key={day}
                        checked={selectedWeekdays.includes(day)}
                        onCheckedChange={() => toggleWeekday(day)}
                        px={3}
                        py={2}
                        borderWidth="1px"
                        borderRadius="md"
                      >
                        {t(`weekdays.${day}`)}
                      </Checkbox>
                    ))}
                  </Flex>
                </Field>
              )}

              {(dayType === VenueDayType.SPECIFIC_DATE ||
                dayType === VenueDayType.HOLIDAY) && (
                <Field
                  label={t('specificDate')}
                  required
                  invalid={Boolean(errors.specificDate)}
                  errorText={errors.specificDate?.message}
                >
                  <Input
                    type="date"
                    autoComplete="off"
                    {...form.register('specificDate')}
                  />
                </Field>
              )}
            </VStack>
          </Box>

          <Box>
            <Text fontWeight="semibold" mb={3}>
              {t('priceSection')}
            </Text>
            <VStack align="stretch" gap={4}>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <Field
                  label={t('startTime')}
                  required
                  invalid={Boolean(errors.startTime)}
                  errorText={errors.startTime?.message}
                >
                  <Input
                    type="time"
                    autoComplete="off"
                    {...form.register('startTime')}
                  />
                </Field>
                <Field
                  label={t('endTime')}
                  required
                  helperText={t('endTimeHelp')}
                  invalid={Boolean(errors.endTime)}
                  errorText={errors.endTime?.message}
                >
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="24:00"
                    autoComplete="off"
                    {...form.register('endTime')}
                  />
                </Field>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                <Field
                  label={t('customerType')}
                  required
                  invalid={Boolean(errors.customerType)}
                  errorText={errors.customerType?.message}
                >
                  <NativeSelect.Root>
                    <NativeSelect.Field {...form.register('customerType')}>
                      {customerTypes.map((value) => (
                        <option key={value} value={value}>
                          {t(`customerTypes.${value}`)}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field>
                <Field
                  label={t('pricePerHour')}
                  required
                  invalid={Boolean(errors.pricePerHour)}
                  errorText={errors.pricePerHour?.message}
                >
                  <Controller
                    control={form.control}
                    name="pricePerHour"
                    render={({ field }) => (
                      <MoneyInput
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        autoComplete="off"
                        onValueChange={(value) => field.onChange(value ?? 0)}
                      />
                    )}
                  />
                </Field>
              </SimpleGrid>
            </VStack>
          </Box>

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
              <VStack align="stretch" gap={4} pt={4}>
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                  <Field
                    label={t('minimumMinutes')}
                    invalid={Boolean(errors.minimumMinutes)}
                    errorText={errors.minimumMinutes?.message}
                  >
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      autoComplete="off"
                      {...form.register('minimumMinutes')}
                    />
                  </Field>
                  <Field
                    label={t('billingStepMinutes')}
                    invalid={Boolean(errors.billingStepMinutes)}
                    errorText={errors.billingStepMinutes?.message}
                  >
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      autoComplete="off"
                      {...form.register('billingStepMinutes')}
                    />
                  </Field>
                </SimpleGrid>
                <Field
                  label={t('priority')}
                  helperText={t('priorityHelp')}
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
                <Field label={t('notes')}>
                  <Input autoComplete="off" {...form.register('notes')} />
                </Field>
              </VStack>
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
