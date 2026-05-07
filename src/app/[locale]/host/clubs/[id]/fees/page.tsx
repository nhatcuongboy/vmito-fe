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

const ClubFeesPage = () => {
  const t = useTranslations('clubs');
  const params = useParams();
  const groupId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    maleFeeMonthly: '',
    femaleFeeMonthly: '',
    maleFeePerSession: '',
    femaleFeePerSession: '',
  });

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const loadFees = useCallback(async () => {
    try {
      setLoading(true);
      const feeConfig = await ClubsService.getClubFeeForMonth(
        groupId,
        selectedYear,
        selectedMonth
      );
      if (feeConfig) {
        setFormData({
          maleFeeMonthly: feeConfig.maleFeeMonthly?.toString() || '',
          femaleFeeMonthly: feeConfig.femaleFeeMonthly?.toString() || '',
          maleFeePerSession: feeConfig.maleFeePerSession?.toString() || '',
          femaleFeePerSession: feeConfig.femaleFeePerSession?.toString() || '',
        });
      } else {
        setFormData({
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
  }, [groupId, selectedMonth, selectedYear, t]);

  useEffect(() => {
    if (groupId) {
      loadFees();
    }
  }, [groupId, loadFees]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await ClubsService.upsertClubFee(groupId, {
        month: selectedMonth,
        year: selectedYear,
        maleFeeMonthly: formData.maleFeeMonthly
          ? Number(formData.maleFeeMonthly)
          : undefined,
        femaleFeeMonthly: formData.femaleFeeMonthly
          ? Number(formData.femaleFeeMonthly)
          : undefined,
        maleFeePerSession: formData.maleFeePerSession
          ? Number(formData.maleFeePerSession)
          : undefined,
        femaleFeePerSession: formData.femaleFeePerSession
          ? Number(formData.femaleFeePerSession)
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
                >
                  <Input
                    type="number"
                    value={formData.maleFeeMonthly}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maleFeeMonthly: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </Field>
                <Field
                  label={t('femaleMonthlyFee')}
                  helperText={`${t('currency')} / ${t('month')}`}
                >
                  <Input
                    type="number"
                    value={formData.femaleFeeMonthly}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        femaleFeeMonthly: e.target.value,
                      })
                    }
                    placeholder="0"
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
                >
                  <Input
                    type="number"
                    value={formData.maleFeePerSession}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maleFeePerSession: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </Field>
                <Field
                  label={t('femalePerSessionFee')}
                  helperText={`${t('currency')} / ${t('session')}`}
                >
                  <Input
                    type="number"
                    value={formData.femaleFeePerSession}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        femaleFeePerSession: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </Field>
              </SimpleGrid>
            </Box>

            <Flex justify="flex-end" mt={6}>
              <Button
                colorPalette="green"
                size="lg"
                onClick={handleSave}
                loading={saving}
              >
                {t('saveConfiguration')}
              </Button>
            </Flex>
          </VStack>
        </Box>
      </VStack>
    </PageLayout>
  );
};

export default ClubFeesPage;
