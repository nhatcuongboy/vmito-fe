'use client';

import React, { useState } from 'react';
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Field } from '@/components/ui/Field';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { VButton } from '@/components/ui/VButton';
import { VSwitch } from '@/components/ui/VSwitch';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import { VenueService } from '@/lib/api/venue.service';
import {
  ClosureStatus,
  EImageCategory,
  Venue,
  VenueStatus,
} from '@/lib/api/types';
import { VIETNAM_CITIES, getDistrictsByCity } from '@/lib/vietnam-locations';
import { trimPhone } from '@/utils/phone-utils';
import { formatOpeningHours } from '@/utils/time-helpers';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';
import PageLayout from '@/components/layout/PageLayout';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';

const venueSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  description: z
    .string()
    .max(5000, 'Mô tả quá dài (tối đa 5000 ký tự)')
    .optional(),
  placeId: z.string().min(1, 'Place ID là bắt buộc'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  locatedWithin: z.string().optional(),
  district: z.string().min(1, 'Quận/huyện là bắt buộc'),
  city: z.string().min(1, 'Thành phố là bắt buộc'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  newAddress: z.string().optional(),
  newDistrict: z.string().optional(),
  newCity: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHours: z.string().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  numberOfCourts: z.number().int().min(1).optional(),
  hourlyRateFixed: z.number().int().min(0).optional(),
  hourlyRateWalkIn: z.number().int().min(0).optional(),
  status: z.string().optional(),
  closureStatus: z.string().optional(),
  isVerified: z.boolean(),
  hasCarParking: z.boolean().optional(),
  hasCanteen: z.boolean().optional(),
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  bookingPolicy: z.string().optional(),
  courtLayoutImage: z.string().optional(),
  courtLayoutImagePublicId: z.string().optional(),
  logo: z.string().optional(),
  logoPublicId: z.string().optional(),
});

type VenueFormValues = z.infer<typeof venueSchema>;

const Divider = () => <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.800' }} />;

const SectionLabel = ({ title }: { title: string }) => (
  <Text fontWeight="semibold" fontSize="sm" color="gray.500">
    {title}
  </Text>
);

