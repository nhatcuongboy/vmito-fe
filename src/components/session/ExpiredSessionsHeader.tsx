'use client';

import { Flex, Text } from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { VButton } from '@/components/ui/VButton';
import { VModal } from '@/components/ui/VModal';

interface ExpiredSessionsHeaderProps {
  expiredCount: number;
  onDeleteAll: () => Promise<void>;
}

export function ExpiredSessionsHeader({
  expiredCount,
  onDeleteAll,
}: ExpiredSessionsHeaderProps) {
  const t = useTranslations('session');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAll();
      setIsModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (expiredCount === 0) return null;

  return (
    <>
      <Flex
        mb={6}
        p={4}
        bg="orange.50"
        borderWidth="1px"
        borderColor="orange.200"
        borderRadius="lg"
        alignItems="center"
        justifyContent="space-between"
        _dark={{ bg: 'orange.900', borderColor: 'orange.700' }}
      >
        <Text
          fontSize="sm"
          color="orange.700"
          fontWeight="medium"
          _dark={{ color: 'orange.200' }}
        >
          ⚠️ {expiredCount} {t('sessions') || 'kèo'}{' '}
          {t('expiredSessionsNeedAction') || 'cần xử lý'}
        </Text>
        <VButton
          size="sm"
          colorPalette="red"
          variant="outline"
          leftIcon={<Trash2 size={16} />}
          onClick={() => setIsModalOpen(true)}
        >
          {t('deleteAllExpired') || 'Xóa tất cả'}
        </VButton>
      </Flex>

      <VModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('deleteAllExpired') || 'Xóa tất cả kèo quá hạn'}
        primaryActionText={t('delete') || 'Xóa'}
        onPrimaryAction={handleDelete}
        isPrimaryLoading={isDeleting}
        primaryColorScheme="red"
      >
        <Text>
          {t('batchDeleteConfirmText') ||
            'Bạn có chắc chắn muốn XÓA tất cả các kèo quá hạn không? Hành động này không thể hoàn tác.'}{' '}
          ({expiredCount} {t('sessions') || 'kèo'})
        </Text>
      </VModal>
    </>
  );
}
