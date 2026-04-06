'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Image,
  Badge,
} from '@chakra-ui/react';
import { Input, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import {
  CreditCard,
  Building2,
  User,
  Save,
  Trash2,
  QrCode,
  ChevronDown,
  X,
} from 'lucide-react';
import { useState, ChangeEvent, useMemo, useRef, useEffect } from 'react';
import {
  HostPaymentSettings,
  UpdateHostPaymentSettingsRequest,
} from '@/lib/api/types';
import QRCodeUploader from './QRCodeUploader';
import { getVietQRImageUrl, findBankByName, vietnamBanks } from '@/lib/banks';

interface PaymentSettingsFormProps {
  initialData?: Partial<HostPaymentSettings>;
  onSubmit: (data: UpdateHostPaymentSettingsRequest) => Promise<void>;
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
  const [hasRemovedExistingQr, setHasRemovedExistingQr] = useState(false);
  const [isDefault, setIsDefault] = useState(initialData?.isDefault ?? true);

  // Bank selector combobox state
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const bankRef = useRef<HTMLDivElement>(null);

  const selectedBank = useMemo(
    () => (bankName ? findBankByName(bankName) : null),
    [bankName]
  );

  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return vietnamBanks;
    const q = bankSearch.toLowerCase();
    return vietnamBanks.filter(
      (b) =>
        b.shortName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q)
    );
  }, [bankSearch]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (bankRef.current && !bankRef.current.contains(e.target as Node)) {
        setIsBankOpen(false);
        setBankSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleBankSelect = (bank: (typeof vietnamBanks)[number]) => {
    setBankName(bank.shortName);
    setIsBankOpen(false);
    setBankSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: UpdateHostPaymentSettingsRequest = {
      bankName: bankName || undefined,
      bankAccountNumber: bankAccountNumber || undefined,
      accountHolderName: accountHolderName || undefined,
      isDefault,
    };

    // Include qrCodeUrl when uploaded, or send null when user explicitly removed an existing QR.
    if (qrCodeUrl && qrCodeUrl.trim() !== '') {
      data.qrCodeUrl = qrCodeUrl;
    } else if (hasRemovedExistingQr) {
      data.qrCodeUrl = null;
    }

    await onSubmit(data);
  };

  const handleQrCodeChange = (url: string | undefined) => {
    setQrCodeUrl(url);

    if (!url && initialData?.qrCodeUrl) {
      setHasRemovedExistingQr(true);
      return;
    }

    setHasRemovedExistingQr(false);
  };

  const isFormValid =
    bankName.trim() !== '' ||
    bankAccountNumber.trim() !== '' ||
    qrCodeUrl !== undefined;

  // Auto-generate QR from bank info when no custom QR is uploaded
  const autoQrUrl = useMemo(
    () =>
      !qrCodeUrl
        ? getVietQRImageUrl(bankName, bankAccountNumber, {
            accountName: accountHolderName || undefined,
          })
        : null,
    [bankName, bankAccountNumber, accountHolderName, qrCodeUrl]
  );

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
        {/* Bank Name — combobox */}
        <Box ref={bankRef} position="relative">
          <Flex align="center" gap={2} mb={1}>
            <Building2 size={16} color="#3182ce" />
            <Text fontSize="sm" fontWeight="medium">
              {t('bankName')}
            </Text>
          </Flex>

          {/* Trigger */}
          <Flex
            align="center"
            gap={2}
            px={3}
            minH="40px"
            border="1px solid"
            borderColor={isBankOpen ? 'blue.400' : 'gray.200'}
            borderRadius="md"
            bg="white"
            cursor={isLoading ? 'not-allowed' : 'pointer'}
            opacity={isLoading ? 0.6 : 1}
            onClick={() => !isLoading && setIsBankOpen((v) => !v)}
            userSelect="none"
          >
            {selectedBank ? (
              <>
                <Image
                  src={selectedBank.logo}
                  alt={selectedBank.shortName}
                  boxSize="22px"
                  objectFit="contain"
                  flexShrink={0}
                />
                <Text fontSize="sm" fontWeight="medium" flex={1}>
                  {selectedBank.shortName}
                  <Text as="span" fontWeight="normal" color="gray.500" ml={2}>
                    {selectedBank.name}
                  </Text>
                </Text>
                <Box
                  as="span"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setBankName('');
                  }}
                  color="gray.400"
                  _hover={{ color: 'gray.600' }}
                  lineHeight={1}
                >
                  <X size={14} />
                </Box>
              </>
            ) : (
              <>
                <Text fontSize="sm" color="gray.400" flex={1}>
                  Chọn ngân hàng...
                </Text>
                <ChevronDown size={14} color="#718096" />
              </>
            )}
          </Flex>

          {/* Dropdown */}
          {isBankOpen && (
            <Box
              position="absolute"
              top="calc(100% + 4px)"
              left={0}
              right={0}
              zIndex={1000}
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              shadow="lg"
              display="flex"
              flexDirection="column"
              maxH="260px"
              overflow="hidden"
            >
              <Box p={2} borderBottom="1px solid" borderColor="gray.100">
                <input
                  autoFocus
                  placeholder="Tìm ngân hàng..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  style={{
                    width: '100%',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </Box>
              <Box overflowY="auto" flex={1}>
                {filteredBanks.map((bank) => (
                  <Flex
                    key={bank.code}
                    align="center"
                    gap={2}
                    px={3}
                    py={2}
                    cursor="pointer"
                    bg={selectedBank?.code === bank.code ? 'blue.50' : 'white'}
                    _hover={{
                      bg:
                        selectedBank?.code === bank.code
                          ? 'blue.50'
                          : 'gray.50',
                    }}
                    onClick={() => handleBankSelect(bank)}
                  >
                    <Image
                      src={bank.logo}
                      alt={bank.shortName}
                      boxSize="24px"
                      objectFit="contain"
                      flexShrink={0}
                    />
                    <Box overflow="hidden">
                      <Text fontSize="sm" fontWeight="medium">
                        {bank.shortName}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        overflow="hidden"
                        whiteSpace="nowrap"
                        textOverflow="ellipsis"
                      >
                        {bank.name}
                      </Text>
                    </Box>
                  </Flex>
                ))}
                {filteredBanks.length === 0 && (
                  <Box p={4} textAlign="center">
                    <Text fontSize="sm" color="gray.400">
                      Không tìm thấy ngân hàng
                    </Text>
                  </Box>
                )}
              </Box>
            </Box>
          )}
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
          <Flex align="center" gap={2} mb={1} justify="space-between">
            <Flex align="center" gap={2}>
              <QrCode size={16} color="#3182ce" />
              <Text fontSize="sm" fontWeight="medium">
                {t('qrCode')}
              </Text>
            </Flex>
            <Badge colorPalette="gray" variant="subtle" fontSize="xs">
              {t('optional') || 'Tùy chọn'}
            </Badge>
          </Flex>

          {/* Live preview of auto-generated QR */}
          {autoQrUrl && (
            <Box
              mb={3}
              p={3}
              bg="green.50"
              border="1px solid"
              borderColor="green.200"
              borderRadius="lg"
              textAlign="center"
            >
              <Text fontSize="xs" color="green.700" mb={2} fontWeight="medium">
                Mã QR tự động từ thông tin ngân hàng
              </Text>
              <Image
                src={autoQrUrl}
                alt="Auto QR Code"
                maxH="160px"
                mx="auto"
                borderRadius="md"
              />
              <Text fontSize="xs" color="green.600" mt={2}>
                Người chơi sẽ thấy mã QR này. Bạn có thể tải lên mã QR khác nếu
                muốn.
              </Text>
            </Box>
          )}

          <QRCodeUploader
            value={qrCodeUrl}
            onChange={handleQrCodeChange}
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
            colorPalette="green"
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
