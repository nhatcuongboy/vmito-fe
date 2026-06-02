'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Tournament, EImageCategory } from '@/lib/api/types';
import { useState } from 'react';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';

interface BannerPanelProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

export default function BannerPanel({
  tournament,
  onTournamentUpdate,
}: BannerPanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.banner');
  const [coverPhoto, setCoverPhoto] = useState<string>(
    tournament.coverPhoto ?? ''
  );
  const [coverPhotoPublicId, setCoverPhotoPublicId] = useState<string>(
    tournament.coverPhotoPublicId ?? ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = ({
    url,
    publicId,
  }: {
    url: string;
    publicId?: string;
  }) => {
    setCoverPhoto(url);
    setCoverPhotoPublicId(publicId ?? '');
  };

  const handleClear = () => {
    setCoverPhoto('');
    setCoverPhotoPublicId('');
  };

  const hasChanges =
    coverPhoto !== (tournament.coverPhoto ?? '') ||
    coverPhotoPublicId !== (tournament.coverPhotoPublicId ?? '');

  const handleSubmit = async () => {
    if (!hasChanges) {
      toaster.info({ title: t('errors.noChanges') });
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await TournamentService.updateTournament(tournament.id, {
        coverPhoto: coverPhoto || undefined,
        coverPhotoPublicId: coverPhotoPublicId || undefined,
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

      <AppSingleImageUpload
        value={coverPhoto || undefined}
        publicId={coverPhotoPublicId || undefined}
        onChange={handleImageChange}
        onClear={handleClear}
        category={EImageCategory.SESSION_COVER}
        alt={t('currentBanner')}
        uploadText="Tải ảnh bìa mới"
        emptyTitle={t('noBanner')}
      />

      <Flex justify="flex-end" gap={3} mt={6}>
        <Button
          variant="outline"
          onClick={() => {
            setCoverPhoto(tournament.coverPhoto ?? '');
            setCoverPhotoPublicId(tournament.coverPhotoPublicId ?? '');
          }}
          disabled={!hasChanges || isSubmitting}
        >
          {t('cancel')}
        </Button>
        <Button
          colorPalette="blue"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!hasChanges}
        >
          {t('save')}
        </Button>
      </Flex>
    </Box>
  );
}
