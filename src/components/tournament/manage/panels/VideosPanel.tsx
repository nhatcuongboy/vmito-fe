'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { Tournament } from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import { getYouTubeEmbed, normalizeYouTubeUrls } from '@/lib/utils/youtube';

interface VideosPanelProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

export default function VideosPanel({
  tournament,
  onTournamentUpdate,
}: VideosPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.videos');
  const originalUrls = useMemo(
    () => tournament.youtubeVideoUrls ?? [],
    [tournament.youtubeVideoUrls]
  );
  const [urls, setUrls] = useState<string[]>(
    originalUrls.length > 0 ? originalUrls : ['']
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedUrls = useMemo(() => normalizeYouTubeUrls(urls), [urls]);
  const filledUrls = urls.map((url) => url.trim()).filter(Boolean);
  const invalidCount = filledUrls.filter((url) => !getYouTubeEmbed(url)).length;
  const hasChanges =
    JSON.stringify(normalizedUrls) !==
    JSON.stringify(normalizeYouTubeUrls(originalUrls));

  const handleChange = (index: number, value: string) => {
    setUrls((current) =>
      current.map((url, currentIndex) => (currentIndex === index ? value : url))
    );
  };

  const handleAdd = () => {
    setUrls((current) => [...current, '']);
  };

  const handleRemove = (index: number) => {
    setUrls((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const handleReset = () => {
    setUrls(originalUrls.length > 0 ? originalUrls : ['']);
  };

  const handleSubmit = async () => {
    if (invalidCount > 0) {
      toaster.error({ title: t('errors.invalidUrl') });
      return;
    }

    if (!hasChanges) {
      toaster.info({ title: t('errors.noChanges') });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await TournamentService.updateTournament(tournament.id, {
        youtubeVideoUrls: normalizedUrls,
      });
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
      <Text color="gray.600" mb={6}>
        {t('description')}
      </Text>

      <VStack align="stretch" gap={3}>
        {urls.map((url, index) => {
          const trimmedUrl = url.trim();
          const isInvalid = !!trimmedUrl && !getYouTubeEmbed(trimmedUrl);

          return (
            <HStack key={index} align="flex-start" gap={2}>
              <Box flex="1">
                <Input
                  value={url}
                  placeholder={t('placeholder')}
                  onChange={(event) => handleChange(index, event.target.value)}
                  borderColor={isInvalid ? 'red.400' : undefined}
                />
                {isInvalid ? (
                  <Text mt={1} fontSize="xs" color="red.500">
                    {t('invalidHelper')}
                  </Text>
                ) : null}
              </Box>
              <IconButton
                aria-label={t('remove')}
                variant="ghost"
                colorPalette="red"
                onClick={() => handleRemove(index)}
              >
                <Trash2 size={16} />
              </IconButton>
            </HStack>
          );
        })}
      </VStack>

      <Button mt={4} variant="outline" onClick={handleAdd}>
        <Plus size={16} />
        {t('add')}
      </Button>

      <Flex justify="flex-end" gap={3} mt={6}>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || isSubmitting}
        >
          {t('cancel')}
        </Button>
        <Button
          colorPalette="blue"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!hasChanges || invalidCount > 0}
        >
          {t('save')}
        </Button>
      </Flex>
    </Box>
  );
}
