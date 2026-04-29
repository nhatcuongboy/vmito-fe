'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Image, Text } from '@chakra-ui/react';
import {
  Button,
  VStack,
  Input,
  IconButton,
} from '@/components/ui/chakra-compat';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { LegacySelect } from '@/components/ui/VSelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { VenueService } from '@/lib/api/venue.service';
import { AdminService, User as AdminUser } from '@/lib/api/admin.service';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { Field } from '@/components/ui/Field';
import AppImageGalleryPicker from '@/components/AppImageGalleryPicker';
import PageLayout from '@/components/layout/PageLayout';
import { ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { EImageCategory, UserRole, Venue } from '@/lib/api/types';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import ClubLevelRequirements from '@/components/club/ClubLevelRequirements';
import { useAuthStore } from '@/stores';

const schema = z.object({
  name: z.string().min(1, 'Tên nhóm là bắt buộc'),
  hostName: z.string().min(1, 'Trưởng nhóm là bắt buộc'),
  description: z
    .string()
    .max(5000, 'Mô tả quá dài (tối đa 5000 ký tự)')
    .optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  images: z.array(z.string()).optional(),
  imagePublicIds: z.array(z.string()).optional(),
  requiredLevels: z.array(z.number()).optional(),
  allLevelsSelected: z.boolean().optional(),
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
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [venues, setVenues] = useState<Venue[]>([]);
  const [pinnedVenues, setPinnedVenues] = useState<Map<string, Venue>>(
    new Map()
  );
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [venueGroups, setVenueGroups] = useState<VenueGroup[]>([]);

  const [clubImages, setClubImages] = useState<ISessionImage[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);

  const [selectedHostUserId, setSelectedHostUserId] = useState('');
  const [hostUsers, setHostUsers] = useState<AdminUser[]>([]);
  const [hostUserSearchLoading, setHostUserSearchLoading] = useState(false);

  const venueSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const hostUserSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      hostName: isAdmin ? '' : user?.name || '',
      description: '',
      requiredLevels: [],
      allLevelsSelected: true,
    },
  });

  const handleVenueSearch = useCallback(
    (query: string) => {
      if (venueSearchTimerRef.current)
        clearTimeout(venueSearchTimerRef.current);
      venueSearchTimerRef.current = setTimeout(async () => {
        setVenueSearchLoading(true);
        try {
          const result = await VenueService.searchVenues({
            keyword: query || undefined,
            limit: 50,
          });
          const fetched = result.data ?? [];
          const pinnedNotInFetched = Array.from(pinnedVenues.values()).filter(
            (pv) => !fetched.find((v) => v.id === pv.id)
          );
          setVenues([...fetched, ...pinnedNotInFetched]);
        } catch {
          setVenues(Array.from(pinnedVenues.values()));
        } finally {
          setVenueSearchLoading(false);
        }
      }, 300);
    },
    [pinnedVenues]
  );

  const handleHostUserSearch = useCallback((query: string) => {
    if (hostUserSearchTimerRef.current)
      clearTimeout(hostUserSearchTimerRef.current);
    hostUserSearchTimerRef.current = setTimeout(async () => {
      setHostUserSearchLoading(true);
      try {
        const users = await AdminService.getUsers({
          search: query || undefined,
        });
        setHostUsers(users);
      } catch {
        setHostUsers([]);
      } finally {
        setHostUserSearchLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    handleVenueSearch('');
    if (isAdmin) {
      handleHostUserSearch('');
    }
  }, [handleVenueSearch, handleHostUserSearch, isAdmin]);

  const venueOptions = useMemo(() => {
    const merged = new Map<string, Venue>();
    venues.forEach((v) => merged.set(v.id, v));
    pinnedVenues.forEach((v) => merged.set(v.id, v));
    return Array.from(merged.values()).map((v) => ({
      value: v.id,
      label: v.name,
      sublabel: v.address,
    }));
  }, [venues, pinnedVenues]);

  const hostUserOptions = useMemo(
    () =>
      hostUsers.map((u) => ({ value: u.id, label: u.name, sublabel: u.email })),
    [hostUsers]
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

  const updateVenueId = (idx: number, venueId: string) => {
    setVenueGroups((prev) =>
      prev.map((g, i) => (i === idx ? { ...g, venueId } : g))
    );
    if (venueId) {
      const found = venues.find((v) => v.id === venueId);
      if (found) {
        setPinnedVenues((prev) => {
          const next = new Map(prev);
          next.set(venueId, found);
          return next;
        });
      }
    }
  };

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
        const venue = venues.find((v) => v.id === g.venueId);
        const venueInfo = venue ? `${venue.name} | ${venue.address}` : '';
        return g.schedules.map((s) => ({ ...s, notes: venueInfo }));
      });

      // Map clubImages to form data
      const images = clubImages.map((img) => img.url);
      const imagePublicIds = clubImages.map((img) => img.publicId);

      // Ensure bannerIndex is within bounds
      const validBannerIndex = Math.min(bannerIndex, clubImages.length - 1);
      const image =
        clubImages[validBannerIndex >= 0 ? validBannerIndex : 0]?.url;
      const imagePublicId =
        clubImages[validBannerIndex >= 0 ? validBannerIndex : 0]?.publicId;

      const { allLevelsSelected, ...restData } = data;

      const club = await ClubsService.createClub({
        ...restData,
        image,
        imagePublicId,
        images,
        imagePublicIds,
        defaultVenueId: venueGroups[0]?.venueId || undefined,
        schedules: schedules.length > 0 ? schedules : undefined,
        hostUserId: selectedHostUserId || undefined,
        requiredLevels: data.requiredLevels,
      });

      // Show appropriate toast based on club status
      if (club.status === 'PENDING') {
        toaster.success({ title: t('notification.club.creationPending') });
      } else {
        toaster.success({ title: t('notification.club.creationSuccess') });
      }

      router.push(ROUTES.CLUBS.MY_CLUBS);
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
        p={{ base: 4, md: 6 }}
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

          {/* Host User (ADMIN only) */}
          {isAdmin && (
            <Field
              label="Host user trong hệ thống"
              helperText="Nếu chọn, user này sẽ được thêm vào nhóm với vai trò Admin"
            >
              <SearchableSelect
                options={hostUserOptions}
                value={selectedHostUserId}
                onChange={(val) => {
                  setSelectedHostUserId(val);
                  if (val) {
                    const selectedUser = hostUsers.find((u) => u.id === val);
                    if (selectedUser) {
                      setValue('hostName', selectedUser.name);
                    }
                  }
                }}
                placeholder="Tìm user theo tên hoặc email"
                searchPlaceholder="Tìm user..."
                noOptionsMessage="Không tìm thấy user"
                onSearchChange={handleHostUserSearch}
                isLoading={hostUserSearchLoading}
              />
            </Field>
          )}

          {/* Trình độ */}
          <ClubLevelRequirements control={control} setValue={setValue} />

          {/* Description */}
          <Field
            label={t('description')}
            invalid={!!errors.description}
            errorText={errors.description?.message}
          >
            <RichTextEditor
              value={watch('description')}
              onChange={(html) => setValue('description', html)}
              placeholder={t('descriptionPlaceholder')}
            />
          </Field>

          {/* Club Image(s) */}
          <Field label={t('clubImage')}>
            <AppMultiImageUpload
              images={clubImages}
              bannerIndex={bannerIndex}
              onImagesChange={setClubImages}
              onBannerChange={setBannerIndex}
              maxImages={10}
              category={EImageCategory.CLUB}
              label={null}
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
                    <Box flex="1" minW={0} overflow="hidden">
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
                        <Box flex="1" minW={{ base: '100px', md: '120px' }}>
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
                        <VDateTimeInput
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
                          placeholder="--:--"
                        />
                        <Text fontSize="xs" color="gray.500">
                          -
                        </Text>
                        <VDateTimeInput
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
                          placeholder="--:--"
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
