import {
  Box,
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
import { Radio } from '@/components/ui/radio';
import { Sparkles } from 'lucide-react';
import { Controller, useWatch } from 'react-hook-form';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { useTranslations } from 'next-intl';
import { useTranslations as useNextIntlTranslations } from 'next-intl';

import { SessionLocationType, Venue } from '@/lib/api/types';
import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';

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
  errors,
  control,
  canEditVenue,
  venues,
  setSelectedVenueObj,
  venueOptions,
  handleVenueSearch,
  isVenueLoading,
  onSuggestNewVenue,
}: {
  t: Translator;
  isEditMode: boolean;
  onOpenAIModal: () => void;
  register: UseFormRegister<SessionFormData>;
  errors: FieldErrors<SessionFormData>;
  control: Control<SessionFormData>;
  canEditVenue: boolean;
  venues: Venue[];
  setSelectedVenueObj: (venue: Venue | null) => void;
  venueOptions: VenueOption[];
  handleVenueSearch: (keyword: string) => void;
  isVenueLoading: boolean;
  /** Called when user clicks "Suggest new venue" in the empty-state of the venue dropdown */
  onSuggestNewVenue?: () => void;
}) {
  const tVenueRequests = useNextIntlTranslations('venueRequests');
  const locationType = useWatch({ control, name: 'locationType' });
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

        {/* Location */}
        <Box id="field-venue">
          <Field.Root disabled={!canEditVenue}>
            <Field.Label>
              {t('location')}{' '}
              <Text as="span" color="red.500">
                *
              </Text>
            </Field.Label>
            <Controller
              control={control}
              name="locationType"
              render={({ field }) => (
                <Radio.Root
                  value={field.value}
                  onValueChange={(details) => field.onChange(details.value)}
                  disabled={!canEditVenue}
                  display="flex"
                  gap={5}
                  mb={3}
                >
                  <Radio.Item value={SessionLocationType.VENUE}>
                    {t('generalSettings.existingVenue')}
                  </Radio.Item>
                  <Radio.Item value={SessionLocationType.CUSTOM}>
                    {t('generalSettings.customLocation')}
                  </Radio.Item>
                </Radio.Root>
              )}
            />

            {locationType === SessionLocationType.VENUE ? (
              <Field.Root invalid={!!errors.selectedVenueId}>
                <Controller
                  control={control}
                  name="selectedVenueId"
                  render={({ field }) => (
                    <SearchableSelect
                      isInvalid={!!errors.selectedVenueId}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
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
                      onNoOptionsAction={
                        onSuggestNewVenue
                          ? {
                              label: tVenueRequests('suggestNewVenue'),
                              onClick: onSuggestNewVenue,
                            }
                          : undefined
                      }
                    />
                  )}
                />
                <Field.ErrorText color="fg.error">
                  {errors.selectedVenueId?.message}
                </Field.ErrorText>
              </Field.Root>
            ) : (
              <Field.Root invalid={!!errors.customLocation}>
                <Input
                  {...register('customLocation')}
                  maxLength={200}
                  placeholder={t('generalSettings.customLocationPlaceholder')}
                  disabled={!canEditVenue}
                />
                <Text mt={1} fontSize="xs" color="fg.muted">
                  {t('generalSettings.customLocationHint')}
                </Text>
                <Field.ErrorText color="fg.error">
                  {errors.customLocation?.message}
                </Field.ErrorText>
              </Field.Root>
            )}
          </Field.Root>
        </Box>
      </Stack>
    </Box>
  );
}
