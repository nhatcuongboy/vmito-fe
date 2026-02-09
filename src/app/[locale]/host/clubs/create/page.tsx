'use client';

import React from 'react';
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
import { FixedMemberGroupsService } from '@/lib/api/fixed-member-groups.service';
import { toaster } from '@/components/ui/toaster';
import { ROUTES } from '@/constants/routes';
import { Field } from '@/components/ui/Field';

import PageLayout from '@/components/layout/PageLayout';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  color: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CreateGroupPage = () => {
  const t = useTranslations('fixedMembers');
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      color: 'blue',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await FixedMemberGroupsService.createGroup(data);
      toaster.success({ title: t('groupCreatedSuccess') });
      router.push(ROUTES.HOST.CLUBS.LIST);
    } catch (error) {
      console.error('Failed to create group:', error);
      toaster.error({ title: t('failedToCreateGroup') });
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

  return (
    <PageLayout title={t('createGroup')}>
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
              {t('createGroup')}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </PageLayout>
  );
};

export default CreateGroupPage;
