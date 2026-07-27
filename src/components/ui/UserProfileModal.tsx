'use client';
import { Input } from '@/components/ui/Input';

import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Avatar,
  Flex,
  Textarea,
  Field,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { VSelect } from './VSelect';
import { Upload, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VModal } from './VModal';
import ChangePasswordModal from './ChangePasswordModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { AdminService, UpdateUserData } from '@/lib/api/admin.service';
import { Gender, GenderType } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useImageUpload } from '@/hooks/useImageUpload';
import { VALID_LEVELS } from '@/constants/levels';

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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const {
    inputRef: avatarInputRef,
    isUploading: isAvatarUploading,
    progress: avatarProgress,
    openFilePicker: handleAvatarClick,
    handleFileChange: handleAvatarFileChange,
  } = useImageUpload({
    uploader: AdminService.uploadAvatar,
    compression: { maxSizeMB: 1, maxWidthOrHeight: 1200 },
    onSuccess: async (uploaded) => {
      if (!user) return;
      const updatedUser = await AdminService.updateUser(user.id, {
        image: uploaded.url,
        imagePublicId: uploaded.publicId,
      });
      setUser({
        ...user,
        image: updatedUser.image ?? uploaded.url,
        imagePublicId:
          (updatedUser as { imagePublicId?: string }).imagePublicId ??
          uploaded.publicId,
      });
      toaster.create({
        title: common('success'),
        description: t('avatarUpdatedSuccessfully'),
        type: 'success',
      });
    },
    onError: () => {
      toaster.create({
        title: common('error'),
        description: t('failedToUploadAvatar'),
        type: 'error',
      });
    },
  });

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
                {VALID_LEVELS.map((level) => (
                  <option key={level} value={String(level)}>
                    {common(`levels.${level}`)}
                  </option>
                ))}
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
