'use client';
import { Input } from '@/components/ui/Input';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Flex,
  SimpleGrid,
  Skeleton,
  Stack,
  Badge,
} from '@chakra-ui/react';
import {
  Button,
  IconButton,
  LegacySelect,
} from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { compressImage } from '@/lib/utils/image';
import {
  CreditCard,
  Building2,
  User,
  QrCode,
  Plus,
  Pencil,
  ExternalLink,
  AlertCircle,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import {
  ISession,
  HostPaymentSettings,
  UpdateHostPaymentSettingsRequest,
  PaymentRecord,
  PaymentMethod,
  ISessionExpense,
  SessionFeeConfig,
  FeeType,
} from '@/lib/api/types';
import { PaymentSettingsService } from '@/lib/api/payment-settings.service';
import { PaymentService } from '@/lib/api/payment.service';
import { PaymentReminderService } from '@/lib/api/payment-reminder.service';
import { SessionExpensesService } from '@/lib/api/session-expenses.service';
import { FeeService } from '@/lib/api/fee.service';
import {
  PaymentSettingsForm,
  SessionPaymentList,
  SessionPaymentSummary,
  SessionExpenseSection,
} from '@/components/payment';
import SessionFeeConfigForm from '@/components/fee/SessionFeeConfigForm';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import { getVietQRImageUrl, getVietnamBanks, Bank } from '@/lib/banks';
import { VModal } from '@/components/ui/VModal';

interface SessionPaymentTabProps {
  session: ISession;
}

export default function SessionPaymentTab({ session }: SessionPaymentTabProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [paymentSettings, setPaymentSettings] =
    useState<HostPaymentSettings | null>(null);
  const [myPaymentSettings, setMyPaymentSettings] = useState<
    HostPaymentSettings[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitchingSettings, setIsSwitchingSettings] = useState(false);

  // Payment management state
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  // Split amount state
  const [splitAmount, setSplitAmount] = useState('');
  const [isSettingSplit, setIsSettingSplit] = useState(false);

  // Recalculate state
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Expenses state
  const [expenses, setExpenses] = useState<ISessionExpense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);

  // Fee config state
  const [feeConfig, setFeeConfig] = useState<SessionFeeConfig | null>(
    session.feeConfig ?? null
  );
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeEnabled, setFeeEnabled] = useState(false);
  const [feeType, setFeeType] = useState<FeeType>(FeeType.FIXED);
  const [feeMaleFee, setFeeMaleFee] = useState<number | undefined>(undefined);
  const [feeFemaleFee, setFeeFemaleFee] = useState<number | undefined>(
    undefined
  );
  const [feeNotes, setFeeNotes] = useState('');

  useEffect(() => {
    setFeeConfig(session.feeConfig ?? null);
  }, [session.feeConfig]);

  // Bank list state
  const [banks, setBanks] = useState<Bank[]>([]);
  useEffect(() => {
    getVietnamBanks().then(setBanks);
  }, []);

  const loadPaymentSettings = useCallback(
    async (showLoading = true) => {
      if (!session.hostId) return;

      if (showLoading) {
        setIsLoading(true);
      }
      try {
        const settings = await PaymentSettingsService.getMyPaymentSettings();
        setMyPaymentSettings(settings);

        if (settings.length > 0) {
          const current =
            settings.find((item) => item.isDefault) ?? settings[0];
          setPaymentSettings(current);
        } else {
          const hostDefault =
            await PaymentSettingsService.getHostPaymentSettings(session.hostId);
          setPaymentSettings(hostDefault);
        }
      } catch (error) {
        console.error('Failed to load payment settings:', error);
        toaster.error({
          title: tCommon('error'),
          description: t('loadSettingsFailed'),
        });
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [session.hostId, t, tCommon]
  );

  const loadPayments = useCallback(
    async (showLoading = true) => {
      if (!session.id) return;

      if (showLoading) {
        setIsLoadingPayments(true);
      }
      try {
        const data = await PaymentService.getSessionPayments(session.id);
        setPayments(data);
      } catch (error) {
        console.error('Failed to load payments:', error);
        toaster.error({
          title: tCommon('error'),
          description: t('loadPaymentsFailed'),
        });
      } finally {
        if (showLoading) {
          setIsLoadingPayments(false);
        }
      }
    },
    [session.id, t, tCommon]
  );

  const loadExpenses = useCallback(async () => {
    if (!session.id) return;

    setIsLoadingExpenses(true);
    try {
      const data = await SessionExpensesService.getSessionExpenses(session.id);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoadingExpenses(false);
    }
  }, [session.id]);

  useEffect(() => {
    loadPaymentSettings();
    loadPayments();
    loadExpenses();
  }, [loadPaymentSettings, loadPayments, loadExpenses]);

  const handleSave = async (data: UpdateHostPaymentSettingsRequest) => {
    setIsSaving(true);
    try {
      const isCreating = !paymentSettings?.id;
      if (paymentSettings?.id) {
        // Update existing
        await PaymentSettingsService.updatePaymentSettings(
          paymentSettings.id,
          data
        );
      } else {
        // Create new
        await PaymentSettingsService.createPaymentSettings(data);
      }
      await loadPaymentSettings(false);
      setIsEditing(false);
      toaster.success({
        title: tCommon('success'),
        description: isCreating ? t('settingsCreated') : t('settingsUpdated'),
      });
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      toaster.error({
        title: tCommon('error'),
        description: paymentSettings?.id
          ? t('updateSettingsFailed')
          : t('createSettingsFailed'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPaymentSettings = async (settingId: string) => {
    if (!settingId || settingId === paymentSettings?.id) {
      return;
    }

    setIsSwitchingSettings(true);
    try {
      const updatedDefault =
        await PaymentSettingsService.setDefaultPaymentSettings(settingId);

      setPaymentSettings(updatedDefault);
      setMyPaymentSettings((prev) =>
        prev.map((item) => ({
          ...item,
          isDefault: item.id === updatedDefault.id,
        }))
      );

      toaster.success({
        title: tCommon('success'),
        description: t('settingsSwitched'),
      });
    } catch (error) {
      console.error('Failed to switch payment settings:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('switchSettingsFailed'),
      });
    } finally {
      setIsSwitchingSettings(false);
    }
  };

  const handleUploadQR = async (file: File) => {
    const compressedFile = await compressImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
    });
    return PaymentSettingsService.uploadQRCode(compressedFile);
  };

  const goToPaymentSettingsPage = () => {
    router.push(ROUTES.HOST.PAYMENT_SETTINGS);
  };

  // Payment management handlers
  const handleApprove = async (
    paymentId: string,
    notes?: string,
    amount?: number,
    paymentMethod?: PaymentMethod
  ) => {
    try {
      const updatedPayment = await PaymentService.approvePayment(paymentId, {
        hostNotes: notes,
        amount,
        paymentMethod,
      });
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === updatedPayment.id
            ? { ...payment, ...updatedPayment }
            : payment
        )
      );
    } catch (error) {
      console.error('Failed to approve payment:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('approvePaymentFailed'),
      });
    }
  };

  const handleReject = async (paymentId: string, notes?: string) => {
    try {
      const updatedPayment = await PaymentService.rejectPayment(paymentId, {
        hostNotes: notes || 'Rejected',
      });
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === updatedPayment.id
            ? { ...payment, ...updatedPayment }
            : payment
        )
      );
    } catch (error) {
      console.error('Failed to reject payment:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('rejectPaymentFailed'),
      });
    }
  };

  const handleRemind = async (paymentId: string) => {
    await PaymentReminderService.createSingleReminder({ paymentId });
  };

  const handleBulkApprove = async (paymentIds: string[]) => {
    try {
      const updatedPayments =
        await PaymentService.bulkApprovePayments(paymentIds);
      const updatedById = new Map(
        updatedPayments.map((payment) => [payment.id, payment])
      );
      setPayments((prev) =>
        prev.map((payment) => {
          const updatedPayment = updatedById.get(payment.id);
          return updatedPayment ? { ...payment, ...updatedPayment } : payment;
        })
      );
    } catch (error) {
      console.error('Failed to bulk approve payments:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('bulkApprovePaymentsFailed'),
      });
    }
  };

  // Expense handlers
  const handleAddExpense = async (name: string, amount: number) => {
    try {
      const newExpense = await SessionExpensesService.createExpense(
        session.id,
        name,
        amount
      );
      setExpenses((prev) => [...prev, newExpense]);
      toaster.success({
        title: tCommon('success'),
        description: t('expenseCreated'),
      });
    } catch (error) {
      console.error('Failed to create expense:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('createExpenseFailed'),
      });
      throw error;
    }
  };

  const handleUpdateExpense = async (
    expenseId: string,
    name: string,
    amount: number
  ) => {
    try {
      const updated = await SessionExpensesService.updateExpense(
        session.id,
        expenseId,
        name,
        amount
      );
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? updated : e))
      );
      toaster.success({
        title: tCommon('success'),
        description: t('expenseUpdated'),
      });
    } catch (error) {
      console.error('Failed to update expense:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('updateExpenseFailed'),
      });
      throw error;
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await SessionExpensesService.deleteExpense(session.id, expenseId);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      toaster.success({
        title: tCommon('success'),
        description: t('expenseDeleted'),
      });
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('deleteExpenseFailed'),
      });
      throw error;
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSetSplitAmount = async () => {
    const amount = parseFloat(splitAmount);
    if (isNaN(amount) || amount <= 0) {
      toaster.error({
        title: tCommon('error'),
        description: t('invalidAmount'),
      });
      return;
    }

    setIsSettingSplit(true);
    try {
      const updatedPayments = await PaymentService.setSplitAmount(
        session.id,
        amount
      );
      setPayments(updatedPayments);
      setSplitAmount(''); // Clear input
      toaster.success({
        title: tCommon('success'),
        description: t('splitAmountSuccess'),
      });
    } catch (error) {
      console.error('Failed to set split amount:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('setSplitAmountFailed'),
      });
    } finally {
      setIsSettingSplit(false);
    }
  };

  const openFeeEditor = () => {
    setFeeEnabled(!!feeConfig);
    setFeeType(feeConfig?.feeType ?? FeeType.FIXED);
    setFeeMaleFee(feeConfig?.maleFee);
    setFeeFemaleFee(feeConfig?.femaleFee);
    setFeeNotes(feeConfig?.notes ?? '');
    setIsEditingFee(true);
  };

  const handleSaveFeeConfig = async () => {
    setIsSavingFee(true);
    try {
      if (!feeEnabled) {
        if (feeConfig) {
          await FeeService.deleteSessionFeeConfig(session.id);
          setFeeConfig(null);
        }
        setIsEditingFee(false);
        return;
      }

      const data = {
        feeType,
        maleFee: feeType === FeeType.FIXED ? feeMaleFee : undefined,
        femaleFee: feeType === FeeType.FIXED ? feeFemaleFee : undefined,
        notes: feeNotes || undefined,
      };
      const updated = feeConfig
        ? await FeeService.updateSessionFeeConfig(session.id, data)
        : await FeeService.createSessionFeeConfig(session.id, data);
      setFeeConfig(updated);
      setIsEditingFee(false);
    } catch (error) {
      console.error('Failed to save fee config:', error);
    } finally {
      setIsSavingFee(false);
    }
  };

  const goToTransactionsPage = () => {
    router.push(ROUTES.HOST.TRANSACTIONS);
  };

  const handleRecalculatePayments = async () => {
    setIsRecalculating(true);
    try {
      const result = await FeeService.recalculateAllPayments(session.id);

      // Reload payments to show updated amounts
      await loadPayments(false);

      toaster.success({
        title: tCommon('success'),
        description: t('recalculateSuccess', { count: result.updated }),
      });
    } catch (error) {
      console.error('Failed to recalculate payments:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('recalculateFailed'),
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading) {
    // Skeleton layout mirrors the loaded structure below — no full-page spinner
    return (
      <VStack gap={4} align="stretch" pb={4}>
        {/* Fee config + payment settings skeleton */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Box
            bg="green.50"
            _dark={{ bg: 'green.950' }}
            borderRadius="xl"
            p={5}
            border="1px solid"
            borderColor="green.200"
          >
            <HStack justify="space-between" mb={4}>
              <HStack gap={2}>
                <Skeleton height="32px" width="32px" borderRadius="lg" />
                <Skeleton height="20px" width="140px" borderRadius="md" />
              </HStack>
              <HStack gap={2}>
                <Skeleton height="24px" width="70px" borderRadius="md" />
                <Skeleton height="24px" width="24px" borderRadius="full" />
              </HStack>
            </HStack>
            <Stack gap={2.5}>
              <Skeleton height="16px" width="50%" borderRadius="md" />
              <Skeleton height="16px" width="45%" borderRadius="md" />
            </Stack>
          </Box>

          <Box
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="lg"
            p={5}
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
          >
            <HStack justify="space-between" mb={3}>
              <Skeleton height="18px" width="120px" borderRadius="md" />
              <HStack gap={2}>
                <Skeleton height="24px" width="90px" borderRadius="md" />
                <Skeleton height="24px" width="50px" borderRadius="md" />
              </HStack>
            </HStack>
            <HStack gap={4} align="start">
              <Skeleton
                height="100px"
                width="100px"
                borderRadius="md"
                flexShrink={0}
              />
              <Stack gap={2} flex={1}>
                <Skeleton height="14px" width="80%" borderRadius="md" />
                <Skeleton height="14px" width="65%" borderRadius="md" />
                <Skeleton height="14px" width="70%" borderRadius="md" />
              </Stack>
            </HStack>
          </Box>
        </SimpleGrid>

        {/* Payment summary skeleton */}
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="xl"
          p={5}
          border="1px solid"
          borderColor="gray.200"
        >
          <Skeleton height="18px" width="140px" borderRadius="md" mb={4} />
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={3}>
            {[...Array(4)].map((_, i) => (
              <Box
                key={i}
                p={3}
                borderRadius="lg"
                bg="gray.50"
                _dark={{ bg: 'gray.700' }}
              >
                <Skeleton height="12px" width="60%" borderRadius="md" mb={2} />
                <Skeleton height="20px" width="80%" borderRadius="md" />
              </Box>
            ))}
          </SimpleGrid>
          <Skeleton height="56px" borderRadius="lg" />
        </Box>

        {/* Payment list skeleton */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={4}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Skeleton height="20px" width="120px" borderRadius="md" mb={4} />
          <Stack gap={3}>
            {[...Array(3)].map((_, i) => (
              <Box
                key={i}
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                p={3}
              >
                <HStack justify="space-between">
                  <HStack gap={3}>
                    <Skeleton height="32px" width="32px" borderRadius="full" />
                    <Stack gap={1}>
                      <Skeleton height="14px" width="100px" borderRadius="md" />
                      <Skeleton height="12px" width="60px" borderRadius="md" />
                    </Stack>
                  </HStack>
                  <HStack gap={2}>
                    <Skeleton height="16px" width="70px" borderRadius="md" />
                    <Skeleton height="22px" width="60px" borderRadius="full" />
                  </HStack>
                </HStack>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Expense section skeleton */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          p={4}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <HStack justify="space-between" mb={4}>
            <Skeleton height="20px" width="100px" borderRadius="md" />
            <Skeleton height="28px" width="110px" borderRadius="md" />
          </HStack>
          <Stack gap={3}>
            {[...Array(2)].map((_, i) => (
              <HStack
                key={i}
                justify="space-between"
                p={3}
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
              >
                <HStack gap={3}>
                  <Skeleton height="36px" width="36px" borderRadius="lg" />
                  <Stack gap={1}>
                    <Skeleton height="14px" width="120px" borderRadius="md" />
                    <Skeleton height="14px" width="70px" borderRadius="md" />
                  </Stack>
                </HStack>
                <Skeleton height="28px" width="60px" borderRadius="full" />
              </HStack>
            ))}
          </Stack>
        </Box>

        <Flex justify="center">
          <Skeleton height="36px" width="180px" borderRadius="md" />
        </Flex>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch" pb={4}>
      {/* Fee Config + Payment Settings — side by side on desktop */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {/* Fee Configuration */}
        {feeConfig ? (
          <Box
            bgGradient="linear(to-br, green.50, white, green.100)"
            _dark={{
              bgGradient: 'linear(to-br, green.950, gray.900, green.900)',
            }}
            borderRadius="xl"
            p={5}
            border="2px solid"
            borderColor="green.300"
            boxShadow="0 10px 26px rgba(23, 154, 59, 0.12)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              insetY: 0,
              left: 0,
              width: '5px',
              bg: 'green.500',
            }}
          >
            <HStack mb={4} justify="space-between" align="center">
              <HStack gap={2}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxSize="32px"
                  borderRadius="lg"
                  bg="green.100"
                  color="green.700"
                  _dark={{ bg: 'green.900', color: 'green.200' }}
                >
                  <Calculator size={17} />
                </Box>
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color="green.800"
                  _dark={{ color: 'green.100' }}
                >
                  {t('sessionFeeConfig')}
                </Text>
              </HStack>
              <HStack gap={2}>
                <Badge
                  colorPalette={
                    feeConfig.feeType === FeeType.FIXED ? 'green' : 'purple'
                  }
                  variant="solid"
                  fontSize="xs"
                  px={2.5}
                  py={1}
                  borderRadius="md"
                >
                  {feeConfig.feeType === FeeType.FIXED
                    ? t('fixed')
                    : t('splitEvenly')}
                </Badge>
                <Button
                  size="xs"
                  variant="ghost"
                  color="green.700"
                  _dark={{ color: 'green.200' }}
                  onClick={openFeeEditor}
                  aria-label={t('editFeeConfig')}
                >
                  <Pencil size={14} />
                </Button>
                <IconButton
                  size="xs"
                  colorPalette="green"
                  variant="ghost"
                  borderRadius="full"
                  aria-label={t('recalculatePayments')}
                  title={t('recalculatePayments')}
                  onClick={handleRecalculatePayments}
                  loading={isRecalculating}
                  disabled={isRecalculating}
                >
                  <RefreshCw size={12} />
                </IconButton>
              </HStack>
            </HStack>
            <VStack align="stretch" gap={2.5}>
              {feeConfig.feeType === FeeType.FIXED && (
                <>
                  {feeConfig.maleFee ? (
                    <HStack gap={3}>
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        _dark={{ color: 'gray.400' }}
                        minW="70px"
                      >
                        {t('maleFee')}:
                      </Text>
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color="green.700"
                        _dark={{ color: 'green.300' }}
                      >
                        {feeConfig.maleFee.toLocaleString('vi-VN')} ₫
                      </Text>
                    </HStack>
                  ) : null}
                  {feeConfig.femaleFee ? (
                    <HStack gap={3}>
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        _dark={{ color: 'gray.400' }}
                        minW="70px"
                      >
                        {t('femaleFee')}:
                      </Text>
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color="green.700"
                        _dark={{ color: 'green.300' }}
                      >
                        {feeConfig.femaleFee.toLocaleString('vi-VN')} ₫
                      </Text>
                    </HStack>
                  ) : null}
                </>
              )}
              {feeConfig.notes && (
                <Text
                  fontSize="sm"
                  color="green.600"
                  _dark={{ color: 'green.400' }}
                  mt={1}
                >
                  {feeConfig.notes}
                </Text>
              )}
            </VStack>
          </Box>
        ) : (
          <Box
            bg="gray.50"
            _dark={{ bg: 'gray.800' }}
            borderRadius="lg"
            p={4}
            border="1px dashed"
            borderColor="gray.300"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={3}
          >
            <Text fontSize="sm" color="gray.400">
              {t('sessionFeeConfig')}
            </Text>
            <Button
              size="sm"
              colorPalette="green"
              variant="outline"
              onClick={openFeeEditor}
            >
              <Plus size={14} />
              <Text ml={1}>{t('configureFeeConfig')}</Text>
            </Button>
          </Box>
        )}

        {/* Payment Settings card */}
        {!paymentSettings ? (
          <Box
            bg="orange.50"
            _dark={{ bg: 'orange.950' }}
            borderRadius="lg"
            p={5}
            border="2px dashed"
            borderColor="orange.200"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            gap={3}
          >
            <AlertCircle size={36} color="#F97316" />
            <Box>
              <Text
                fontWeight="semibold"
                fontSize="sm"
                color="orange.700"
                _dark={{ color: 'orange.200' }}
                mb={1}
              >
                {t('noPaymentSettings')}
              </Text>
              <Text
                fontSize="xs"
                color="orange.600"
                _dark={{ color: 'orange.300' }}
              >
                {t('noPaymentSettingsDescription')}
              </Text>
            </Box>
            <Button
              size="sm"
              colorPalette="orange"
              onClick={() => setIsEditing(true)}
            >
              <Plus size={14} />
              <Text ml={1}>{t('addSettings')}</Text>
            </Button>
          </Box>
        ) : (
          <Box
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="lg"
            p={5}
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
          >
            <HStack justify="space-between" mb={3}>
              <Text fontSize="sm" fontWeight="semibold">
                {t('currentSettings')}
              </Text>
              <HStack gap={2}>
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="green"
                  onClick={goToPaymentSettingsPage}
                >
                  <ExternalLink size={12} />
                  <Text ml={1}>{t('manageAllAccounts')}</Text>
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  {tCommon('edit')}
                </Button>
              </HStack>
            </HStack>

            {myPaymentSettings.length > 1 && (
              <Box mb={3}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('savedAccounts')}
                </Text>
                <LegacySelect
                  value={paymentSettings?.id || ''}
                  onChange={(e) => handleSelectPaymentSettings(e.target.value)}
                  disabled={isSwitchingSettings}
                >
                  <option value="">{t('selectSavedAccount')}</option>
                  {myPaymentSettings.map((item) => {
                    const label = [
                      item.bankName || t('noBank'),
                      item.bankAccountNumber
                        ? `- ${item.bankAccountNumber}`
                        : null,
                      item.isDefault ? `(${t('default')})` : null,
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <option key={item.id} value={item.id}>
                        {label}
                      </option>
                    );
                  })}
                </LegacySelect>
              </Box>
            )}

            <HStack gap={4} align="start">
              {paymentSettings && (
                <>
                  {/* QR Code thumbnail: prefer uploaded, fall back to auto-generated */}
                  {(() => {
                    const qrUrl =
                      paymentSettings.qrCodeUrl ||
                      getVietQRImageUrl(
                        paymentSettings.bankName ?? '',
                        paymentSettings.bankAccountNumber ?? '',
                        {
                          accountName: paymentSettings.accountHolderName,
                          bankList: banks,
                        }
                      );
                    if (!qrUrl) return null;
                    return (
                      <Box flexShrink={0}>
                        <HStack gap={1} mb={1}>
                          <QrCode size={12} color="#718096" />
                          <Text fontSize="xs" color="gray.500">
                            {t('qrCode')}
                          </Text>
                        </HStack>
                        <Image
                          src={qrUrl}
                          alt="QR Code"
                          boxSize="100px"
                          objectFit="contain"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                        />
                      </Box>
                    );
                  })()}

                  {/* Bank info */}
                  <VStack gap={2} align="stretch" flex={1} minW={0}>
                    {paymentSettings.bankName && (
                      <HStack gap={2} align="start">
                        <Building2
                          size={14}
                          color="#718096"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            {t('bankName')}
                          </Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {paymentSettings.bankName}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                    {paymentSettings.bankAccountNumber && (
                      <HStack gap={2} align="start">
                        <CreditCard
                          size={14}
                          color="#718096"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            {t('accountNumber')}
                          </Text>
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            fontFamily="mono"
                            wordBreak="break-all"
                          >
                            {paymentSettings.bankAccountNumber}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                    {paymentSettings.accountHolderName && (
                      <HStack gap={2} align="start">
                        <User
                          size={14}
                          color="#718096"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <Box>
                          <Text fontSize="xs" color="gray.500">
                            {t('accountHolderName')}
                          </Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {paymentSettings.accountHolderName}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                  </VStack>
                </>
              )}
            </HStack>
          </Box>
        )}
      </SimpleGrid>

      <VModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title={paymentSettings ? t('editSettings') : t('addSettings')}
        size="lg"
        hideSecondaryAction
        showFooterDivider={false}
        maxBodyHeight={{ base: '75vh', md: '70vh' }}
      >
        <PaymentSettingsForm
          initialData={paymentSettings || undefined}
          onSubmit={handleSave}
          onUploadQR={handleUploadQR}
          isLoading={isSaving}
        />
      </VModal>

      <VModal
        isOpen={isEditingFee}
        onClose={() => setIsEditingFee(false)}
        title={feeConfig ? t('editFeeConfig') : t('configureFeeConfig')}
        size="lg"
        primaryActionText={tCommon('save')}
        onPrimaryAction={handleSaveFeeConfig}
        isPrimaryLoading={isSavingFee}
        secondaryActionText={tCommon('cancel')}
        maxBodyHeight={{ base: '75vh', md: '70vh' }}
      >
        <SessionFeeConfigForm
          enabled={feeEnabled}
          onEnabledChange={setFeeEnabled}
          feeType={feeType}
          onFeeTypeChange={setFeeType}
          maleFee={feeMaleFee}
          onMaleFeeChange={setFeeMaleFee}
          femaleFee={feeFemaleFee}
          onFemaleFeeChange={setFeeFemaleFee}
          notes={feeNotes}
          onNotesChange={setFeeNotes}
          disabled={isSavingFee}
        />
      </VModal>

      {/* Split Amount Calculator — only for SPLIT_EVENLY sessions */}
      {feeConfig?.feeType === FeeType.SPLIT_EVENLY && (
        <Box
          bg="purple.50"
          _dark={{ bg: 'purple.950' }}
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor="purple.200"
        >
          <HStack mb={2}>
            <Calculator size={16} color="#805AD5" />
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="purple.700"
              _dark={{ color: 'purple.200' }}
            >
              {t('splitAmountCalculator')}
            </Text>
          </HStack>
          <Text
            fontSize="xs"
            color="purple.600"
            _dark={{ color: 'purple.300' }}
            mb={3}
          >
            {t('splitAmountDescription')}
          </Text>
          <HStack>
            <Input
              type="number"
              placeholder={t('totalAmountPlaceholder')}
              value={splitAmount}
              onChange={(e) => setSplitAmount(e.target.value)}
              disabled={isSettingSplit}
              bg="white"
              _dark={{ bg: 'gray.700' }}
              size="sm"
            />
            <Button
              colorPalette="purple"
              size="sm"
              onClick={handleSetSplitAmount}
              loading={isSettingSplit}
              disabled={!splitAmount || isSettingSplit}
            >
              {t('calculateAndUpdate')}
            </Button>
          </HStack>
        </Box>
      )}

      <SessionPaymentSummary
        session={session}
        payments={payments}
        totalExpenses={totalExpenses}
      />

      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      >
        <SessionPaymentList
          session={session}
          payments={payments}
          onApprove={handleApprove}
          onReject={handleReject}
          onBulkApprove={handleBulkApprove}
          onRemind={handleRemind}
          totalExpenses={totalExpenses}
          isLoading={isLoadingPayments}
          showSummary={false}
          headerTitle={t('income')}
        />
      </Box>

      <SessionExpenseSection
        sessionId={session.id}
        expenses={expenses}
        onAdd={handleAddExpense}
        onUpdate={handleUpdateExpense}
        onDelete={handleDeleteExpense}
        isLoading={isLoadingExpenses}
      />

      <Flex justify="center">
        <Button
          size="sm"
          variant="outline"
          colorPalette="green"
          onClick={goToTransactionsPage}
        >
          <ExternalLink size={14} />
          <Text ml={1}>{t('viewAllTransactions')}</Text>
        </Button>
      </Flex>
    </VStack>
  );
}
