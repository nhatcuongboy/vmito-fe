'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Box, Flex, Heading, Stack } from '@chakra-ui/react';
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import {
  Button,
  HStack,
  SimpleGrid,
  VStack,
} from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import LocationAutocomplete from '@/components/common/LocationAutocomplete';
import { AppSportSelect } from '@/components/common/AppSportSelect';
import LevelRequirementsCard from '@/components/session/LevelRequirementsCard';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import { VenueService } from '@/lib/api/venue.service';
import { EImageCategory, SportType, Venue } from '@/lib/api/types';
import { getVenueSearchSublabel } from '@/utils/venue-helpers';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { IClass, IClassInput } from '@/types/class';
import { useRouter } from '@/i18n/config';
import { ClassFormData, classFormSchema } from './classFormSchema';

const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const CUSTOM_LOCATION_VALUE = '__custom_location__';

const cardStyle = {
  bg: { base: 'white', _dark: 'gray.800' },
  p: { base: 4, md: 6 },
  borderRadius: 'lg',
  boxShadow: 'sm',
  borderWidth: '1px',
  borderColor: { base: 'gray.100', _dark: 'gray.700' },
};

const defaultSchedule = {
  dayOfWeek: 1,
  startTime: '18:00',
  endTime: '19:30',
  isActive: true,
};

function toImages(initial?: IClass): {
  images: ISessionImage[];
  bannerIndex: number;
} {
  if (!initial) return { images: [], bannerIndex: 0 };
  const urls = Array.from(
    new Set(
      [initial.coverPhoto, ...(initial.images || [])].filter(
        (image): image is string => Boolean(image)
      )
    )
  );
  return {
    images: urls.map((url, index) => ({
      url,
      publicId:
        initial.imagePublicIds?.[initial.images?.indexOf(url)] ||
        (url === initial.coverPhoto ? initial.coverPhotoPublicId : undefined) ||
        `existing-${index}-${url}`,
    })),
    bannerIndex: Math.max(0, urls.indexOf(initial.coverPhoto || '')),
  };
}

