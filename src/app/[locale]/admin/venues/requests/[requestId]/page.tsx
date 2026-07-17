'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Image,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import {
  LuCalendarClock,
  LuCheck,
  LuExternalLink,
  LuMapPin,
  LuUser,
} from 'react-icons/lu';
import PageLayout from '@/components/layout/PageLayout';
import {
  RequestActionBar,
  RequestCompletedState,
  RequestDetailCard,
  RequestInfoList,
  RequestInfoRow,
  RequestLoadingState,
  RequestNotFoundState,
} from '@/components/request-detail';
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
import dayjs from '@/lib/dayjs';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import { useParams } from 'next/navigation';
import { ROUTES } from '@/constants';
import {
  VENUE_REQUEST_FIELDS,
  formatVenueRequestValue,
} from '@/constants/venue-request-fields';

const STATUS_BADGES: Record<
  VenueRequestStatus,
  { palette: string; labelKey: string }
> = {
  [VenueRequestStatus.PENDING]: {
    palette: 'orange',
    labelKey: 'approvalPending',
  },
  [VenueRequestStatus.APPROVED]: {
    palette: 'green',
    labelKey: 'approvalStatusApproved',
  },
  [VenueRequestStatus.REJECTED]: {
    palette: 'red',
    labelKey: 'approvalStatusRejected',
  },
};

