'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Flex, Text, Textarea } from '@chakra-ui/react';
import {
  Button,
  VStack,
  SimpleGrid,
  Input,
  Select,
} from '@/components/ui/chakra-compat';
import { Switch } from '@/components/ui/switch';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { FixedMemberGroupsService } from '@/lib/api/fixed-member-groups.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { EClubJoinPolicy } from '@/types/fixed-member';
import { ROUTES } from '@/constants/routes';
import PageLayout from '@/components/layout/PageLayout';

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
});

type FormData = z.infer<typeof schema>;

const EditGroupPage = () => {
  const t = useTranslations('fixedMembers');
  const t_clubs = useTranslations('clubs');
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    control,
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
    },
  });

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const group = await FixedMemberGroupsService.getGroup(groupId);
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
      } catch (error) {
        console.error('Failed to load group:', error);
        toaster.error({ title: t('failedToLoadGroup') });
        router.push(ROUTES.HOST.CLUBS.LIST);
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId, setValue, router, t]);

  const onSubmit = async (data: FormData) => {
    try {
      await FixedMemberGroupsService.updateGroup(groupId, {
        ...data,
        maxMembers:
          (data.maxMembers as any) === null
            ? undefined
            : (data.maxMembers as any),
      });
      toaster.success({ title: t('groupUpdatedSuccess') });
      router.push(ROUTES.HOST.CLUBS.LIST);
    } catch (error) {
      console.error('Failed to update group:', error);
      toaster.error({ title: t('failedToUpdateGroup') });
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
        bg="white"
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
              label={t('groupName')}
              invalid={!!errors.name}
              errorText={errors.name?.message}
            >
              <Input
                {...register('name')}
                placeholder={t('groupNamePlaceholder')}
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

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <Field label={t_clubs('joinPolicy.title' as any) || 'Join Policy'}>
              <Select {...register('joinPolicy')}>
                <option value={EClubJoinPolicy.OPEN}>
                  {t_clubs('joinPolicy.open')}
                </option>
                <option value={EClubJoinPolicy.APPROVAL_REQUIRED}>
                  {t_clubs('joinPolicy.approvalRequired')}
                </option>
                <option value={EClubJoinPolicy.INVITATION_ONLY}>
                  {t_clubs('joinPolicy.invitationOnly')}
                </option>
              </Select>
            </Field>

            <Field
              label={t_clubs('maxMembers') || 'Max Members'}
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
                  <Switch
                    id="isPublic"
                    checked={field.value}
                    onCheckedChange={(e) => field.onChange(e.checked)}
                    colorPalette="blue"
                  />
                )}
              />
              <Box>
                <Text fontWeight="bold">Public Club</Text>
                <Text fontSize="xs" color="gray.500">
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
            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
              {t('saveChanges')}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
};

export default EditGroupPage;
