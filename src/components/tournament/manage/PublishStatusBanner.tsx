'use client';

import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { VModal, useModal } from '@/components/ui/VModal';

interface PublishStatusBannerProps {
  tournament: Tournament;
  onUpdate: (updated: Tournament) => void;
}

export default function PublishStatusBanner({
  tournament,
  onUpdate,
}: PublishStatusBannerProps) {
  const t = useTranslations('pages.tournaments.detail.manage.publishBanner');
  const confirmModal = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const isPublished = tournament.isPublished;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const updated = isPublished
        ? await TournamentService.unpublishTournament(tournament.id)
        : await TournamentService.publishTournament(tournament.id);
      onUpdate(updated);
      confirmModal.onClose();
    } catch (error) {
      console.error('Error updating publish status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Box
        as="button"
        w="full"
        textAlign="left"
        bg={isPublished ? 'green.50' : 'gray.50'}
        borderWidth="1px"
        borderColor={isPublished ? 'green.200' : 'gray.200'}
        borderRadius="xl"
        px={4}
        py={3}
        cursor="pointer"
        _hover={{ opacity: 0.85 }}
        _dark={{
          bg: isPublished ? 'green.900' : 'gray.800',
          borderColor: isPublished ? 'green.700' : 'gray.700',
        }}
        transition="opacity 0.15s"
        onClick={confirmModal.onOpen}
      >
        <Flex align="center" gap={2.5}>
          <Box
            w="8px"
            h="8px"
            borderRadius="full"
            bg={isPublished ? 'green.500' : 'gray.400'}
            flexShrink={0}
          />
          <Box>
            <Text
              fontWeight="semibold"
              fontSize="sm"
              color={isPublished ? 'green.800' : 'gray.700'}
              _dark={{ color: isPublished ? 'green.100' : 'gray.100' }}
            >
              {isPublished ? t('publishedTitle') : t('draftTitle')}
            </Text>
            <Text
              fontSize="xs"
              color={isPublished ? 'green.600' : 'gray.500'}
              mt={0.5}
              _dark={{ color: isPublished ? 'green.300' : 'gray.400' }}
            >
              {isPublished ? t('publishedSubtitle') : t('draftSubtitle')}
            </Text>
          </Box>
        </Flex>
      </Box>

      <VModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        isCentered
        size="sm"
        primaryActionText={
          isPublished ? t('confirmDraftButton') : t('confirmPublishButton')
        }
        onPrimaryAction={handleConfirm}
        isPrimaryLoading={isLoading}
        secondaryActionText={t('cancel')}
        showCloseButton={false}
      >
        <Flex direction="column" align="center" gap={4} py={2}>
          <Flex
            w="56px"
            h="56px"
            bg="gray.100"
            borderRadius="xl"
            align="center"
            justify="center"
            _dark={{ bg: 'gray.700' }}
          >
            <FileText size={28} color="var(--chakra-colors-gray-600)" />
          </Flex>
          <Box textAlign="center">
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              {isPublished ? t('confirmDraftTitle') : t('confirmPublishTitle')}
            </Text>
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {isPublished
                ? t('confirmDraftDescription')
                : t('confirmPublishDescription')}
            </Text>
          </Box>
        </Flex>
      </VModal>
    </>
  );
}
