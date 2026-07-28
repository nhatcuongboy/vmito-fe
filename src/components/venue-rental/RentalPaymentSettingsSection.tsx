'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Button, Image } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import QRCodeUploader from '@/components/payment/QRCodeUploader';
import { toaster } from '@/components/ui/toaster';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  EImageCategory,
  VenueRentalDepositMode,
  VenueRentalPaymentSettings,
} from '@/lib/api/types';
import { UserImageService } from '@/lib/api/user-image.service';
import { Bank, getVietnamBanks, getVietQRImageUrl } from '@/lib/banks';
import SectionCard from './SectionCard';

const DEFAULTS: VenueRentalPaymentSettings = {
  venueId: '',
  bankName: null,
  bankAccountNumber: null,
  bankAccountName: null,
  qrUrl: null,
  qrPublicId: null,
  depositMode: VenueRentalDepositMode.NONE,
  depositValue: 0,
  depositDeadlineMinutes: 30,
  balanceDueHours: 2,
  refundCutoffHours: 24,
  refundBeforePercent: 100,
  refundAfterPercent: 0,
};

export default function RentalPaymentSettingsSection({
  venueId,
  canEdit,
}: {
  venueId: string;
  canEdit: boolean;
}) {
  const t = useTranslations('venueRental.paymentSettings');
  const [settings, setSettings] = useState<VenueRentalPaymentSettings>({
    ...DEFAULTS,
    venueId,
  });
  const [saved, setSaved] = useState(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrPublicId, setQrPublicId] = useState<string | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await VenueRentalService.getPaymentSettings(venueId);
      const next = { ...DEFAULTS, ...result, venueId };
      setSettings(next);
      setSaved(next);
      setQrPublicId(next.qrPublicId);
    } catch {
      const fallback = { ...DEFAULTS, venueId };
      setSettings(fallback);
      setSaved(fallback);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    load();
    getVietnamBanks().then(setBanks);
  }, [load]);

  const error = useMemo(() => {
    const depositEnabled = settings.depositMode !== VenueRentalDepositMode.NONE;
    if (
      depositEnabled &&
      (!settings.bankName?.trim() ||
        !settings.bankAccountNumber?.trim() ||
        !settings.bankAccountName?.trim())
    ) {
      return t('errors.bankRequired');
    }
    if (
      settings.depositMode === VenueRentalDepositMode.PERCENTAGE &&
      (settings.depositValue < 1 || settings.depositValue > 100)
    ) {
      return t('errors.percentage');
    }
    if (
      settings.depositMode === VenueRentalDepositMode.FIXED &&
      settings.depositValue <= 0
    ) {
      return t('errors.fixed');
    }
    if (
      settings.depositDeadlineMinutes < 10 ||
      settings.depositDeadlineMinutes > 1440
    ) {
      return t('errors.deadline');
    }
    if (settings.balanceDueHours < 0 || settings.balanceDueHours > 720) {
      return t('errors.balanceDue');
    }
    if (settings.refundCutoffHours < 0 || settings.refundCutoffHours > 8760) {
      return t('errors.refundCutoff');
    }
    if (
      settings.refundBeforePercent < 0 ||
      settings.refundBeforePercent > 100 ||
      settings.refundAfterPercent < 0 ||
      settings.refundAfterPercent > 100
    ) {
      return t('errors.refundPercent');
    }
    return null;
  }, [settings, t]);

  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);
  const patchNumber = (key: keyof VenueRentalPaymentSettings, value: string) =>
    setSettings((current) => ({ ...current, [key]: Number(value) || 0 }));

  const save = async () => {
    if (error || !canEdit) return;
    setSaving(true);
    try {
      const payload = {
        ...settings,
        bankName: settings.bankName || '',
        bankAccountNumber: settings.bankAccountNumber || '',
        bankAccountName: settings.bankAccountName || '',
        depositValue:
          settings.depositMode === VenueRentalDepositMode.NONE
            ? 0
            : settings.depositValue,
        qrUrl: settings.qrUrl || '',
        qrPublicId: qrPublicId || '',
      };
      delete (payload as Partial<VenueRentalPaymentSettings>).id;
      delete (payload as Partial<VenueRentalPaymentSettings>).venueId;
      const result = await VenueRentalService.updatePaymentSettings(
        venueId,
        payload
      );
      const next = { ...DEFAULTS, ...result, venueId };
      setSettings(next);
      setSaved(next);
      setQrPublicId(next.qrPublicId);
      toaster.success({ title: t('saved') });
    } finally {
      setSaving(false);
    }
  };

  const generatedQr = getVietQRImageUrl(
    settings.bankName || '',
    settings.bankAccountNumber || '',
    {
      accountName: settings.bankAccountName || undefined,
      bankList: banks,
    }
  );

  return (
    <SectionCard
      title={t('title')}
      description={t('description')}
      headerRight={
        dirty ? <Badge colorPalette="orange">{t('unsaved')}</Badge> : undefined
      }
      footer={
        canEdit ? (
          <Button
            colorPalette="green"
            loading={saving}
            disabled={!dirty || !!error}
            onClick={save}
          >
            {t('save')}
          </Button>
        ) : (
          <Text fontSize="sm" color="gray.500">
            {t('readOnly')}
          </Text>
        )
      }
    >
      {loading ? (
        <Spinner />
      ) : (
        <VStack align="stretch" gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field label={t('depositMode')}>
              <SearchableSelect
                value={settings.depositMode}
                isDisabled={!canEdit}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    depositMode: value as VenueRentalDepositMode,
                    depositValue:
                      value === VenueRentalDepositMode.NONE
                        ? 0
                        : current.depositValue,
                  }))
                }
                options={Object.values(VenueRentalDepositMode).map((value) => ({
                  value,
                  label: t(`mode.${value}`),
                }))}
              />
            </Field>
            {settings.depositMode !== VenueRentalDepositMode.NONE ? (
              <Field
                label={
                  settings.depositMode === VenueRentalDepositMode.PERCENTAGE
                    ? t('depositPercent')
                    : t('depositFixed')
                }
              >
                <Input
                  type="number"
                  min={
                    settings.depositMode === VenueRentalDepositMode.PERCENTAGE
                      ? 1
                      : 1000
                  }
                  max={
                    settings.depositMode === VenueRentalDepositMode.PERCENTAGE
                      ? 100
                      : undefined
                  }
                  step={
                    settings.depositMode === VenueRentalDepositMode.PERCENTAGE
                      ? 1
                      : 1000
                  }
                  disabled={!canEdit}
                  value={settings.depositValue}
                  onChange={(event) =>
                    patchNumber('depositValue', event.target.value)
                  }
                />
              </Field>
            ) : (
              <Box />
            )}
            <Field label={t('depositDeadline')}>
              <Input
                type="number"
                min={10}
                max={1440}
                disabled={!canEdit}
                value={settings.depositDeadlineMinutes}
                onChange={(event) =>
                  patchNumber('depositDeadlineMinutes', event.target.value)
                }
              />
            </Field>
            <Field label={t('balanceDue')}>
              <Input
                type="number"
                min={0}
                max={720}
                disabled={!canEdit}
                value={settings.balanceDueHours}
                onChange={(event) =>
                  patchNumber('balanceDueHours', event.target.value)
                }
              />
            </Field>
            <Field label={t('refundCutoff')}>
              <Input
                type="number"
                min={0}
                max={8760}
                disabled={!canEdit}
                value={settings.refundCutoffHours}
                onChange={(event) =>
                  patchNumber('refundCutoffHours', event.target.value)
                }
              />
            </Field>
            <Field label={t('refundBefore')}>
              <Input
                type="number"
                min={0}
                max={100}
                disabled={!canEdit}
                value={settings.refundBeforePercent}
                onChange={(event) =>
                  patchNumber('refundBeforePercent', event.target.value)
                }
              />
            </Field>
            <Field label={t('refundAfter')}>
              <Input
                type="number"
                min={0}
                max={100}
                disabled={!canEdit}
                value={settings.refundAfterPercent}
                onChange={(event) =>
                  patchNumber('refundAfterPercent', event.target.value)
                }
              />
            </Field>
          </SimpleGrid>

          <Text fontWeight="semibold">{t('bankSection')}</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Field label={t('bankName')}>
              <Input
                disabled={!canEdit}
                value={settings.bankName || ''}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    bankName: event.target.value || null,
                  }))
                }
              />
            </Field>
            <Field label={t('accountNumber')}>
              <Input
                disabled={!canEdit}
                value={settings.bankAccountNumber || ''}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    bankAccountNumber: event.target.value || null,
                  }))
                }
              />
            </Field>
            <Field label={t('accountName')}>
              <Input
                disabled={!canEdit}
                value={settings.bankAccountName || ''}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    bankAccountName: event.target.value || null,
                  }))
                }
              />
            </Field>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
            <Field label={t('customQr')}>
              <QRCodeUploader
                value={settings.qrUrl || undefined}
                disabled={!canEdit}
                onChange={(url) => {
                  if (!url) setQrPublicId(null);
                  setSettings((current) => ({
                    ...current,
                    qrUrl: url || null,
                    qrPublicId: url ? current.qrPublicId : null,
                  }));
                }}
                onUpload={async (file) => {
                  const uploaded = await UserImageService.uploadImage(
                    file,
                    EImageCategory.QR_CODE
                  );
                  setQrPublicId(uploaded.publicId);
                  return uploaded.url;
                }}
              />
            </Field>
            <Box borderWidth="1px" borderRadius="lg" p={4}>
              <Text fontWeight="semibold" mb={3}>
                {t('preview')}
              </Text>
              {settings.qrUrl || generatedQr ? (
                <Image
                  src={settings.qrUrl || generatedQr || ''}
                  alt={t('preview')}
                  maxH="220px"
                  mx="auto"
                  objectFit="contain"
                />
              ) : (
                <Text fontSize="sm" color="gray.500">
                  {t('previewEmpty')}
                </Text>
              )}
              <Text mt={3} fontSize="sm">
                {t('previewPolicy', {
                  mode: t(`mode.${settings.depositMode}`),
                  value: settings.depositValue,
                })}
              </Text>
            </Box>
          </SimpleGrid>
          {error ? (
            <Text color="red.500" fontSize="sm">
              {error}
            </Text>
          ) : null}
        </VStack>
      )}
    </SectionCard>
  );
}
