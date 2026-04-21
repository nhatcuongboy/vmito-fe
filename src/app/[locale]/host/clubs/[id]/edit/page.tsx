'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Text, Textarea, Image } from '@chakra-ui/react';
import {
  Button,
  VStack,
  SimpleGrid,
  Input,
  IconButton,
} from '@/components/ui/chakra-compat';
import { LegacySelect } from '@/components/ui/VSelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { ClubsService } from '@/lib/api/clubs.service';
import { VenueService } from '@/lib/api/venue.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/loading-spinner';
import AppImageGalleryPicker from '@/components/AppImageGalleryPicker';
import { EClubJoinPolicy } from '@/types/club';
import { ROUTES } from '@/constants/routes';
import PageLayout from '@/components/layout/PageLayout';
import { ImageIcon, Plus, Trash2, X } from 'lucide-react';
import { EImageCategory, Venue } from '@/lib/api/types';
import { VSwitch } from '@/components/ui/VSwitch';

const scheduleSchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm'),
});

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  isPublic: z.boolean(),
  joinPolicy: z.nativeEnum(EClubJoinPolicy),
  maxMembers: z
    .union([z.coerce.number(), z.literal(''), z.null()])
    .transform((val) => (val === '' || val === null ? null : val)),
  location: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  images: z.array(z.string()).optional(),
  imagePublicIds: z.array(z.string()).optional(),
  schedules: z.array(scheduleSchema).optional(),
});

type FormData = z.infer<typeof schema>;

