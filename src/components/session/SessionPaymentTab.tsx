'use client';
import { Input } from '@/components/ui/Input';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Image,
  Flex,
  SimpleGrid,
  Skeleton,
  Stack,
  Badge,
} from '@chakra-ui/react';
import { Button, LegacySelect } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  Building2,
  User,
  QrCode,
  Plus,
  ExternalLink,
  AlertCircle,
  Calculator,
} from 'lucide-react';
import {
  ISession,
  HostPaymentSettings,
  UpdateHostPaymentSettingsRequest,
  PaymentRecord,
  PaymentMethod,
  ISessionExpense,
  FeeType,
} from '@/lib/api/types';
import { PaymentSettingsService } from '@/lib/api/payment-settings.service';
import { PaymentService } from '@/lib/api/payment.service';
import { SessionExpensesService } from '@/lib/api/session-expenses.service';
import {
  PaymentSettingsForm,
  SessionPaymentList,
  SessionExpenseSection,
} from '@/components/payment';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import { ROUTES } from '@/constants';
import { getVietQRImageUrl } from '@/lib/banks';

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

  // Expenses state
  const [expenses, setExpenses] = useState<ISessionExpense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);

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

  const loadPayments = useCallback(async () => {
    if (!session.id) return;

    setIsLoadingPayments(true);
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
      setIsLoadingPayments(false);
    }
  }, [session.id, t, tCommon]);

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
        description: paymentSettings?.id
          ? t('settingsUpdated')
          : t('settingsCreated'),
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
    return PaymentSettingsService.uploadQRCode(file);
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
      await PaymentService.approvePayment(paymentId, {
        hostNotes: notes,
        amount,
        paymentMethod,
      });
      await loadPayments(); // Refresh payment list
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
      await PaymentService.rejectPayment(paymentId, {
        hostNotes: notes || 'Rejected',
      });
      await loadPayments(); // Refresh payment list
    } catch (error) {
      console.error('Failed to reject payment:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('rejectPaymentFailed'),
      });
    }
  };

  const handleBulkApprove = async (paymentIds: string[]) => {
    try {
      await PaymentService.bulkApprovePayments(paymentIds);
      await loadPayments(); // Refresh payment list
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
      await PaymentService.setSplitAmount(session.id, amount);
      await loadPayments(); // Refresh to show updated amounts
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

  if (isLoading) {
    // Skeleton layout — no full-page spinner
    return (
      <VStack gap={4} align="stretch" pb={4}>
        {/* Header skeleton */}
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="lg"
          p={5}
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <HStack justify="space-between">
            <HStack gap={3}>
              <Skeleton height="24px" width="24px" borderRadius="md" />
              <Skeleton height="22px" width="180px" borderRadius="md" />
            </HStack>
            <Skeleton height="32px" width="120px" borderRadius="md" />
          </HStack>
          <Skeleton height="14px" width="60%" borderRadius="md" mt={3} />
        </Box>

        {/* Info grid skeleton */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Box
            bg="green.50"
            _dark={{ bg: 'green.900' }}
            borderRadius="lg"
            p={4}
            border="1px solid"
            borderColor="green.200"
          >
            <Skeleton height="18px" width="140px" borderRadius="md" mb={3} />
            <Stack gap={2}>
              <Skeleton height="14px" width="70%" borderRadius="md" />
              <Skeleton height="14px" width="55%" borderRadius="md" />
              <Skeleton height="14px" width="60%" borderRadius="md" />
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
            <HStack justify="space-between" mb={4}>
              <Skeleton height="18px" width="140px" borderRadius="md" />
              <Skeleton height="30px" width="60px" borderRadius="md" />
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

        {/* Payment list skeleton */}
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="lg"
          p={5}
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Skeleton height="22px" width="160px" borderRadius="md" mb={4} />
          <Stack gap={3}>
            {[...Array(4)].map((_, i) => (
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
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch" pb={4}>
      {/* Header */}
      <Box
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        p={5}
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <Flex justify="space-between" align="center">
          <HStack gap={2}>
            <CreditCard size={20} color="#3182ce" />
            <Heading size="sm">{t('hostPaymentInfo')}</Heading>
          </HStack>
          <Button
            size="sm"
            variant="outline"
            onClick={goToPaymentSettingsPage}
            colorPalette="green"
          >
            <ExternalLink size={14} />
            <Text ml={1}>{t('manageSettings')}</Text>
          </Button>
        </Flex>
        <Text fontSize="xs" color="gray.500" mt={2}>
          {t('paymentInfoDescription')}
        </Text>
      </Box>

      {/* Fee Config + Payment Settings — side by side on desktop */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        {/* Fee Configuration */}
        {session.feeConfig ? (
          <Box
            bg="green.50"
            _dark={{ bg: 'green.950' }}
            borderRadius="lg"
            p={4}
            border="1px solid"
            borderColor="green.200"
          >
            <HStack mb={3}>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="green.700"
                _dark={{ color: 'green.200' }}
              >
                {t('sessionFeeConfig')}
              </Text>
              <Badge
                colorPalette={
                  session.feeConfig.feeType === FeeType.FIXED
                    ? 'green'
                    : 'purple'
                }
                variant="subtle"
                fontSize="xs"
              >
                {session.feeConfig.feeType === FeeType.FIXED
                  ? t('fixed')
                  : t('splitEvenly')}
              </Badge>
            </HStack>
            <VStack align="stretch" gap={1.5}>
              {session.feeConfig.feeType === FeeType.FIXED && (
                <>
                  {session.feeConfig.maleFee ? (
                    <HStack gap={2}>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        _dark={{ color: 'gray.400' }}
                        minW="70px"
                      >
                        {t('maleFee')}:
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="green.700"
                        _dark={{ color: 'green.300' }}
                      >
                        {session.feeConfig.maleFee.toLocaleString('vi-VN')} ₫
                      </Text>
                    </HStack>
                  ) : null}
                  {session.feeConfig.femaleFee ? (
                    <HStack gap={2}>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        _dark={{ color: 'gray.400' }}
                        minW="70px"
                      >
                        {t('femaleFee')}:
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="green.700"
                        _dark={{ color: 'green.300' }}
                      >
                        {session.feeConfig.femaleFee.toLocaleString('vi-VN')} ₫
                      </Text>
                    </HStack>
                  ) : null}
                </>
              )}
              {session.feeConfig.notes && (
                <Text
                  fontSize="xs"
                  color="green.600"
                  _dark={{ color: 'green.400' }}
                  mt={1}
                >
                  {session.feeConfig.notes}
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
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="sm" color="gray.400">
              {t('sessionFeeConfig')}
            </Text>
          </Box>
        )}

        {/* Payment Settings card */}
        {isEditing ? (
          <Box
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="lg"
            p={5}
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
          >
            <HStack justify="space-between" mb={4}>
              <Heading size="sm">
                {paymentSettings ? t('editSettings') : t('addSettings')}
              </Heading>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                {tCommon('cancel')}
              </Button>
            </HStack>
            <PaymentSettingsForm
              initialData={paymentSettings || undefined}
              onSubmit={handleSave}
              onUploadQR={handleUploadQR}
              isLoading={isSaving}
            />
          </Box>
        ) : !paymentSettings ? (
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
              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                {tCommon('edit')}
              </Button>
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
                  style={{ width: '100%', backgroundColor: 'white' }}
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
                        { accountName: paymentSettings.accountHolderName }
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

      {/* Split Amount Calculator — only for SPLIT_EVENLY sessions */}
      {session.feeConfig?.feeType === FeeType.SPLIT_EVENLY && (
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

      {/* Payment Management */}
      <Box
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        p={5}
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <Heading size="sm" mb={4}>
          {t('paymentManagement')}
        </Heading>

        <SessionExpenseSection
          sessionId={session.id}
          expenses={expenses}
          onAdd={handleAddExpense}
          onUpdate={handleUpdateExpense}
          onDelete={handleDeleteExpense}
          isLoading={isLoadingExpenses}
        />

        <Box mt={4}>
          <SessionPaymentList
            session={session}
            payments={payments}
            onApprove={handleApprove}
            onReject={handleReject}
            onBulkApprove={handleBulkApprove}
            totalExpenses={totalExpenses}
            isLoading={isLoadingPayments}
          />
        </Box>
      </Box>
    </VStack>
  );
}
