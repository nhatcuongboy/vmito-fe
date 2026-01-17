'use client';

import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocale, useTranslations } from 'next-intl';
import {
  Box,
  Button,
  Heading,
  Input,
  Link,
  Spinner,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import QRScanner from '@/components/QRScanner';
import { AuthService } from '@/lib/api/auth.service';
import MainLayout from '@/components/layout/MainLayout';
import PublicRouteGuard from '@/components/guards/PublicRouteGuard';

function JoinByCodeContent() {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const locale = useLocale();
  const t = useTranslations('pages.join.joinByCode');

  // Redirect authenticated users based on role
  //   useEffect(() => {
  //     if (status === "authenticated" && session?.user) {
  //       if (session.user.role === "HOST") {
  //         router.push(`/host`);
  //       } else if (session.user.role === "PLAYER") {
  //         const playerId = (session.user as any).playerId;
  //         if (playerId) {
  //           router.push(`/join/status?playerId=${playerId}`);
  //         }
  //       }
  //     }
  //   }, [session, status, router, locale]);

  // Auto-fill from QR code if present
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setJoinCode(codeFromUrl);
    }
  }, [searchParams]);

  const checkCodeType = async (code: string) => {
    try {
      const result = await AuthService.checkCode(code);
      return result.isPlayerCode ? 'player' : 'session';
    } catch (error) {
      return 'session';
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      toaster.error({ title: t('enterCodeError') });
      return;
    }

    setLoading(true);

    try {
      // Check code type first
      const result = await AuthService.checkCode(joinCode);

      if (result.isPlayerCode && result.playerId) {
        // Player code - redirect to confirm page to complete registration
        router.push(`/join/confirm?playerId=${result.playerId}`);
        return;
      }

      // For session codes, redirect to register page to fill player info
      router.push(`/join/register?code=${joinCode}`);
    } catch (error: unknown) {
      toaster.error({ title: t('joinFailedError') });
      console.error('Join error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (code: string) => {
    setJoinCode(code.toUpperCase());
    toaster.success({ title: t('qrScanSuccess') });
  };

  return (
    <MainLayout title={t('title')}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        height="100%"
      >
        <Box
          maxW="md"
          w="full"
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="lg"
        >
          <VStack gap={6}>
            <Box textAlign="center">
              <Heading size="lg" color="green.600">
                🏸 {t('title')}
              </Heading>
              <Text color="gray.600" mt={2}>
                {t('subtitle')}
              </Text>
            </Box>

            <form onSubmit={handleJoinSession} style={{ width: '100%' }}>
              <VStack gap={4}>
                <Box w="full">
                  <Text mb={2} fontWeight="medium">
                    {t('joinCode')}
                  </Text>
                  <HStack gap={2}>
                    <Input
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      placeholder={t('joinCodePlaceholder')}
                      maxLength={8}
                      required
                      fontSize="lg"
                      textAlign="center"
                      letterSpacing="2px"
                      flex={1}
                    />
                    <Button onClick={onOpen} variant="outline" size="lg" px={3}>
                      <Camera size={20} />
                    </Button>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {t('joinCodeHelp')}
                  </Text>
                </Box>

                <Button
                  type="submit"
                  colorScheme="green"
                  width="full"
                  size="lg"
                  loading={loading}
                  disabled={!joinCode.trim()}
                >
                  {loading ? <Spinner size="sm" /> : t('joinSession')}
                </Button>
              </VStack>
            </form>

            <VStack gap={2}>
              <Text color="gray.600" textAlign="center">
                {t('alreadyHaveAccount')}{' '}
                <Link
                  href="/auth/signin"
                  color="blue.600"
                  fontWeight="semibold"
                >
                  {t('signIn')}
                </Link>
              </Text>

              <Text color="gray.500" fontSize="sm" textAlign="center">
                {t('troubleHelp')}
              </Text>
            </VStack>
          </VStack>
        </Box>

        <QRScanner isOpen={isOpen} onClose={onClose} onScan={handleQRScan} />
      </Box>
    </MainLayout>
  );
}

export default function JoinByCodePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PublicRouteGuard redirectTo="/host">
        <JoinByCodeContent />
      </PublicRouteGuard>
    </Suspense>
  );
}
