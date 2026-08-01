'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog';
import { toaster } from '@/components/ui/toaster';
import { IBackfillResult, RankingService } from '@/lib/api/ranking.service';

interface PointsBackfillCardProps {
  onCompleted: () => void;
}

export function PointsBackfillCard({ onCompleted }: PointsBackfillCardProps) {
  const t = useTranslations('admin.points');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<IBackfillResult | null>(null);

  const handleConfirm = async () => {
    try {
      setIsRunning(true);
      const res = await RankingService.runBackfill();
      setResult(res);
      setIsConfirmOpen(false);
      toaster.success({
        title: t('backfill.success'),
        description: t('backfill.successDetail', {
          inserted: res.inserted,
          users: res.usersUpdated,
        }),
      });
      onCompleted();
    } catch (error) {
      console.error('Points backfill failed:', error);
      toaster.error({ title: t('backfill.error') });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="md"
            bg="orange.100"
            _dark={{ bg: 'orange.900/30' }}
            color="orange.600"
          >
            <RefreshCcw size={18} />
          </Box>
          <Box>
            <Heading size="md">{t('backfill.title')}</Heading>
            <Text fontSize="sm" color="gray.500">
              {t('backfill.description')}
            </Text>
          </Box>
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Text fontSize="xs" color="gray.500">
            {t('backfill.hint')}
          </Text>

          <Box>
            <Button
              colorPalette="orange"
              loading={isRunning}
              onClick={() => setIsConfirmOpen(true)}
            >
              {t('backfill.run')}
            </Button>
          </Box>

          {result && (
            <SimpleGrid
              columns={3}
              gap={4}
              p={3}
              borderRadius="md"
              borderWidth="1px"
              borderColor="border.subtle"
            >
              <ResultStat
                label={t('backfill.candidates')}
                value={result.candidates}
              />
              <ResultStat
                label={t('backfill.inserted')}
                value={result.inserted}
                color="green.600"
              />
              <ResultStat
                label={t('backfill.usersUpdated')}
                value={result.usersUpdated}
              />
            </SimpleGrid>
          )}
        </VStack>
      </Card.Body>

      <AppConfirmDialog
        isOpen={isConfirmOpen}
        title={t('backfill.confirmTitle')}
        body={t('backfill.confirmBody')}
        confirmLabel={t('backfill.run')}
        cancelLabel={t('backfill.cancel')}
        colorPalette="green"
        isLoading={isRunning}
        onConfirm={handleConfirm}
        onClose={() => setIsConfirmOpen(false)}
      />
    </Card.Root>
  );
}

const ResultStat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) => (
  <Box>
    <Text fontSize="xs" color="gray.500">
      {label}
    </Text>
    <Text fontSize="xl" fontWeight="bold" color={color} lineHeight="1.3">
      {value}
    </Text>
  </Box>
);
