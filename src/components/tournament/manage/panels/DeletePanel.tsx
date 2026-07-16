'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, Heading, Text, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { toaster } from '@/components/ui/toaster';
import { Field } from '@/components/ui/Field';
import { ROUTES } from '@/constants/routes';

interface DeletePanelProps {
  tournament: Tournament;
}

export default function DeletePanel({ tournament }: DeletePanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage.panels.delete');
  const router = useRouter();
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isValid = confirmName.trim() === tournament.name.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      setIsDeleting(true);
      await TournamentService.deleteTournament(tournament.id);
      toaster.success({ title: t('success') });
      router.push(ROUTES.HOST.TOURNAMENTS.LIST);
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      toaster.error({ title: t('error') });
    } finally {
      setIsDeleting(false);
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

      <form onSubmit={handleDelete}>
        <Flex direction="column" gap={6}>
          <Box
            p={4}
            bg="red.50"
            borderWidth="1px"
            borderColor="red.200"
            borderRadius="lg"
            _dark={{ bg: 'red.950/20', borderColor: 'red.900/50' }}
          >
            <Flex gap={3} align="flex-start">
              <AlertTriangle size={20} color="var(--chakra-colors-red-600)" />
              <Box>
                <Text
                  fontWeight="semibold"
                  color="red.800"
                  _dark={{ color: 'red.300' }}
                  mb={1}
                >
                  {t('warningTitle')}
                </Text>
                <Text
                  fontSize="sm"
                  color="red.700"
                  _dark={{ color: 'red.400' }}
                >
                  {t('warningText')}
                </Text>
              </Box>
            </Flex>
          </Box>

          <Field label={t('instruction', { name: tournament.name })} required>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={t('placeholder')}
              disabled={isDeleting}
            />
          </Field>

          <Flex justify="flex-end">
            <Button
              type="submit"
              colorPalette="red"
              disabled={!isValid || isDeleting}
              loading={isDeleting}
            >
              {t('button')}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}
