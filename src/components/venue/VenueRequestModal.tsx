'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  MapPin,
  PencilLine,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import VModal from '@/components/ui/VModal';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import { VenueRequestService } from '@/lib/api/venue-request.service';
import { VenueService } from '@/lib/api/venue.service';
import {
  ClosureStatus,
  SportType,
  Venue,
  VenueRequestPayload,
  VenueRequestType,
} from '@/lib/api/types';
import { AppSportMultiSelect } from '@/components/common/AppSportMultiSelect';
import { getVenueSportTypes } from '@/constants/sports';
import { useNewAdminUnits } from '@/hooks/useNewAdminUnits';
import { composeNewAddress } from '@/utils/venue-helpers';
import { trimPhone } from '@/utils/phone-utils';
import { formatVenueName } from '@/utils';
import { formatOpeningHours, parseOpeningHours } from '@/utils/time-helpers';

const venueRequestSchema = z.object({
  name: z.string().min(2).max(200),
  sportTypes: z.array(z.nativeEnum(SportType)).min(1),
  street: z.string().min(3).max(500),
  newCity: z.string().min(1).max(120),
  newDistrict: z.string().min(1).max(120),
  numberOfCourts: z.number().int().min(1).optional(),
  openingHours: z.string().max(200).optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  phone: z.string().max(40).optional(),
  website: z.string().max(500).optional(),
  locatedWithin: z.string().max(200).optional(),
  wifiName: z.string().max(200).optional(),
  wifiPassword: z.string().max(200).optional(),
  closureStatus: z.nativeEnum(ClosureStatus).optional(),
  description: z.string().max(5000).optional(),
  note: z.string().max(2000).optional(),
});

type VenueRequestFormValues = z.infer<typeof venueRequestSchema>;

interface VenueRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: VenueRequestType;
  venue?: Venue | null;
  defaultKeyword?: string;
  onSubmitted?: () => void;
  onOpenCreateRequest?: () => void;
  onOpenPriceCorrection?: () => void;
  onOpenImageCorrection?: () => void;
}

