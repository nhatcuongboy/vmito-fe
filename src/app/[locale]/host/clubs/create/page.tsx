'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Image, Text, Textarea } from '@chakra-ui/react';
import {
  Button,
  VStack,
  Input,
  IconButton,
} from '@/components/ui/chakra-compat';
import { LegacySelect } from '@/components/ui/VSelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { VenueService } from '@/lib/api/venue.service';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { Field } from '@/components/ui/Field';
import AppImageGalleryPicker from '@/components/AppImageGalleryPicker';
import PageLayout from '@/components/layout/PageLayout';
import { ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { EImageCategory, Venue } from '@/lib/api/types';

const schema = z.object({
  name: z.string().min(1, 'Tên nhóm là bắt buộc'),
  hostName: z.string().min(1, 'Trưởng nhóm là bắt buộc'),
  description: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  images: z.array(z.string()).optional(),
  imagePublicIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof schema>;

interface ScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface VenueGroup {
  venueId: string;
  schedules: ScheduleEntry[];
}

const CreateClubPage = () => {
  const t = useTranslations('clubs');
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [venueGroups, setVenueGroups] = useState<VenueGroup[]>([]);
  const venueSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const imagesValue = watch('images') || [];
  const imagePublicIdsValue = watch('imagePublicIds') || [];

  const handleVenueSearch = useCallback((query: string) => {
    if (venueSearchTimerRef.current) clearTimeout(venueSearchTimerRef.current);
    venueSearchTimerRef.current = setTimeout(async () => {
      setVenueSearchLoading(true);
      try {
        const result = await VenueService.searchVenues({
          keyword: query || undefined,
          limit: 50,
        });
        setVenues(result.data ?? []);
      } catch {
        setVenues([]);
      } finally {
        setVenueSearchLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    handleVenueSearch('');
  }, [handleVenueSearch]);

  const venueOptions = useMemo(
    () =>
      venues.map((v) => ({ value: v.id, label: v.name, sublabel: v.address })),
    [venues]
  );

  const addVenueGroup = () =>
    setVenueGroups((prev) => [
      ...prev,
      {
        venueId: '',
        schedules: [{ dayOfWeek: 1, startTime: '19:00', endTime: '21:00' }],
      },
    ]);

  const removeVenueGroup = (idx: number) =>
    setVenueGroups((prev) => prev.filter((_, i) => i !== idx));

  const updateVenueId = (idx: number, venueId: string) =>
    setVenueGroups((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, venueId } : g))
    );

  const addSchedule = (groupIdx: number) =>
    setVenueGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? {
              ...g,
              schedules: [
                ...g.schedules,
                { dayOfWeek: 1, startTime: '19:00', endTime: '21:00' },
              ],
            }
          : g
      )
    );

  const removeSchedule = (groupIdx: number, schedIdx: number) =>
    setVenueGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, schedules: g.schedules.filter((_, si) => si !== schedIdx) }
          : g
      )
    );

  const updateSchedule = (
    groupIdx: number,
    schedIdx: number,
    field: keyof ScheduleEntry,
    value: string | number
  ) =>
    setVenueGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? {
              ...g,
              schedules: g.schedules.map((s, si) =>
                si === schedIdx ? { ...s, [field]: value } : s
              ),
            }
          : g
      )
    );

  const dayOptions = Array.from({ length: 7 }, (_, i) => ({
    value: i,
    label: t(`dayNames.${i as 0 | 1 | 2 | 3 | 4 | 5 | 6}`),
  }));

  const onSubmit = async (data: FormData) => {
    try {
      const schedules = venueGroups.flatMap((g) => {
        const venueName = venues.find((v) => v.id === g.venueId)?.name || '';
        return g.schedules.map((s) => ({ ...s, notes: venueName }));
      });
      await ClubsService.createClub({
        ...data,
        defaultVenueId: venueGroups[0]?.venueId || undefined,
        schedules: schedules.length > 0 ? schedules : undefined,
      });
      toaster.success({ title: t('clubCreatedSuccess') });
      router.push(ROUTES.CLUBS.BROWSE);
    } catch (error) {
      console.error('Failed to create club:', error);
      toaster.error({ title: t('failedToCreateClub') });
    }
  };

  return (
    <PageLayout
      title={t('createClub')}
      showBackButton
      backHref={ROUTES.CLUBS.BROWSE}
    >
      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        bg={{ base: 'white', _dark: 'gray.900' }}
        p={8}
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
        maxW="container.md"
        mx="auto"
      >
        <VStack spacing={6} align="stretch">
          {/* Club Name */}
          <Field
            label={t('clubName')}
            required
            invalid={!!errors.name}
            errorText={errors.name?.message}
          >
            <Input
              {...register('name')}
              placeholder={t('clubNamePlaceholder')}
            />
          </Field>

          {/* Trưởng nhóm */}
          <Field
            label="Trưởng nhóm"
            required
            invalid={!!errors.hostName}
            errorText={errors.hostName?.message}
          >
            <Input
              {...register('hostName')}
              placeholder="Nhập tên trưởng nhóm"
            />
          </Field>

          {/* Description */}
          <Field
            label={t('description')}
            invalid={!!errors.description}
            errorText={errors.description?.message}
          >
            <Textarea
              {...register('description')}
              placeholder={t('descriptionPlaceholder')}
            />
          </Field>

          {/* Club Image(s) */}
          <Field label={t('clubImage')}>
            {imagesValue.length > 0 ? (
              <Flex gap={2} flexWrap="wrap">
                {imagesValue.map((url, idx) => (
                  <Box key={url} position="relative" display="inline-block">
                    <Image
                      src={url}
                      alt={`Club image ${idx + 1}`}
                      boxSize="100px"
                      borderRadius="md"
                      objectFit="cover"
                    />
                    <IconButton
                      size="xs"
                      position="absolute"
                      top={1}
                      right={1}
                      colorPalette="red"
                      variant="solid"
                      borderRadius="full"
                      aria-label={t('removeImage')}
                      onClick={() => {
                        const newImages = [...imagesValue];
                        newImages.splice(idx, 1);
                        const newPublicIds = [...imagePublicIdsValue];
                        newPublicIds.splice(idx, 1);
                        setValue('images', newImages);
                        setValue('imagePublicIds', newPublicIds);
                        if (newImages.length > 0) {
                          setValue('image', newImages[0]);
                          setValue('imagePublicId', newPublicIds[0]);
                        } else {
                          setValue('image', undefined);
                          setValue('imagePublicId', undefined);
                        }
                      }}
                    >
                      <X size={12} />
                    </IconButton>
                  </Box>
                ))}
              </Flex>
            ) : (
              <Box
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="gray.300"
                _dark={{ borderColor: 'gray.600', color: 'gray.400' }}
                borderRadius="md"
                p={6}
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
                color="gray.500"
              >
                <ImageIcon size={32} />
                <Text fontSize="sm">{t('noImageSelected')}</Text>
              </Box>
            )}
            <Button
              size="sm"
              variant="outline"
              mt={2}
              onClick={() => setIsGalleryOpen(true)}
            >
              <ImageIcon size={16} />
              {t('selectImage')}
            </Button>
            <AppImageGalleryPicker
              isOpen={isGalleryOpen}
              onClose={() => setIsGalleryOpen(false)}
              onSelect={(imgs) => {
                const urls = imgs.map((i) => i.url);
                const publicIds = imgs.map((i) => i.publicId);
                setValue('images', urls);
                setValue('imagePublicIds', publicIds);
                if (imgs.length > 0) {
                  setValue('image', urls[0]);
                  setValue('imagePublicId', publicIds[0]);
                } else {
                  setValue('image', undefined);
                  setValue('imagePublicId', undefined);
                }
              }}
              selectedImages={imagesValue.map((url, idx) => ({
                url,
                publicId: imagePublicIdsValue[idx] || '',
              }))}
              maxSelect={10}
              category={EImageCategory.CLUB}
            />
          </Field>

          {/* Multi-Venue + Schedule */}
          <Field label="Sân hoạt động">
            <VStack spacing={4} align="stretch">
              {venueGroups.map((group, groupIdx) => (
                <Box
                  key={groupIdx}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                  p={4}
                >
                  <Flex gap={2} align="center" mb={3}>
                    <Box flex="1">
                      <SearchableSelect
                        options={venueOptions}
                        value={group.venueId}
                        onChange={(val) => updateVenueId(groupIdx, val)}
                        placeholder={t('searchVenue')}
                        searchPlaceholder={t('searchVenue')}
                        noOptionsMessage={t('noVenueSelected')}
                        onSearchChange={handleVenueSearch}
                        isLoading={venueSearchLoading}
                      />
                    </Box>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => removeVenueGroup(groupIdx)}
                      aria-label="Xóa sân"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Flex>

                  <VStack spacing={2} align="stretch">
                    {group.schedules.map((sched, schedIdx) => (
                      <Flex key={schedIdx} gap={1} align="center">
                        <Box flex="1" minW={{ base: '70px', md: '120px' }}>
                          <LegacySelect
                            size="sm"
                            value={String(sched.dayOfWeek)}
                            onChange={(
                              e: React.ChangeEvent<HTMLSelectElement>
                            ) =>
                              updateSchedule(
                                groupIdx,
                                schedIdx,
                                'dayOfWeek',
                                Number(e.target.value)
                              )
                            }
                          >
                            {dayOptions.map((d) => (
                              <option key={d.value} value={d.value}>
                                {d.label}
                              </option>
                            ))}
                          </LegacySelect>
                        </Box>
                        <Input
                          type="time"
                          size="sm"
                          value={sched.startTime}
                          onChange={(e) =>
                            updateSchedule(
                              groupIdx,
                              schedIdx,
                              'startTime',
                              e.target.value
                            )
                          }
                          w={{ base: '100px', md: '120px' }}
                          px={1}
                        />
                        <Text fontSize="xs" color="gray.500">
                          -
                        </Text>
                        <Input
                          type="time"
                          size="sm"
                          value={sched.endTime}
                          onChange={(e) =>
                            updateSchedule(
                              groupIdx,
                              schedIdx,
                              'endTime',
                              e.target.value
                            )
                          }
                          w={{ base: '100px', md: '120px' }}
                          px={1}
                        />
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => removeSchedule(groupIdx, schedIdx)}
                          aria-label={t('removeSchedule')}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Flex>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => addSchedule(groupIdx)}
                      w="fit-content"
                    >
                      <Plus size={14} />
                      {t('addSchedule')}
                    </Button>
                  </VStack>
                </Box>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={addVenueGroup}
                w="fit-content"
              >
                <Plus size={16} />
                Thêm sân
              </Button>
            </VStack>
          </Field>

          <Flex justify="flex-end" gap={4} mt={4}>
            <Button variant="ghost" onClick={() => router.back()}>
              {t('cancel')}
            </Button>
            <Button type="submit" colorPalette="green" loading={isSubmitting}>
              {t('createClub')}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
};

export default CreateClubPage;
