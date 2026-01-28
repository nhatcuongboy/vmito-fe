'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { CreditCard, Plus } from 'lucide-react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import { Button } from '@/components/ui/chakra-compat';
import { PaymentSettingsForm } from '@/components/payment';
import { PaymentSettingsService } from '@/lib/api/payment-settings.service';
import { HostPaymentSettings, UserRole } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';

function PaymentSettingsContent() {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  const [settings, setSettings] = useState<HostPaymentSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const data = await PaymentSettingsService.getMyPaymentSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('loadSettingsFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleCreate = async (
    data: Omit<HostPaymentSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const newSettings = await PaymentSettingsService.createPaymentSettings(data);
      setSettings((prev) => [...prev, newSettings]);
      setIsCreating(false);
      toaster.success({
        title: tCommon('success'),
        description: t('settingsCreated'),
      });
    } catch (error) {
      console.error('Failed to create settings:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('createSettingsFailed'),
      });
    }
  };

  const handleUpdate = async (
    id: string,
    data: Omit<HostPaymentSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    setSavingId(id);
    try {
      const updated = await PaymentSettingsService.updatePaymentSettings(id, data);
      setSettings((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
      setEditingId(null);
      toaster.success({
        title: tCommon('success'),
        description: t('settingsUpdated'),
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('updateSettingsFailed'),
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await PaymentSettingsService.deletePaymentSettings(id);
      setSettings((prev) => prev.filter((s) => s.id !== id));
      toaster.success({
        title: tCommon('success'),
        description: t('settingsDeleted'),
      });
    } catch (error) {
      console.error('Failed to delete settings:', error);
      toaster.error({
        title: tCommon('error'),
        description: t('deleteSettingsFailed'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadQR = async (file: File) => {
    return PaymentSettingsService.uploadQRCode(file);
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">
          {tCommon('loading')}
        </Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.md" py={6}>
      <VStack gap={6} align="stretch">
        <HStack justify="space-between">
          <HStack>
            <CreditCard size={24} color="#3182ce" />
            <Heading size="lg">{t('settings')}</Heading>
          </HStack>
          {!isCreating && settings.length > 0 && (
            <Button
              colorPalette="blue"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} />
              <Text ml={1}>{t('addSettings')}</Text>
            </Button>
          )}
        </HStack>

        <Text color="gray.600">
          {t('settingsDescription')}
        </Text>

        {/* Existing Settings */}
        {settings.map((setting) => (
          <Box key={setting.id}>
            {editingId === setting.id ? (
              <PaymentSettingsForm
                initialData={setting}
                onSubmit={(data) => handleUpdate(setting.id, data)}
                onDelete={() => handleDelete(setting.id)}
                onUploadQR={handleUploadQR}
                isLoading={savingId === setting.id}
                isDeleting={deletingId === setting.id}
                showDelete
              />
            ) : (
              <Box
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
                bg="white"
              >
                <HStack justify="space-between" mb={3}>
                  <HStack>
                    <Text fontWeight="semibold">
                      {setting.bankName || t('noBank')}
                    </Text>
                    {setting.isDefault && (
                      <Box
                        px={2}
                        py={0.5}
                        bg="blue.100"
                        color="blue.700"
                        borderRadius="md"
                        fontSize="xs"
                        fontWeight="medium"
                      >
                        {t('default')}
                      </Box>
                    )}
                  </HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(setting.id)}
                  >
                    {tCommon('edit')}
                  </Button>
                </HStack>

                <VStack align="stretch" gap={1}>
                  {setting.bankAccountNumber && (
                    <Text fontSize="sm" color="gray.600">
                      {t('accountNumber')}: {setting.bankAccountNumber}
                    </Text>
                  )}
                  {setting.accountHolderName && (
                    <Text fontSize="sm" color="gray.600">
                      {t('accountHolderName')}: {setting.accountHolderName}
                    </Text>
                  )}
                  {setting.qrCodeUrl && (
                    <Text fontSize="sm" color="green.600">
                      {t('qrCodeUploaded')}
                    </Text>
                  )}
                </VStack>
              </Box>
            )}
          </Box>
        ))}

        {/* Create New Form */}
        {isCreating && (
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">{t('addSettings')}</Heading>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsCreating(false)}
              >
                {tCommon('cancel')}
              </Button>
            </HStack>
            <PaymentSettingsForm
              onSubmit={handleCreate}
              onUploadQR={handleUploadQR}
            />
          </Box>
        )}

        {/* Empty State */}
        {settings.length === 0 && !isCreating && (
          <Box
            textAlign="center"
            py={10}
            border="2px dashed"
            borderColor="gray.200"
            borderRadius="lg"
          >
            <CreditCard size={48} color="#A0AEC0" style={{ margin: '0 auto' }} />
            <Text mt={4} mb={4} color="gray.500">
              {t('noSettings')}
            </Text>
            <Button
              colorPalette="blue"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} />
              <Text ml={1}>{t('addSettings')}</Text>
            </Button>
          </Box>
        )}
      </VStack>
    </Container>
  );
}

export default function PaymentSettingsPage() {
  const t = useTranslations('payment');

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Suspense>
        <Box minH="100vh">
          <TopBar title={t('settings')} />
          <PaymentSettingsContent />
        </Box>
      </Suspense>
    </ProtectedRouteGuard>
  );
}
