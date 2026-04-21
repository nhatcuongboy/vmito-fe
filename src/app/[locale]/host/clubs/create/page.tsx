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
  SimpleGrid,
  Input,
  IconButton,
} from '@/components/ui/chakra-compat';
import { LegacySelect } from '@/components/ui/VSelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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

const scheduleSchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:mm'),
});

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
  images: z.array(z.string()).optional(),
  imagePublicIds: z.array(z.string()).optional(),
  schedules: z.array(scheduleSchema).optional(),
});

type FormData = z.infer<typeof schema>;

const CreateClubPage = () => {
  const t = useTranslations('clubs');
  const router = useRouter();
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const venueSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      color: 'blue',
      schedules: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedules',
  });

  const imageValue = watch('image');
  const imagePublicIdValue = watch('imagePublicId');
  const coverPhotoValue = watch("coverPhoto");
  const coverPhotoPublicIdValue = watch("coverPhotoPublicId");
  const imagesValue = watch('images') || [];
  const imagePublicIdsValue = watch('imagePublicIds') || [];

  // Debounced server-side venue search
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

  // Load initial venues when dropdown first receives focus (lazy)
  useEffect(() => {
    handleVenueSearch('');
  }, [handleVenueSearch]);

  const venueOptions = useMemo(
    () =>
      venues.map((v) => ({
        value: v.id,
        label: v.name,
        sublabel: v.address,
      })),
    [venues]
  );

  const onSubmit = async (data: FormData) => {
    try {
      await ClubsService.createClub({
        ...data,
        defaultVenueId: selectedVenueId || undefined,
      });
      toaster.success({ title: t('clubCreatedSuccess') });
      router.push(ROUTES.CLUBS.BROWSE);
    } catch (error) {
      console.error('Failed to create club:', error);
      toaster.error({ title: t('failedToCreateClub') });
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
    label: t(`dayNames.${i as 0 | 1 | 2 | 3 | 4 | 5 | 6}`),
  }));

  return (
    <PageLayout
      title={t('createClub')}
      showBackButton
      backHref={ROUTES.HOST.CLUBS.LIST}
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
            invalid={!!errors.name}
            errorText={errors.name?.message}
          >
            <Input
              {...register('name')}
              placeholder={t('clubNamePlaceholder')}
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
              onSearchChange={handleVenueSearch}
              isLoading={venueSearchLoading}
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
                  <Text fontSize="sm" color="gray.500">
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

          {/* Color Picker */}
          <Field label={t('colorLabel')}>
            <SimpleGrid columns={4} spacing={4}>
              {colors.map((color) => (
                <Box
                  key={color}
                  as="label"
                  cursor="pointer"
                  borderWidth="1px"
                  borderRadius="md"
                  p={2}
                  bg={{ base: `${color}.50`, _dark: `${color}.900` }}
                  borderColor={{ base: `${color}.200`, _dark: `${color}.700` }}
                  _hover={{
                    bg: { base: `${color}.100`, _dark: `${color}.800` },
                  }}
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
              {t('createClub')}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
};

export default CreateClubPage;