const EditClubPage = () => {
  const t = useTranslations('clubs');
  const t_clubs = useTranslations('clubs');
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting, isLoading },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      isPublic: false,
      joinPolicy: EClubJoinPolicy.APPROVAL_REQUIRED,
      maxMembers: null,
      description: '',
      color: 'blue',
      location: '',
      schedules: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'schedules',
  });

  const imageValue = watch('image');
  const imagePublicIdValue = watch('imagePublicId');
  const imagesValue = watch('images') || [];
  const imagePublicIdsValue = watch('imagePublicIds') || [];

  useEffect(() => {
    VenueService.getAllVenues()
      .then(setVenues)
      .catch(() => setVenues([]));
  }, []);

  const venueOptions = useMemo(
    () =>
      venues.map((v) => ({
        value: v.id,
        label: v.name,
        sublabel: v.address,
      })),
    [venues]
  );

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const group = await ClubsService.getClub(groupId);
        setValue('name', group.name);
        setValue('description', group.description || '');
        setValue('color', group.color || 'blue');
        setValue('isPublic', group.isPublic ?? false);
        setValue(
          'joinPolicy',
          group.joinPolicy || EClubJoinPolicy.APPROVAL_REQUIRED
        );
        setValue('maxMembers', group.maxMembers ?? null);
        setValue('location', group.location || '');
        setValue('image', group.image || undefined);
        setValue('imagePublicId', group.imagePublicId || undefined);
        setValue('images', group.images || []);
        setValue('imagePublicIds', group.imagePublicIds || []);

        // Load schedules
        if (group.schedules && group.schedules.length > 0) {
          replace(
            group.schedules.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
            }))
          );
        }

        // Load default venue
        if (group.defaultVenue) {
          setSelectedVenueId(group.defaultVenue.id);
        }
      } catch (error) {
        console.error('Failed to load group:', error);
        toaster.error({ title: t('failedToLoadClub') });
        router.push(ROUTES.CLUBS.BROWSE);
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId, setValue, replace, router, t]);

  const onSubmit = async (data: FormData) => {
    try {
      await ClubsService.updateClub(groupId, {
        ...data,
        maxMembers:
          (data.maxMembers as any) === null
            ? undefined
            : (data.maxMembers as any),
        defaultVenueId: selectedVenueId || undefined,
      });
      toaster.success({ title: t('clubUpdatedSuccess') });
      router.push(ROUTES.CLUBS.BROWSE);
    } catch (error) {
      console.error('Failed to update club:', error);
      toaster.error({ title: t('failedToUpdateClub') });
    }
  };

  const colors = [
    'blue',
    'green',
    'purple',
    'orange',
    'red',
    'teal',
    'cyan',
    'pink',
  ];

  const dayOptions = Array.from({ length: 7 }, (_, i) => ({
    value: i,
    label: t(`dayNames.${i}` as any),
  }));

  if (isLoading) {
    return (
      <PageLayout title={t('editGroup')}>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t('editGroup')}>
      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        bg="bg"
        _dark={{ bg: 'gray.800' }}
        p={8}
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
        maxW="container.md"
        mx="auto"
      >
        <VStack gap={6} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field
              label={t('clubName')}
              invalid={!!errors.name}
              errorText={errors.name?.message}
            >
              <Input
                {...register('name')}
                placeholder={t('clubNamePlaceholder')}
              />
            </Field>

            <Field
              label={t('location')}
              invalid={!!errors.location}
              errorText={errors.location?.message}
            >
              <Input
                {...register('location')}
                placeholder="Primary venue or city"
              />
            </Field>
          </SimpleGrid>

          <Field
            label={t('description')}
            invalid={!!errors.description}
            errorText={errors.description?.message}
          >
            <Textarea
              {...register('description')}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
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

                        // Sync primary image
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

          {/* Venue Selector */}
          <Field label={t('venue')}>
            <SearchableSelect
              options={venueOptions}
              value={selectedVenueId}
              onChange={setSelectedVenueId}
              placeholder={t('searchVenue')}
              searchPlaceholder={t('searchVenue')}
              noOptionsMessage={t('noVenueSelected')}
            />
          </Field>

          {/* Schedule */}
          <Field label={t('schedule')}>
            <VStack spacing={3} align="stretch">
              {fields.map((field, index) => (
                <Flex key={field.id} gap={3} align="center" flexWrap="wrap">
                  <Box flex="1" minW="120px">
                    <Controller
                      name={`schedules.${index}.dayOfWeek`}
                      control={control}
                      render={({ field: f }) => (
                        <LegacySelect
                          value={String(f.value)}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            f.onChange(Number(e.target.value))
                          }
                        >
                          {dayOptions.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </LegacySelect>
                      )}
                    />
                  </Box>
                  <Input
                    type="time"
                    {...register(`schedules.${index}.startTime`)}
                    w="130px"
                  />
                  <Text fontSize="sm" color="fg.muted">
                    -
                  </Text>
                  <Input
                    type="time"
                    {...register(`schedules.${index}.endTime`)}
                    w="130px"
                  />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => remove(index)}
                    aria-label={t('removeSchedule')}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Flex>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  append({ dayOfWeek: 1, startTime: '19:00', endTime: '21:00' })
                }
                w="fit-content"
              >
                <Plus size={16} />
                {t('addSchedule')}
              </Button>
            </VStack>
          </Field>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field label={t_clubs('joinPolicy.title' as any) || 'Join Policy'}>
              <LegacySelect {...register('joinPolicy')}>
                <option value={EClubJoinPolicy.OPEN}>
                  {t_clubs('joinPolicy.open')}
                </option>
                <option value={EClubJoinPolicy.APPROVAL_REQUIRED}>
                  {t_clubs('joinPolicy.approvalRequired')}
                </option>
                <option value={EClubJoinPolicy.INVITATION_ONLY}>
                  {t_clubs('joinPolicy.invitationOnly')}
                </option>
              </LegacySelect>
            </Field>

            <Field
              label={t_clubs('maxMembersLabel') || 'Max Members'}
              invalid={!!errors.maxMembers}
              errorText={errors.maxMembers?.message}
            >
              <Input
                type="number"
                {...register('maxMembers')}
                placeholder="Unlimited"
              />
            </Field>
          </SimpleGrid>

          <Field>
            <Flex align="center" gap={3}>
              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <VSwitch
                    id="isPublic"
                    checked={field.value}
                    onCheckedChange={(e) => field.onChange(e.checked)}
                    colorPalette="green"
                  />
                )}
              />
              <Box>
                <Text fontWeight="bold">Public Club</Text>
                <Text fontSize="xs" color="fg.muted">
                  Visible to everyone in discovery
                </Text>
              </Box>
            </Flex>
          </Field>

          <Field label={t('colorLabel')}>
            <SimpleGrid columns={{ base: 2, sm: 4 }} gap={4}>
              {colors.map((color) => (
                <Box
                  key={color}
                  as="label"
                  cursor="pointer"
                  borderWidth="2px"
                  borderRadius="md"
                  p={2}
                  bg={`${color}.50`}
                  _dark={{ bg: `${color}.900/20` }}
                  borderColor={`${color}.200`}
                  _hover={{ bg: `${color}.100` }}
                  transition="all 0.2s"
                >
                  <Flex align="center" gap={2}>
                    <input type="radio" value={color} {...register('color')} />
                    <Text textTransform="capitalize" fontSize="sm">
                      {color}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
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
