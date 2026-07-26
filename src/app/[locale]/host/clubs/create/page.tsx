'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Grid } from '@chakra-ui/react';
import { Button, VStack, Input } from '@/components/ui/chakra-compat';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { VenueService } from '@/lib/api/venue.service';
import { AdminService, User as AdminUser } from '@/lib/api/admin.service';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { Field } from '@/components/ui/Field';
import PageLayout from '@/components/layout/PageLayout';
import { UserRole, Venue } from '@/lib/api/types';
import { getVenueSearchSublabel } from '@/utils/venue-helpers';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { ISessionImage } from '@/components/session/AppMultiImageUpload';
import ClubLevelRequirements from '@/components/club/ClubLevelRequirements';
import ClubMediaEditor from '@/components/club/ClubMediaEditor';
import VenueCollapsibleSection from '@/components/venue/VenueCollapsibleSection';
import ClubVenueScheduleEditor, {
  ClubVenueScheduleEditorHandle,
} from '@/components/club/ClubVenueScheduleEditor';
import {
  ClubVenueGroupDraft,
  ClubVenueScheduleValidation,
  validateClubVenueSchedule,
} from '@/components/club/club-venue-schedule';
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
  logo: z.string().optional(),
  logoPublicId: z.string().optional(),
  images: z.array(z.string()).optional(),
  imagePublicIds: z.array(z.string()).optional(),
  requiredLevels: z.array(z.number()).optional(),
  allLevelsSelected: z.boolean().optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      zalo: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
      website: z.string().optional(),
      other: z.string().optional(),
    })
    .optional(),
});

type FormData = z.infer<typeof schema>;

const CreateClubPage = () => {
  const t = useTranslations('clubs');
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN;
  const { showNewAddress } = useAppSettings();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [pinnedVenues, setPinnedVenues] = useState<Map<string, Venue>>(
    new Map()
  );
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [venueGroups, setVenueGroups] = useState<ClubVenueGroupDraft[]>([]);
  const [venueValidation, setVenueValidation] =
    useState<ClubVenueScheduleValidation>(() => validateClubVenueSchedule([]));
  const [hasValidatedVenues, setHasValidatedVenues] = useState(false);

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
      sublabel: getVenueSearchSublabel(v, showNewAddress),
    }));
  }, [venues, pinnedVenues, showNewAddress]);

  const hostUserOptions = useMemo(
    () =>
      hostUsers.map((u) => ({ value: u.id, label: u.name, sublabel: u.email })),
    [hostUsers]
  );

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

      const createdClub = await ClubsService.createClub({
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

      toaster.success({ title: t('notification.club.creationSuccess') });

      router.push(ROUTES.CLUBS.DETAIL(createdClub.slug || createdClub.id));
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

          {/* Mạng xã hội & Liên kết */}
          <Box
            p={4}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
            bg={{ base: 'gray.50/50', _dark: 'gray.800/50' }}
          >
            <VenueCollapsibleSection
              title={t('socialLinks.title')}
              defaultOpen={false}
            >
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <Field label={t('socialLinks.facebook')}>
                  <Input
                    {...register('socialLinks.facebook')}
                    placeholder={t('socialLinks.facebookPlaceholder')}
                  />
                </Field>

                <Field label={t('socialLinks.zalo')}>
                  <Input
                    {...register('socialLinks.zalo')}
                    placeholder={t('socialLinks.zaloPlaceholder')}
                  />
                </Field>

                <Field label={t('socialLinks.tiktok')}>
                  <Input
                    {...register('socialLinks.tiktok')}
                    placeholder={t('socialLinks.tiktokPlaceholder')}
                  />
                </Field>

                <Field label={t('socialLinks.youtube')}>
                  <Input
                    {...register('socialLinks.youtube')}
                    placeholder={t('socialLinks.youtubePlaceholder')}
                  />
                </Field>

                <Field label={t('socialLinks.website')}>
                  <Input
                    {...register('socialLinks.website')}
                    placeholder={t('socialLinks.websitePlaceholder')}
                  />
                </Field>

                <Field label={t('socialLinks.other')}>
                  <Input
                    {...register('socialLinks.other')}
                    placeholder={t('socialLinks.otherPlaceholder')}
                  />
                </Field>
              </Grid>
            </VenueCollapsibleSection>
          </Box>

          <Flex
            justify={{ base: 'stretch', md: 'flex-end' }}
            gap={{ base: 0, md: 4 }}
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
            <Button
              type="submit"
              colorPalette="green"
              loading={isSubmitting}
              w={{ base: 'full', md: 'auto' }}
              flex={{ base: '1 1 auto', md: 'initial' }}
            >
              {t('createClub')}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
};

export default CreateClubPage;
