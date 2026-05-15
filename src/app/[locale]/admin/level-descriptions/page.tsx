'use client';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { VALID_LEVELS } from '@/constants/levels';
import { useRouter } from '@/i18n/config';
import { LevelDescriptionService } from '@/lib/api/level-description.service';
import { LevelDescription, UserRole } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Badge,
  Box,
  Card,
  Container,
  Heading,
  HStack,
  Separator,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Award, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { setLevelDescriptionsCache } from '@/hooks/useLevelDescriptions';

export default function AdminLevelDescriptionsPage() {
  const t = useTranslations('admin');
  const common = useTranslations('common');
  const levelText = useTranslations('common.levelDescriptions');
  const router = useRouter();
  const { isAuthenticated, isHydrated, user: currentUser } = useAuthStore();
  const { getLevelLabel, getLevelShortLabel } = useLevelLabel();
  const [descriptions, setDescriptions] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const normalizedDescriptions = useMemo(
    () =>
      VALID_LEVELS.map((level) => ({
        level,
        description: descriptions[level]?.trim() || '',
      })),
    [descriptions]
  );

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('accessDenied') });
      router.replace('/dashboard');
    }
  }, [isHydrated, isAuthenticated, currentUser, router, t]);

  useEffect(() => {
    if (!isHydrated || currentUser?.role !== UserRole.ADMIN) return;

    const loadDescriptions = async () => {
      try {
        setIsLoading(true);
        const data = await LevelDescriptionService.getLevelDescriptions();
        setDescriptions(
          Object.fromEntries(
            data.map((item) => [item.level, item.description || ''])
          )
        );
      } catch (error) {
        console.error('Failed to load level descriptions:', error);
        toaster.error({ title: levelText('loadFailed') });
      } finally {
        setIsLoading(false);
      }
    };

    loadDescriptions();
  }, [currentUser?.role, isHydrated, levelText]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await LevelDescriptionService.updateLevelDescriptions({
        descriptions: normalizedDescriptions,
      });
      setDescriptions(
        Object.fromEntries(
          updated.map((item: LevelDescription) => [
            item.level,
            item.description || '',
          ])
        )
      );
      setLevelDescriptionsCache(updated);
      toaster.success({ title: levelText('saveSuccess') });
    } catch (error) {
      console.error('Failed to save level descriptions:', error);
      toaster.error({ title: levelText('saveFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isHydrated || !currentUser || currentUser.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <MainLayout title={t('levelDescriptions')}>
      <Container maxW="container.lg" py={8}>
        <VStack gap={8} align="stretch">
          <HStack gap={3}>
            <Box
              p={3}
              borderRadius="lg"
              bg="green.100"
              _dark={{ bg: 'green.900/30' }}
              color="green.600"
            >
              <Award size={24} />
            </Box>
            <Box>
              <Heading size="lg">{t('levelDescriptions')}</Heading>
              <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                {levelText('adminDescription')}
              </Text>
            </Box>
          </HStack>

          <Separator />

          <Card.Root>
            <Card.Header>
              <HStack justify="space-between" align="start" gap={4}>
                <Box>
                  <Heading size="md">{levelText('title')}</Heading>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {levelText('adminHint')}
                  </Text>
                </Box>
                <Button
                  colorPalette="green"
                  onClick={handleSave}
                  disabled={isLoading || isSaving}
                  loading={isSaving}
                  leftIcon={<Save size={16} />}
                >
                  {levelText('save')}
                </Button>
              </HStack>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <HStack justify="center" py={10}>
                  <Spinner size="sm" />
                  <Text color="fg.muted">{common('loading')}</Text>
                </HStack>
              ) : (
                <VStack gap={4} align="stretch">
                  {VALID_LEVELS.map((level) => {
                    const levelColor = getSkillLevelColor([level]);

                    return (
                      <Box
                        key={level}
                        borderWidth="1px"
                        borderColor="border"
                        borderRadius="md"
                        p={4}
                      >
                        <HStack gap={2} mb={3}>
                          <Badge
                            colorPalette={levelColor.colorPalette}
                            variant="solid"
                            borderRadius="full"
                            px={2.5}
                            py={0.5}
                            borderWidth="1px"
                            borderColor={levelColor.borderColor}
                          >
                            {getLevelShortLabel(level)}
                          </Badge>
                          <Text fontWeight="semibold">
                            {getLevelLabel(level)}
                          </Text>
                        </HStack>
                        <Textarea
                          value={descriptions[level] || ''}
                          onChange={(event) =>
                            setDescriptions((current) => ({
                              ...current,
                              [level]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder={levelText('placeholder')}
                        />
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </MainLayout>
  );
}
