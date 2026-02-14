'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Text, Textarea } from '@chakra-ui/react';
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
import ImageUploader from '@/components/cloudinary/ImageUploader';
import PageLayout from '@/components/layout/PageLayout';
import { Plus, Trash2 } from 'lucide-react';
import { Venue } from '@/lib/api/types';

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
  schedules: z.array(scheduleSchema).optional(),
});

type FormData = z.infer<typeof schema>;

const CreateClubPage = () => {
  const t = useTranslations('clubs');
  const router = useRouter();
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [venues, setVenues] = useState<Venue[]>([]);

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

  const handleUploadImage = useCallback(
    async (file: File): Promise<string> => {
      const result = await ClubsService.uploadClubImage(file);
      setValue('imagePublicId', result.publicId);
      return result.url;
    },
    [setValue]
  );

  useEffect(() => {
    VenueService.getAllVenues()
      .then(setVenues)
      .catch(() => setVenues([]));
  }, []);

  const venueOptions = useMemo(
    () =>
      venues.map((v) => ({
        value: v.id,
        label: `${v.name} - ${v.address}`,
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
    label: t(`dayNames.${i}` as any),
  }));

  return (
    <PageLayout title={t('createClub')}>
      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        bg="white"
        p={8}
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
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
                  bg={`${color}.50`}
                  borderColor={`${color}.200`}
                  _hover={{ bg: `${color}.100` }}
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