const toOptionalNumber = (value: string) => {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toPayload = (values: VenueRequestFormValues): VenueRequestPayload => ({
  name: values.name.trim(),
  sportTypes: values.sportTypes,
  street: values.street.trim(),
  newCity: values.newCity.trim(),
  newDistrict: values.newDistrict.trim(),
  numberOfCourts: values.numberOfCourts,
  openingHours:
    formatOpeningHours(values.openTime, values.closeTime) || undefined,
  phone: trimPhone(values.phone),
  website: values.website?.trim() || undefined,
  locatedWithin: values.locatedWithin?.trim() || undefined,
  wifiName: values.wifiName?.trim() || undefined,
  wifiPassword: values.wifiPassword?.trim() || undefined,
  closureStatus: values.closureStatus,
  description: values.description?.trim() || undefined,
  note: values.note?.trim() || undefined,
});

export default function VenueRequestModal({
  isOpen,
  onClose,
  type,
  venue,
  defaultKeyword = '',
  onSubmitted,
  onOpenCreateRequest,
  onOpenPriceCorrection,
  onOpenImageCorrection,
}: VenueRequestModalProps) {
  const t = useTranslations('venueRequests');
  const tVenue = useTranslations('venue');
  const tSport = useTranslations('sport');
  const router = useRouter();
  const [similarVenues, setSimilarVenues] = useState<Venue[]>([]);
  const [hasReviewedSimilar, setHasReviewedSimilar] = useState(false);
  const [isCheckingSimilar, setIsCheckingSimilar] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const defaultValues = useMemo<VenueRequestFormValues>(() => {
    const openingHours = parseOpeningHours(venue?.openingHours);

    return {
      name: venue?.name || defaultKeyword,
      sportTypes: venue ? getVenueSportTypes(venue) : [SportType.BADMINTON],
      street: venue?.streetAddress || venue?.address || '',
      newCity: venue?.newCity || venue?.city || '',
      newDistrict: venue?.newDistrict || venue?.district || '',
      numberOfCourts: venue?.numberOfCourts,
      openingHours: venue?.openingHours || '',
      openTime: openingHours.openTime,
      closeTime: openingHours.closeTime,
      phone: venue?.phone || '',
      website: venue?.website || '',
      locatedWithin: venue?.locatedWithin || '',
      wifiName: venue?.wifiName || '',
      wifiPassword: venue?.wifiPassword || '',
      closureStatus: venue?.closureStatus ?? ClosureStatus.OPERATING,
      description: '',
      note: '',
    };
  }, [defaultKeyword, venue]);

  const form = useForm<VenueRequestFormValues>({
    resolver: zodResolver(venueRequestSchema),
    defaultValues,
  });

  const { cityOptions: newCityOptions, getWardsByCity } = useNewAdminUnits();
  const watchedStreet = form.watch('street');
  const selectedNewCity = form.watch('newCity');
  const selectedNewDistrict = form.watch('newDistrict');
  const newWardOptions = getWardsByCity(selectedNewCity);
  const newAddressPreview = composeNewAddress(
    watchedStreet,
    selectedNewDistrict,
    selectedNewCity
  );

  const isCreate = type === VenueRequestType.CREATE;

  useEffect(() => {
    if (!isOpen) return;
    form.reset(defaultValues);
    setSimilarVenues([]);
    setHasReviewedSimilar(false);
    setIsExpanded(false);
  }, [defaultValues, form, isOpen]);

  const resetSimilarWarning = () => {
    if (similarVenues.length > 0 || hasReviewedSimilar) {
      setSimilarVenues([]);
      setHasReviewedSimilar(false);
    }
  };

  const handleSubmit = async (values: VenueRequestFormValues) => {
    try {
      const payload = toPayload(values);

      if (isCreate && !hasReviewedSimilar) {
        setIsCheckingSimilar(true);
        const result = await VenueService.searchVenues({
          keyword: payload.name,
          limit: 5,
        });
        setIsCheckingSimilar(false);

        if (result.data.length > 0) {
          setSimilarVenues(result.data);
          setHasReviewedSimilar(true);
          return;
        }
      }

      await VenueRequestService.create({
        type,
        venueId: isCreate ? undefined : venue?.id,
        payload,
      });

      toaster.success({ title: t('submitSuccess') });
      form.reset(defaultValues);
      onSubmitted?.();
      onClose();
    } catch (error) {
      setIsCheckingSimilar(false);
      console.error('Failed to submit venue request:', error);
      toaster.error({ title: t('submitError') });
    }
  };

  const handleRedirectToCreate = () => {
    onClose();
    if (onOpenCreateRequest) {
      onOpenCreateRequest();
      return;
    }

    router.push('/venues?action=openVenueCreateRequest');
  };

  const primaryActionText =
    isCreate && similarVenues.length > 0
      ? t('submitAnyway')
      : isCreate
        ? t('submitCreate')
        : t('submitUpdate');

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreate ? t('createTitle') : t('updateTitle')}
      description={undefined}
      size="xl"
      maxBodyHeight={{ base: '70vh', md: '75vh' }}
      primaryActionText={primaryActionText}
      onPrimaryAction={() => form.handleSubmit(handleSubmit)()}
      isPrimaryLoading={form.formState.isSubmitting || isCheckingSimilar}
      secondaryActionText={t('cancel')}
    >
      <VStack align="stretch" gap={4}>
        {/* Similar venues warning */}
        {similarVenues.length > 0 && (
          <Box
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="orange.200"
            bg="orange.50"
            _dark={{ bg: 'orange.900/20', borderColor: 'orange.700' }}
          >
            <HStack gap={2} mb={3} color="orange.700">
              <AlertTriangle size={18} />
              <Text fontWeight="semibold">{t('similarVenuesTitle')}</Text>
            </HStack>
            <VStack align="stretch" gap={2}>
              {similarVenues.map((item) => {
                const name = formatVenueName(
                  item.name,
                  tVenue('nameFormat', { name: '{name}' })
                );
                return (
                  <Flex
                    key={item.id}
                    gap={3}
                    align="center"
                    justify="space-between"
                    p={3}
                    borderRadius="md"
                    bg={{ base: 'white', _dark: 'gray.800' }}
                  >
                    <Box minW={0}>
                      <Text fontWeight="semibold" lineClamp={1}>
                        {name}
                      </Text>
                      <HStack gap={1} color="gray.500" fontSize="sm">
                        <MapPin size={13} />
                        <Text lineClamp={1}>{item.address}</Text>
                      </HStack>
                    </Box>
                    <Button
                      size="sm"
                      variant="outline"
                      flexShrink={0}
                      onClick={() => {
                        onClose();
                        router.push(`/venues/${item.slug || item.id}`);
                      }}
                    >
                      <ExternalLink size={14} />
                      {t('viewVenue')}
                    </Button>
                  </Flex>
                );
              })}
            </VStack>
            <Text mt={3} fontSize="sm" color="orange.700">
              {t('similarVenuesHint')}
            </Text>
          </Box>
        )}

        {/* ── Required fields ── */}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field
                label={t('fields.name')}
                required
                invalid={!!fieldState.error}
                errorText={t('validation.required')}
              >
                <Input
                  {...field}
                  onChange={(event) => {
                    resetSimilarWarning();
                    field.onChange(event);
                  }}
                />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="sportTypes"
            render={({ field }) => (
              <Field label={tSport('title')} required>
                <AppSportMultiSelect
                  value={field.value}
                  onChange={field.onChange}
                />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="street"
            render={({ field, fieldState }) => (
              <Field
                label={t('fields.street')}
                required
                invalid={!!fieldState.error}
                errorText={t('validation.required')}
                helperText={t('helpers.street')}
              >
                <Input
                  {...field}
                  placeholder={t('placeholders.street')}
                  onChange={(event) => {
                    resetSimilarWarning();
                    field.onChange(event);
                  }}
                />
              </Field>
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Controller
            control={form.control}
            name="newCity"
            render={({ field, fieldState }) => (
              <Field
                label={t('fields.newCity')}
                required
                invalid={!!fieldState.error}
                errorText={t('validation.required')}
              >
                <SearchableSelect
                  options={newCityOptions}
                  value={field.value}
                  onChange={(val) => {
                    resetSimilarWarning();
                    field.onChange(val);
                    form.setValue('newDistrict', '');
                  }}
                  placeholder={t('placeholders.newCity')}
                  isInvalid={!!fieldState.error}
                />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="newDistrict"
            render={({ field, fieldState }) => (
              <Field
                label={t('fields.newDistrict')}
                required
                invalid={!!fieldState.error}
                errorText={t('validation.required')}
                helperText={t('helpers.newDistrict')}
              >
                <SearchableSelect
                  options={newWardOptions}
                  value={field.value}
                  onChange={(val) => {
                    resetSimilarWarning();
                    field.onChange(val);
                  }}
                  placeholder={
                    selectedNewCity
                      ? t('placeholders.newDistrict')
                      : t('fields.newCity')
                  }
                  isDisabled={!selectedNewCity}
                  isInvalid={!!fieldState.error}
                />
              </Field>
            )}
          />
        </SimpleGrid>

        {/* ── Expand / Collapse toggle ── */}
        <Box
          as="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          display="flex"
          alignItems="center"
          gap={2}
          px={3}
          py={2}
          borderRadius="md"
          borderWidth="1px"
          borderColor="gray.200"
          bg={{ base: 'gray.50', _dark: 'gray.800' }}
          _dark={{ borderColor: 'gray.700' }}
          _hover={{ bg: { base: 'gray.100', _dark: 'gray.700' } }}
          width="full"
          cursor="pointer"
          transition="all 0.15s"
          textAlign="left"
        >
          <Text
            fontSize="sm"
            fontWeight="medium"
            color="gray.600"
            _dark={{ color: 'gray.300' }}
            flex={1}
          >
            {t('additionalInfo')}
          </Text>
          {isExpanded ? (
            <ChevronUp size={15} color="var(--chakra-colors-gray-500)" />
          ) : (
            <ChevronDown size={15} color="var(--chakra-colors-gray-500)" />
          )}
        </Box>

        {/* ── Optional / additional fields (collapsible) ── */}
        <Box
          overflow="hidden"
          maxH={isExpanded ? '9999px' : '0px'}
          opacity={isExpanded ? 1 : 0}
          transition="max-height 0.3s ease, opacity 0.25s ease"
        >
          <VStack align="stretch" gap={4} pb={1}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Controller
                control={form.control}
                name="locatedWithin"
                render={({ field }) => (
                  <Field
                    label={t('fields.locatedWithin')}
                    helperText={t('helpers.locatedWithin')}
                  >
                    <Input {...field} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="numberOfCourts"
                render={({ field }) => (
                  <Field label={t('fields.numberOfCourts')}>
                    <Input
                      type="number"
                      min={1}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(toOptionalNumber(event.target.value))
                      }
                    />
                  </Field>
                )}
              />
            </SimpleGrid>

            <Field label={t('fields.openingHours')}>
              <HStack width="full" gap={2}>
                <Controller
                  control={form.control}
                  name="openTime"
                  render={({ field }) => (
                    <VDateTimeInput
                      {...field}
                      type="time"
                      placeholder={t('placeholders.openTime')}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name="closeTime"
                  render={({ field }) => (
                    <VDateTimeInput
                      {...field}
                      type="time"
                      placeholder={t('placeholders.closeTime')}
                    />
                  )}
                />
              </HStack>
            </Field>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Controller
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <Field label={t('fields.phone')}>
                    <Input {...field} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="website"
                render={({ field }) => (
                  <Field label={t('fields.website')}>
                    <Input {...field} />
                  </Field>
                )}
              />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Controller
                control={form.control}
                name="wifiName"
                render={({ field }) => (
                  <Field label={t('fields.wifiName')}>
                    <Input {...field} />
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="wifiPassword"
                render={({ field }) => (
                  <Field label={t('fields.wifiPassword')}>
                    <Input {...field} />
                  </Field>
                )}
              />
            </SimpleGrid>

            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <Field label={t('fields.description')}>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder={t('placeholders.description')}
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="note"
              render={({ field }) => (
                <Field label={t('fields.note')}>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder={
                      isCreate
                        ? t('placeholders.createNote')
                        : t('placeholders.updateNote')
                    }
                  />
                </Field>
              )}
            />
          </VStack>
        </Box>

        {/* Other request shortcuts (update mode only) */}
        {!isCreate && (
          <Box
            p={3}
            borderRadius="lg"
            borderWidth="1px"
            borderColor="gray.200"
            bg="gray.50"
            _dark={{ bg: 'gray.900/40', borderColor: 'gray.700' }}
          >
            <VStack align="stretch" gap={2.5}>
              {(onOpenPriceCorrection || onOpenImageCorrection) && (
                <VStack align="stretch" gap={1.5}>
                  <Text fontSize="sm" color="gray.500">
                    {t('otherRequestsHint')}
                  </Text>
                  <HStack gap={2} flexWrap="wrap">
                    {onOpenPriceCorrection && (
                      <Button
                        variant="outline"
                        size="xs"
                        colorPalette="green"
                        onClick={onOpenPriceCorrection}
                      >
                        <PencilLine size={13} />
                        {tVenue('detail.suggestPriceEdit')}
                      </Button>
                    )}
                    {onOpenImageCorrection && (
                      <Button
                        variant="outline"
                        size="xs"
                        colorPalette="green"
                        onClick={onOpenImageCorrection}
                      >
                        <PencilLine size={13} />
                        {tVenue('detail.suggestImageEdit')}
                      </Button>
                    )}
                  </HStack>
                </VStack>
              )}

              <HStack gap={1.5} fontSize="sm">
                <Info
                  size={14}
                  color="var(--chakra-colors-gray-400)"
                  style={{ flexShrink: 0, marginTop: '1px' }}
                />
                <Text color="gray.500" _dark={{ color: 'gray.400' }}>
                  {t('suggestNewVenueInsteadHint')}{' '}
                  <Text
                    as="span"
                    color="brand.500"
                    fontWeight="semibold"
                    cursor="pointer"
                    _hover={{ textDecoration: 'underline', color: 'brand.600' }}
                    onClick={handleRedirectToCreate}
                  >
                    {t('suggestNewVenueLink')}
                  </Text>
                </Text>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>
    </VModal>
  );
}
