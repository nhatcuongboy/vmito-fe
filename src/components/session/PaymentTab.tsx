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
} from 'lucide-react';
import { ISession, HostPaymentSettings } from '@/lib/api/types';
import { PaymentSettingsService } from '@/lib/api/payment-settings.service';
import { PaymentSettingsForm } from '@/components/payment';
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

  useEffect(() => {
    loadPaymentSettings();
  }, [loadPaymentSettings]);

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
    </VStack>
  );
}
