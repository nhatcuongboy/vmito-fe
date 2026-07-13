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
import { Sparkles } from 'lucide-react';
import { Controller } from 'react-hook-form';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { useTranslations } from 'next-intl';

import { Venue } from '@/lib/api/types';
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
}) {
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
          <Field.Root
            invalid={!!errors.selectedVenueId}
            disabled={!canEditVenue}
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
                  onSearchChange={handleVenueSearch}
                  isLoading={isVenueLoading}
                  isDisabled={!canEditVenue}
                />
              )}
            />
            <Field.ErrorText color="fg.error">
              {errors.selectedVenueId?.message}
            </Field.ErrorText>
          </Field.Root>
        </Box>
      </Stack>
    </Box>
  );
}