export default function CreateVenuePage() {
  const router = useRouter();
  const t = useTranslations('admin');
  const [venueImages, setVenueImages] = useState<ISessionImage[]>([]);
  const [venueBannerIndex, setVenueBannerIndex] = useState(0);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      description: '',
      placeId: '',
      address: '',
      locatedWithin: '',
      district: '',
      city: '',
      lat: undefined,
      lng: undefined,
      newAddress: '',
      newDistrict: '',
      newCity: '',
      phone: '',
      website: '',
      openingHours: '',
      openTime: '',
      closeTime: '',
      numberOfCourts: undefined,
      hourlyRateFixed: undefined,
      hourlyRateWalkIn: undefined,
      status: 'ACTIVE',
      closureStatus: 'OPERATING',
      isVerified: false,
      hasCarParking: false,
      hasCanteen: false,
      wifiName: '',
      wifiPassword: '',
      bookingPolicy: '',
      courtLayoutImage: '',
      courtLayoutImagePublicId: '',
      logo: '',
      logoPublicId: '',
    },
  });

  const handleSubmit = async (data: VenueFormValues) => {
    try {
      const images = venueImages.map((img) => img.url);
      const imagePublicIds = venueImages.map((img) => img.publicId);
      const coverPhoto = venueImages[venueBannerIndex]?.url;
      const coverPhotoPublicId = venueImages[venueBannerIndex]?.publicId;
      const { openTime, closeTime, ...venueData } = data;

      const payload = {
        ...venueData,
        openingHours: formatOpeningHours(openTime, closeTime) || undefined,
        coverPhoto,
        coverPhotoPublicId,
        images,
        imagePublicIds,
        status: data.status as VenueStatus,
        closureStatus: data.closureStatus as ClosureStatus,
        phone: trimPhone(data.phone),
      };

      const result = await VenueService.createVenue(
        payload as Omit<Venue, 'id'>
      );
      toaster.success({ title: t('venueCreatedSuccess') });
      router.push(`/venues/${result.slug || result.id}`);
    } catch (_error) {
      console.error('Failed to create venue:', _error);
      toaster.error({ title: t('failedToCreateVenue') });
    }
  };

  const selectedCity = form.watch('city');
  const districtOptions = getDistrictsByCity(selectedCity);

  return (
    <PageLayout title="Tạo sân mới" showBackButton backHref="/admin/venues">
      <Box
        bg={{ base: 'white', _dark: 'gray.900' }}
        p={{ base: 4, md: 6 }}
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
        maxW="container.md"
        mx="auto"
      >
        <VStack gap={6} align="stretch">
          {/* Thông tin cơ bản */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Thông tin cơ bản" />

            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field
                  label="Tên sân"
                  required
                  invalid={!!fieldState.error}
                  errorText={fieldState.error?.message}
                >
                  <Input {...field} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <Field label="Mô tả">
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Nhập mô tả về sân..."
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="placeId"
              render={({ field, fieldState }) => (
                <Field
                  label="Place ID"
                  required
                  invalid={!!fieldState.error}
                  errorText={fieldState.error?.message}
                >
                  <Input {...field} placeholder="Google Place ID" />
                </Field>
              )}
            />
          </VStack>

          <Divider />

          {/* Thông tin địa chỉ */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Thông tin địa chỉ" />
            <Text fontSize="xs" color="gray.500">
              {t('legacyAddressHelper')}
            </Text>

            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field
                  label="Địa chỉ"
                  required
                  invalid={!!fieldState.error}
                  errorText={fieldState.error?.message}
                >
                  <Input {...field} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="locatedWithin"
              render={({ field }) => (
                <Field label="Vị trí trực thuộc">
                  <Input {...field} placeholder="VD: Nhà thi đấu A" />
                </Field>
              )}
            />

            <HStack width="full" gap={4} align="flex-start">
              <Controller
                control={form.control}
                name="city"
                render={({ field, fieldState }) => (
                  <Field
                    flex={1}
                    label="Thành phố"
                    required
                    invalid={!!fieldState.error}
                    errorText={fieldState.error?.message}
                  >
                    <SearchableSelect
                      options={VIETNAM_CITIES}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        form.setValue('district', '');
                      }}
                      placeholder="Chọn thành phố"
                      isInvalid={!!fieldState.error}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="district"
                render={({ field, fieldState }) => (
                  <Field
                    flex={1}
                    label="Quận/Huyện"
                    required
                    invalid={!!fieldState.error}
                    errorText={fieldState.error?.message}
                  >
                    <SearchableSelect
                      options={districtOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        selectedCity
                          ? 'Chọn quận/huyện'
                          : 'Chọn thành phố trước'
                      }
                      isDisabled={!selectedCity}
                      isInvalid={!!fieldState.error}
                      noOptionsMessage="Không tìm thấy quận/huyện"
                    />
                  </Field>
                )}
              />
            </HStack>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <Field flex={1} label="Vĩ độ (Latitude)">
                    <Input
                      {...field}
                      type="number"
                      step="any"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <Field flex={1} label="Kinh độ (Longitude)">
                    <Input
                      {...field}
                      type="number"
                      step="any"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field>
                )}
              />
            </HStack>

            <Text fontWeight="medium" fontSize="xs" color="blue.500">
              {t('newAddressSection')}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {t('newAddressHelper')}
            </Text>

            <Controller
              control={form.control}
              name="newAddress"
              render={({ field }) => (
                <Field label="Địa chỉ mới">
                  <Input {...field} placeholder={t('newAddressPlaceholder')} />
                </Field>
              )}
            />

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="newDistrict"
                render={({ field }) => (
                  <Field flex={1} label="Phường/Xã mới">
                    <Input
                      {...field}
                      placeholder={t('newDistrictPlaceholder')}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="newCity"
                render={({ field }) => (
                  <Field flex={1} label="Tỉnh/Thành phố mới">
                    <Input {...field} placeholder={t('newCityPlaceholder')} />
                  </Field>
                )}
              />
            </HStack>
          </VStack>

          <Divider />

          {/* Thông tin liên hệ */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Thông tin liên hệ" />

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <Field flex={1} label="Số điện thoại">
                    <Input {...field} placeholder="VD: +84 123 456 789" />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="website"
                render={({ field }) => (
                  <Field flex={1} label="Website">
                    <Input {...field} placeholder="VD: https://example.com" />
                  </Field>
                )}
              />
            </HStack>
          </VStack>

          <Divider />

          {/* Thông tin sân */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Thông tin sân" />

            <Field label="Giờ hoạt động">
              <HStack width="full" gap={4}>
                <Controller
                  control={form.control}
                  name="openTime"
                  render={({ field }) => (
                    <VDateTimeInput
                      {...field}
                      type="time"
                      placeholder="Bắt đầu"
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
                      placeholder="Kết thúc"
                    />
                  )}
                />
              </HStack>
            </Field>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="numberOfCourts"
                render={({ field }) => (
                  <Field flex={1} label="Số lượng sân">
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseInt(e.target.value, 10)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field>
                )}
              />
              <Box flex={1} />
            </HStack>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="hourlyRateFixed"
                render={({ field }) => (
                  <Field flex={1} label="Giá thuê cố định (VND)">
                    <MoneyInput
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="hourlyRateWalkIn"
                render={({ field }) => (
                  <Field flex={1} label="Giá thuê vãng lai (VND)">
                    <MoneyInput
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </HStack>
          </VStack>

          <Divider />

          {/* Trạng thái */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Trạng thái" />

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Field flex={1} label="Trạng thái hoạt động">
                    <SearchableSelect
                      options={[
                        { value: 'ACTIVE', label: 'Hoạt động' },
                        { value: 'INACTIVE', label: 'Tạm ngừng' },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="closureStatus"
                render={({ field }) => (
                  <Field flex={1} label="Tình trạng đóng cửa">
                    <SearchableSelect
                      options={[
                        { value: 'OPERATING', label: 'Đang mở cửa' },
                        {
                          value: 'TEMPORARILY_CLOSED',
                          label: 'Đóng cửa tạm thời',
                        },
                        {
                          value: 'PERMANENTLY_CLOSED',
                          label: 'Đóng cửa vĩnh viễn',
                        },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </HStack>

            <Controller
              control={form.control}
              name="isVerified"
              render={({ field }) => (
                <VSwitch
                  checked={field.value}
                  onCheckedChange={(details) => field.onChange(details.checked)}
                  label="Đã xác minh"
                  colorPalette="green"
                />
              )}
            />
          </VStack>

          <Divider />

          {/* Tiện ích */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Tiện ích" />

            <HStack gap={6}>
              <Controller
                control={form.control}
                name="hasCarParking"
                render={({ field }) => (
                  <VSwitch
                    checked={!!field.value}
                    onCheckedChange={(details) =>
                      field.onChange(details.checked)
                    }
                    label="Có bãi đậu ô tô"
                    colorPalette="green"
                  />
                )}
              />
              <Controller
                control={form.control}
                name="hasCanteen"
                render={({ field }) => (
                  <VSwitch
                    checked={!!field.value}
                    onCheckedChange={(details) =>
                      field.onChange(details.checked)
                    }
                    label="Có căn tin/bán nước"
                    colorPalette="green"
                  />
                )}
              />
            </HStack>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="wifiName"
                render={({ field }) => (
                  <Field flex={1} label="Tên WiFi">
                    <Input {...field} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="wifiPassword"
                render={({ field }) => (
                  <Field flex={1} label="Mật khẩu WiFi">
                    <Input {...field} />
                  </Field>
                )}
              />
            </HStack>
          </VStack>

          <Divider />

          {/* Chính sách */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Chính sách" />

            <Controller
              control={form.control}
              name="bookingPolicy"
              render={({ field }) => (
                <Field label="Chính sách đặt sân">
                  <Input {...field} />
                </Field>
              )}
            />
          </VStack>

          <Divider />

          {/* Hình ảnh */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Hình ảnh" />

            <Field label="Ảnh sân">
              <AppMultiImageUpload
                images={venueImages}
                bannerIndex={venueBannerIndex}
                onImagesChange={setVenueImages}
                onBannerChange={setVenueBannerIndex}
                maxImages={10}
                category={EImageCategory.OTHER}
                label={null}
              />
            </Field>

            <Controller
              control={form.control}
              name="courtLayoutImage"
              render={({ field }) => (
                <Field label="Sơ đồ sân">
                  <AppSingleImageUpload
                    value={field.value}
                    publicId={form.watch('courtLayoutImagePublicId')}
                    onChange={(image) => {
                      field.onChange(image.url);
                      form.setValue(
                        'courtLayoutImagePublicId',
                        image.publicId || ''
                      );
                    }}
                    onClear={() => {
                      field.onChange('');
                      form.setValue('courtLayoutImagePublicId', '');
                    }}
                    category={EImageCategory.OTHER}
                    alt="Sơ đồ sân"
                    urlPlaceholder="Nhập URL hình ảnh sơ đồ sân..."
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="logo"
              render={({ field }) => (
                <Field label="Logo sân">
                  <AppSingleImageUpload
                    value={field.value}
                    publicId={form.watch('logoPublicId')}
                    onChange={(image) => {
                      field.onChange(image.url);
                      form.setValue('logoPublicId', image.publicId || '');
                    }}
                    onClear={() => {
                      field.onChange('');
                      form.setValue('logoPublicId', '');
                    }}
                    category={EImageCategory.OTHER}
                    alt="Logo sân"
                    urlPlaceholder="Nhập URL logo sân..."
                  />
                </Field>
              )}
            />
          </VStack>

          {/* Actions */}
          <Flex justify="flex-end" gap={4} mt={2}>
            <VButton
              variant="ghost"
              onClick={() => router.push('/admin/venues')}
            >
              Hủy
            </VButton>
            <VButton
              colorPalette="green"
              loading={form.formState.isSubmitting}
              onClick={form.handleSubmit(handleSubmit)}
            >
              Tạo sân
            </VButton>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
}
