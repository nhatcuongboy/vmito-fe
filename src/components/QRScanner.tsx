'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Box, Button, Text, VStack, HStack } from '@chakra-ui/react';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen && !readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader();
    }

    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [isOpen]);

  const startScanning = async () => {
    if (!videoRef.current || !readerRef.current) return;

    setIsScanning(true);
    setError(null);

    try {
      const result = await readerRef.current.decodeOnceFromVideoDevice(
        undefined,
        videoRef.current
      );

      if (result) {
        const scannedText = result.getText();
        // Extract code from URL or use as-is
        const codeMatch = scannedText.match(/code=([A-Z0-9]{8})/);
        const code = codeMatch ? codeMatch[1] : scannedText;

        onScan(code);
        onClose();
      }
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('QR scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.800"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="white"
        borderRadius="lg"
        p={6}
        maxW="md"
        w="full"
        maxH="90vh"
        overflow="auto"
      >
        <VStack gap={4}>
          <HStack justify="space-between" w="full">
            <Text fontSize="lg" fontWeight="bold">
              Scan QR Code
            </Text>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X size={20} />
            </Button>
          </HStack>

          <Box
            w="full"
            h="300px"
            bg="black"
            borderRadius="md"
            overflow="hidden"
            position="relative"
          >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {!isScanning && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                textAlign="center"
              >
                <Camera size={48} color="white" />
                <Text color="white" mt={2}>
                  Click Start to scan
                </Text>
              </Box>
            )}
          </Box>

          {error && (
            <Text color="red.500" fontSize="sm" textAlign="center">
              {error}
            </Text>
          )}

          <VStack gap={2} w="full">
            {!isScanning ? (
              <Button onClick={startScanning} colorScheme="blue" width="full">
                <Camera size={16} style={{ marginRight: '8px' }} />
                Start Scanning
              </Button>
            ) : (
              <Button onClick={stopScanning} colorScheme="red" width="full">
                <X size={16} style={{ marginRight: '8px' }} />
                Stop Scanning
              </Button>
            )}
          </VStack>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            Point your camera at a QR code to scan the join code
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}