export function ClassForm({
  initial,
  onSubmit,
  submitting,
  backHref,
}: {
  initial?: IClass;
  onSubmit: (data: IClassInput) => Promise<void>;
  submitting?: boolean;
  backHref: string;
}) {
  const isEdit = Boolean(initial);
  const router = useRouter();
  const existingMedia = useMemo(() => toImages(initial), [initial]);
  const [images, setImages] = useState<ISessionImage[]>(existingMedia.images);
  const [bannerIndex, setBannerIndex] = useState(existingMedia.bannerIndex);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(
    initial?.venue ? (initial.venue as Venue) : null
  );
  const [isVenueLoading, setVenueLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const venueFieldRef = useRef<HTMLDivElement>(null);
  const { showNewAddress } = useAppSettings();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(
      classFormSchema
    ) as unknown as Resolver<ClassFormData>,
    defaultValues: {
      name: initial?.name || '',
      description: initial?.description || '',
      sportType: initial?.sportType || SportType.BADMINTON,
      contactName: initial?.contactName || '',
      contactPhone: initial?.contactPhone || '',
      zaloUrl: initial?.zaloUrl || '',
      socialLinks: initial?.socialLinks || {},
      locationType: initial ? (initial.venueId ? 'VENUE' : 'CUSTOM') : 'VENUE',
      selectedVenueId: initial?.venueId || '',
      customLocationName: initial?.customLocationName || '',
      customLocationAddress: initial?.customLocationAddress || '',
      customLocationPlaceId: initial?.customLocationPlaceId || '',
      customLocationLat: initial?.customLocationLat ?? undefined,
      customLocationLng: initial?.customLocationLng ?? undefined,
      customLocationDistrict: initial?.customLocationDistrict || '',
      customLocationCity: initial?.customLocationCity || '',
      startDate: initial?.startDate?.slice(0, 10) || '',
      endDate: initial?.endDate?.slice(0, 10) || '',
      capacity: initial?.capacity ?? undefined,
      tuitionPeriod: initial?.tuitionPeriod || 'CONTACT',
      tuitionAmount: initial?.tuitionAmount ?? undefined,
      tuitionNotes: initial?.tuitionNotes || '',
      requiredLevels: initial?.requiredLevels || [],
      allLevelsSelected: !initial?.requiredLevels?.length,
      schedules: initial?.schedules?.length
        ? initial.schedules.map(
            ({ dayOfWeek, startTime, endTime, isActive }) => ({
              dayOfWeek,
              startTime,
              endTime,
              isActive: isActive ?? true,
            })
          )
        : [defaultSchedule],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
  });
  const sportType = useWatch({ control, name: 'sportType' });
  const locationType = useWatch({ control, name: 'locationType' });
  const tuitionPeriod = useWatch({ control, name: 'tuitionPeriod' });
  const customLocationName = useWatch({ control, name: 'customLocationName' });

  const fetchVenues = useCallback(
    async (keyword = '') => {
      setVenueLoading(true);
      try {
        const result = await VenueService.searchVenues({
          keyword: keyword || undefined,
          sportType,
          limit: 30,
          sortBy: keyword ? 'relevance' : undefined,
        });
        setVenues(result.data || []);
      } finally {
        setVenueLoading(false);
      }
    },
    [sportType]
  );
  useEffect(() => {
    void fetchVenues();
  }, [fetchVenues]);
  useEffect(() => {
    setImages(existingMedia.images);
    setBannerIndex(existingMedia.bannerIndex);
  }, [existingMedia]);
  const handleVenueSearch = useCallback(
    (query: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(
        () => void fetchVenues(query.trim()),
        300
      );
    },
    [fetchVenues]
  );
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    []
  );

  const venueOptions = useMemo(() => {
    const all =
      selectedVenue && !venues.some((venue) => venue.id === selectedVenue.id)
        ? [selectedVenue, ...venues]
        : venues;
    return all.map((venue) => ({
      value: venue.id,
      label: venue.name,
      sublabel: getVenueSearchSublabel(venue, showNewAddress),
    }));
  }, [venues, selectedVenue, showNewAddress]);
  const clearCustomLocation = () => {
    setValue('customLocationName', '');
    setValue('customLocationAddress', '');
    setValue('customLocationPlaceId', '');
    setValue('customLocationLat', undefined);
    setValue('customLocationLng', undefined);
    setValue('customLocationDistrict', '');
    setValue('customLocationCity', '');
  };
  const handleSportChange = (next: SportType) => {
    if (next === sportType) return;
    setValue('sportType', next, { shouldDirty: true });
    setValue('selectedVenueId', '', { shouldValidate: true });
    setSelectedVenue(null);
  };
  const submit = async (data: ClassFormData) => {
    const banner = images[bannerIndex];
    const socialLinks = Object.fromEntries(
      Object.entries(data.socialLinks || {}).flatMap(([key, value]) => {
        const url = value?.trim();
        return url ? [[key, url]] : [];
      })
    );
    await onSubmit({
      name: data.name,
      sportType: data.sportType,
      description: data.description || '',
      contactName: data.contactName || undefined,
      contactPhone: data.contactPhone,
      // Omit an empty value when creating; send an empty string while editing
      // so the API can explicitly clear a previously saved Zalo URL.
      zaloUrl: data.zaloUrl || (isEdit ? '' : undefined),
      ...(Object.keys(socialLinks).length || isEdit ? { socialLinks } : {}),
      requiredLevels: data.allLevelsSelected ? [] : data.requiredLevels,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      capacity: data.capacity ?? null,
      tuitionPeriod: data.tuitionPeriod,
      tuitionAmount:
        data.tuitionPeriod === 'CONTACT' ? undefined : data.tuitionAmount,
      tuitionNotes: data.tuitionNotes || '',
      ...(data.locationType === 'VENUE'
        ? { venueId: data.selectedVenueId }
        : {
            customLocation: {
              name: data.customLocationName || '',
              address: data.customLocationAddress || undefined,
              placeId: data.customLocationPlaceId || undefined,
              lat: data.customLocationLat,
              lng: data.customLocationLng,
              district: data.customLocationDistrict || undefined,
              city: data.customLocationCity || undefined,
            },
          }),
      coverPhoto: banner?.url || (isEdit ? '' : undefined),
      coverPhotoPublicId: banner?.publicId?.startsWith('existing-')
        ? initial?.coverPhotoPublicId || (isEdit ? '' : undefined)
        : banner?.publicId || (isEdit ? '' : undefined),
      images: images.map((image) => image.url),
      imagePublicIds: images
        .map((image) => image.publicId)
        .filter((publicId) => !publicId.startsWith('existing-')),
      schedules: data.schedules,
    });
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(submit)}
      maxW="container.md"
      mx="auto"
      pb={{ base: 28, md: 6 }}
    >
      <VStack gap={6} align="stretch">
        <Box {...cardStyle}>
          <Heading size="md" mb={4}>
            Thông tin cơ bản
          </Heading>
          <Stack gap={4}>
            <Field
              label="Tên lớp"
              required
              invalid={!!errors.name}
              errorText={errors.name?.message}
            >
              <Input
                {...register('name')}
                placeholder="Ví dụ: Lớp cầu lông cơ bản buổi tối"
              />
            </Field>
            <Field
              label="Mô tả"
              invalid={!!errors.description}
              errorText={errors.description?.message}
            >
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Giới thiệu nội dung, giáo trình và đối tượng phù hợp"
                    minHeight="120px"
                  />
                )}
              />
            </Field>
            <Field label="Môn học" required>
              <AppSportSelect value={sportType} onChange={handleSportChange} />
            </Field>
          </Stack>
        </Box>

        <Box {...cardStyle}>
          <Heading size="md" mb={4}>
            Địa điểm học
          </Heading>
          <Stack gap={4}>
            <Field
              ref={venueFieldRef}
              id="field-venue"
              label="Địa điểm"
              required
              invalid={locationType === 'VENUE' && !!errors.selectedVenueId}
              errorText={errors.selectedVenueId?.message}
            >
              <Controller
                control={control}
                name="selectedVenueId"
                render={({ field }) => (
                  <SearchableSelect
                    isInvalid={
                      locationType === 'VENUE' && !!errors.selectedVenueId
                    }
                    value={
                      locationType === 'CUSTOM'
                        ? CUSTOM_LOCATION_VALUE
                        : field.value
                    }
                    selectedLabelOverride={
                      locationType === 'CUSTOM' ? customLocationName : undefined
                    }
                    onChange={(value) => {
                      if (!value) {
                        field.onChange('');
                        setValue('locationType', 'VENUE', {
                          shouldValidate: true,
                        });
                        clearCustomLocation();
                        setSelectedVenue(null);
                        return;
                      }

                      field.onChange(value);
                      setValue('locationType', 'VENUE', {
                        shouldValidate: true,
                      });
                      clearCustomLocation();
                      setSelectedVenue(
                        venues.find((venue) => venue.id === value) || null
                      );
                    }}
                    options={venueOptions}
                    placeholder="Chọn sân trên Vmito"
                    searchPlaceholder="Tìm sân..."
                    noOptionsMessage="Không tìm thấy sân"
                    onSearchChange={handleVenueSearch}
                    isLoading={isVenueLoading}
                    dropdownZIndex={2000}
                    dropdownPortalContainerRef={venueFieldRef}
                    isClearable
                    clearAriaLabel="Xóa địa điểm"
                    searchActions={[
                      {
                        label: (query) => `Dùng địa điểm khác: ${query}`,
                        onClick: (query) => {
                          field.onChange('');
                          setValue('locationType', 'CUSTOM', {
                            shouldValidate: true,
                          });
                          clearCustomLocation();
                          setValue('customLocationName', query, {
                            shouldValidate: true,
                          });
                          setSelectedVenue(null);
                        },
                        variant: 'primary',
                        icon: MapPin,
                      },
                    ]}
                  />
                )}
              />
            </Field>
            {locationType === 'CUSTOM' && (
              <Box
                mt={3}
                p={{ base: 3, md: 4 }}
                borderWidth="1px"
                borderColor={{ base: 'green.200', _dark: 'green.700' }}
                bg={{ base: 'green.50', _dark: 'green.950' }}
                borderRadius="lg"
              >
                <Badge mb={3} colorPalette="green" variant="subtle">
                  Địa điểm tùy chọn
                </Badge>
                <Stack gap={3}>
                  <Field
                    label="Tên địa điểm"
                    required
                    invalid={!!errors.customLocationName}
                    errorText={errors.customLocationName?.message}
                  >
                    <Input
                      {...register('customLocationName')}
                      autoComplete="off"
                      placeholder="Ví dụ: Nhà thi đấu quận 7"
                      bg={{ base: 'white', _dark: 'gray.800' }}
                    />
                  </Field>
                  <Field
                    label="Địa chỉ"
                    optionalText="Khuyến nghị"
                    helperText="Thêm địa chỉ để học viên có thể tìm lớp và tìm đường dễ dàng."
                  >
                    <Controller
                      control={control}
                      name="customLocationAddress"
                      render={({ field }) => (
                        <LocationAutocomplete
                          value={field.value || ''}
                          onInputChange={(address) => {
                            field.onChange(address);
                            setValue('customLocationPlaceId', '');
                            setValue('customLocationLat', undefined);
                            setValue('customLocationLng', undefined);
                            setValue('customLocationDistrict', '');
                            setValue('customLocationCity', '');
                          }}
                          onSelect={(place) => {
                            field.onChange(place.address);
                            setValue('customLocationPlaceId', place.placeId);
                            setValue('customLocationLat', place.lat);
                            setValue('customLocationLng', place.lng);
                            setValue(
                              'customLocationDistrict',
                              place.district || ''
                            );
                            setValue('customLocationCity', place.city || '');
                          }}
                          inputName="customLocationAddress"
                          ariaLabel="Địa chỉ địa điểm"
                          placeholder="Tìm hoặc nhập địa chỉ..."
                        />
                      )}
                    />
                  </Field>
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        <LevelRequirementsCard control={control} setValue={setValue} />

        <Box {...cardStyle}>
          <Heading size="md" mb={4}>
            Lịch học và tuyển sinh
          </Heading>
          <Stack gap={4}>
            <Field
              label="Lịch học"
              required
              errorText={errors.schedules?.message}
            >
              <Stack gap={3}>
                {fields.map((field, index) => (
                  <HStack key={field.id} align="end">
                    <Field label="Thứ" flex="1">
                      <Controller
                        control={control}
                        name={`schedules.${index}.dayOfWeek`}
                        render={({ field: dayField }) => (
                          <SearchableSelect
                            value={String(dayField.value)}
                            onChange={(value) =>
                              dayField.onChange(Number(value))
                            }
                            options={DAYS.map((day, dayIndex) => ({
                              value: String(dayIndex),
                              label: day,
                            }))}
                            placeholder="Chọn thứ"
                          />
                        )}
                      />
                    </Field>
                    <Field label="Bắt đầu" flex="1">
                      <Input
                        type="time"
                        {...register(`schedules.${index}.startTime`)}
                      />
                    </Field>
                    <Field
                      label="Kết thúc"
                      flex="1"
                      invalid={!!errors.schedules?.[index]?.endTime}
                      errorText={errors.schedules?.[index]?.endTime?.message}
                    >
                      <Input
                        type="time"
                        {...register(`schedules.${index}.endTime`)}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      colorPalette="red"
                      aria-label="Xóa buổi học"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </HStack>
                ))}
              </Stack>
              <Button
                type="button"
                variant="outline"
                w="fit-content"
                onClick={() => append(defaultSchedule)}
              >
                <Plus size={18} /> Thêm buổi học
              </Button>
            </Field>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Field label="Khai giảng">
                <Input type="date" {...register('startDate')} />
              </Field>
              <Field
                label="Kết thúc"
                invalid={!!errors.endDate}
                errorText={errors.endDate?.message}
              >
                <Input type="date" {...register('endDate')} />
              </Field>
              <Field label="Sĩ số tối đa">
                <Controller
                  control={control}
                  name="capacity"
                  render={({ field }) => (
                    <Input
                      type="number"
                      min={1}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined
                        )
                      }
                    />
                  )}
                />
              </Field>
              <Field label="Chu kỳ học phí">
                <Controller
                  control={control}
                  name="tuitionPeriod"
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: 'CONTACT', label: 'Liên hệ' },
                        { value: 'PER_SESSION', label: 'Theo buổi' },
                        { value: 'MONTHLY', label: 'Theo tháng' },
                        { value: 'COURSE', label: 'Theo khóa' },
                      ]}
                    />
                  )}
                />
              </Field>
            </SimpleGrid>
            {tuitionPeriod !== 'CONTACT' && (
              <Field
                label="Học phí (VND)"
                required
                invalid={!!errors.tuitionAmount}
                errorText={errors.tuitionAmount?.message}
              >
                <Controller
                  control={control}
                  name="tuitionAmount"
                  render={({ field }) => (
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            ? Number(event.target.value)
                            : undefined
                        )
                      }
                    />
                  )}
                />
              </Field>
            )}
            <Field label="Ghi chú học phí">
              <Input
                {...register('tuitionNotes')}
                placeholder="Ví dụ: Đã bao gồm sân và cầu"
              />
            </Field>
          </Stack>
        </Box>

        <Box {...cardStyle}>
          <Heading size="md" mb={4}>
            Thông tin liên hệ
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field label="Người liên hệ">
              <Input {...register('contactName')} />
            </Field>
            <Field
              label="Số điện thoại"
              required
              invalid={!!errors.contactPhone}
              errorText={errors.contactPhone?.message}
            >
              <Input {...register('contactPhone')} type="tel" />
            </Field>
            <Field
              label="Link Zalo"
              invalid={!!errors.zaloUrl}
              errorText={errors.zaloUrl?.message}
              gridColumn={{ md: 'span 2' }}
            >
              <Input
                {...register('zaloUrl')}
                placeholder="https://zalo.me/..."
              />
            </Field>
          </SimpleGrid>
        </Box>

        <Box {...cardStyle}>
          <Heading size="md" mb={4}>
            Mạng xã hội & liên kết
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Field label="Facebook">
              <Input
                {...register('socialLinks.facebook')}
                placeholder="https://facebook.com/fanpage"
              />
            </Field>
            <Field label="Zalo">
              <Input
                {...register('socialLinks.zalo')}
                placeholder="https://zalo.me/g/..."
              />
            </Field>
            <Field label="TikTok">
              <Input
                {...register('socialLinks.tiktok')}
                placeholder="https://tiktok.com/@..."
              />
            </Field>
            <Field label="YouTube">
              <Input
                {...register('socialLinks.youtube')}
                placeholder="https://youtube.com/@..."
              />
            </Field>
            <Field label="Website">
              <Input
                {...register('socialLinks.website')}
                placeholder="https://yourwebsite.com"
              />
            </Field>
            <Field label="Liên kết khác">
              <Input
                {...register('socialLinks.other')}
                placeholder="https://..."
              />
            </Field>
          </SimpleGrid>
        </Box>

        <Box {...cardStyle}>
          <Heading size="md" mb={4}>
            Hình ảnh lớp học
          </Heading>
          <AppMultiImageUpload
            images={images}
            bannerIndex={bannerIndex}
            onImagesChange={setImages}
            onBannerChange={setBannerIndex}
            label="Ảnh lớp học"
            category={EImageCategory.SESSION_COVER}
          />
        </Box>

        <Flex
          justify={{ base: 'stretch', md: 'flex-end' }}
          gap={{ base: 0, md: 3 }}
          position={{ base: 'fixed', md: 'static' }}
          left={{ base: 0, md: 'auto' }}
          right={{ base: 0, md: 'auto' }}
          bottom={{ base: 0, md: 'auto' }}
          zIndex={{ base: 20, md: 'auto' }}
          bg={{ base: 'white', _dark: 'gray.900' }}
          borderTopWidth={{ base: '1px', md: 0 }}
          borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
          px={{ base: 4, md: 0 }}
          pt={{ base: 3, md: 0 }}
          pb={{ base: 'calc(12px + env(safe-area-inset-bottom))', md: 0 }}
          boxShadow={{ base: '0 -8px 20px rgba(15, 23, 42, 0.08)', md: 'none' }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(backHref)}
            display={{ base: 'none', md: 'inline-flex' }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            colorPalette="green"
            loading={submitting || isSubmitting}
            w={{ base: 'full', md: 'auto' }}
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo lớp học'}
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
}
