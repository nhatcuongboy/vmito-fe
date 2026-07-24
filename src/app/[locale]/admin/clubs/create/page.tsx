'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Text } from '@chakra-ui/react';
import {
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
import { ClubsService } from '@/lib/api/clubs.service';
import { compressImage } from '@/lib/utils/image';
import { VenueService } from '@/lib/api/venue.service';
import { AdminService, User } from '@/lib/api/admin.service';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { Field } from '@/components/ui/Field';
import ImageUploader from '@/components/cloudinary/ImageUploader';
import PageLayout from '@/components/layout/PageLayout';
import { Plus, Trash2 } from 'lucide-react';
import { Venue } from '@/lib/api/types';
import { getVenueSearchSublabel } from '@/utils/venue-helpers';
import { useAppSettings } from '@/contexts/AppSettingsContext';

const schema = z.object({
  name: z.string().min(1, 'Tên nhóm là bắt buộc'),
  hostName: z.string().min(1, 'Trưởng nhóm là bắt buộc'),
  description: z
    .string()
    .max(5000, 'Mô tả quá dài (tối đa 5000 ký tự)')
    .optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
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

const AdminCreateClubPage = () => {
  const t = useTranslations('clubs');
  const router = useRouter();
  const { showNewAddress } = useAppSettings();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [pinnedVenues, setPinnedVenues] = useState<Map<string, Venue>>(
    new Map()
  );
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [venueGroups, setVenueGroups] = useState<VenueGroup[]>([]);
  const [selectedHostUserId, setSelectedHostUserId] = useState('');
  const [hostUsers, setHostUsers] = useState<User[]>([]);
  const [hostUserSearchLoading, setHostUserSearchLoading] = useState(false);
  const venueSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const hostUserSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
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

  const imageValue = watch('image');

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

  const handleUploadImage = useCallback(
    async (file: File): Promise<string> => {
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
      });
      const result = await ClubsService.uploadClubImage(compressedFile);
      setValue('imagePublicId', result.publicId);
      return result.url;
    },
    [setValue]
  );

  useEffect(() => {
    handleVenueSearch('');
  }, [handleVenueSearch]);
  useEffect(() => {
    handleHostUserSearch('');
  }, [handleHostUserSearch]);

  const venueOptions = useMemo(() => {
    const merged = new Map<string, Venue>();
    venues.forEach((v) => merged.set(v.id, v));
    pinnedVenues.forEach((v) => merged.set(v.id, v));
    return Array.from(merged.values()).map((v) => ({
      value: v.id,
      label: v.name,
      sublabel: getVenueSearchSublabel(v, showNewAddress),
    }));
  }, [venues, pinnedVenues, showNewAddress]);

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
    label: t(`dayNames.${i}` as Parameters<typeof t>[0]),
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
        hostUserId: selectedHostUserId || undefined,
      });

      // Admin-created clubs are auto-approved
      toaster.success({ title: t('notification.club.creationSuccess') });
      router.push(ROUTES.ADMIN.CLUBS);
    } catch (error) {
      console.error('Failed to create club:', error);
      toaster.error({ title: t('failedToCreateClub') });
    }
  };

  return (
    <PageLayout title={t('adminApproval.createClubTitle')}>
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
            label={t('adminApproval.provisionalHostName')}
            required
            invalid={!!errors.hostName}
            errorText={errors.hostName?.message}
            helperText={t('adminApproval.provisionalHostNameHelp')}
          >
            <Input
              {...register('hostName')}
              placeholder={t('adminApproval.provisionalHostNamePlaceholder')}
            />
          </Field>

          {/* Host User (ADMIN only) */}
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
              minHeight="120px"
            />
          </Field>

          {/* Club Image */}
          <Field label={t('clubImage')}>
            <ImageUploader
              value={imageValue}
              onChange={(url) => {
                setValue('image', url || undefined);
                if (!url) setValue('imagePublicId', undefined);
              }}
              onUpload={handleUploadImage}
              maxSizeMB={5}
              maxWidth={400}
              maxHeight={400}
            />
          </Field>

          {/* Multi-Venue + Schedule */}
          <Field label="Sân hoạt động">
            <VStack spacing={3} align="stretch">
              {venueGroups.map((group, groupIdx) => (
                <Box
                  key={groupIdx}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                  p={3}
                >
                  <Flex gap={2} align="center" mb={2}>
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

                  <VStack spacing={1.5} align="stretch">
                    {group.schedules.map((sched, schedIdx) => (
                      <Flex key={schedIdx} gap={1} align="center">
                        <Box flex="1" minW={{ base: '90px', md: '110px' }}>
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
                          w={{ base: '90px', md: '110px' }}
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
                          w={{ base: '90px', md: '110px' }}
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
                      size="xs"
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
              {t('adminApproval.createClub')}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
};

export default AdminCreateClubPage;
