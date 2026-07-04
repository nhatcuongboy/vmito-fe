'use client';

import React, { useState, useEffect } from 'react';
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
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
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';
import VenuePricingManager from '@/components/venue/VenuePricingManager';
import PageLayout from '@/components/layout/PageLayout';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { use } from 'react';
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
});

type VenueFormValues = z.infer<typeof venueSchema>;

const Divider = () => <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.800' }} />;

const SectionLabel = ({ title }: { title: string }) => (
  <Text fontWeight="semibold" fontSize="sm" color="gray.500">
    {title}
  </Text>
);

export default function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('admin');
  const [venueImages, setVenueImages] = useState<ISessionImage[]>([]);
  const [venueBannerIndex, setVenueBannerIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [venue, setVenue] = useState<Venue | null>(null);

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
    },
  });

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setIsLoading(true);
        const data = await VenueService.getVenue(id);
        setVenue(data);

        form.reset({
          name: data.name,
          placeId: data.placeId,
          address: data.address,
          district: data.district || '',
          city: data.city || '',
          locatedWithin: data.locatedWithin || '',
          newAddress: data.newAddress || '',
          newDistrict: data.newDistrict || '',
          newCity: data.newCity || '',
          lat: data.lat ?? undefined,
          lng: data.lng ?? undefined,
          phone: data.phone || '',
          website: data.website || '',
          isVerified: data.isVerified ?? false,
          description: data.description || '',
          openingHours: data.openingHours || '',
          numberOfCourts: data.numberOfCourts ?? undefined,
          status: data.status || 'ACTIVE',
          closureStatus: data.closureStatus || 'OPERATING',
          hourlyRateFixed: data.hourlyRateFixed ?? undefined,
          hourlyRateWalkIn: data.hourlyRateWalkIn ?? undefined,
          hasCarParking: data.hasCarParking ?? false,
          hasCanteen: data.hasCanteen ?? false,
          wifiName: data.wifiName || '',
          wifiPassword: data.wifiPassword || '',
          bookingPolicy: data.bookingPolicy || '',
          courtLayoutImage: data.courtLayoutImage || '',
          courtLayoutImagePublicId: data.courtLayoutImagePublicId || '',
        });

        // Initialize venueImages from venue data
        const loadedImages: ISessionImage[] = [];

        // Add coverPhoto first if it exists
        if (data.coverPhoto && data.coverPhotoPublicId) {
          loadedImages.push({
            url: data.coverPhoto,
            publicId: data.coverPhotoPublicId,
          });
        }

        // Add other images
        if (data.images && data.imagePublicIds) {
          data.images.forEach((url, idx) => {
            const publicId = data.imagePublicIds?.[idx];
            if (
              publicId &&
              !loadedImages.some((img) => img.publicId === publicId)
            ) {
              loadedImages.push({ url, publicId });
            }
          });
        }

        setVenueImages(loadedImages);
        setVenueBannerIndex(0);
      } catch (error: unknown) {
        console.error('Failed to fetch venue:', error);
        if (
          (error as { response?: { status?: number } })?.response?.status ===
          404
        ) {
          toaster.error({ title: t('venues.notFound') });
        } else {
          toaster.error({ title: t('venues.loadError') });
        }
        router.push('/admin/venues');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenue();
  }, [id, router, form]);

  const handleSubmit = async (data: VenueFormValues) => {
    try {
      const images = venueImages.map((img) => img.url);
      const imagePublicIds = venueImages.map((img) => img.publicId);
      const coverPhoto = venueImages[venueBannerIndex]?.url;
      const coverPhotoPublicId = venueImages[venueBannerIndex]?.publicId;

      const payload = {
        ...data,
        coverPhoto,
        coverPhotoPublicId,
        images,
        imagePublicIds,
        status: data.status as VenueStatus,
        closureStatus: data.closureStatus as ClosureStatus,
        phone: trimPhone(data.phone),
      };

      const result = await VenueService.updateVenue(
        id,
        payload as Partial<Venue>
      );
      toaster.success({ title: t('venues.updateSuccess') });
      router.push(`/venues/${result.slug || result.id}`);
    } catch (_error) {
      console.error('Failed to update venue:', _error);
      toaster.error({ title: t('venues.updateError') });
    }
  };

  const selectedCity = form.watch('city');
  const districtOptions = getDistrictsByCity(selectedCity);

  if (isLoading) {
    return (
      <PageLayout title="Chỉnh sửa sân" showBackButton backHref="/admin/venues">
        <Flex justify="center" align="center" minH="50vh">
          <Text color="gray.500">Đang tải...</Text>
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={venue ? `Chỉnh sửa: ${venue.name}` : 'Chỉnh sửa sân'}
      showBackButton
      backHref="/admin/venues"
    >
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
          {/* Basic Information */}
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

          {/* Location Details */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Thông tin địa chỉ" />

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
              Địa chỉ mới (Nghị quyết 60) — để trống để hệ thống tự điền
            </Text>

            <Controller
              control={form.control}
              name="newAddress"
              render={({ field }) => (
                <Field label="Địa chỉ mới">
                  <Input
                    {...field}
                    placeholder="VD: Phường Cầu Kiệu, TP Hồ Chí Minh"
                  />
                </Field>
              )}
            />

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="newDistrict"
                render={({ field }) => (
                  <Field flex={1} label="Phường/Xã mới">
                    <Input {...field} placeholder="VD: Cầu Kiệu" />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="newCity"
                render={({ field }) => (
                  <Field flex={1} label="Tỉnh/Thành phố mới">
                    <Input {...field} placeholder="VD: TP Hồ Chí Minh" />
                  </Field>
                )}
              />
            </HStack>
          </VStack>

          <Divider />

          {/* Contact Information */}
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

          {/* Venue Information */}
          <VStack gap={4} align="stretch">
            <SectionLabel title="Thông tin sân" />

            <Controller
              control={form.control}
              name="openingHours"
              render={({ field }) => (
                <Field label="Giờ hoạt động">
                  <Input {...field} placeholder="VD: 6:00 - 22:00" />
                </Field>
              )}
            />

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

            <VenuePricingManager
              venueId={id}
              legacyFixed={form.watch('hourlyRateFixed')}
              legacyWalkIn={form.watch('hourlyRateWalkIn')}
            />
          </VStack>

          <Divider />

          {/* Status */}
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

          {/* Amenities */}
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

          {/* Policies */}
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

          {/* Media */}
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
              Lưu thay đổi
            </VButton>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
}
