'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex } from '@chakra-ui/react';
import { Button, VStack, Input } from '@/components/ui/chakra-compat';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
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
import { ROUTES } from '@/constants/routes';
import PageLayout from '@/components/layout/PageLayout';
import { UserRole } from '@/lib/api/types';
import { getVenueSearchSublabel } from '@/utils/venue-helpers';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { ISessionImage } from '@/components/session/AppMultiImageUpload';
import { useAuthStore } from '@/stores';
import ClubLevelRequirements from '@/components/club/ClubLevelRequirements';
import ClubMediaEditor from '@/components/club/ClubMediaEditor';
import ClubVenueScheduleEditor, {
  ClubVenueScheduleEditorHandle,
} from '@/components/club/ClubVenueScheduleEditor';
import {
  ClubScheduleDraft,
  ClubVenueGroupDraft,
  ClubVenueScheduleValidation,
  createClubScheduleDraft,
  createClubVenueGroupDraft,
  validateClubVenueSchedule,
} from '@/components/club/club-venue-schedule';

const schema = z.object({
  name: z.string().min(1, 'Tên nhóm là bắt buộc'),
  hostName: z.string().optional(),
  description: z
    .string()
    .max(5000, 'Mô tả quá dài (tối đa 5000 ký tự)')
    .optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  logo: z.string().optional(),
  logoPublicId: z.string().optional(),
  images: z.array(z.string()).optional(),
  imagePublicIds: z.array(z.string()).optional(),
  requiredLevels: z.array(z.number()).optional(),
  allLevelsSelected: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

type TVenueOption = {
  id: string;
  name: string;
  address: string;
  district?: string;
  city?: string;
  newAddress?: string;
};

const EditClubPage = () => {
  const t = useTranslations('clubs');
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN;
  const { showNewAddress } = useAppSettings();

  const [venues, setVenues] = useState<TVenueOption[]>([]);
  // pinnedVenues keeps track of venues currently selected in venueGroups so
  // they always appear in options even if they fall outside the search results.
  const [pinnedVenues, setPinnedVenues] = useState<Map<string, TVenueOption>>(
    new Map()
  );
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [venueGroups, setVenueGroups] = useState<ClubVenueGroupDraft[]>([]);
  const [venueValidation, setVenueValidation] =
    useState<ClubVenueScheduleValidation>(() => validateClubVenueSchedule([]));
  const [hasValidatedVenues, setHasValidatedVenues] = useState(false);
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
  const venueEditorRef = useRef<ClubVenueScheduleEditorHandle>(null);

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
    const merged = new Map<string, TVenueOption>();
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
        setValue('logo', group.logo || undefined);
        setValue('logoPublicId', group.logoPublicId || undefined);
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

        // Set host user for admin
        if (isAdmin && group.host) {
          setSelectedHostUserId(group.hostId);
          // Add current host to hostUsers so it appears in dropdown
          setHostUsers((prev) => {
            const exists = prev.some((u) => u.id === group.host.id);
            if (exists) return prev;
            return [
              {
                id: group.host.id,
                name: group.host.name,
                email: group.host.email || '',
                role: UserRole.HOST,
                createdAt: '',
                updatedAt: '',
              },
              ...prev,
            ];
          });
        }

        // Collect all unique venue info from schedules so we can resolve them
        // Notes are stored as "Venue Name | Address", so we parse the venue name
        const notesToVenueName = new Map<string, string>();
        if (group.schedules) {
          group.schedules.forEach((s) => {
            if (s.notes) {
              // Extract venue name from "Name | Address" format
              const venueName = s.notes.split(' | ')[0];
              notesToVenueName.set(s.notes, venueName);
            }
          });
        }

        // Fetch a broader venue list covering all schedule venue names
        // We do one search per unique name that isn't the defaultVenue
        const nameToVenue = new Map<string, TVenueOption>();
        // Map from notes string to resolved venue
        const notesToResolvedVenue = new Map<string, TVenueOption>();

        if (group.defaultVenue) {
          nameToVenue.set(group.defaultVenue.name, {
            id: group.defaultVenue.id,
            name: group.defaultVenue.name,
            address: group.defaultVenue.address,
          });
        }

        await Promise.all(
          Array.from(notesToVenueName.entries()).map(
            async ([notesKey, venueName]) => {
              // Skip if we already have this venue from defaultVenue
              if (nameToVenue.has(venueName)) {
                notesToResolvedVenue.set(notesKey, nameToVenue.get(venueName)!);
                return;
              }
              try {
                const result = await VenueService.searchVenues({
                  keyword: venueName,
                  limit: 10,
                });
                // Match by venue name (not the full "name | address" string)
                const matched = (result.data ?? []).find(
                  (v) => v.name === venueName
                );
                if (matched) {
                  const venueOption = {
                    id: matched.id,
                    name: matched.name,
                    address: matched.address,
                  };
                  nameToVenue.set(venueName, venueOption);
                  notesToResolvedVenue.set(notesKey, venueOption);
                }
              } catch {
                // ignore individual search errors
              }
            }
          )
        );

        // Pin all resolved venues so they always appear in the select options
        setPinnedVenues((prev) => {
          const next = new Map(prev);
          nameToVenue.forEach((v) => next.set(v.id, v));
          return next;
        });

        // Reconstruct venueGroups from schedules
        if (group.schedules && group.schedules.length > 0) {
          const defaultVenueId = group.defaultVenue?.id || '';

          const noteGroups = new Map<
            string,
            { venueId: string; schedules: ClubScheduleDraft[] }
          >();

          group.schedules.forEach((s) => {
            const key = s.notes || '__default__';
            if (!noteGroups.has(key)) {
              // Use notesToResolvedVenue which maps the full notes string to the venue
              const resolvedVenue = s.notes
                ? notesToResolvedVenue.get(s.notes)
                : null;
              noteGroups.set(key, {
                venueId:
                  resolvedVenue?.id ||
                  (key === '__default__' ? defaultVenueId : ''),
                schedules: [],
              });
            }
            noteGroups.get(key)!.schedules.push(
              createClubScheduleDraft({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
              })
            );
          });

          setVenueGroups(
            Array.from(noteGroups.values()).map((group) =>
              createClubVenueGroupDraft(
                { venueId: group.venueId },
                group.schedules
              )
            )
          );
        } else if (group.defaultVenue) {
          // No schedules but has a venue — create an empty group
          setVenueGroups([
            createClubVenueGroupDraft({ venueId: group.defaultVenue.id }, []),
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
  }, [groupId, setValue, router, t, isAdmin]);

  const handleVenueSelected = useCallback(
    (venueId: string) => {
      const found = venues.find((venue) => venue.id === venueId);
      if (!found) return;

      setPinnedVenues((current) => {
        const next = new Map(current);
        next.set(venueId, found);
        return next;
      });
    },
    [venues]
  );

  const handleVenueGroupsChange = useCallback(
    (groups: ClubVenueGroupDraft[]) => {
      setVenueGroups(groups);
      if (hasValidatedVenues) {
        setVenueValidation(validateClubVenueSchedule(groups));
      }
    },
    [hasValidatedVenues]
  );

  const onSubmit = async (data: FormData) => {
    const nextVenueValidation = validateClubVenueSchedule(venueGroups);
    setVenueValidation(nextVenueValidation);
    setHasValidatedVenues(true);

    if (!nextVenueValidation.isValid) {
      toaster.error({ title: t('venueEditor.validationSummary') });
      venueEditorRef.current?.focusFirstError();
      return;
    }

    try {
      const selectedVenues = new Map(
        [...venues, ...Array.from(pinnedVenues.values())].map((venue) => [
          venue.id,
          venue,
        ])
      );
      const schedules = venueGroups.flatMap((group) => {
        const venue = selectedVenues.get(group.venueId);
        const venueInfo = venue ? `${venue.name} | ${venue.address}` : '';

        return group.schedules.map((schedule) => ({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          notes: venueInfo,
        }));
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

      const restData = { ...data };
      delete restData.allLevelsSelected;

      const updatedClub = await ClubsService.updateClub(groupId, {
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
      router.push(ROUTES.CLUBS.DETAIL(updatedClub.slug || updatedClub.id));
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
        pb={{ base: 28, md: 6 }}
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
              minHeight="120px"
            />
          </Field>

          <ClubMediaEditor
            images={clubImages}
            bannerIndex={bannerIndex}
            logo={watch('logo')}
            logoPublicId={watch('logoPublicId')}
            onImagesChange={setClubImages}
            onBannerChange={setBannerIndex}
            onLogoChange={(image) => {
              setValue('logo', image.url);
              setValue('logoPublicId', image.publicId || '');
            }}
            onLogoClear={() => {
              setValue('logo', '');
              setValue('logoPublicId', '');
            }}
          />

          <ClubVenueScheduleEditor
            ref={venueEditorRef}
            value={venueGroups}
            venueOptions={venueOptions}
            onChange={handleVenueGroupsChange}
            onVenueSelected={handleVenueSelected}
            onSearchChange={handleVenueSearch}
            isLoading={venueSearchLoading}
            validation={venueValidation}
          />

          <Flex
            justify={{ base: 'space-between', md: 'flex-end' }}
            gap={{ base: 3, md: 4 }}
            mt={4}
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
            boxShadow={{
              base: '0 -8px 20px rgba(15, 23, 42, 0.08)',
              md: 'none',
            }}
          >
            <Button variant="ghost" onClick={() => router.back()}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              colorPalette="green"
              loading={isSubmitting}
              flex={{ base: '0 0 auto', md: 'initial' }}
            >
              {t('saveChanges')}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
};

export default EditClubPage;
