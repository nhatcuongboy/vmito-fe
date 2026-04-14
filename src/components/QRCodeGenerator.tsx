'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Box, Text, VStack, Button, HStack } from '@chakra-ui/react';
import { Copy, Check } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import { Locale } from '@/i18n/locales';

interface QRCodeGeneratorProps {
  joinCode: string;
  size?: number;
  /** Optional URL override. When provided, the QR code encodes this URL directly instead of the join-by-code URL. */
  url?: string;
  /** Optional label displayed below the QR code. Defaults to 'Scan to join session'. */
  label?: string;
  /** Hide the join code text below the label. */
  hideCode?: boolean;
  /** Optional click handler specifically for the generated QR code image wrapper */
  onQrClick?: () => void;
}

export default function QRCodeGenerator({
  joinCode,
  size = 200,
  url: urlOverride,
  label = 'Scan to join session',
  hideCode = false,
  onQrClick,
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (!canvasRef.current || !joinCode) return;

    const generateQR = async () => {
      try {
        // Get current locale from pathname or default to Locale.EN
        const currentPath = window.location.pathname;
        const locale = (currentPath.split('/')[1] as Locale) || Locale.EN;
        const url = urlOverride
          ? urlOverride.startsWith('http')
            ? urlOverride
            : `${window.location.origin}${urlOverride}`
          : `${window.location.origin}/${locale}/join-by-code?code=${joinCode}`;
        setShareUrl(url);
        await QRCode.toCanvas(canvasRef.current, url, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
      } catch (error) {
        console.error('QR code generation error:', error);
      }
    };

    generateQR();
  }, [joinCode, size, urlOverride]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toaster.success({ title: 'Link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toaster.error({ title: 'Failed to copy link' });
    }
  };

  return (
    <VStack gap={3}>
      <Box
        p={4}
        bg="white"
        borderRadius="lg"
        boxShadow="md"
        border="1px solid"
        borderColor="gray.200"
        cursor={onQrClick ? 'pointer' : 'default'}
        _hover={onQrClick ? { transform: 'scale(1.02)' } : {}}
        transition="all 0.2s"
        onClick={onQrClick}
      >
        <canvas ref={canvasRef} />
      </Box>
      <Text fontSize="sm" color="gray.600" textAlign="center">
        {label}
      </Text>
      {!hideCode && (
        <Text
          fontSize="lg"
          fontWeight="bold"
          letterSpacing="2px"
          color="green.600"
        >
          {joinCode}
        </Text>
      )}
      <Button
        onClick={copyLink}
        variant="outline"
        size="sm"
        colorPalette={copied ? 'green' : 'blue'}
      >
        <HStack gap={2}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <Text>{copied ? 'Copied!' : 'Copy Link'}</Text>
        </HStack>
      </Button>
    </VStack>
  );
}
