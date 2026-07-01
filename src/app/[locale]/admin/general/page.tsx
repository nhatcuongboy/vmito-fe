'use client';

import MainLayout from '@/components/layout/MainLayout';
import { VSwitch } from '@/components/ui/VSwitch';
import { toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/chakra-compat';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { VenueService } from '@/lib/api/venue.service';
import { UserRole } from '@/lib/api/types';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import {
  Box,
  Card,
  Container,
  Heading,
  HStack,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SlidersHorizontal, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

// ── Migrate result ──────────────────────────────────────────────────────────

interface IMigrateResult {
  message: string;
  total: number;
  matched: number;
  cityOnly: number;
  unmatched: number;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminGeneralPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();
  const { showNewAddress, setShowNewAddress } = useAppSettings();

  // Migrate state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<IMigrateResult | null>(
    null
  );

  // Auth guard
  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('accessDenied') });
      router.replace('/dashboard');
    }
  }, [isHydrated, isAuthenticated, currentUser, router, t]);

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setMigrateResult(null);
      const result = await VenueService.migrateAddresses();
      setMigrateResult(result);
      toaster.success({ title: t('migrationComplete') });
    } catch (error) {
      console.error('Migration failed:', error);
      toaster.error({ title: tc('error'), description: t('migrationFailed') });
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isHydrated || !currentUser || currentUser.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <MainLayout title="Cài đặt chung">
      <Container maxW="container.lg" py={8}>
        <VStack gap={8} align="stretch">
          {/* Page header */}
          <HStack gap={3}>
            <Box
              p={3}
              borderRadius="lg"
              bg="green.100"
              _dark={{ bg: 'green.900/30' }}
              color="green.600"
            >
              <SlidersHorizontal size={24} />
            </Box>
            <Box>
              <Heading size="lg">Cài đặt chung</Heading>
              <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                Quản lý cài đặt toàn hệ thống
              </Text>
            </Box>
          </HStack>

          <Separator />

          {/* Section 1: Migrate addresses */}
          <Card.Root>
            <Card.Header>
              <HStack gap={3}>
                <Box
                  p={2}
                  borderRadius="md"
                  bg="blue.100"
                  _dark={{ bg: 'blue.900/30' }}
                  color="blue.600"
                >
                  <MapPin size={18} />
                </Box>
                <Box>
                  <Heading size="md">Chuyển đổi địa chỉ mới</Heading>
                  <Text fontSize="sm" color="gray.500">
                    Tự động cập nhật địa chỉ mới (Nghị quyết 60) cho tất cả địa
                    điểm chưa có địa chỉ mới
                  </Text>
                </Box>
              </HStack>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Button
                  colorPalette="green"
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  alignSelf="flex-start"
                >
                  {isMigrating ? (
                    <>
                      <Spinner size="sm" />
                      Đang chạy...
                    </>
                  ) : (
                    'Migrate địa chỉ'
                  )}
                </Button>

                {migrateResult && (
                  <Box
                    p={4}
                    borderRadius="md"
                    bg="green.50"
                    _dark={{ bg: 'green.900/20', borderColor: 'green.700' }}
                    borderWidth="1px"
                    borderColor="green.200"
                  >
                    <Text fontWeight="semibold" mb={2} color="green.700">
                      Kết quả migration
                    </Text>
                    <VStack align="start" gap={1} fontSize="sm">
                      <Text>
                        Tổng số:{' '}
                        <Text as="span" fontWeight="semibold">
                          {migrateResult.total}
                        </Text>{' '}
                        địa điểm
                      </Text>
                      <Text>
                        Khớp đầy đủ (ward + city):{' '}
                        <Text as="span" fontWeight="semibold" color="green.600">
                          {migrateResult.matched}
                        </Text>
                      </Text>
                      <Text>
                        Chỉ khớp thành phố:{' '}
                        <Text as="span" fontWeight="semibold" color="blue.600">
                          {migrateResult.cityOnly}
                        </Text>
                      </Text>
                      <Text>
                        Không khớp:{' '}
                        <Text as="span" fontWeight="semibold" color="red.600">
                          {migrateResult.unmatched}
                        </Text>
                      </Text>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Section 2: Show new address toggle */}
          <Card.Root>
            <Card.Header>
              <Heading size="md">Hiển thị địa chỉ mới</Heading>
              <Text fontSize="sm" color="gray.500" mt={1}>
                Bật/tắt hiển thị địa chỉ theo Nghị quyết 60 trong toàn bộ ứng
                dụng
              </Text>
            </Card.Header>
            <Card.Body>
              <HStack gap={4}>
                <VSwitch
                  checked={showNewAddress}
                  onCheckedChange={(e) => setShowNewAddress(e.checked)}
                  colorPalette="green"
                />
                <Text fontSize="sm">
                  {showNewAddress
                    ? 'Đang hiển thị địa chỉ mới'
                    : 'Đang ẩn địa chỉ mới'}
                </Text>
              </HStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </MainLayout>
  );
}
