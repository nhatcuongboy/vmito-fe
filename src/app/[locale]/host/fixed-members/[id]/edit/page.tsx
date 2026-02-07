'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  Button,
  VStack,
  SimpleGrid,
  Input,
} from '@/components/ui/chakra-compat';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { FixedMemberGroupsService } from '@/lib/api/fixed-member-groups.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/loading-spinner';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const EditGroupPage = () => {
  const t = useTranslations('fixedMembers');
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isLoading },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const loadGroup = async () => {
      try {
        const group = await FixedMemberGroupsService.getGroup(groupId);
        setValue('name', group.name);
        setValue('description', group.description || '');
        setValue('color', group.color || 'blue');
      } catch (error) {
        console.error('Failed to load group:', error);
        toaster.error({ title: t('failedToLoadGroup') });
        router.push('/host/fixed-members');
      }
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId, setValue, router, t]);

  const onSubmit = async (data: FormData) => {
    try {
      await FixedMemberGroupsService.updateGroup(groupId, data);
      toaster.success({ title: t('groupUpdatedSuccess') });
      router.push('/host/fixed-members');
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
    return <LoadingSpinner />;
  }

  return (
    <Container maxW="container.md" py={8}>
      <Flex mb={8} align="center">
        <Button variant="ghost" onClick={() => router.back()} mr={4}>
          {t('back')}
        </Button>
        <Heading size="lg">{t('editGroup')}</Heading>
      </Flex>

      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        bg="white"
        p={8}
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
      >
        <VStack spacing={6} align="stretch">
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
            label={t('description')}
            invalid={!!errors.description}
            errorText={errors.description?.message}
          >
            <Textarea
              {...register('description')}
              placeholder={t('descriptionPlaceholder')}
            />
          </Field>

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
                  <Flex align="center">
                    <input
                      type="radio"
                      value={color}
                      {...register('color')}
                      style={{ marginRight: '8px' }}
                    />
                    <Text textTransform="capitalize">{color}</Text>
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
    </Container>
  );
};

export default EditGroupPage;
