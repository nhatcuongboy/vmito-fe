'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Box, Flex, Heading, Text } from '@chakra-ui/react';
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
import { EMemberStatus, IClubMember, IClubMonthlyMember } from '@/types/club';
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
  const tCommon = useTranslations('common');
  const params = useParams();
  const routeClubId = params.id as string;
  const [clubId, setClubId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubMembers, setClubMembers] = useState<IClubMember[]>([]);
  const [monthlyMembers, setMonthlyMembers] = useState<IClubMonthlyMember[]>(
    []
  );
  const [selectedMonthlyUserId, setSelectedMonthlyUserId] = useState('');
  const [monthlyMemberSaving, setMonthlyMemberSaving] = useState(false);

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

  // Resolve the route param (slug or id) to the actual club id exactly once
  // per routeClubId change. Kept separate from loadFees so that setting
  // clubId here doesn't also re-trigger loadFees's own effect a second time.
  useEffect(() => {
    if (!routeClubId) return;
    let cancelled = false;

    resolveClubId()
      .then((resolvedClubId) => {
        if (!cancelled) setClubId(resolvedClubId);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to resolve club:', error);
        toaster.error({ title: t('failedToLoadFees') });
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [routeClubId, resolveClubId, t]);

  const loadFees = useCallback(async () => {
    if (!clubId) return;

    try {
      setLoading(true);
      const [feeConfig, membersData, monthlyMembersData] = await Promise.all([
        ClubsService.getClubFeeForMonth(clubId, selectedYear, selectedMonth),
        ClubsService.getClubMembers(clubId),
        ClubsService.getClubMonthlyMembers(clubId, selectedYear, selectedMonth),
      ]);

      setClubMembers(membersData);
      setMonthlyMembers(monthlyMembersData);
      setSelectedMonthlyUserId('');

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
  }, [clubId, selectedMonth, selectedYear, t]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

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

  const monthlyMemberUserIds = new Set(
    monthlyMembers.map((member) => member.userId)
  );
  const availableMonthlyMembers = clubMembers.filter(
    (member) =>
      member.status === EMemberStatus.ACTIVE &&
      !monthlyMemberUserIds.has(member.userId)
  );

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'MALE':
        return tCommon('male');
      case 'FEMALE':
        return tCommon('female');
      case 'OTHER':
        return tCommon('other');
      case 'PREFER_NOT_TO_SAY':
        return tCommon('preferNotToSay');
      default:
        return '';
    }
  };

  const handleAddMonthlyMember = async () => {
    if (!selectedMonthlyUserId || !clubId) return;

    try {
      setMonthlyMemberSaving(true);
      const added = await ClubsService.upsertClubMonthlyMember(clubId, {
        userId: selectedMonthlyUserId,
        year: selectedYear,
        month: selectedMonth,
      });
      setMonthlyMembers((prev) => [...prev, added]);
      setSelectedMonthlyUserId('');
      toaster.success({ title: t('monthlyMemberAddedSuccess') });
    } catch (error) {
      console.error('Failed to add monthly member:', error);
      toaster.error({ title: t('failedToUpdateMonthlyMembers') });
    } finally {
      setMonthlyMemberSaving(false);
    }
  };

  const handleRemoveMonthlyMember = async (userId: string) => {
    if (!clubId) return;

    try {
      setMonthlyMemberSaving(true);
      await ClubsService.deleteClubMonthlyMember(
        clubId,
        userId,
        selectedYear,
        selectedMonth
      );
      setMonthlyMembers((prev) =>
        prev.filter((member) => member.userId !== userId)
      );
      toaster.success({ title: t('monthlyMemberRemovedSuccess') });
    } catch (error) {
      console.error('Failed to remove monthly member:', error);
      toaster.error({ title: t('failedToUpdateMonthlyMembers') });
    } finally {
      setMonthlyMemberSaving(false);
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

        <Box bg="bg" p={6} borderRadius="lg" shadow="sm" borderWidth="1px">
          <VStack spacing={5} align="stretch">
            <Box>
              <Flex justify="space-between" align="center" gap={3} wrap="wrap">
                <Box>
                  <Heading size="sm">{t('monthlyMembers')}</Heading>
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    {t('monthlyMembersDescription')}
                  </Text>
                </Box>
                <Badge colorPalette="green" variant="subtle">
                  {t(`month${selectedMonth}`)} {selectedYear}
                </Badge>
              </Flex>
            </Box>

            <HStack spacing={3} align="flex-end">
              <Box flex="1" minW={0}>
                <Field label={t('selectMember')}>
                  <VSelect
                    value={selectedMonthlyUserId}
                    onChange={(e) => setSelectedMonthlyUserId(e.target.value)}
                    disabled={monthlyMemberSaving}
                  >
                    <option value="">{t('selectMember')}</option>
                    {availableMonthlyMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.user.name}
                      </option>
                    ))}
                  </VSelect>
                </Field>
              </Box>
              <Button
                colorPalette="green"
                onClick={handleAddMonthlyMember}
                disabled={!selectedMonthlyUserId}
                loading={monthlyMemberSaving}
              >
                {t('addMonthlyMember')}
              </Button>
            </HStack>

            <Divider />

            {monthlyMembers.length === 0 ? (
              <Text color="fg.muted" fontSize="sm">
                {t('noMonthlyMembers')}
              </Text>
            ) : (
              <VStack spacing={2} align="stretch">
                {monthlyMembers.map((member) => (
                  <Flex
                    key={member.id}
                    justify="space-between"
                    align="center"
                    gap={3}
                    p={3}
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="md"
                  >
                    <Box minW={0}>
                      <Flex align="center" gap={2}>
                        <Text fontWeight="semibold" lineClamp={1}>
                          {member.user.name}
                        </Text>
                        {member.user.gender && (
                          <Badge
                            colorPalette={
                              member.user.gender === 'FEMALE' ? 'pink' : 'blue'
                            }
                            variant="subtle"
                            flexShrink={0}
                          >
                            {getGenderLabel(member.user.gender)}
                          </Badge>
                        )}
                      </Flex>
                      <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                        {member.user.email}
                      </Text>
                    </Box>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      loading={monthlyMemberSaving}
                      onClick={() => handleRemoveMonthlyMember(member.userId)}
                    >
                      {t('remove')}
                    </Button>
                  </Flex>
                ))}
              </VStack>
            )}
          </VStack>
        </Box>
      </VStack>
    </PageLayout>
  );
};

export default ClubFeesPage;
