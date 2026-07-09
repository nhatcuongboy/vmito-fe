'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Text, Image } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/ChakraModal';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { toaster } from '@/components/ui/toaster';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export default function ShareScoreboardModal({ isOpen, onClose, url }: Props) {
  const t = useTranslations('pages.tournaments.scoreboard');
  const [qr, setQr] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) return;
    QRCode.toDataURL(url, { width: 240, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [isOpen, url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toaster.success({ title: t('linkCopied') });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>{t('qrTitle')}</ModalHeader>
      <ModalCloseButton onClose={onClose} />
      <ModalBody>
        <Flex direction="column" align="center" gap={4}>
          {qr && (
            <Box bg="white" p={3} borderRadius="lg">
              <Image src={qr} alt="QR code" boxSize="220px" />
            </Box>
          )}
          <Text
            fontSize="xs"
            color="gray.500"
            wordBreak="break-all"
            textAlign="center"
            _dark={{ color: 'gray.400' }}
          >
            {url}
          </Text>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button onClick={() => void handleCopy()}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {t('copyLink')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
