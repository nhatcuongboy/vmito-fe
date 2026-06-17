'use client';

import { useState } from 'react';
import { Box, Heading, Text, Flex, VStack } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Radio } from '@/components/ui/radio';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';

interface VisibilityPanelProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

export default function VisibilityPanel({
  tournament,
  onTournamentUpdate,
}: VisibilityPanelProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.panels.visibility'
  );

  const [visibility, setVisibility] = useState(
    tournament.isPublished ? 'public' : 'private'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges =
    (visibility === 'public' && !tournament.isPublished) ||
    (visibility === 'private' && tournament.isPublished);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      toaster.info({ title: t('errors.noChanges') });
      return;
    }

    try {
      setIsSubmitting(true);
      let updated: Tournament;

      if (visibility === 'public') {
        updated = await TournamentService.publishTournament(tournament.id);
      } else {
        updated = await TournamentService.unpublishTournament(tournament.id);
      }

      onTournamentUpdate?.(updated);
      toaster.success({ title: t('success') });
    } catch {
      toaster.error({ title: t('errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setVisibility(tournament.isPublished ? 'public' : 'private');
  };

  return (
    <Box>
      <Heading size="md" mb={2}>
        {t('title')}
      </Heading>
      <Text color="gray.600" mb={6} _dark={{ color: 'gray.300' }}>
        {t('description')}
      </Text>

      <form onSubmit={handleSubmit}>
        <Radio.Root
          value={visibility}
          onValueChange={(details) => {
            if (details.value) setVisibility(details.value);
          }}
          mb={8}
        >
          <VStack align="stretch" gap={4}>
            <Radio.Item
              value="public"
              cursor="pointer"
              disabled={isSubmitting}
              alignItems="flex-start"
            >
              <VStack align="start" gap={1} ml={1} mt={-0.5}>
                <Text fontWeight="medium" fontSize="md">
                  {t('publicLabel')}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {t('publicHelp')}
                </Text>
              </VStack>
            </Radio.Item>

            <Radio.Item
              value="private"
              cursor="pointer"
              disabled={isSubmitting}
              alignItems="flex-start"
            >
              <VStack align="start" gap={1} ml={1} mt={-0.5}>
                <Text fontWeight="medium" fontSize="md">
                  {t('privateLabel')}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {t('privateHelp')}
                </Text>
              </VStack>
            </Radio.Item>
          </VStack>
        </Radio.Root>

        <Flex justify="flex-end" gap={3}>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!hasChanges || isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            colorPalette="green"
            disabled={!hasChanges || isSubmitting}
            loading={isSubmitting}
          >
            {t('save')}
          </Button>
        </Flex>
      </form>
    </Box>
  );
}
