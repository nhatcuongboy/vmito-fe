'use client';

import MainLayout from '@/components/layout/MainLayout';
import { VSwitch } from '@/components/ui/VSwitch';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { UserRole } from '@/lib/api/types';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import {
  Box,
  Card,
  Container,
  Heading,
  HStack,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { AddressMigrationCard } from './AddressMigrationCard';
import { VenueMaintenanceCard } from './VenueMaintenanceCard';

export default function AdminGeneralPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();
  const { showNewAddress, setShowNewAddress } = useAppSettings();

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

          <AddressMigrationCard />

          <VenueMaintenanceCard />

          {/* Show new address toggle */}
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
