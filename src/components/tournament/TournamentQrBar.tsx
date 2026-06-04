'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Box, Flex } from '@chakra-ui/react';
import { Button, HStack } from '@/components/ui/chakra-compat';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';

// High-resolution size used when generating the QR for download
const QR_HQ_SIZE = 400;
// Display size of the QR thumbnail shown in the bar
const QR_DISPLAY_SIZE = 64;

interface ITournamentQrBarProps {
  url: string;
  /** If provided, the share button calls this instead of copying to clipboard. */
  onShare?: () => Promise<void>;
}

export default function TournamentQrBar({
  url,
  onShare,
}: ITournamentQrBarProps) {
  const t = useTranslations('pages.tournaments.qrBar');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: QR_HQ_SIZE,
      margin: 2,
      color: { dark: '#111827', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR generation error:', err));
  }, [url]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'qr-tournament.png';
    link.click();
    toaster.success({ title: t('downloadSuccess') });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toaster.success({ title: t('copySuccess') });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toaster.error({ title: t('copyError') });
    }
  };

  const handleShare = async () => {
    if (onShare) {
      await onShare();
    } else {
      await handleCopy();
    }
  };

  return (
    <Flex
      align="center"
      gap={3}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      px={3}
      py={2.5}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      {/* Compact QR thumbnail */}
      <Box
        bg="white"
        borderRadius="md"
        borderWidth="1px"
        borderColor="gray.100"
        p={1}
        flexShrink={0}
        _dark={{ borderColor: 'gray.600' }}
      >
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="QR"
            width={QR_DISPLAY_SIZE}
            height={QR_DISPLAY_SIZE}
            style={{ display: 'block' }}
          />
        ) : (
          <Box
            w={`${QR_DISPLAY_SIZE}px`}
            h={`${QR_DISPLAY_SIZE}px`}
            bg="gray.100"
            borderRadius="sm"
            _dark={{ bg: 'gray.700' }}
          />
        )}
      </Box>

      {/* Action buttons */}
      <HStack gap={2} flexWrap="wrap">
        <Button
          size="sm"
          variant="outline"
          colorPalette="gray"
          leftIcon={<Download size={14} />}
          onClick={handleDownload}
          disabled={!qrDataUrl}
        >
          {t('download')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          colorPalette={copied ? 'green' : 'blue'}
          leftIcon={
            onShare ? (
              <Share2 size={14} />
            ) : copied ? (
              <Check size={14} />
            ) : (
              <Copy size={14} />
            )
          }
          onClick={handleShare}
        >
          {onShare ? t('share') : copied ? t('copied') : t('copy')}
        </Button>
      </HStack>
    </Flex>
  );
}
