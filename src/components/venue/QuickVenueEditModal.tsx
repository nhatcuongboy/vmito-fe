'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import {
  VStack,
  HStack,
  Field,
  Textarea,
  NativeSelectRoot,
  NativeSelectField,
  Text,
} from '@chakra-ui/react';

import { ClosureStatus, Venue } from '@/lib/api/types';
import { VenueService } from '@/lib/api/venue.service';
import { Input } from '@/components/ui/Input';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VIETNAM_CITIES, getDistrictsByCity } from '@/lib/vietnam-locations';
import { trimPhone } from '@/utils/phone-utils';
import { Checkbox } from '@/components/ui/checkbox';

const venueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  placeId: z.string().min(1, 'Place ID is required'),
  description: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHours: z.string().optional(),
  numberOfCourts: z.number().int().min(1).optional(),
  hourlyRateFixed: z.number().int().min(0).optional(),
  hourlyRateWalkIn: z.number().int().min(0).optional(),
  isVerified: z.boolean(),
  hasCarParking: z.boolean().optional(),
  hasCanteen: z.boolean().optional(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  closureStatus: z.nativeEnum(ClosureStatus).optional(),
  bookingPolicy: z.string().optional(),
  locatedWithin: z.string().optional(),
  courtLayoutImage: z.string().optional(),
  courtLayoutImagePublicId: z.string().optional(),
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
      description: venue.description || '',
      address: venue.address,
      district: venue.district || '',
      city: venue.city || '',
      lat: venue.lat,
      lng: venue.lng,
      phone: venue.phone || '',
      website: venue.website || '',
      openingHours: venue.openingHours || '',
      numberOfCourts: venue.numberOfCourts,
      hourlyRateFixed: venue.hourlyRateFixed,
      hourlyRateWalkIn: venue.hourlyRateWalkIn,
      isVerified: venue.isVerified ?? false,
      hasCarParking: venue.hasCarParking ?? undefined,
      hasCanteen: venue.hasCanteen ?? undefined,
      wifiName: venue.wifiName || '',
      wifiPassword: venue.wifiPassword || '',
      closureStatus: venue.closureStatus ?? ClosureStatus.OPERATING,
      bookingPolicy: venue.bookingPolicy || '',
      locatedWithin: venue.locatedWithin || '',
      courtLayoutImage: venue.courtLayoutImage || '',
      courtLayoutImagePublicId: venue.courtLayoutImagePublicId || '',
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
      title={t('editVenue') || 'Sửa địa điểm'}
      primaryActionText={tCommon('save')}
      onPrimaryAction={() => form.handleSubmit(handleUpdate)()}
      isPrimaryLoading={form.formState.isSubmitting}
      secondaryActionText={tCommon('cancel')}
    >
      <VStack gap={4} as="form">
        {/* === Thông tin cơ bản === */}
        <Text fontWeight="semibold" w="full" color="gray.500" fontSize="sm">
          Thông tin cơ bản
        </Text>

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
          name="description"
          render={({ field }) => (
            <Field.Root>
              <Field.Label>{t('description') || 'Mô tả'}</Field.Label>
              <Textarea {...field} rows={3} resize="vertical" />
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
          name="locatedWithin"
          render={({ field }) => (
            <Field.Root>
              <Field.Label>{t('locatedWithin') || 'Nằm trong'}</Field.Label>
              <Input {...field} placeholder="Ví dụ: Trung tâm thể dục ABC" />
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

        {/* === Liên hệ === */}
        <Text fontWeight="semibold" w="full" color="gray.500" fontSize="sm">
          Liên hệ
        </Text>

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

        <Controller
          control={form.control}
          name="website"
          render={({ field }) => (
            <Field.Root>
              <Field.Label>Website</Field.Label>
              <Input {...field} placeholder="https://example.com" />
            </Field.Root>
          )}
        />

        {/* === Thông tin sân === */}
        <Text fontWeight="semibold" w="full" color="gray.500" fontSize="sm">
          Thông tin sân
        </Text>

        <HStack width="full" gap={4}>
          <Controller
            control={form.control}
            name="openingHours"
            render={({ field }) => (
              <Field.Root flex={1}>
                <Field.Label>Giờ mở cửa</Field.Label>
                <Input {...field} placeholder="6:00 AM - 11:00 PM" />
              </Field.Root>
            )}
          />
          <Controller
            control={form.control}
            name="numberOfCourts"
            render={({ field }) => (
              <Field.Root flex={1}>
                <Field.Label>Số sân</Field.Label>
                <Input
                  {...field}
                  type="number"
                  min={1}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  value={field.value ?? ''}
                />
              </Field.Root>
            )}
          />
        </HStack>

        <HStack width="full" gap={4}>
          <Controller
            control={form.control}
            name="hourlyRateFixed"
            render={({ field }) => (
              <Field.Root flex={1}>
                <Field.Label>Giá cố định (đ/h)</Field.Label>
                <Input
                  {...field}
                  type="number"
                  min={0}
                  placeholder="150000"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  value={field.value ?? ''}
                />
              </Field.Root>
            )}
          />
          <Controller
            control={form.control}
            name="hourlyRateWalkIn"
            render={({ field }) => (
              <Field.Root flex={1}>
                <Field.Label>Giá vãng lai (đ/h)</Field.Label>
                <Input
                  {...field}
                  type="number"
                  min={0}
                  placeholder="200000"
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  value={field.value ?? ''}
                />
              </Field.Root>
            )}
          />
        </HStack>

        {/* === Trạng thái === */}
        <Text fontWeight="semibold" w="full" color="gray.500" fontSize="sm">
          Trạng thái
        </Text>

        <Controller
          control={form.control}
          name="closureStatus"
          render={({ field }) => (
            <Field.Root>
              <Field.Label>
                {t('closureStatus') || 'Trạng thái hoạt động'}
              </Field.Label>
              <NativeSelectRoot>
                <NativeSelectField
                  {...field}
                  value={field.value ?? ClosureStatus.OPERATING}
                >
                  <option value={ClosureStatus.OPERATING}>
                    Đang hoạt động
                  </option>
                  <option value={ClosureStatus.TEMPORARILY_CLOSED}>
                    Tạm đóng cửa
                  </option>
                  <option value={ClosureStatus.PERMANENTLY_CLOSED}>
                    Đóng cửa vĩnh viễn
                  </option>
                </NativeSelectField>
              </NativeSelectRoot>
            </Field.Root>
          )}
        />

        <Controller
          control={form.control}
          name="isVerified"
          render={({ field }) => (
            <Field.Root>
              <Checkbox
                checked={field.value}
                onCheckedChange={(e) => field.onChange(!!e.checked)}
              >
                {t('isVerified') || 'Đã xác minh'}
              </Checkbox>
            </Field.Root>
          )}
        />

        {/* === Tiện ích === */}
        <Text fontWeight="semibold" w="full" color="gray.500" fontSize="sm">
          Tiện ích
        </Text>

        <HStack width="full" gap={6}>
          <Controller
            control={form.control}
            name="hasCarParking"
            render={({ field }) => (
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={(e) => field.onChange(!!e.checked)}
              >
                {t('hasCarParking') || 'Bãi đậu xe ô tô'}
              </Checkbox>
            )}
          />
          <Controller
            control={form.control}
            name="hasCanteen"
            render={({ field }) => (
              <Checkbox
                checked={field.value ?? false}
                onCheckedChange={(e) => field.onChange(!!e.checked)}
              >
                {t('hasCanteen') || 'Căn tin'}
              </Checkbox>
            )}
          />
        </HStack>

        <HStack width="full" gap={4}>
          <Controller
            control={form.control}
            name="wifiName"
            render={({ field }) => (
              <Field.Root flex={1}>
                <Field.Label>{t('wifiName') || 'Tên WiFi'}</Field.Label>
                <Input {...field} placeholder="VenueWiFi" />
              </Field.Root>
            )}
          />
          <Controller
            control={form.control}
            name="wifiPassword"
            render={({ field }) => (
              <Field.Root flex={1}>
                <Field.Label>
                  {t('wifiPassword') || 'Mật khẩu WiFi'}
                </Field.Label>
                <Input {...field} placeholder="••••••••" />
              </Field.Root>
            )}
          />
        </HStack>

        {/* === Chính sách & Sơ đồ === */}
        <Text fontWeight="semibold" w="full" color="gray.500" fontSize="sm">
          Chính sách & Sơ đồ sân
        </Text>

        <Controller
          control={form.control}
          name="bookingPolicy"
          render={({ field }) => (
            <Field.Root>
              <Field.Label>
                {t('bookingPolicy') || 'Chính sách đặt sân'}
              </Field.Label>
              <Textarea
                {...field}
                rows={3}
                resize="vertical"
                placeholder="Nhập chính sách đặt sân..."
              />
            </Field.Root>
          )}
        />

        <Controller
          control={form.control}
          name="courtLayoutImage"
          render={({ field }) => (
            <Field.Root>
              <Field.Label>
                {t('courtLayoutImage') || 'Sơ đồ sân (URL ảnh)'}
              </Field.Label>
              <Input {...field} placeholder="https://..." />
            </Field.Root>
          )}
        />
      </VStack>
    </VModal>
  );
}
