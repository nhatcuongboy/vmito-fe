'use client';

import { Box, Flex, Heading, Text, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { useState } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';

interface ContactPanelProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ContactPanel({
  tournament,
  onTournamentUpdate,
}: ContactPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.contact');
  const initialName = tournament.contactName ?? '';
  const initialEmail = tournament.contactEmail ?? '';
  const initialPhone = tournament.contactPhone ?? '';

  const [contactName, setContactName] = useState(initialName);
  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [contactPhone, setContactPhone] = useState(initialPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges =
    contactName.trim() !== initialName.trim() ||
    contactEmail.trim() !== initialEmail.trim() ||
    contactPhone.trim() !== initialPhone.trim();

  const handleReset = () => {
    setContactName(initialName);
    setContactEmail(initialEmail);
    setContactPhone(initialPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      toaster.info({ title: t('errors.noChanges') });
      return;
    }

    const trimmedEmail = contactEmail.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      toaster.error({ title: t('errors.invalidEmail') });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await TournamentService.updateTournament(tournament.id, {
        contactName: contactName.trim() || null,
        contactEmail: trimmedEmail || null,
        contactPhone: contactPhone.trim() || null,
      } as Partial<Tournament>);
      onTournamentUpdate?.(updated);
      toaster.success({ title: t('success') });
    } catch {
      toaster.error({ title: t('errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
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
        <Field label={t('nameLabel')} mb={4}>
          <Input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder={t('namePlaceholder')}
            maxLength={100}
            disabled={isSubmitting}
          />
        </Field>

        <Field label={t('emailLabel')} mb={4}>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            maxLength={150}
            disabled={isSubmitting}
          />
        </Field>

        <Field label={t('phoneLabel')} mb={6}>
          <Input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder={t('phonePlaceholder')}
            maxLength={30}
            disabled={isSubmitting}
          />
        </Field>

        <Flex justify="flex-end" gap={3}>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            colorScheme="green"
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
