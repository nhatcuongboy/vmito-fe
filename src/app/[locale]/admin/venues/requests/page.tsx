'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Check, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import { VenueRequestService } from '@/lib/api/venue-request.service';
import {
  UserRole,
  Venue,
  VenueRequest,
  VenueRequestStatus,
  VenueRequestType,
} from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  VENUE_REQUEST_FIELDS,
  formatVenueRequestValue,
} from '@/constants/venue-request-fields';

const statusColors: Record<VenueRequestStatus, string> = {
  [VenueRequestStatus.PENDING]: 'yellow',
  [VenueRequestStatus.APPROVED]: 'green',
  [VenueRequestStatus.REJECTED]: 'red',
};

export default function AdminVenueRequestsPage() {
  const t = useTranslations('venueRequests');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();
  const [requests, setRequests] = useState<VenueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<VenueRequestStatus | ''>(
    VenueRequestStatus.PENDING
  );
  const [typeFilter, setTypeFilter] = useState<VenueRequestType | ''>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VenueRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await VenueRequestService.getAdmin({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setRequests(data);
    } catch (error) {
      console.error('Failed to load venue requests:', error);
      toaster.error({ title: t('loadError') });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t, typeFilter]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (user?.role !== UserRole.ADMIN) {
      toaster.error({ title: tAdmin('accessDenied') });
      router.replace('/');
      return;
    }
    loadRequests();
  }, [isAuthenticated, isHydrated, loadRequests, router, tAdmin, user?.role]);

  const counts = useMemo(
    () =>
      requests.reduce(
        (acc, request) => {
          acc[request.status] = (acc[request.status] || 0) + 1;
          return acc;
        },
        {} as Partial<Record<VenueRequestStatus, number>>
      ),
    [requests]
  );

  const handleApprove = async (request: VenueRequest) => {
    try {
      setProcessingId(request.id);
      await VenueRequestService.approve(request.id);
      toaster.success({ title: t('approveSuccess') });
      await loadRequests();
    } catch (error) {
      console.error('Failed to approve venue request:', error);
      toaster.error({ title: t('approveError') });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;

    try {
      setProcessingId(rejectTarget.id);
      await VenueRequestService.reject(rejectTarget.id, rejectReason);
      toaster.success({ title: t('rejectSuccess') });
      setRejectTarget(null);
      setRejectReason('');
      await loadRequests();
    } catch (error) {
      console.error('Failed to reject venue request:', error);
      toaster.error({ title: t('rejectError') });
    } finally {
      setProcessingId(null);
    }
  };

  const renderPayloadBody = (request: VenueRequest) => {
    if (request.type === VenueRequestType.PRICE_CORRECTION) {
      return (
        <VStack align="stretch" gap={3}>
          {request.payload.priceImageUrl && (
            <Image
              src={request.payload.priceImageUrl}
              alt={t('fields.priceImage')}
              maxH="360px"
              objectFit="contain"
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
              _dark={{ borderColor: 'gray.700' }}
            />
          )}
          {request.payload.note && (
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {request.payload.note}
            </Text>
          )}
        </VStack>
      );
    }

    if (request.type === VenueRequestType.IMAGE_CORRECTION) {
      const images = request.payload.suggestedImages || [];
      return (
        <VStack align="stretch" gap={3}>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={2}>
            {images.map((image, index) => (
              <Image
                key={image.publicId || index}
                src={image.url}
                alt={`${index + 1}`}
                aspectRatio={1}
                objectFit="cover"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700' }}
              />
            ))}
          </SimpleGrid>
          <Text fontSize="xs" color="gray.500">
            {t('imageReviewHint')}
          </Text>
          {request.payload.note && (
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {request.payload.note}
            </Text>
          )}
        </VStack>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={3}>
        {VENUE_REQUEST_FIELDS.map(({ key, venueKey }) => {
          const requested = request.payload[key];
          const current =
            key === 'note'
              ? undefined
              : request.venue?.[(venueKey || key) as keyof Venue];
          if (requested === undefined && current === undefined) return null;

          return (
            <Box
              key={key}
              borderWidth="1px"
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
              borderRadius="md"
              p={3}
            >
              <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>
                {t(`fields.${key}`)}
              </Text>
              {request.type === VenueRequestType.UPDATE && key !== 'note' && (
                <Text fontSize="sm" color="gray.500" lineClamp={2}>
                  {t('currentValue')}: {formatVenueRequestValue(current)}
                </Text>
              )}
              <Text fontSize="sm" fontWeight="semibold" whiteSpace="pre-wrap">
                {request.type === VenueRequestType.UPDATE && key !== 'note'
                  ? `${t('requestedValue')}: ${formatVenueRequestValue(requested)}`
                  : formatVenueRequestValue(requested)}
              </Text>
            </Box>
          );
        })}
      </SimpleGrid>
    );
  };

  const renderRequest = (request: VenueRequest) => {
    const isPending = request.status === VenueRequestStatus.PENDING;
    const isImageCorrection =
      request.type === VenueRequestType.IMAGE_CORRECTION;

    return (
      <Box
        key={request.id}
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
      >
        <Flex
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={3}
          direction={{ base: 'column', md: 'row' }}
          mb={4}
        >
          <Box>
            <HStack gap={2} mb={1}>
              <Badge
                colorPalette={
                  request.type === VenueRequestType.CREATE ? 'green' : 'blue'
                }
              >
                {t(`types.${request.type}`)}
              </Badge>
              <Badge colorPalette={statusColors[request.status]}>
                {t(`statuses.${request.status}`)}
              </Badge>
            </HStack>
            <Heading size="sm">
              {request.payload.name || request.venue?.name || t('untitled')}
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {t('submittedBy', {
                name: request.submittedBy?.name || '-',
                date: new Date(request.createdAt).toLocaleDateString(),
              })}
            </Text>
          </Box>

          <HStack gap={2}>
            {request.venue && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(
                    `/venues/${request.venue?.slug || request.venue?.id}`
                  )
                }
              >
                <ExternalLink size={14} />
                {t('viewVenue')}
              </Button>
            )}
            {isPending && (
              <>
                {isImageCorrection ? (
                  <Button
                    size="sm"
                    colorPalette="green"
                    onClick={() =>
                      router.push(`/admin/venues/requests/${request.id}`)
                    }
                  >
                    <Check size={14} />
                    {t('reviewAndApply')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    colorPalette="green"
                    loading={processingId === request.id}
                    onClick={() => handleApprove(request)}
                  >
                    <Check size={14} />
                    {t('approve')}
                  </Button>
                )}
                <Button
                  size="sm"
                  colorPalette="red"
                  variant="outline"
                  disabled={processingId === request.id}
                  onClick={() => setRejectTarget(request)}
                >
                  <X size={14} />
                  {t('reject')}
                </Button>
              </>
            )}
          </HStack>
        </Flex>

        {renderPayloadBody(request)}

        {request.adminNote && (
          <Box mt={3} p={3} borderRadius="md" bg="red.50" color="red.700">
            <Text fontSize="sm" fontWeight="semibold">
              {t('adminNote')}
            </Text>
            <Text fontSize="sm">{request.adminNote}</Text>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <MainLayout title={t('adminTitle')}>
      <Container maxW="container.xl" py={6}>
        <VStack align="stretch" gap={5}>
          <Flex justify="space-between" align="center" gap={3}>
            <Heading size="lg">{t('adminTitle')}</Heading>
            <Button variant="outline" onClick={loadRequests}>
              <RefreshCw size={16} />
              {t('refresh')}
            </Button>
          </Flex>

          <Flex gap={2} flexWrap="wrap">
            {['', ...Object.values(VenueRequestStatus)].map((status) => (
              <Badge
                key={status || 'all'}
                px={4}
                py={2}
                borderRadius="lg"
                cursor="pointer"
                variant={statusFilter === status ? 'solid' : 'outline'}
                colorPalette={
                  status ? statusColors[status as VenueRequestStatus] : 'gray'
                }
                onClick={() =>
                  setStatusFilter(status as VenueRequestStatus | '')
                }
              >
                {status ? t(`statuses.${status}`) : t('allStatuses')}
                {status && counts[status as VenueRequestStatus]
                  ? ` (${counts[status as VenueRequestStatus]})`
                  : ''}
              </Badge>
            ))}
          </Flex>

          <Flex gap={2} flexWrap="wrap">
            {['', ...Object.values(VenueRequestType)].map((type) => (
              <Badge
                key={type || 'all'}
                px={4}
                py={2}
                borderRadius="lg"
                cursor="pointer"
                variant={typeFilter === type ? 'solid' : 'outline'}
                colorPalette={
                  type === VenueRequestType.CREATE
                    ? 'green'
                    : type
                      ? 'blue'
                      : 'gray'
                }
                onClick={() => setTypeFilter(type as VenueRequestType | '')}
              >
                {type ? t(`types.${type}`) : t('allTypes')}
              </Badge>
            ))}
          </Flex>

          {loading ? (
            <Flex justify="center" align="center" minH="260px">
              <Spinner size="lg" colorPalette="green" />
            </Flex>
          ) : requests.length === 0 ? (
            <Box
              textAlign="center"
              py={12}
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
            >
              <Text color="gray.500">{t('empty')}</Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={4}>
              {requests.map(renderRequest)}
            </VStack>
          )}
        </VStack>
      </Container>

      <VModal
        isOpen={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        title={t('rejectTitle')}
        primaryActionText={t('reject')}
        primaryColorScheme="red"
        onPrimaryAction={handleReject}
        isPrimaryLoading={!!rejectTarget && processingId === rejectTarget.id}
        isPrimaryDisabled={!rejectReason.trim()}
        secondaryActionText={t('cancel')}
      >
        <Field label={t('rejectReason')} required>
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
        </Field>
      </VModal>
    </MainLayout>
  );
}
