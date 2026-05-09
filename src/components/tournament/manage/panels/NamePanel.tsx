'use client';

import { Box, Flex, Heading, Text, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { useState } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';

interface NamePanelProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

export default function NamePanel({
  tournament,
  onTournamentUpdate,
}: NamePanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.name');
  const [name, setName] = useState(tournament.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toaster.error({ title: t('errors.nameRequired') });
      return;
    }

    if (name === tournament.name) {
      toaster.info({ title: t('errors.noChanges') });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await TournamentService.updateTournament(tournament.id, {
        name: name.trim(),
      });
      onTournamentUpdate?.(updated);
      toaster.success({ title: t('success') });
    } catch (error) {
      toaster.error({ title: t('errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = name !== tournament.name;

  return (
    <Box>
      <Heading size="md" mb={2}>
        {t('title')}
      </Heading>
      <Text color="gray.600" mb={6}>
        {t('description')}
      </Text>

      <form onSubmit={handleSubmit}>
        <Field label={t('nameLabel')} required mb={6}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            maxLength={100}
            disabled={isSubmitting}
          />
        </Field>

        <Flex justify="flex-end" gap={3}>
          <Button
            variant="outline"
            onClick={() => setName(tournament.name)}
            disabled={!hasChanges || isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
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
