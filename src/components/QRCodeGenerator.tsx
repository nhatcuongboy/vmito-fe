'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Box, Text, VStack, Button, HStack } from '@chakra-ui/react';
import { Copy, Check } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';

interface QRCodeGeneratorProps {
  joinCode: string;
  size?: number;
}

export default function QRCodeGenerator({
  joinCode,
  size = 200,
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (!canvasRef.current || !joinCode) return;

    const generateQR = async () => {
      try {
        // Get current locale from pathname or default to 'en'
        const currentPath = window.location.pathname;
        const locale = currentPath.split('/')[1] || 'en';
        const url = `${window.location.origin}/${locale}/join-by-code?code=${joinCode}`;
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
  }, [joinCode, size]);

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
      >
        <canvas ref={canvasRef} />
      </Box>
      <Text fontSize="sm" color="gray.600" textAlign="center">
        Scan to join session
      </Text>
      <Text
        fontSize="lg"
        fontWeight="bold"
        letterSpacing="2px"
        color="blue.600"
      >
        {joinCode}
      </Text>
      <Button
        onClick={copyLink}
        variant="outline"
        size="sm"
        colorScheme={copied ? 'green' : 'blue'}
      >
        <HStack gap={2}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <Text>{copied ? 'Copied!' : 'Copy Link'}</Text>
        </HStack>
      </Button>
    </VStack>
  );
}
