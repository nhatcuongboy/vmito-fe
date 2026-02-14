'use client';

import { VModal } from '@/components/ui/VModal';
import { Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnUrl?: string;
}

const LoginPromptModal = ({
  isOpen,
  onClose,
  returnUrl,
}: LoginPromptModalProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const handleLogin = () => {
    const redirectUrl = returnUrl || '/';
    router.push(`/auth/signin?returnUrl=${encodeURIComponent(redirectUrl)}`);
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('loginRequired')}
      primaryActionText={tCommon('login')}
      secondaryActionText={tCommon('cancel')}
      onPrimaryAction={handleLogin}
      primaryColorScheme="blue"
    >
      <Text>{t('loginRequiredDescription')}</Text>
    </VModal>
  );
};

export default LoginPromptModal;
