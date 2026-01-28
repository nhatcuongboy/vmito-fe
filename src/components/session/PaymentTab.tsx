'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Spinner,
  Center,
  Image,
  Flex,
  SimpleGrid,
  Input,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  Building2,
  User,
  QrCode,
  Plus,
  ExternalLink,
  AlertCircle,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { ISession, HostPaymentSettings, PaymentRecord, FeeType } from '@/lib/api/types';
import { PaymentSettingsService } from '@/lib/api/payment-settings.service';
import { PaymentService } from '@/lib/api/payment.service';
import { PaymentSettingsForm, SessionPaymentList } from '@/components/payment';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';

interface PaymentTabProps {
  session: ISession;
}

export default function PaymentTab({ session }: PaymentTabProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [paymentSettings, setPaymentSettings] = useState<HostPaymentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Payment management state
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [stats, setStats] = useState<{
    totalPlayers: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    submittedCount: number;
    approvedCount: number;
    pendingCount: number;
    rejectedCount: number;
  } | null>(null);

  // Split amount state
  const [splitAmount, setSplitAmount] = useState('');
  const [isSettingSplit, setIsSettingSplit] = useState(false);

  const loadPaymentSettings = useCallback(async () => {
    if (!session.hostId) return;

    setIsLoading(true);
    try {
      const settings = await PaymentSettingsService.getHostPaymentSettings(session.hostId);
      setPaymentSettings(settings);
    } catch (error) {
      console.error('Failed to load payment settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session.hostId]);

  const loadStats = useCallback(async () => {
    if (!session.id) return;

    try {
      const data = await PaymentService.getSessionPaymentStats(session.id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load payment stats:', error);
    }
  }, [session.id]);

  const loadPayments = useCallback(async () => {
    if (!session.id) return;

    setIsLoadingPayments(true);
    try {
      const data = await PaymentService.getSessionPayments(session.id);
      console.log('Loaded payments:', data);
      setPayments(data);
      // Load stats after payments are loaded
      await loadStats();
    } catch (error) {
      console.error('Failed to load payments:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('loadPaymentsFailed'),
      });
    } finally {
      setIsLoadingPayments(false);
    }
  }, [session.id, t, tCommon, loadStats]);

  useEffect(() => {
    loadPaymentSettings();
    loadPayments();
  }, [loadPaymentSettings, loadPayments]);

  const handleSave = async (
    data: Omit<HostPaymentSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsSaving(true);
    try {
      if (paymentSettings?.id) {
        // Update existing
        const updated = await PaymentSettingsService.updatePaymentSettings(
          paymentSettings.id,
          data
        );
        setPaymentSettings(updated);
      } else {
        // Create new
        const created = await PaymentSettingsService.createPaymentSettings(data);
        setPaymentSettings(created);
      }
      setIsEditing(false);
      toaster.success({
        title: tCommon('success'),
        description: paymentSettings?.id ? t('settingsUpdated') : t('settingsCreated'),
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

  const handleUploadQR = async (file: File) => {
    return PaymentSettingsService.uploadQRCode(file);
  };

  const goToPaymentSettingsPage = () => {
    router.push('/host/payment-settings');
  };

  // Payment management handlers
  const handleApprove = async (paymentId: string, notes?: string) => {
    try {
      await PaymentService.approvePayment(paymentId, { hostNotes: notes });
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
    return (
      <Center py={10}>
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }

  return (
    <VStack gap={6} align="stretch" pb={4}>
      {/* Header */}
      <Box
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        p={6}
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <Flex justify="space-between" align="start" mb={2}>
          <HStack>
            <CreditCard size={24} color="#3182ce" />
            <Heading size="md">{t('hostPaymentInfo')}</Heading>
          </HStack>
          <Button
            size="sm"
            variant="outline"
            onClick={goToPaymentSettingsPage}
            colorPalette="blue"
          >
            <ExternalLink size={14} />
            <Text ml={1}>{t('manageSettings')}</Text>
          </Button>
        </Flex>
        <Text fontSize="sm" color="gray.600" mt={2}>
          {t('paymentInfoDescription')}
        </Text>
      </Box>

      {/* Fee Configuration Info */}
      {session.feeConfig && (
        <Box
          bg="blue.50"
          _dark={{ bg: 'blue.900' }}
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor="blue.200"
        >
          <HStack mb={2}>
            <Text fontWeight="semibold" color="blue.700" _dark={{ color: 'blue.200' }}>
              {t('sessionFeeConfig')}
            </Text>
          </HStack>
          <VStack align="stretch" gap={1}>
            <Text fontSize="sm" color="blue.600" _dark={{ color: 'blue.300' }}>
              {t('feeType')}: {session.feeConfig.feeType === 'FIXED' ? t('fixed') : t('splitEvenly')}
            </Text>
            {session.feeConfig.feeType === 'FIXED' && (
              <>
                {session.feeConfig.maleFee && (
                  <Text fontSize="sm" color="blue.600" _dark={{ color: 'blue.300' }}>
                    {t('maleFee')}: {session.feeConfig.maleFee.toLocaleString('vi-VN')} VND
                  </Text>
                )}
                {session.feeConfig.femaleFee && (
                  <Text fontSize="sm" color="blue.600" _dark={{ color: 'blue.300' }}>
                    {t('femaleFee')}: {session.feeConfig.femaleFee.toLocaleString('vi-VN')} VND
                  </Text>
                )}
              </>
            )}
            {session.feeConfig.notes && (
              <Text fontSize="sm" color="blue.600" _dark={{ color: 'blue.300' }}>
                {t('notes')}: {session.feeConfig.notes}
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {/* Payment Settings */}
      {!paymentSettings && !isEditing ? (
        // No payment settings - show empty state
        <Box
          bg="orange.50"
          _dark={{ bg: 'orange.900' }}
          borderRadius="lg"
          p={6}
          border="2px dashed"
          borderColor="orange.200"
          textAlign="center"
        >
          <AlertCircle size={48} color="#F97316" style={{ margin: '0 auto 16px' }} />
          <Heading size="sm" mb={2} color="orange.700" _dark={{ color: 'orange.200' }}>
            {t('noPaymentSettings')}
          </Heading>
          <Text fontSize="sm" color="orange.600" _dark={{ color: 'orange.300' }} mb={4}>
            {t('noPaymentSettingsDescription')}
          </Text>
          <Button colorPalette="orange" onClick={() => setIsEditing(true)}>
            <Plus size={16} />
            <Text ml={1}>{t('addSettings')}</Text>
          </Button>
        </Box>
      ) : isEditing ? (
        // Edit/Create mode
        <Box>
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
      ) : (
        // Display mode
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="lg"
          p={6}
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <HStack justify="space-between" mb={4}>
            <Heading size="sm">{t('currentSettings')}</Heading>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              {tCommon('edit')}
            </Button>
          </HStack>

          {paymentSettings?.qrCodeUrl && (
            <Box mb={4} textAlign="center">
              <HStack justify="center" mb={2}>
                <QrCode size={16} color="#718096" />
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  {t('qrCode')}
                </Text>
              </HStack>
              <Image
                src={paymentSettings.qrCodeUrl}
                alt="QR Code"
                maxH="200px"
                mx="auto"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
            </Box>
          )}

          <VStack gap={3} align="stretch">
            {paymentSettings?.bankName && (
              <HStack>
                <Building2 size={16} color="#718096" />
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} minW="120px">
                  {t('bankName')}:
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {paymentSettings.bankName}
                </Text>
              </HStack>
            )}

            {paymentSettings?.bankAccountNumber && (
              <HStack>
                <CreditCard size={16} color="#718096" />
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} minW="120px">
                  {t('accountNumber')}:
                </Text>
                <Text fontSize="sm" fontWeight="medium" fontFamily="mono">
                  {paymentSettings.bankAccountNumber}
                </Text>
              </HStack>
            )}

            {paymentSettings?.accountHolderName && (
              <HStack>
                <User size={16} color="#718096" />
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} minW="120px">
                  {t('accountHolderName')}:
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {paymentSettings.accountHolderName}
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      )}

      {/* Split Amount Calculator - Only for SPLIT_EVENLY sessions */}
      {session.feeConfig?.feeType === FeeType.SPLIT_EVENLY && (
        <Box
          bg="purple.50"
          _dark={{ bg: 'purple.900' }}
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor="purple.200"
        >
          <Heading size="sm" mb={2}>
            {t('splitAmountCalculator')}
          </Heading>
          <Text fontSize="sm" color="purple.600" _dark={{ color: 'purple.300' }} mb={3}>
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
            />
            <Button
              colorPalette="purple"
              onClick={handleSetSplitAmount}
              loading={isSettingSplit}
              disabled={!splitAmount || isSettingSplit}
            >
              {t('calculateAndUpdate')}
            </Button>
          </HStack>
        </Box>
      )}

      {/* Info Box */}
      <Box
        bg="gray.50"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        p={4}
        border="1px solid"
        borderColor="gray.200"
      >
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
          💡 {t('paymentTabTip')}
        </Text>
      </Box>

      {/* Payment Statistics */}
      {stats && (
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="lg"
          p={6}
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
        >
          <Heading size="md" mb={4}>
            {t('paymentStatistics')}
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Box
              bg="blue.50"
              _dark={{ bg: 'blue.900' }}
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="blue.200"
            >
              <HStack mb={2}>
                <Users size={16} color="#3182ce" />
                <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.300' }}>
                  {t('totalPlayers')}
                </Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600" _dark={{ color: 'blue.300' }}>
                {stats.totalPlayers}
              </Text>
            </Box>
            <Box
              bg="blue.50"
              _dark={{ bg: 'blue.900' }}
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="blue.200"
            >
              <HStack mb={2}>
                <DollarSign size={16} color="#3182ce" />
                <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.300' }}>
                  {t('totalAmount')}
                </Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600" _dark={{ color: 'blue.300' }}>
                {stats.totalAmount.toLocaleString('vi-VN')}
              </Text>
              <Text fontSize="xs" color="gray.500">VND</Text>
            </Box>
            <Box
              bg="green.50"
              _dark={{ bg: 'green.900' }}
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="green.200"
            >
              <HStack mb={2}>
                <CheckCircle size={16} color="#38a169" />
                <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.300' }}>
                  {t('paidAmount')}
                </Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.600" _dark={{ color: 'green.300' }}>
                {stats.paidAmount.toLocaleString('vi-VN')}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {stats.approvedCount} {t('approvedPayments')}
              </Text>
            </Box>
            <Box
              bg="orange.50"
              _dark={{ bg: 'orange.900' }}
              p={4}
              borderRadius="md"
              border="1px solid"
              borderColor="orange.200"
            >
              <HStack mb={2}>
                <Clock size={16} color="#d69e2e" />
                <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: 'gray.300' }}>
                  {t('pendingAmount')}
                </Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="orange.600" _dark={{ color: 'orange.300' }}>
                {stats.pendingAmount.toLocaleString('vi-VN')}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {stats.pendingCount + stats.submittedCount} {t('waiting')}
              </Text>
            </Box>
          </SimpleGrid>
        </Box>
      )}

      {/* Payment Management Section */}
      <Box
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="lg"
        p={6}
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <Heading size="md" mb={4}>
          {t('paymentManagement')}
        </Heading>
        {isLoadingPayments ? (
          <Center py={10}>
            <Spinner size="lg" color="blue.500" />
          </Center>
        ) : (
          <SessionPaymentList
            session={session}
            payments={payments}
            onApprove={handleApprove}
            onReject={handleReject}
            onBulkApprove={handleBulkApprove}
            isLoading={false}
          />
        )}
      </Box>
    </VStack>
  );
}
