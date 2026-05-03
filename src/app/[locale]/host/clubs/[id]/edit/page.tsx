'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Text } from '@chakra-ui/react';
import {
  Image,
  Button,
  VStack,
  Input,
  IconButton,
} from '@/components/ui/chakra-compat';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { LegacySelect } from '@/components/ui/VSelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { ClubsService } from '@/lib/api/clubs.service';
import { VenueService } from '@/lib/api/venue.service';
import { AdminService, User as AdminUser } from '@/lib/api/admin.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/loading-spinner';
import AppImageGalleryPicker from '@/components/AppImageGalleryPicker';
import { ROUTES } from '@/constants/routes';
import PageLayout from '@/components/layout/PageLayout';
import { ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { EImageCategory, UserRole, Venue } from '@/lib/api/types';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import { useAuthStore } from '@/stores';
import ClubLevelRequirements from '@/components/club/ClubLevelRequirements';

const schema = z.object({
  name: z.string().min(1, 'Tên nhóm là bắt buộc'),
  hostName: z.string().optional(),
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

const EditClubPage = () => {
  const t = useTranslations('clubs');
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [venues, setVenues] = useState<Venue[]>([]);
  // pinnedVenues keeps track of venues currently selected in venueGroups so
  // they always appear in options even if they fall outside the search results.
  const [pinnedVenues, setPinnedVenues] = useState<Map<string, Venue>>(
    new Map()
  );
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [venueGroups, setVenueGroups] = useState<VenueGroup[]>([]);
  const [isLoadingClub, setIsLoadingClub] = useState(true);

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
      hostName: '',
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
            sortBy: query ? 'relevance' : undefined,
          });
          const fetched = result.data ?? [];
          // Merge pinned (selected) venues so they always appear in options
          const pinnedNotInFetched = Array.from(pinnedVenues.values()).filter(
            (pv) => !fetched.find((v) => v.id === pv.id)
          );
          setVenues([...fetched, ...pinnedNotInFetched]);
        } catch {
          // On error keep at least the pinned venues
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
    // Deduplicate: pinned venues take priority (they have the correct data)
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

  // Load club data and reconstruct venueGroups
  useEffect(() => {
    if (!groupId) return;
    const loadGroup = async () => {
      setIsLoadingClub(true);
      try {
        const group = await ClubsService.getClub(groupId);
        setValue('name', group.name);
        setValue('hostName', group.hostName || '');
        setValue('description', group.description || '');
        setValue('image', group.image || undefined);
        setValue('imagePublicId', group.imagePublicId || undefined);
        setValue('images', group.images || []);
        setValue('imagePublicIds', group.imagePublicIds || []);
        setValue('requiredLevels', group.requiredLevels || []);
        setValue(
          'allLevelsSelected',
          !group.requiredLevels || group.requiredLevels.length === 0
        );

        // Initialize clubImages from group data
        const loadedImages: ISessionImage[] = [];
        if (group.images && group.imagePublicIds) {
          group.images.forEach((url, idx) => {
            const publicId = group.imagePublicIds?.[idx];
            if (publicId) {
              loadedImages.push({ url, publicId });
            }
          });
        }
        setClubImages(loadedImages);

        // Calculate bannerIndex from group.image
        if (group.image && loadedImages.length > 0) {
          const idx = loadedImages.findIndex((img) => img.url === group.image);
          setBannerIndex(idx >= 0 ? idx : 0);
        } else {
          setBannerIndex(0);
        }

        // Collect all unique venue names from schedules so we can resolve them
        const uniqueVenueNames = new Set<string>();
        if (group.schedules) {
          group.schedules.forEach((s) => {
            if (s.notes) uniqueVenueNames.add(s.notes);
          });
        }
        if (group.defaultVenue?.name) {
          uniqueVenueNames.add(group.defaultVenue.name);
        }

        // Fetch a broader venue list covering all schedule venue names
        // We do one search per unique name that isn't the defaultVenue
        const nameToVenue = new Map<
          string,
          { id: string; name: string; address: string }
        >();
        if (group.defaultVenue) {
          nameToVenue.set(group.defaultVenue.name, group.defaultVenue);
        }

        await Promise.all(
          Array.from(uniqueVenueNames).map(async (venueName) => {
            if (nameToVenue.has(venueName)) return;
            try {
              const result = await VenueService.searchVenues({
                keyword: venueName,
                limit: 10,
              });
              const matched = (result.data ?? []).find(
                (v) => v.name === venueName
              );
              if (matched) nameToVenue.set(venueName, matched);
            } catch {
              // ignore individual search errors
            }
          })
        );

        // Pin all resolved venues so they always appear in the select options
        setPinnedVenues((prev) => {
          const next = new Map(prev);
          nameToVenue.forEach((v) => next.set(v.id, v as any));
          return next;
        });

        // Reconstruct venueGroups from schedules
        if (group.schedules && group.schedules.length > 0) {
          const defaultVenueId = group.defaultVenue?.id || '';

          const noteGroups = new Map<
            string,
            { venueId: string; schedules: ScheduleEntry[] }
          >();

          group.schedules.forEach((s) => {
            const key = s.notes || '__default__';
            if (!noteGroups.has(key)) {
              const resolvedVenue = s.notes ? nameToVenue.get(s.notes) : null;
              noteGroups.set(key, {
                venueId:
                  resolvedVenue?.id ||
                  (key === '__default__' ? defaultVenueId : ''),
                schedules: [],
              });
            }
            noteGroups.get(key)!.schedules.push({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            });
          });

          setVenueGroups(Array.from(noteGroups.values()));
        } else if (group.defaultVenue) {
          // No schedules but has a venue — create an empty group
          setVenueGroups([
            {
              venueId: group.defaultVenue.id,
              schedules: [
                { dayOfWeek: 1, startTime: '19:00', endTime: '21:00' },
              ],
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to load group:', error);
        toaster.error({ title: t('failedToLoadClub') });
        router.push(ROUTES.CLUBS.BROWSE);
      } finally {
        setIsLoadingClub(false);
      }
    };

    loadGroup();
  }, [groupId, setValue, router, t]);

  // --- VenueGroup helpers (identical to create page) ---
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
    // Pin the selected venue so it always shows in options after a search refresh
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

      await ClubsService.updateClub(groupId, {
        ...restData,
        image,
        imagePublicId,
        images,
        imagePublicIds,
        defaultVenueId: venueGroups[0]?.venueId || undefined,
        schedules: schedules.length > 0 ? schedules : undefined,
        requiredLevels: data.requiredLevels,
      });
      toaster.success({ title: t('clubUpdatedSuccess') });
      router.push(ROUTES.CLUBS.BROWSE);
    } catch (error) {
      console.error('Failed to update club:', error);
      toaster.error({ title: t('failedToUpdateClub') });
    }
  };

  if (isLoadingClub) {
    return (
      <PageLayout title={t('editGroup')}>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t('editGroup')}
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
          <Field label="Trưởng nhóm">
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
              {t('saveChanges')}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
};

export default EditClubPage;
