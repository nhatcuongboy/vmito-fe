'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Input,
  Avatar,
  Flex,
  Textarea,
  Field,
} from '@chakra-ui/react';
import { Select } from './Select';
import { PasswordInput } from './password-input';
import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CommonModal } from './CommonModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { AdminService, UpdateUserData } from '@/lib/api/admin.service';
import { Gender, GenderType, PlayerLevel } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod schema for user profile validation
const userProfileSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    gender: z.nativeEnum(Gender).optional().or(z.literal('')),
    level: z.string().optional(),
    levelDescription: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

type UserProfileFormData = z.infer<typeof userProfileSchema>;

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
}: UserProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const common = useTranslations('common');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      name: '',
      phone: '',
      gender: '',
      level: '',
      levelDescription: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user && isOpen) {
      // Fetch full user data from API to get all fields
      const loadUserData = async () => {
        try {
          const fullUser = await AdminService.getUser(user.id);
          reset({
            name: fullUser.name || '',
            phone: fullUser.phone || '',
            gender: (fullUser.gender as Gender) || '',
            level: fullUser.level ? String(fullUser.level) : '',
            levelDescription: fullUser.levelDescription || '',
            password: '',
            confirmPassword: '',
          });
        } catch (error) {
          console.error('Failed to load user data:', error);
          reset({
            name: user.name || '',
            phone: '',
            gender: '',
            level: '',
            levelDescription: '',
            password: '',
            confirmPassword: '',
          });
        }
      };
      loadUserData();
    }
  }, [user, isOpen, reset]);

  const onSubmit = async (data: UserProfileFormData) => {
    if (!user) return;

    try {
      const updateData: Partial<UpdateUserData> = {};

      if (data.name && typeof data.name === 'string')
        updateData.name = data.name;
      if (data.phone && typeof data.phone === 'string')
        updateData.phone = data.phone;
      if (data.gender) {
        updateData.gender = data.gender as GenderType;
      }
      if (data.level && typeof data.level === 'string')
        updateData.level = Number(data.level);
      if (data.levelDescription && typeof data.levelDescription === 'string') {
        updateData.levelDescription = data.levelDescription;
      }
      if (
        data.password &&
        typeof data.password === 'string' &&
        data.password.trim() !== ''
      ) {
        updateData.password = data.password;
      }

      const updatedUser = await AdminService.updateUser(
        user.id,
        updateData as UpdateUserData
      );

      if (updatedUser) {
        setUser({
          ...user,
          name: updatedUser.name || user.name,
          image: updatedUser.image || user.image,
        });
      }

      toaster.create({
        title: common('success'),
        description: 'Profile updated successfully',
        type: 'success',
      });

      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toaster.create({
        title: common('error'),
        description: 'Failed to update profile',
        type: 'error',
      });
    }
  };

  if (!user) return null;

  const handleAvatarClick = () => {
    if (isAvatarUploading) return;
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsAvatarUploading(true);
    try {
      const uploaded = await AdminService.uploadAvatar(file);
      const updatedUser = await AdminService.updateUser(user.id, {
        image: uploaded.url,
        imagePublicId: uploaded.publicId,
      });

      setUser({
        ...user,
        image: updatedUser.image ?? uploaded.url,
        imagePublicId: (updatedUser as any).imagePublicId ?? uploaded.publicId,
      });

      toaster.create({
        title: common('success'),
        description: 'Avatar updated successfully',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toaster.create({
        title: common('error'),
        description: 'Failed to upload avatar',
        type: 'error',
      });
    } finally {
      setIsAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={common('editProfile')}
      size="lg"
      primaryActionText={common('save')}
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryLoading={isSubmitting}
      secondaryActionText={common('cancel')}
      maxBodyHeight="70vh"
      isCentered={true}
    >
      <VStack gap={6} align="stretch">
        {/* Avatar Section */}
        <Flex direction="column" align="center" gap={3}>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarFileChange}
            style={{ display: 'none' }}
            disabled={isAvatarUploading}
          />
          <Box position="relative">
            <Avatar.Root size="2xl" bg="blue.500">
              <Avatar.Fallback name={user.name || user.email}>
                {(user.name || user.email).charAt(0).toUpperCase()}
              </Avatar.Fallback>
              {user.image && <Avatar.Image src={user.image} />}
            </Avatar.Root>
            <Box
              position="absolute"
              bottom={0}
              right={0}
              bg="blue.500"
              color="white"
              p={2}
              borderRadius="full"
              cursor="pointer"
              _hover={{ bg: 'blue.600' }}
              boxShadow="md"
              onClick={handleAvatarClick}
            >
              <Upload size={16} />
            </Box>
          </Box>
          <Text fontSize="sm" color="fg.muted">
            Click to upload avatar
          </Text>
        </Flex>

        {/* Name */}
        <Field.Root invalid={!!errors.name} required>
          <Field.Label>
            {common('name')}{' '}
            <Text as="span" color="red.500">
              *
            </Text>
          </Field.Label>
          <Input {...register('name')} placeholder="Enter your name" />
          <Field.ErrorText color="fg.error">
            {errors.name?.message}
          </Field.ErrorText>
        </Field.Root>

        {/* Email (Read-only) */}
        <Field.Root>
          <Field.Label>Email</Field.Label>
          <Input
            value={user.email}
            disabled
            bg={{ base: 'gray.50', _dark: 'whiteAlpha.100' }}
          />
        </Field.Root>

        {/* Phone */}
        <Field.Root invalid={!!errors.phone}>
          <Field.Label>{common('phone')}</Field.Label>
          <Input
            {...register('phone')}
            placeholder="Enter your phone number"
            type="tel"
          />
          <Field.ErrorText color="fg.error">
            {errors.phone?.message}
          </Field.ErrorText>
        </Field.Root>

        {/* Gender */}
        <Field.Root invalid={!!errors.gender}>
          <Field.Label>{common('gender')}</Field.Label>
          <Controller
            control={control}
            name="gender"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <option value="">{common('selectGender')}</option>
                <option value="MALE">{common('male')}</option>
                <option value="FEMALE">{common('female')}</option>
                <option value="OTHER">{common('other')}</option>
              </Select>
            )}
          />
          <Field.ErrorText color="fg.error">
            {errors.gender?.message}
          </Field.ErrorText>
        </Field.Root>

        {/* Level */}
        <Field.Root invalid={!!errors.level}>
          <Field.Label>{common('level')}</Field.Label>
          <Controller
            control={control}
            name="level"
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <option value="">{common('selectLevel')}</option>
                <option value={String(PlayerLevel.BEGINNER)}>
                  {common('levels.1')}
                </option>
                <option value={String(PlayerLevel.ADVANCED_BEGINNER)}>
                  {common('levels.2')}
                </option>
                <option value={String(PlayerLevel.LOW_INTERMEDIATE)}>
                  {common('levels.3')}
                </option>
                <option value={String(PlayerLevel.INTERMEDIATE)}>
                  {common('levels.4')}
                </option>
                <option value={String(PlayerLevel.HIGH_INTERMEDIATE)}>
                  {common('levels.5')}
                </option>
                <option value={String(PlayerLevel.ADVANCED)}>
                  {common('levels.6')}
                </option>
                <option value={String(PlayerLevel.SEMI_PRO)}>
                  {common('levels.7')}
                </option>
                <option value={String(PlayerLevel.PRO)}>
                  {common('levels.8')}
                </option>
              </Select>
            )}
          />
          <Field.ErrorText color="fg.error">
            {errors.level?.message}
          </Field.ErrorText>
        </Field.Root>

        {/* Level Description */}
        <Field.Root invalid={!!errors.levelDescription}>
          <Field.Label>Level Description</Field.Label>
          <Textarea
            {...register('levelDescription')}
            placeholder="Describe your skill level"
            rows={3}
          />
          <Field.ErrorText color="fg.error">
            {errors.levelDescription?.message}
          </Field.ErrorText>
        </Field.Root>

        {/* Password Section */}
        <Box borderTop="1px solid" borderColor="border" pt={4}>
          <Text fontSize="md" fontWeight="semibold" mb={4}>
            Change Password
          </Text>

          <VStack gap={4} align="stretch">
            <Field.Root invalid={!!errors.password}>
              <Field.Label>New Password</Field.Label>
              <PasswordInput
                {...register('password')}
                placeholder="Enter new password (leave blank to keep current)"
              />
              <Field.ErrorText color="fg.error">
                {errors.password?.message}
              </Field.ErrorText>
              <Field.HelperText>
                Leave blank to keep current password
              </Field.HelperText>
            </Field.Root>

            <Field.Root invalid={!!errors.confirmPassword}>
              <Field.Label>Confirm Password</Field.Label>
              <PasswordInput
                {...register('confirmPassword')}
                placeholder="Confirm new password"
              />
              <Field.ErrorText color="fg.error">
                {errors.confirmPassword?.message}
              </Field.ErrorText>
            </Field.Root>
          </VStack>
        </Box>
      </VStack>
    </CommonModal>
  );
}
