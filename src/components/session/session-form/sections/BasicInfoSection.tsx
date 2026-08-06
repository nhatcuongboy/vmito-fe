import {
  Alert,
  Box,
  Badge,
  CloseButton,
  Field,
  Flex,
  Heading,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/chakra-compat';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import LocationAutocomplete from '@/components/common/LocationAutocomplete';
import { Sparkles, MapPin, Plus } from 'lucide-react';
import { Controller, useWatch } from 'react-hook-form';
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import type { useTranslations } from 'next-intl';
import { useTranslations as useNextIntlTranslations } from 'next-intl';

import { SessionLocationType, SportType, Venue } from '@/lib/api/types';
import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';
import { AppSportSelect } from '@/components/common/AppSportSelect';
import { useRef } from 'react';

type Translator = ReturnType<typeof useTranslations>;

interface VenueOption {
  value: string;
  label: string;
  sublabel?: string;
}

const CUSTOM_LOCATION_VALUE = '__custom_location__';

export function BasicInfoSection({
  t,
  isEditMode,
  onOpenAIModal,
  register,
  setValue,
  errors,
  control,
  canEditVenue,
  sportType,
  onSportTypeChange,
  venues,
  setSelectedVenueObj,
  venueOptions,
  handleVenueSearch,
  isVenueLoading,
  onSuggestNewVenue,
  showAiCustomLocationWarning = false,
  onDismissAiCustomLocationWarning,
}: {
  t: Translator;
  isEditMode: boolean;
  onOpenAIModal: () => void;
  register: UseFormRegister<SessionFormData>;
  setValue: UseFormSetValue<SessionFormData>;
  errors: FieldErrors<SessionFormData>;
  control: Control<SessionFormData>;
  canEditVenue: boolean;
  sportType: SportType;
  onSportTypeChange: (sportType: SportType) => void;
  venues: Venue[];
  setSelectedVenueObj: (venue: Venue | null) => void;
  venueOptions: VenueOption[];
  handleVenueSearch: (keyword: string) => void;
  isVenueLoading: boolean;
  /** Called when user clicks "Suggest new venue" below venue search results. */
  onSuggestNewVenue?: (keyword: string) => void;
  /**
   * True when AI extraction fell back to a custom location because the venue
   * is not in Vmito, so the user must verify the name and address.
   */
  showAiCustomLocationWarning?: boolean;
  onDismissAiCustomLocationWarning?: () => void;
}) {
  const tVenueRequests = useNextIntlTranslations('venueRequests');
  const tCommon = useNextIntlTranslations('common');
  const tSport = useNextIntlTranslations('sport');
  const locationType = useWatch({ control, name: 'locationType' });
  const customLocation = useWatch({ control, name: 'customLocation' });
  const customLocationAddress = useWatch({
    control,
    name: 'customLocationAddress',
  });
  const venueFieldRef = useRef<HTMLDivElement>(null);

  const clearCustomLocationDetails = () => {
    setValue('customLocationAddress', '');
    setValue('customLocationPlaceId', '');
    setValue('customLocationLat', undefined);
    setValue('customLocationLng', undefined);
    setValue('customLocationDistrict', '');
    setValue('customLocationCity', '');
  };

  const clearCustomLocation = () => {
    setValue('customLocation', '');
    clearCustomLocationDetails();
  };
  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
    >
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Heading size="md">{t('basicInfo')}</Heading>
        {!isEditMode && (
          <Button
            size="xs"
            variant="outline"
            onClick={onOpenAIModal}
            leftIcon={<Sparkles size={14} />}
            borderRadius="full"
            bg={{ base: 'purple.50', _dark: 'purple.950' }}
            borderColor={{ base: 'purple.200', _dark: 'purple.700' }}
            color={{ base: 'purple.700', _dark: 'purple.200' }}
            _hover={{
              bg: { base: 'purple.100', _dark: 'purple.900' },
              borderColor: { base: 'purple.300', _dark: 'purple.600' },
            }}
          >
            {t('createByAI')}
          </Button>
        )}
      </Flex>
      <Stack gap={4}>
        {/* Session Name */}
        <Field.Root id="field-name" invalid={!!errors.name}>
          <Field.Label>
            {t('name')}{' '}
            <Text as="span" color="red.500">
              *
            </Text>
          </Field.Label>
          <Input
            {...register('name')}
            placeholder={t('sessionNamePlaceholder')}
          />
          <Field.ErrorText color="fg.error">
            {errors.name?.message}
          </Field.ErrorText>
        </Field.Root>

        {/* Description */}
        <Field.Root invalid={!!errors.description}>
          <Field.Label>{t('description')}</Field.Label>
          <Textarea
            {...register('description')}
            placeholder={t('descriptionPlaceholder')}
            rows={3}
          />
          <Field.ErrorText>{errors.description?.message}</Field.ErrorText>
        </Field.Root>

        {/* Sport */}
        <Field.Root disabled={!canEditVenue}>
          <Field.Label>
            {tSport('title')}{' '}
            <Text as="span" color="red.500">
              *
            </Text>
          </Field.Label>
          <AppSportSelect
            value={sportType}
            onChange={onSportTypeChange}
            isDisabled={!canEditVenue}
          />
          <Field.HelperText>{tSport('selectHelper')}</Field.HelperText>
        </Field.Root>

        {/* Location */}
        <Box id="field-venue" ref={venueFieldRef}>
          <Field.Root
            disabled={!canEditVenue}
            invalid={
              locationType === SessionLocationType.VENUE &&
              !!errors.selectedVenueId
            }
          >
            <Field.Label>
              {t('location')}{' '}
              <Text as="span" color="red.500">
                *
              </Text>
            </Field.Label>
            <Controller
              control={control}
              name="selectedVenueId"
              render={({ field }) => (
                <SearchableSelect
                  isInvalid={
                    locationType === SessionLocationType.VENUE &&
                    !!errors.selectedVenueId
                  }
                  value={
                    locationType === SessionLocationType.CUSTOM
                      ? CUSTOM_LOCATION_VALUE
                      : field.value
                  }
                  selectedLabelOverride={
                    locationType === SessionLocationType.CUSTOM
                      ? customLocation
                      : undefined
                  }
                  onChange={(value) => {
                    // Picking (or clearing to) a Vmito venue resolves what the
                    // warning was about, so retire it for good rather than
                    // letting it resurface if the user goes custom again by
                    // hand — that location would be theirs, not the AI's.
                    onDismissAiCustomLocationWarning?.();

                    if (!value) {
                      field.onChange('');
                      setValue('locationType', SessionLocationType.VENUE);
                      clearCustomLocation();
                      setSelectedVenueObj(null);
                      return;
                    }

                    field.onChange(value);
                    setValue('locationType', SessionLocationType.VENUE);
                    clearCustomLocation();
                    const venue = venues.find((v) => v.id === value);
                    setSelectedVenueObj(venue ?? null);
                  }}
                  options={venueOptions}
                  placeholder={t('generalSettings.selectVenue')}
                  searchPlaceholder={t('generalSettings.searchVenue')}
                  noOptionsMessage={t('generalSettings.noVenueFound')}
                  onSearchChange={handleVenueSearch}
                  isLoading={isVenueLoading}
                  isDisabled={!canEditVenue}
                  dropdownZIndex={2000}
                  dropdownPortalContainerRef={venueFieldRef}
                  isClearable
                  clearAriaLabel={t('generalSettings.clearLocation')}
                  searchActions={[
                    {
                      label: (query) =>
                        t('generalSettings.useCustomLocation', { name: query }),
                      onClick: (query) => {
                        field.onChange('');
                        setValue('locationType', SessionLocationType.CUSTOM, {
                          shouldValidate: true,
                        });
                        setValue('customLocation', query, {
                          shouldValidate: true,
                        });
                        clearCustomLocationDetails();
                        setSelectedVenueObj(null);
                      },
                      variant: 'primary',
                      icon: MapPin,
                    },
                    ...(onSuggestNewVenue
                      ? [
                          {
                            label: () => tVenueRequests('suggestNewVenue'),
                            onClick: (query: string) =>
                              onSuggestNewVenue(query),
                            variant: 'secondary' as const,
                            icon: Plus,
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            />

            <Field.ErrorText color="fg.error">
              {errors.selectedVenueId?.message}
            </Field.ErrorText>
          </Field.Root>

          {/* Only meaningful while the custom fallback is still in place:
              switching back to a Vmito venue resolves the problem, so the
              warning disappears on its own without the user dismissing it. */}
          {showAiCustomLocationWarning &&
          locationType === SessionLocationType.CUSTOM ? (
            <Alert.Root status="warning" size="sm" mt={3} borderRadius="md">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  {t('generalSettings.aiCustomLocation.title')}
                </Alert.Title>
                <Alert.Description>
                  {t('generalSettings.aiCustomLocation.description')}
                </Alert.Description>
              </Alert.Content>
              {onDismissAiCustomLocationWarning ? (
                <CloseButton
                  size="xs"
                  pos="relative"
                  top="-1"
                  insetEnd="-1"
                  aria-label={tCommon('close')}
                  onClick={onDismissAiCustomLocationWarning}
                />
              ) : null}
            </Alert.Root>
          ) : null}

          {locationType === SessionLocationType.CUSTOM ? (
            <Box
              mt={3}
              p={{ base: 3, md: 4 }}
              borderWidth="1px"
              borderColor={{ base: 'green.200', _dark: 'green.700' }}
              bg={{ base: 'green.50', _dark: 'green.950' }}
              borderRadius="lg"
            >
              <Badge mb={3} colorPalette="green" variant="subtle">
                {t('generalSettings.temporaryLocation')}
              </Badge>

              <Stack gap={3}>
                <Field.Root invalid={!!errors.customLocation}>
                  <Field.Label>
                    {t('generalSettings.customLocationName')}{' '}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Field.Label>
                  <Input
                    {...register('customLocation')}
                    autoComplete="off"
                    placeholder={t('generalSettings.customLocationPlaceholder')}
                    disabled={!canEditVenue}
                    bg={{ base: 'white', _dark: 'gray.800' }}
                  />
                  <Field.ErrorText color="fg.error">
                    {errors.customLocation?.message}
                  </Field.ErrorText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>
                    {t('generalSettings.customLocationAddress')}{' '}
                    <Text as="span" color="fg.muted" fontWeight="normal">
                      ({t('generalSettings.recommendedLabel')})
                    </Text>
                  </Field.Label>
                  <LocationAutocomplete
                    value={customLocationAddress || ''}
                    onInputChange={(address) => {
                      setValue('customLocationAddress', address, {
                        shouldDirty: true,
                      });
                      setValue('customLocationPlaceId', '');
                      setValue('customLocationLat', undefined);
                      setValue('customLocationLng', undefined);
                      setValue('customLocationDistrict', '');
                      setValue('customLocationCity', '');
                    }}
                    onSelect={(place) => {
                      setValue('customLocationAddress', place.address, {
                        shouldDirty: true,
                      });
                      setValue('customLocationPlaceId', place.placeId);
                      setValue('customLocationLat', place.lat);
                      setValue('customLocationLng', place.lng);
                      setValue('customLocationDistrict', place.district || '');
                      setValue('customLocationCity', place.city || '');
                    }}
                    inputName="customLocationAddress"
                    ariaLabel={t('generalSettings.customLocationAddress')}
                    placeholder={t(
                      'generalSettings.customLocationAddressPlaceholder'
                    )}
                    isDisabled={!canEditVenue}
                  />
                  <Field.HelperText color="fg.muted">
                    {t('generalSettings.customLocationAddressHelp')}
                  </Field.HelperText>
                </Field.Root>
              </Stack>
            </Box>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
