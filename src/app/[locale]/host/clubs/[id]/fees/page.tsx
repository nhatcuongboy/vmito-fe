'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import {
  Button,
  VStack,
  HStack,
  VSelect,
  SimpleGrid,
  Divider,
  Input,
} from '@/components/ui/chakra-compat';
import { useParams } from 'next/navigation';
import { ClubsService } from '@/lib/api/clubs.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/loading-spinner';
import PageLayout from '@/components/layout/PageLayout';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const formatAmountDisplay = (raw: string): string => {
  const stripped = raw.replace(/[^\d]/g, '');
  if (!stripped) return '';
  const num = parseInt(stripped, 10);
  if (isNaN(num)) return raw;
  return num.toLocaleString('vi-VN');
};

const parseAmountInput = (input: string): string => {
  return input.replace(/[^\d]/g, '');
};

const feeSchema = z
  .string()
  .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: 'invalidFee',
  });

const schema = z.object({
  maleFeeMonthly: feeSchema,
  femaleFeeMonthly: feeSchema,
  maleFeePerSession: feeSchema,
  femaleFeePerSession: feeSchema,
});

type FormData = z.infer<typeof schema>;

const ClubFeesPage = () => {
  const t = useTranslations('clubs');
  const params = useParams();
  const routeClubId = params.id as string;
  const [clubId, setClubId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      maleFeeMonthly: '',
      femaleFeeMonthly: '',
      maleFeePerSession: '',
      femaleFeePerSession: '',
    },
  });

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const resolveClubId = useCallback(async () => {
    if (!routeClubId) return '';

    try {
      const club = await ClubsService.getClub(routeClubId);
      return club.id;
    } catch {
      const club = await ClubsService.getClubDetails(routeClubId);
      return club.id;
    }
  }, [routeClubId]);

  const loadFees = useCallback(async () => {
    try {
      setLoading(true);
      const resolvedClubId = clubId || (await resolveClubId());
      if (!resolvedClubId) return;

      setClubId(resolvedClubId);
      const feeConfig = await ClubsService.getClubFeeForMonth(
        resolvedClubId,
        selectedYear,
        selectedMonth
      );
      if (feeConfig) {
        reset({
          maleFeeMonthly: feeConfig.maleFeeMonthly?.toString() || '',
          femaleFeeMonthly: feeConfig.femaleFeeMonthly?.toString() || '',
          maleFeePerSession: feeConfig.maleFeePerSession?.toString() || '',
          femaleFeePerSession: feeConfig.femaleFeePerSession?.toString() || '',
        });
      } else {
        reset({
          maleFeeMonthly: '',
          femaleFeeMonthly: '',
          maleFeePerSession: '',
          femaleFeePerSession: '',
        });
      }
    } catch (error) {
      console.error('Failed to load fees:', error);
      toaster.error({ title: t('failedToLoadFees') });
    } finally {
      setLoading(false);
    }
  }, [clubId, resolveClubId, selectedMonth, selectedYear, t]);

  useEffect(() => {
    if (routeClubId) {
      loadFees();
    }
  }, [routeClubId, loadFees]);

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      const resolvedClubId = clubId || (await resolveClubId());
      if (!resolvedClubId) return;

      setClubId(resolvedClubId);
      await ClubsService.upsertClubFee(resolvedClubId, {
        month: selectedMonth,
        year: selectedYear,
        maleFeeMonthly: data.maleFeeMonthly
          ? Number(data.maleFeeMonthly)
          : undefined,
        femaleFeeMonthly: data.femaleFeeMonthly
          ? Number(data.femaleFeeMonthly)
          : undefined,
        maleFeePerSession: data.maleFeePerSession
          ? Number(data.maleFeePerSession)
          : undefined,
        femaleFeePerSession: data.femaleFeePerSession
          ? Number(data.femaleFeePerSession)
          : undefined,
      });
      toaster.success({ title: t('feesUpdatedSuccess') });
      loadFees();
    } catch (error) {
      console.error('Failed to update fees:', error);
      toaster.error({ title: t('failedToUpdateFees') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout
        title={t('feeConfiguration')}
        maxW="container.lg"
        isLoading={true}
        loadingComponent={<LoadingSpinner />}
      />
    );
  }

  return (
    <PageLayout title={t('feeConfiguration')} maxW="container.lg">
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="lg">{t('feeConfiguration')}</Heading>
          <Button variant="ghost" onClick={() => window.history.back()}>
            {t('back')}
          </Button>
        </Flex>

        <Box bg="bg" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="md" mb={4}>
                  {t('selectMonth')}
                </Heading>
                <HStack spacing={4} mb={6}>
                  <Box width="150px">
                    <VSelect
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          {t(`month${m}`)}
                        </option>
                      ))}
                    </VSelect>
                  </Box>
                  <Box width="120px">
                    <VSelect
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                      {[selectedYear - 1, selectedYear, selectedYear + 1].map(
                        (y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        )
                      )}
                    </VSelect>
                  </Box>
                </HStack>
              </Box>

              <Divider />

              <Box>
                <Heading size="sm" mb={4}>
                  {t('monthlyFeeConfig')}
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Field
                    label={t('maleMonthlyFee')}
                    helperText={`${t('currency')} / ${t('month')}`}
                    invalid={!!errors.maleFeeMonthly}
                    errorText={
                      errors.maleFeeMonthly?.message
                        ? t(errors.maleFeeMonthly.message)
                        : undefined
                    }
                  >
                    <Controller
                      name="maleFeeMonthly"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formatAmountDisplay(field.value)}
                          onChange={(e) =>
                            field.onChange(parseAmountInput(e.target.value))
                          }
                        />
                      )}
                    />
                  </Field>
                  <Field
                    label={t('femaleMonthlyFee')}
                    helperText={`${t('currency')} / ${t('month')}`}
                    invalid={!!errors.femaleFeeMonthly}
                    errorText={
                      errors.femaleFeeMonthly?.message
                        ? t(errors.femaleFeeMonthly.message)
                        : undefined
                    }
                  >
                    <Controller
                      name="femaleFeeMonthly"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formatAmountDisplay(field.value)}
                          onChange={(e) =>
                            field.onChange(parseAmountInput(e.target.value))
                          }
                        />
                      )}
                    />
                  </Field>
                </SimpleGrid>
              </Box>

              <Divider />

              <Box>
                <Heading size="sm" mt={4}>
                  {t('perSessionFeeConfig')}
                </Heading>
                <Text fontSize="sm" color="fg.muted" mb={4}>
                  {t('perSessionFeeDescription')}
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Field
                    label={t('malePerSessionFee')}
                    helperText={`${t('currency')} / ${t('session')}`}
                    invalid={!!errors.maleFeePerSession}
                    errorText={
                      errors.maleFeePerSession?.message
                        ? t(errors.maleFeePerSession.message)
                        : undefined
                    }
                  >
                    <Controller
                      name="maleFeePerSession"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formatAmountDisplay(field.value)}
                          onChange={(e) =>
                            field.onChange(parseAmountInput(e.target.value))
                          }
                        />
                      )}
                    />
                  </Field>
                  <Field
                    label={t('femalePerSessionFee')}
                    helperText={`${t('currency')} / ${t('session')}`}
                    invalid={!!errors.femaleFeePerSession}
                    errorText={
                      errors.femaleFeePerSession?.message
                        ? t(errors.femaleFeePerSession.message)
                        : undefined
                    }
                  >
                    <Controller
                      name="femaleFeePerSession"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formatAmountDisplay(field.value)}
                          onChange={(e) =>
                            field.onChange(parseAmountInput(e.target.value))
                          }
                        />
                      )}
                    />
                  </Field>
                </SimpleGrid>
              </Box>

              <Flex justify="flex-end" mt={6}>
                <Button
                  type="submit"
                  colorPalette="green"
                  size="lg"
                  loading={saving}
                >
                  {t('saveConfiguration')}
                </Button>
              </Flex>
            </VStack>
          </form>
        </Box>
      </VStack>
    </PageLayout>
  );
};

export default ClubFeesPage;
