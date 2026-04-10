'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Input,
  SimpleGrid,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, useMemo, useEffect } from 'react';
import { VModal } from '@/components/ui/VModal';
import { Button } from '@/components/ui/chakra-compat';
import { HostPaymentSettings } from '@/lib/api/types';
import { ChevronDown } from 'lucide-react';
import {
  getVietnamBanks,
  RECOMMENDED_BANK_CODES,
  Bank,
  findBankInList,
} from '@/lib/banks';
import { toaster } from '@/components/ui/toaster';

interface FastTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingAmount: number;
  hostPaymentSettings: HostPaymentSettings;
  defaultMessage?: string;
}

export default function FastTransferModal({
  isOpen,
  onClose,
  pendingAmount,
  hostPaymentSettings,
  defaultMessage = '',
}: FastTransferModalProps) {
  const t = useTranslations('payment');
  const tCommon = useTranslations('common');

  const [amount, setAmount] = useState<string>(pendingAmount.toString());
  const [message, setMessage] = useState<string>(defaultMessage);
  const [banks, setBanks] = useState<Bank[]>([]);

  // Fetch banks on mount
  useEffect(() => {
    getVietnamBanks().then(setBanks);
  }, []);

  // Sync amount when pendingAmount changes (e.g. modal opens with new amount)
  useEffect(() => {
    setAmount(pendingAmount.toString());
  }, [pendingAmount]);

  useEffect(() => {
    setMessage(defaultMessage);
  }, [defaultMessage]);

  // Default to TPBank (or first available recommended)
  const defaultBankCode = 'TPB';
  const [selectedBankListCode, setSelectedBankListCode] =
    useState<string>(defaultBankCode);
  const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');

  const selectedBank = useMemo(() => {
    return (
      banks.find((b) => b.code === selectedBankListCode) ||
      banks[0] ||
      ({
        code: 'TPB',
        shortName: 'TPBank',
        logo: 'https://cdn.vietqr.io/img/TPB.png',
      } as Bank)
    );
  }, [selectedBankListCode, banks]);

  const recommendedBanks = useMemo(() => {
    return banks.filter((b) => RECOMMENDED_BANK_CODES.includes(b.code));
  }, [banks]);

  const otherBanks = useMemo(() => {
    return banks
      .filter((b) => !RECOMMENDED_BANK_CODES.includes(b.code))
      .filter(
        (b) =>
          b.shortName.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
          b.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
      );
  }, [bankSearchQuery, banks]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const val = e.target.value.replace(/\D/g, '');
    setAmount(val);
  };

  const setPresetAmount = (val: number) => {
    setAmount(val.toString());
  };

  // Find the recipient bank entry by matching the host's freetext bankName
  const recipientBank = useMemo(() => {
    return findBankInList(hostPaymentSettings.bankName || '', banks);
  }, [hostPaymentSettings.bankName, banks]);

  const handleTransfer = () => {
    if (!amount || parseInt(amount) === 0) {
      toaster.error({
        title: tCommon('error'),
        description: t('amountRequired') || 'Vui lòng nhập số tiền',
      });
      return;
    }

    if (!selectedBank) return;

    // Build VietQR deeplink correctly according to documentation
    // format: vietqr://pay?app={appId}&ba={account}@{bank}&am={amount}&tn={msg}&bn={name}&url={callback}
    const searchParams = new URLSearchParams();

    // 1. App ID (from selectedBank)
    const appId =
      new URL(
        selectedBank.deepLink || 'https://dl.vietqr.io/pay?app='
      ).searchParams.get('app') || selectedBank.code.toLowerCase();
    searchParams.set('app', appId);

    // 2. Recipient Account (ba: accountNumber@bankCode)
    if (hostPaymentSettings.bankAccountNumber) {
      const bankCodeForBa = recipientBank?.code.toLowerCase() ?? '';
      const ba = bankCodeForBa
        ? `${hostPaymentSettings.bankAccountNumber}@${bankCodeForBa}`
        : hostPaymentSettings.bankAccountNumber;
      searchParams.set('ba', ba);
    }

    // 3. Amount (am)
    searchParams.set('am', amount);

    // 4. Message (tn)
    if (message) {
      searchParams.set('tn', message);
    }

    // 5. Receiver Name (bn)
    if (hostPaymentSettings.accountHolderName) {
      searchParams.set('bn', hostPaymentSettings.accountHolderName);
    }

    // 6. Callback URL (url) - return to app after success
    searchParams.set('url', window.location.href);

    // Construct the direct deeplink
    const deeplink = `https://dl.vietqr.io/pay?${searchParams.toString()}`;

    // Execute transfer
    window.location.href = deeplink;
    setTimeout(() => onClose(), 500);
  };

  return (
    <>
      <VModal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        title="Thanh toán"
        hideSecondaryAction
      >
        <Box p={4} pb={safeAreaBottom}>
          <VStack align="stretch" gap={6}>
            {/* Recipient Account section */}
            <Box>
              <Text fontSize="sm" color="gray.500" mb={3}>
                Tài khoản người nhận
              </Text>
              <HStack gap={3}>
                <Box bg="orange.100" p={2} borderRadius="md">
                  <Image
                    src={selectedBank.logo}
                    alt={selectedBank.shortName}
                    maxW="32px"
                    maxH="32px"
                    objectFit="contain"
                  />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="lg" fontWeight="semibold">
                    {hostPaymentSettings.bankAccountNumber}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {selectedBank.shortName} • {selectedBank.name}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Amount section */}
            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>
                Số tiền
              </Text>
              <HStack borderBottom="1px solid" borderColor="blue.400" pb={1}>
                <Input
                  variant="flushed"
                  fontSize="3xl"
                  fontWeight="semibold"
                  placeholder="0"
                  value={amount ? parseInt(amount).toLocaleString('vi-VN') : ''}
                  onChange={handleAmountChange}
                />
                <Text fontWeight="semibold" color="gray.600">
                  VND
                </Text>
              </HStack>
            </Box>

            {/* Message section */}
            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>
                Lời nhắn
              </Text>
              <Input
                variant="flushed"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Nhập lời nhắn..."
              />
            </Box>

            {/* Presets */}
            <HStack gap={3}>
              <Button
                size="sm"
                variant="outline"
                borderRadius="full"
                onClick={() => setPresetAmount(100000)}
              >
                100.000
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderRadius="full"
                onClick={() => setPresetAmount(1000000)}
              >
                1.000.000
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderRadius="full"
                onClick={() => setPresetAmount(10000000)}
              >
                10.000.000
              </Button>
            </HStack>

            {/* Bottom Action Area */}
            <Box pt={4} mt={4} borderTop="1px solid" borderColor="gray.100">
              <HStack justify="space-between">
                <VStack align="start" gap={1}>
                  <Text fontSize="sm" color="gray.500">
                    Bằng ứng dụng
                  </Text>
                  <HStack
                    cursor="pointer"
                    onClick={() => setIsBankSelectorOpen(true)}
                  >
                    <Image
                      src={selectedBank.logo}
                      alt={selectedBank.shortName}
                      w="20px"
                      h="20px"
                      objectFit="contain"
                    />
                    <Text fontWeight="medium">{selectedBank.shortName}</Text>
                    <ChevronDown size={16} />
                  </HStack>
                </VStack>
                <Button
                  colorPalette="blue"
                  size="lg"
                  px={8}
                  borderRadius="full"
                  onClick={handleTransfer}
                >
                  {t('method.bankTransfer')}
                </Button>
              </HStack>
            </Box>
          </VStack>
        </Box>
      </VModal>

      {/* Bank Selector Drawer */}
      <VModal
        isOpen={isBankSelectorOpen}
        onClose={() => setIsBankSelectorOpen(false)}
        size="md"
        title="Chọn ứng dụng ngân hàng"
        hideSecondaryAction
      >
        <VStack align="stretch" gap={4} pb={safeAreaBottom}>
          <Input
            placeholder="Tìm kiếm"
            value={bankSearchQuery}
            onChange={(e) => setBankSearchQuery(e.target.value)}
          />

          <Box pt={2}>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={3}>
              Ngân hàng đề xuất
            </Text>
            <SimpleGrid columns={3} gap={3}>
              {recommendedBanks.map((bank) => (
                <VStack
                  key={bank.id}
                  border="1px solid"
                  borderColor={
                    selectedBankListCode === bank.code ? 'blue.500' : 'gray.200'
                  }
                  bg={selectedBankListCode === bank.code ? 'blue.50' : 'white'}
                  borderRadius="lg"
                  p={3}
                  cursor="pointer"
                  onClick={() => {
                    setSelectedBankListCode(bank.code);
                    setIsBankSelectorOpen(false);
                  }}
                >
                  <Image
                    src={bank.logo}
                    alt={bank.shortName}
                    maxH="32px"
                    objectFit="contain"
                  />
                  <Text fontSize="xs" textAlign="center">
                    {bank.shortName}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </Box>

          <Box pt={4}>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={3}>
              Các ngân hàng khác
            </Text>
            <SimpleGrid columns={3} gap={3}>
              {otherBanks.map((bank) => (
                <VStack
                  key={bank.id}
                  border="1px solid"
                  borderColor={
                    selectedBankListCode === bank.code ? 'blue.500' : 'gray.200'
                  }
                  bg={selectedBankListCode === bank.code ? 'blue.50' : 'white'}
                  borderRadius="lg"
                  p={3}
                  cursor="pointer"
                  onClick={() => {
                    setSelectedBankListCode(bank.code);
                    setIsBankSelectorOpen(false);
                  }}
                >
                  <Image
                    src={bank.logo}
                    alt={bank.shortName}
                    maxH="32px"
                    objectFit="contain"
                  />
                  <Text fontSize="xs" textAlign="center" lineClamp={1}>
                    {bank.shortName}
                  </Text>
                </VStack>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>
      </VModal>
    </>
  );
}

const safeAreaBottom = { base: 6, md: 4 };
