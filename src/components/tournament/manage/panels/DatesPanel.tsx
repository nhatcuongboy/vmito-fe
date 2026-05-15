'use client';

import { Box, Flex, Heading, Text, Input, Grid } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { useState } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';
import { Calendar } from 'lucide-react';

interface DatesPanelProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

export default function DatesPanel({
  tournament,
  onTournamentUpdate,
}: DatesPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.dates');

  // Format dates for input (YYYY-MM-DD)
  const formatDateForInput = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(
    formatDateForInput(tournament.startDate)
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(tournament.endDate)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toaster.error({ title: t('errors.datesRequired') });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      toaster.error({ title: t('errors.endBeforeStart') });
      return;
    }

    // Check if dates changed
    const originalStart = formatDateForInput(tournament.startDate);
    const originalEnd = formatDateForInput(tournament.endDate);
    if (startDate === originalStart && endDate === originalEnd) {
      toaster.info({ title: t('errors.noChanges') });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await TournamentService.updateTournament(tournament.id, {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      onTournamentUpdate?.(updated);
      toaster.success({ title: t('success') });
    } catch {
      toaster.error({ title: t('errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges =
    startDate !== formatDateForInput(tournament.startDate) ||
    endDate !== formatDateForInput(tournament.endDate);

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Box>
      <Heading size="md" mb={2}>
        {t('title')}
      </Heading>
      <Text color="gray.600" mb={6}>
        {t('description')}
      </Text>

      <form onSubmit={handleSubmit}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} mb={6}>
          <Field label={t('startDateLabel')} required>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
            />
            {startDate && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {formatDisplayDate(startDate)}
              </Text>
            )}
          </Field>

          <Field label={t('endDateLabel')} required>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              disabled={isSubmitting}
            />
            {endDate && (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {formatDisplayDate(endDate)}
              </Text>
            )}
          </Field>
        </Grid>

        {/* Date Range Preview */}
        <Box
          p={4}
          bg="gray.50"
          borderRadius="md"
          mb={6}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Calendar size={20} />
          <Text fontWeight="medium">
            {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
          </Text>
        </Box>

        <Flex justify="flex-end" gap={3}>
          <Button
            variant="outline"
            onClick={() => {
              setStartDate(formatDateForInput(tournament.startDate));
              setEndDate(formatDateForInput(tournament.endDate));
            }}
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
