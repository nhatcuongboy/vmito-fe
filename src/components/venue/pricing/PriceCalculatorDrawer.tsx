'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box, NativeSelect, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import VDrawer from '@/components/ui/VDrawer';
import { VenueService } from '@/lib/api/venue.service';
import {
  VenueCustomerType,
  VenueRentalPriceCalculation,
} from '@/lib/api/types';
import {
  formatCurrency,
  getEndDateTime,
  getTodayDateInput,
  isValidEndTime,
  isValidStartTime,
  timeToMinute,
} from './pricing-utils';

interface PriceCalculatorDrawerProps {
  isOpen: boolean;
  venueId: string;
  locale: string;
  defaultCurrency: string;
  onClose: () => void;
}

interface CalculatorFormValues {
  date: string;
  startTime: string;
  endTime: string;
  numberOfCourts: number;
  customerType: VenueCustomerType;
}

const customerTypes = Object.values(VenueCustomerType);

function createDefaults(): CalculatorFormValues {
  return {
    date: getTodayDateInput(),
    startTime: '09:00',
    endTime: '11:00',
    numberOfCourts: 1,
    customerType: VenueCustomerType.WALK_IN,
  };
}

export function PriceCalculatorDrawer({
  isOpen,
  venueId,
  locale,
  defaultCurrency,
  onClose,
}: PriceCalculatorDrawerProps) {
  const t = useTranslations('adminVenuePricing');
  const [calculation, setCalculation] =
    useState<VenueRentalPriceCalculation | null>(null);
  const [submitError, setSubmitError] = useState('');
  const schema = useMemo(
    () =>
      z
        .object({
          date: z.string().min(1, t('validation.dateRequired')),
          startTime: z
            .string()
            .refine(isValidStartTime, t('validation.invalidTime')),
          endTime: z
            .string()
            .refine(isValidEndTime, t('validation.invalidTime')),
          numberOfCourts: z
            .number()
            .int(t('validation.integerRequired'))
            .positive(t('validation.courtsPositive')),
          customerType: z.nativeEnum(VenueCustomerType),
        })
        .superRefine((value, context) => {
          if (
            isValidStartTime(value.startTime) &&
            isValidEndTime(value.endTime) &&
            timeToMinute(value.endTime) <= timeToMinute(value.startTime)
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['endTime'],
              message: t('validation.endTimeAfterStart'),
            });
          }
        }),
    [t]
  );
  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: createDefaults(),
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!isOpen) return;
    form.reset(createDefaults());
    setCalculation(null);
    setSubmitError('');
  }, [form, isOpen]);

  const calculate = async (values: CalculatorFormValues) => {
    setSubmitError('');
    setCalculation(null);
    try {
      const result = await VenueService.calculateRentalPrice(venueId, {
        startTime: `${values.date}T${values.startTime}:00+07:00`,
        endTime: getEndDateTime(values.date, values.endTime),
        numberOfCourts: values.numberOfCourts,
        customerType: values.customerType,
      });
      setCalculation(result);
    } catch {
      setSubmitError(t('errors.calculate'));
    }
  };

  return (
    <VDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('calculatorTitle')}
      description={t('calculatorDescription')}
      closeButtonAriaLabel={t('closeDrawer')}
      primaryActionText={t('calculate')}
      secondaryActionText={t('close')}
      onPrimaryAction={() => form.handleSubmit(calculate)()}
      onSecondaryAction={onClose}
      isPrimaryLoading={isSubmitting}
      isPrimaryDisabled={isSubmitting}
      size="md"
    >
      <VStack
        as="form"
        align="stretch"
        gap={5}
        onSubmit={form.handleSubmit(calculate)}
      >
        <Field
          label={t('date')}
          required
          invalid={Boolean(errors.date)}
          errorText={errors.date?.message}
        >
          <Input type="date" autoComplete="off" {...form.register('date')} />
        </Field>
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
            label={t('numberOfCourts')}
            required
            invalid={Boolean(errors.numberOfCourts)}
            errorText={errors.numberOfCourts?.message}
          >
            <Controller
              control={form.control}
              name="numberOfCourts"
              render={({ field }) => (
                <Input
                  name={field.name}
                  ref={field.ref}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={field.value}
                  onBlur={field.onBlur}
                  autoComplete="off"
                  onChange={(event) =>
                    field.onChange(Number(event.target.value || 1))
                  }
                />
              )}
            />
          </Field>
          <Field label={t('customerType')} required>
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
        </SimpleGrid>

        {submitError && (
          <Text color="red.600" fontSize="sm" role="alert" aria-live="polite">
            {submitError}
          </Text>
        )}

        {calculation && (
          <Box
            bg={{ base: 'green.50', _dark: 'green.950' }}
            borderWidth="1px"
            borderColor={{ base: 'green.200', _dark: 'green.800' }}
            borderRadius="lg"
            p={4}
            aria-live="polite"
          >
            <Text fontSize="sm" color="gray.500">
              {t('calculationTotal')}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" mt={1}>
              {formatCurrency(
                calculation.totalAmount,
                calculation.currency || defaultCurrency,
                locale
              )}
            </Text>
            <VStack align="stretch" gap={3} mt={4}>
              {calculation.breakdown.map((item, index) => (
                <Box
                  key={`${item.from}-${item.to}-${index}`}
                  borderTopWidth="1px"
                  borderColor={{ base: 'green.200', _dark: 'green.800' }}
                  pt={3}
                >
                  <Text fontWeight="semibold" fontVariantNumeric="tabular-nums">
                    {item.from}–{item.to}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    _dark={{ color: 'gray.300' }}
                  >
                    {t('calculationLine', {
                      price: formatCurrency(
                        item.pricePerHour,
                        calculation.currency || defaultCurrency,
                        locale
                      ),
                      minutes: item.billableMinutes,
                      courts: item.numberOfCourts,
                      amount: formatCurrency(
                        item.amount,
                        calculation.currency || defaultCurrency,
                        locale
                      ),
                    })}
                  </Text>
                  {item.source === 'LEGACY' && (
                    <Text fontSize="xs" color="orange.600" mt={1}>
                      {t('legacySource')}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </VDrawer>
  );
}
