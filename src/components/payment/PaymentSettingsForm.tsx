'use client';

import { Box, Text, VStack, HStack, Flex } from '@chakra-ui/react';
import { Input, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { CreditCard, Building2, User, Save, Trash2 } from 'lucide-react';
import { useState, ChangeEvent } from 'react';
import { HostPaymentSettings } from '@/lib/api/types';
import QRCodeUploader from './QRCodeUploader';

interface PaymentSettingsFormProps {
  initialData?: Partial<HostPaymentSettings>;
  onSubmit: (data: Omit<HostPaymentSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onUploadQR: (file: File) => Promise<string>;
  isLoading?: boolean;
  isDeleting?: boolean;
  showDelete?: boolean;
}

export default function PaymentSettingsForm({
  initialData,
  onSubmit,
  onDelete,
  onUploadQR,
  isLoading = false,
  isDeleting = false,
  showDelete = false,
}: PaymentSettingsFormProps) {
  const t = useTranslations('payment');

  const [bankName, setBankName] = useState(initialData?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(
    initialData?.bankAccountNumber || ''
  );
  const [accountHolderName, setAccountHolderName] = useState(
    initialData?.accountHolderName || ''
  );
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(
    initialData?.qrCodeUrl || undefined
  );
  const [isDefault, setIsDefault] = useState(initialData?.isDefault ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: Omit<HostPaymentSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      bankName: bankName || undefined,
      bankAccountNumber: bankAccountNumber || undefined,
      accountHolderName: accountHolderName || undefined,
      isDefault,
    };

    // Only include qrCodeUrl if it has a valid value
    if (qrCodeUrl && qrCodeUrl.trim() !== '') {
      data.qrCodeUrl = qrCodeUrl;
    }

    await onSubmit(data);
  };

  const isFormValid =
    bankName.trim() !== '' ||
    bankAccountNumber.trim() !== '' ||
    qrCodeUrl !== undefined;

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      p={4}
      bg="white"
    >
      <VStack gap={4} align="stretch">
        {/* Bank Name */}
        <Box>
          <Flex align="center" gap={2} mb={1}>
            <Building2 size={16} color="#3182ce" />
            <Text fontSize="sm" fontWeight="medium">
              {t('bankName')}
            </Text>
          </Flex>
          <Input
            placeholder={t('bankNamePlaceholder')}
            value={bankName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setBankName(e.target.value)
            }
            disabled={isLoading}
          />
        </Box>

        {/* Account Number */}
        <Box>
          <Flex align="center" gap={2} mb={1}>
            <CreditCard size={16} color="#3182ce" />
            <Text fontSize="sm" fontWeight="medium">
              {t('accountNumber')}
            </Text>
          </Flex>
          <Input
            placeholder={t('accountNumberPlaceholder')}
            value={bankAccountNumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setBankAccountNumber(e.target.value)
            }
            disabled={isLoading}
          />
        </Box>

        {/* Account Holder Name */}
        <Box>
          <Flex align="center" gap={2} mb={1}>
            <User size={16} color="#3182ce" />
            <Text fontSize="sm" fontWeight="medium">
              {t('accountHolderName')}
            </Text>
          </Flex>
          <Input
            placeholder={t('accountHolderNamePlaceholder')}
            value={accountHolderName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setAccountHolderName(e.target.value)
            }
            disabled={isLoading}
          />
        </Box>

        {/* QR Code */}
        <Box>
          <Flex align="center" gap={2} mb={2}>
            <Text fontSize="sm" fontWeight="medium">
              {t('qrCode')}
            </Text>
          </Flex>
          <QRCodeUploader
            value={qrCodeUrl}
            onChange={setQrCodeUrl}
            onUpload={onUploadQR}
            disabled={isLoading}
          />
        </Box>

        {/* Default Toggle */}
        <Flex align="center" gap={2}>
          <Box
            as="label"
            cursor={isLoading ? 'not-allowed' : 'pointer'}
            display="inline-flex"
            alignItems="center"
            opacity={isLoading ? 0.6 : 1}
          >
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setIsDefault(e.target.checked)
              }
              disabled={isLoading}
              style={{ display: 'none' }}
            />
            <Box
              w="20px"
              h="20px"
              border="2px solid"
              borderColor={isDefault ? 'blue.500' : 'gray.300'}
              bg={isDefault ? 'blue.500' : 'white'}
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.2s"
            >
              {isDefault && (
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth={3}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </Box>
          </Box>
          <Text fontSize="sm" color="gray.600">
            {t('setAsDefault')}
          </Text>
        </Flex>

        {/* Actions */}
        <HStack justify="flex-end" gap={2} pt={2}>
          {showDelete && onDelete && (
            <Button
              variant="outline"
              colorPalette="red"
              onClick={onDelete}
              loading={isDeleting}
              disabled={isLoading}
            >
              <Trash2 size={16} />
              <Text ml={1}>{t('delete')}</Text>
            </Button>
          )}
          <Button
            type="submit"
            colorPalette="blue"
            loading={isLoading}
            disabled={!isFormValid || isDeleting}
          >
            <Save size={16} />
            <Text ml={1}>{t('save')}</Text>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
