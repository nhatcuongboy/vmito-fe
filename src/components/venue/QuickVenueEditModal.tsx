'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { VStack, HStack, Field } from '@chakra-ui/react';

import { Venue } from '@/lib/api/types';
import { VenueService } from '@/lib/api/venue.service';
import { Input } from '@/components/ui/Input';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VIETNAM_CITIES, getDistrictsByCity } from '@/lib/vietnam-locations';
import { trimPhone } from '@/utils/phone-utils';

const venueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  placeId: z.string().min(1, 'Place ID is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  isVerified: z.boolean(),
});

type VenueFormValues = z.infer<typeof venueSchema>;

interface QuickVenueEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue;
  onUpdated: (venue: Venue) => void;
}

export function QuickVenueEditModal({
  isOpen,
  onClose,
  venue,
  onUpdated,
}: QuickVenueEditModalProps) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: venue.name,
      placeId: venue.placeId,
      address: venue.address,
      district: venue.district || '',
      city: venue.city || '',
      lat: venue.lat,
      lng: venue.lng,
      phone: venue.phone || '',
      isVerified: venue.isVerified ?? false,
    },
  });

  const handleUpdate = async (data: VenueFormValues) => {
    try {
      const payload = {
        ...data,
        phone: trimPhone(data.phone),
      };
      const updated = await VenueService.updateVenue(venue.id, payload);
      toaster.success({
        title: t('venueUpdatedSuccess') || 'Cập nhật sân thành công',
      });
      onUpdated(updated);
      onClose();
    } catch (error) {
      console.error('Failed to update venue:', error);
      toaster.error({
        title: t('failedToUpdateVenue') || 'Không thể cập nhật sân',
      });
    }
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editVenue') || 'Sửa địa điểm (Nhanh)'}
      primaryActionText={tCommon('save')}
      onPrimaryAction={() => form.handleSubmit(handleUpdate)()}
      isPrimaryLoading={form.formState.isSubmitting}
      secondaryActionText={tCommon('cancel')}
    >
      <VStack gap={4} as="form">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field.Root invalid={!!fieldState.error} required>
              <Field.Label>
                {t('name') || 'Tên'} <Field.RequiredIndicator />
              </Field.Label>
              <Input {...field} />
              <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
            </Field.Root>
          )}
        />

        <Controller
          control={form.control}
          name="placeId"
          render={({ field, fieldState }) => (
            <Field.Root invalid={!!fieldState.error} required>
              <Field.Label>
                {t('placeId') || 'Place ID'} <Field.RequiredIndicator />
              </Field.Label>
              <Input {...field} placeholder="Google Place ID" />
              <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
            </Field.Root>
          )}
        />

        <Controller
          control={form.control}
          name="address"
          render={({ field, fieldState }) => (
            <Field.Root invalid={!!fieldState.error} required>
              <Field.Label>
                {t('address') || 'Địa chỉ'} <Field.RequiredIndicator />
              </Field.Label>
              <Input {...field} />
              <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
            </Field.Root>
          )}
        />

        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <Field.Root>
              <Field.Label>{t('phone') || 'Số điện thoại'}</Field.Label>
              <Input {...field} placeholder="e.g. +84 123 456 789" />
            </Field.Root>
          )}
        />

        <HStack width="full" gap={4} align="flex-start">
          <Controller
            control={form.control}
            name="city"
            render={({ field, fieldState }) => (
              <Field.Root flex={1} invalid={!!fieldState.error} required>
                <Field.Label>
                  {t('city') || 'Thành phố'} <Field.RequiredIndicator />
                </Field.Label>
                <SearchableSelect
                  options={VIETNAM_CITIES}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    form.setValue('district', '');
                  }}
                  placeholder={t('city') || 'Thành phố'}
                  isInvalid={!!fieldState.error}
                />
                <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
              </Field.Root>
            )}
          />
          <Controller
            control={form.control}
            name="district"
            render={({ field, fieldState }) => {
              const selectedCity = form.watch('city');
              const districtOptions = getDistrictsByCity(selectedCity);
              return (
                <Field.Root flex={1} invalid={!!fieldState.error} required>
                  <Field.Label>
                    {t('district') || 'Quận/Huyện'} <Field.RequiredIndicator />
                  </Field.Label>
                  <SearchableSelect
                    options={districtOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={
                      selectedCity
                        ? t('district') || 'Quận/Huyện'
                        : 'Chọn thành phố trước'
                    }
                    isDisabled={!selectedCity}
                    isInvalid={!!fieldState.error}
                    noOptionsMessage="Không tìm thấy"
                  />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              );
            }}
          />
        </HStack>

        <HStack width="full" gap={4}>
          <Controller
            control={form.control}
            name="lat"
            render={({ field }) => (
              <Field.Root flex={1}>
                <Field.Label>Latitude</Field.Label>
                <Input
                  {...field}
                  type="number"
                  step="any"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  value={field.value ?? ''}
                />
              </Field.Root>
            )}
          />
          <Controller
            control={form.control}
            name="lng"
            render={({ field }) => (
              <Field.Root flex={1}>
                <Field.Label>Longitude</Field.Label>
                <Input
                  {...field}
                  type="number"
                  step="any"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  value={field.value ?? ''}
                />
              </Field.Root>
            )}
          />
        </HStack>
      </VStack>
    </VModal>
  );
}
