'use client';
import { Input } from '@/components/ui/Input';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Avatar,
  Flex,
  Textarea,
  Field,
  Button,
} from '@chakra-ui/react';
import { VSelect } from './VSelect';
import { Upload, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VModal } from './VModal';
import ChangePasswordModal from './ChangePasswordModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { AdminService, UpdateUserData } from '@/lib/api/admin.service';
import { Gender, GenderType, PlayerLevel } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod schema for user profile validation
const userProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  gender: z.nativeEnum(Gender).optional().or(z.literal('')),
  level: z.string().optional(),
  levelDescription: z.string().optional(),
});

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
  const t = useTranslations('common.profileModal');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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
          });
        } catch (error) {
          console.error('Failed to load user data:', error);
          reset({
            name: user.name || '',
            phone: '',
            gender: '',
            level: '',
            levelDescription: '',
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
        description: t('profileUpdatedSuccessfully'),
        type: 'success',
      });

      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toaster.create({
        title: common('error'),
        description: t('failedToUpdateProfile'),
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
        description: t('avatarUpdatedSuccessfully'),
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toaster.create({
        title: common('error'),
        description: t('failedToUploadAvatar'),
        type: 'error',
      });
    } finally {
      setIsAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  return (
    <VModal
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
            <Avatar.Root size="2xl" bg="green.500">
              <Avatar.Fallback name={user.name || user.email}>
                {(user.name || user.email).charAt(0).toUpperCase()}
              </Avatar.Fallback>
              {user.image && <Avatar.Image src={user.image} />}
            </Avatar.Root>
            <Box
              position="absolute"
              bottom={0}
              right={0}
              bg="green.500"
              color="white"
              p={2}
              borderRadius="full"
              cursor="pointer"
              _hover={{ bg: 'brand.600' }}
              boxShadow="md"
              onClick={handleAvatarClick}
            >
              <Upload size={16} />
            </Box>
          </Box>
          <Text fontSize="sm" color="fg.muted">
            {t('clickToUploadAvatar')}
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
          <Input {...register('name')} placeholder={t('enterName')} />
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
            placeholder={t('enterPhone')}
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
              <VSelect
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
              >
                <option value="">{common('selectGender')}</option>
                <option value="MALE">{common('male')}</option>
                <option value="FEMALE">{common('female')}</option>
                <option value="OTHER">{common('other')}</option>
              </VSelect>
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
              <VSelect
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
              </VSelect>
            )}
          />
          <Field.ErrorText color="fg.error">
            {errors.level?.message}
          </Field.ErrorText>
        </Field.Root>

        {/* Level Description */}
        <Field.Root invalid={!!errors.levelDescription}>
          <Field.Label>{t('levelDescription')}</Field.Label>
          <Textarea
            {...register('levelDescription')}
            placeholder={t('describeLevelPlaceholder')}
            rows={3}
          />
          <Field.ErrorText color="fg.error">
            {errors.levelDescription?.message}
          </Field.ErrorText>
        </Field.Root>

        {/* Change Password Button */}
        <Box borderTop="1px solid" borderColor="border" pt={4}>
          <Button
            variant="outline"
            w="full"
            onClick={() => setIsChangePasswordOpen(true)}
            gap={2}
          >
            <Lock size={16} />
            {t('changePassword')}
          </Button>
        </Box>
      </VStack>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </VModal>
  );
}
