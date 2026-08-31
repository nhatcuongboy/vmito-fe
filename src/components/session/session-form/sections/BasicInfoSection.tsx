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
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import { VSwitch } from '@/components/ui/VSwitch';
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
import { useAiFeatureEnabled } from '@/hooks/useAiFeatureEnabled';
import { useRef, useState, useEffect } from 'react';

type Translator = ReturnType<typeof useTranslations>;

interface VenueOption {
  value: string;
  label: string;
  sublabel?: string;
}

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
  const aiFeatureEnabled = useAiFeatureEnabled();
  const locationType = useWatch({ control, name: 'locationType' });
  const selectedVenueId = useWatch({ control, name: 'selectedVenueId' });
  const customLocation = useWatch({ control, name: 'customLocation' });
  const customLocationAddress = useWatch({
    control,
    name: 'customLocationAddress',
  });
  const venueFieldRef = useRef<HTMLDivElement>(null);

  // State for custom location toggle switch
  // Default to false (venue mode), but initialize based on form's locationType
  const [isCustomLocationMode, setIsCustomLocationMode] = useState(false);

  // Initialize switch state based on form's locationType on mount
  useEffect(() => {
    if (locationType === SessionLocationType.CUSTOM) {
      setIsCustomLocationMode(true);
    }
  }, [locationType]);

  // Handler for toggle switch
  const handleToggleCustomLocation = (checked: boolean) => {
    setIsCustomLocationMode(checked);
    // Update form's locationType to match switch state
    setValue(
      'locationType',
      checked ? SessionLocationType.CUSTOM : SessionLocationType.VENUE,
      { shouldValidate: true }
    );
  };

  // Find the selected venue object for address display
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  const clearCustomLocationDetails = () => {
    setValue('customLocationAddress', '');
    setValue('customLocationPlaceId', '');
    setValue('customLocationLat', undefined);
    setValue('customLocationLng', undefined);
    setValue('customLocationDistrict', '');
    setValue('customLocationCity', '');
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
        {!isEditMode && aiFeatureEnabled && (
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
          {/* <Field.HelperText>{tSport('selectHelper')}</Field.HelperText> */}
        </Field.Root>

        {/* Location */}
        <Box id="field-venue" ref={venueFieldRef}>
          <Field.Root
            disabled={!canEditVenue}
            invalid={
              (locationType === SessionLocationType.VENUE &&
                !!errors.selectedVenueId) ||
              (locationType === SessionLocationType.CUSTOM &&
                !!errors.customLocation)
            }
          >
            <Flex align="center" justify="space-between" mb={2} width="100%">
              <Field.Label>
                {t('location')}{' '}
                <Text as="span" color="red.500">
                  *
                </Text>
              </Field.Label>
              <Flex align="center" gap={2}>
                <Text fontSize="sm" color="fg.muted">
                  {t('generalSettings.customLocationToggle')}
                </Text>
                <VSwitch
                  checked={isCustomLocationMode}
                  onCheckedChange={(e) => handleToggleCustomLocation(e.checked)}
                  disabled={!canEditVenue}
                  size="sm"
                  colorPalette="green"
                />
              </Flex>
            </Flex>

            {/* Venue Select - Only show when switch is OFF */}
            {!isCustomLocationMode && (
              <>
                <Controller
                  control={control}
                  name="selectedVenueId"
                  render={({ field }) => (
                    <SearchableSelect
                      isInvalid={
                        locationType === SessionLocationType.VENUE &&
                        !!errors.selectedVenueId
                      }
                      value={field.value}
                      onChange={(value) => {
                        // Picking a venue resolves the AI warning
                        onDismissAiCustomLocationWarning?.();

                        if (!value) {
                          field.onChange('');
                          setValue('locationType', SessionLocationType.VENUE);
                          setSelectedVenueObj(null);
                          return;
                        }

                        field.onChange(value);
                        setValue('locationType', SessionLocationType.VENUE);
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
                      searchActions={
                        onSuggestNewVenue
                          ? [
                              {
                                label: () => tVenueRequests('suggestNewVenue'),
                                onClick: (query: string) =>
                                  onSuggestNewVenue(query),
                                variant: 'secondary' as const,
                                icon: Plus,
                              },
                            ]
                          : undefined
                      }
                    />
                  )}
                />

                {/* Venue Address Display - Show when venue is selected */}
                {selectedVenue && selectedVenue.address && (
                  <Flex
                    align="center"
                    gap={1.5}
                    mt={1.5}
                    aria-label={t('generalSettings.venueAddress')}
                  >
                    <Box
                      as="span"
                      display="inline-flex"
                      alignItems="center"
                      flexShrink={0}
                      color="fg.muted"
                    >
                      <MapPin size={14} />
                    </Box>
                    <Box flex="1" minW={0}>
                      <AppAddressDisplay
                        address={selectedVenue.address}
                        district={selectedVenue.district}
                        city={selectedVenue.city}
                        newAddress={selectedVenue.newAddress}
                        newDistrict={selectedVenue.newDistrict}
                        fontSize="sm"
                        color="fg.muted"
                        lineClamp={2}
                      />
                    </Box>
                  </Flex>
                )}
              </>
            )}

            <Field.ErrorText color="fg.error">
              {locationType === SessionLocationType.VENUE
                ? errors.selectedVenueId?.message
                : errors.customLocation?.message}
            </Field.ErrorText>
          </Field.Root>

          {/* AI Custom Location Warning - Show regardless of switch state when applicable */}
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

          {/* Custom Location Section - Only show when switch is ON */}
          {isCustomLocationMode && (
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
          )}
        </Box>
      </Stack>
    </Box>
  );
}
