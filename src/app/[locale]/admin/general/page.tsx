'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/Input';
import { VSwitch } from '@/components/ui/VSwitch';
import { toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/chakra-compat';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { VenueService } from '@/lib/api/venue.service';
import { NotificationService } from '@/lib/api/notification.service';
import { UserRole } from '@/lib/api/types';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import {
  Box,
  Card,
  Container,
  Field,
  Heading,
  HStack,
  Separator,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { LuBell, LuSend, LuUsers } from 'react-icons/lu';
import { SlidersHorizontal, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ── Broadcast form ──────────────────────────────────────────────────────────

const broadcastSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters'),
});

type TBroadcastFormData = z.infer<typeof broadcastSchema>;

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
  const tn = useTranslations('notification');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();
  const { showNewAddress, setShowNewAddress } = useAppSettings();

  // Migrate state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState<IMigrateResult | null>(
    null
  );

  // Broadcast state
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Broadcast form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TBroadcastFormData>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: { title: '', message: '' },
  });

  const watchedTitle = watch('title');
  const watchedMessage = watch('message');

  const handleMigrate = async () => {
    try {
      setIsMigrating(true);
      setMigrateResult(null);
      const result = await VenueService.migrateAddresses();
      setMigrateResult(result);
      toaster.success({ title: 'Migration complete' });
    } catch (error) {
      console.error('Migration failed:', error);
      toaster.error({ title: tc('error'), description: 'Migration failed' });
    } finally {
      setIsMigrating(false);
    }
  };

  const onBroadcastSubmit = async (data: TBroadcastFormData) => {
    try {
      setIsSubmitting(true);
      const result = await NotificationService.broadcastNotification(data);
      toaster.success({
        title: tn('broadcastSuccess'),
        description: `${result.count} ${tn('usersNotified')}`,
      });
      reset();
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
      toaster.error({ title: tc('error'), description: tn('broadcastError') });
    } finally {
      setIsSubmitting(false);
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
                  colorPalette="blue"
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
                    _dark={{ bg: 'green.900/20' }}
                    borderWidth="1px"
                    borderColor="green.200"
                    _dark_borderColor="green.700"
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

          {/* Section 3: Broadcast notification */}
          <Card.Root>
            <Card.Header>
              <HStack gap={3}>
                <Box
                  p={2}
                  borderRadius="md"
                  bg="purple.100"
                  _dark={{ bg: 'purple.900/30' }}
                  color="purple.600"
                >
                  <LuBell size={18} />
                </Box>
                <Box>
                  <Heading size="md">{tn('broadcastNotifications')}</Heading>
                  <Text fontSize="sm" color="gray.500">
                    {tn('broadcastDescription')}
                  </Text>
                </Box>
              </HStack>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleSubmit(onBroadcastSubmit)}>
                <VStack gap={4} align="stretch">
                  <Field.Root invalid={!!errors.title}>
                    <Field.Label>{tn('notificationTitle')} *</Field.Label>
                    <Input
                      {...register('title')}
                      placeholder={tn('titlePlaceholder')}
                      maxLength={200}
                    />
                    {errors.title && (
                      <Field.ErrorText>{errors.title.message}</Field.ErrorText>
                    )}
                    <Field.HelperText>
                      {watchedTitle.length}/200
                    </Field.HelperText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.message}>
                    <Field.Label>{tn('notificationMessage')} *</Field.Label>
                    <Textarea
                      {...register('message')}
                      placeholder={tn('messagePlaceholder')}
                      rows={4}
                      maxLength={1000}
                    />
                    {errors.message && (
                      <Field.ErrorText>
                        {errors.message.message}
                      </Field.ErrorText>
                    )}
                    <Field.HelperText>
                      {watchedMessage.length}/1000
                    </Field.HelperText>
                  </Field.Root>

                  {/* Preview */}
                  {(watchedTitle || watchedMessage) && (
                    <Box
                      p={4}
                      borderRadius="md"
                      bg="gray.50"
                      _dark={{ bg: 'gray.800' }}
                      borderWidth="1px"
                    >
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.500"
                        mb={2}
                      >
                        {tn('preview')}
                      </Text>
                      <VStack align="start" gap={1}>
                        <Text fontWeight="semibold">
                          {watchedTitle || tn('notificationTitle')}
                        </Text>
                        <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                          {watchedMessage || tn('notificationMessage')}
                        </Text>
                      </VStack>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    colorPalette="purple"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <LuSend size={18} />
                        <LuUsers size={18} />
                        {tn('sendToAllUsers')}
                      </>
                    )}
                  </Button>
                </VStack>
              </form>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </MainLayout>
  );
}