const VenueRequestDetailContent = () => {
  const t = useTranslations('notification');
  const tVenueRequests = useTranslations('venueRequests');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<VenueRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    'APPROVED' | 'REJECTED' | null
  >(null);
  const [isActioned, setIsActioned] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);

  const fetchRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      const found = await VenueRequestService.getById(requestId);
      setRequest(found);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setRequest(null);
      } else {
        toaster.error({ title: tCommon('error') });
      }
    } finally {
      setIsLoading(false);
    }
  }, [requestId, tCommon]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  useEffect(() => {
    if (request?.type === VenueRequestType.IMAGE_CORRECTION) {
      setSelectedImageIds(
        (request.payload.suggestedImages || []).map(
          (image) => image.publicId || image.url
        )
      );
    }
  }, [request]);

  const toggleImage = (id: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApprove = async () => {
    if (
      request?.type === VenueRequestType.IMAGE_CORRECTION &&
      selectedImageIds.length === 0
    ) {
      toaster.error({ title: tVenueRequests('imageRequired') });
      return;
    }

    try {
      setActionLoading('APPROVED');
      const body =
        request?.type === VenueRequestType.IMAGE_CORRECTION
          ? { applyImagePublicIds: selectedImageIds }
          : undefined;
      await VenueRequestService.approve(requestId, body);
      toaster.success({ title: tVenueRequests('approveSuccess') });
      router.replace(ROUTES.ADMIN.VENUE_REQUESTS);
    } catch {
      toaster.error({ title: tVenueRequests('approveError') });
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActionLoading('REJECTED');
      await VenueRequestService.reject(requestId, rejectReason);
      toaster.success({ title: tVenueRequests('rejectSuccess') });
      setIsRejectModalOpen(false);
      setRejectReason('');
      setIsActioned(true);
    } catch {
      toaster.error({ title: tVenueRequests('rejectError') });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return <RequestLoadingState />;
  }

  if (!request) {
    return (
      <RequestNotFoundState
        icon={<LuMapPin size={32} />}
        title={t('approvalNotFound')}
        description={t('approvalNotFoundDescription')}
      />
    );
  }

  if (isActioned) {
    return (
      <RequestCompletedState
        title={t('approvalActionCompleted')}
        backLabel={tCommon('back')}
        onBack={() => router.push(ROUTES.ADMIN.VENUE_REQUESTS)}
      />
    );
  }

  const isPending = request.status === VenueRequestStatus.PENDING;
  const isUpdate = request.type === VenueRequestType.UPDATE;
  const statusBadge = STATUS_BADGES[request.status];
  const title =
    request.payload.name || request.venue?.name || tVenueRequests('untitled');

  return (
    <Box px={{ base: 4, md: 6 }} py={6} maxW="container.sm" mx="auto">
      <RequestDetailCard
        accent="purple"
        icon={<LuMapPin size={28} />}
        title={title}
        badges={
          <>
            <Badge
              colorPalette={
                request.type === VenueRequestType.CREATE ? 'green' : 'blue'
              }
              size="sm"
            >
              {tVenueRequests(`types.${request.type}`)}
            </Badge>
            <Badge colorPalette={statusBadge.palette} size="sm">
              {t(statusBadge.labelKey as Parameters<typeof t>[0])}
            </Badge>
          </>
        }
      >
        <RequestInfoList>
          {/* Submitted by */}
          <RequestInfoRow
            icon={<LuUser size={16} />}
            label={t('approvalSubmittedBy')}
            value={request.submittedBy?.name || '-'}
          />

          {/* Requested at */}
          <RequestInfoRow
            icon={<LuCalendarClock size={16} />}
            label={t('approvalRequestedAt')}
            value={`${dayjs(request.createdAt).format('dddd, DD/MM/YYYY')} · ${formatTimeByDevicePreference(request.createdAt)}`}
          />

          {/* Existing venue (for update requests) */}
          {request.venue && (
            <RequestInfoRow
              icon={<LuMapPin size={16} />}
              label={tVenueRequests('viewVenue')}
            >
              <Button
                size="xs"
                variant="outline"
                mt={1}
                onClick={() =>
                  router.push(
                    ROUTES.VENUES.DETAIL(request.venue!.id, request.venue!.slug)
                  )
                }
              >
                <LuExternalLink size={12} />
                {request.venue.name}
              </Button>
            </RequestInfoRow>
          )}
        </RequestInfoList>

        {/* Requested venue details */}
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" fontWeight="semibold">
            {t('approvalVenueInfo')}
          </Text>

          {request.type === VenueRequestType.PRICE_CORRECTION ? (
            <VStack align="stretch" gap={3}>
              {request.payload.priceImageUrl && (
                <Image
                  src={request.payload.priceImageUrl}
                  alt={tVenueRequests('fields.priceImage')}
                  maxH="420px"
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
              {request.venue && (
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="green"
                  alignSelf="flex-start"
                  onClick={() =>
                    router.push(`/admin/venues/${request.venue!.id}/pricing`)
                  }
                >
                  {tVenueRequests('configurePricing')}
                </Button>
              )}
            </VStack>
          ) : request.type === VenueRequestType.IMAGE_CORRECTION ? (
            <VStack align="stretch" gap={3}>
              <Text fontSize="xs" color="gray.500">
                {tVenueRequests('imageSelectHint')}
              </Text>
              <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
                {(request.payload.suggestedImages || []).map((image, index) => {
                  const id = image.publicId || image.url;
                  const selected = selectedImageIds.includes(id);
                  return (
                    <Box
                      key={id}
                      position="relative"
                      cursor="pointer"
                      onClick={() => toggleImage(id)}
                      borderWidth="2px"
                      borderColor={selected ? 'green.500' : 'gray.200'}
                      _dark={{
                        borderColor: selected ? 'green.400' : 'gray.700',
                      }}
                      borderRadius="md"
                      overflow="hidden"
                      opacity={selected ? 1 : 0.55}
                      transition="all 0.15s"
                    >
                      <Image
                        src={image.url}
                        alt={`${index + 1}`}
                        aspectRatio={1}
                        objectFit="cover"
                        w="full"
                      />
                      {selected && (
                        <Flex
                          position="absolute"
                          top={1}
                          right={1}
                          bg="green.500"
                          color="white"
                          borderRadius="full"
                          w={6}
                          h={6}
                          align="center"
                          justify="center"
                        >
                          <LuCheck size={14} />
                        </Flex>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
              {request.payload.note && (
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {request.payload.note}
                </Text>
              )}
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
              {VENUE_REQUEST_FIELDS.map(({ key, venueKey }) => {
                const requested = request.payload[key];
                const current =
                  key === 'note'
                    ? undefined
                    : request.venue?.[(venueKey || key) as keyof Venue];
                if (requested === undefined && current === undefined)
                  return null;

                return (
                  <Box
                    key={key}
                    borderWidth="1px"
                    borderColor="gray.100"
                    _dark={{ borderColor: 'gray.700' }}
                    borderRadius="md"
                    p={3}
                  >
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {tVenueRequests(`fields.${key}`)}
                    </Text>
                    {isUpdate && key !== 'note' && (
                      <Text fontSize="sm" color="gray.500" lineClamp={2}>
                        {tVenueRequests('currentValue')}:{' '}
                        {formatVenueRequestValue(current)}
                      </Text>
                    )}
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      whiteSpace="pre-wrap"
                    >
                      {isUpdate && key !== 'note'
                        ? `${tVenueRequests('requestedValue')}: ${formatVenueRequestValue(requested)}`
                        : formatVenueRequestValue(requested)}
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>

        {/* Admin note (when already rejected) */}
        {request.adminNote && (
          <Box p={3} borderRadius="md" bg="red.50" color="red.700">
            <Text fontSize="sm" fontWeight="semibold">
              {tVenueRequests('adminNote')}
            </Text>
            <Text fontSize="sm">{request.adminNote}</Text>
          </Box>
        )}
      </RequestDetailCard>

      {isPending && (
        <RequestActionBar
          rejectLabel={t('reject')}
          approveLabel={t('approve')}
          onReject={() => setIsRejectModalOpen(true)}
          onApprove={handleApprove}
          loadingAction={actionLoading}
        />
      )}

      <VModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectReason('');
        }}
        title={tVenueRequests('rejectTitle')}
        primaryActionText={tVenueRequests('reject')}
        primaryColorScheme="red"
        onPrimaryAction={handleReject}
        isPrimaryLoading={actionLoading === 'REJECTED'}
        isPrimaryDisabled={!rejectReason.trim()}
        secondaryActionText={tVenueRequests('cancel')}
      >
        <Field label={tVenueRequests('rejectReason')} required>
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
        </Field>
      </VModal>
    </Box>
  );
};

export default function VenueRequestDetailPage() {
  const t = useTranslations('notification');
  const tAdmin = useTranslations('admin');
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace(ROUTES.AUTH.SIGNIN);
      return;
    }
    if (user?.role !== UserRole.ADMIN) {
      toaster.error({ title: tAdmin('accessDenied') });
      router.replace('/');
    }
  }, [isAuthenticated, isHydrated, router, tAdmin, user?.role]);

  if (!isHydrated || user?.role !== UserRole.ADMIN) {
    return <RequestLoadingState />;
  }

  return (
    <Suspense>
      <PageLayout
        title={t('venueRequestDetailTitle')}
        showBackButton
        backHref={ROUTES.ADMIN.VENUE_REQUESTS}
      >
        <VenueRequestDetailContent />
      </PageLayout>
    </Suspense>
  );
}
