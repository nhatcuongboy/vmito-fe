'use client';

import { VStack, Field } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VModal } from './VModal';
import { PasswordInput } from './password-input';
import { useAuthStore } from '@/stores/useAuthStore';
import { AdminService, UpdateUserData } from '@/lib/api/admin.service';
import { toaster } from '@/components/ui/toaster';

const changePasswordSchema = z
  .object({
    password: z.string().min(6, 'passwordTooShort'),
    confirmPassword: z.string().min(1, 'passwordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const { user } = useAuthStore();
  const common = useTranslations('common');
  const t = useTranslations('common.profileModal');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const getErrorMessage = (errorMsg?: string) => {
    if (!errorMsg) return undefined;
    // Map zod error keys to i18n translations
    if (errorMsg === 'passwordTooShort') return t('passwordTooShort');
    if (errorMsg === 'passwordsDoNotMatch') return t('passwordsDoNotMatch');
    if (errorMsg === 'passwordRequired') return t('passwordRequired');
    return errorMsg;
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!user) return;

    try {
      await AdminService.updateUser(user.id, {
        password: data.password,
      } as UpdateUserData);

      toaster.create({
        title: common('success'),
        description: t('passwordChangedSuccessfully'),
        type: 'success',
      });

      reset();
      onClose();
    } catch (error) {
      console.error('Failed to change password:', error);
      toaster.create({
        title: common('error'),
        description: t('failedToChangePassword'),
        type: 'error',
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('changePassword')}
      size="md"
      primaryActionText={common('save')}
      onPrimaryAction={handleSubmit(onSubmit)}
      isPrimaryLoading={isSubmitting}
      secondaryActionText={common('cancel')}
      isCentered={true}
    >
      <VStack gap={4} align="stretch">
        <Field.Root invalid={!!errors.password} required>
          <Field.Label>{t('newPassword')}</Field.Label>
          <PasswordInput
            {...register('password')}
            placeholder={t('newPasswordPlaceholder')}
          />
          <Field.ErrorText color="fg.error">
            {getErrorMessage(errors.password?.message)}
          </Field.ErrorText>
        </Field.Root>

        <Field.Root invalid={!!errors.confirmPassword} required>
          <Field.Label>{t('confirmPassword')}</Field.Label>
          <PasswordInput
            {...register('confirmPassword')}
            placeholder={t('confirmPasswordPlaceholder')}
          />
          <Field.ErrorText color="fg.error">
            {getErrorMessage(errors.confirmPassword?.message)}
          </Field.ErrorText>
        </Field.Root>
      </VStack>
    </VModal>
  );
};

export default ChangePasswordModal;
