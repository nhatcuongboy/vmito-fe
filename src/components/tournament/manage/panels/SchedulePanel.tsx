'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Flex, Heading, Text, Badge } from '@chakra-ui/react';
import { VStack, Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { useModal } from '@/components/ui/VModal';
import { ArrowLeftRight, Settings } from 'lucide-react';
import {
  Category,
  Tournament,
  CategoryMatch,
  ScheduleType,
} from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import ScheduleTypeModal from './schedule/ScheduleTypeModal';
import ManageScheduleModal from './schedule/ManageScheduleModal';

interface SchedulePanelProps {
  categories: Category[];
  tournament: Tournament;
}

export default function SchedulePanel({
  categories,
  tournament,
}: SchedulePanelProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  const [allMatches, setAllMatches] = useState<CategoryMatch[]>([]);
  const [scheduleType, setScheduleType] = useState<ScheduleType | undefined>(
    tournament.scheduleType
  );
  const typeModal = useModal();
  const manageModal = useModal();

  // Fetch matches to get real scheduled count
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matches = await TournamentService.getAllMatches(tournament.id);
        setAllMatches(matches);
      } catch {
        // fall back to category-level counts
      }
    };
    fetchMatches();
  }, [tournament.id]);

  const totalMatches =
    allMatches.length > 0
      ? allMatches.length
      : categories.reduce((sum, cat) => sum + (cat._count?.matches || 0), 0);
  const scheduledMatches = allMatches.filter(
    (m) => m.startTime && m.courtId
  ).length;
  const unscheduledMatches = totalMatches - scheduledMatches;
  const progress =
    totalMatches > 0 ? (scheduledMatches / totalMatches) * 100 : 0;
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (progress / 100) * circumference;

  const handleTypeChange = useCallback(
    async (type: ScheduleType) => {
      setScheduleType(type);
      try {
        await TournamentService.updateScheduleType(tournament.id, type);
      } catch {
        // revert on failure
        setScheduleType(tournament.scheduleType);
      }
    },
    [tournament.id, tournament.scheduleType]
  );

  const handleScheduleSaved = useCallback(async () => {
    try {
      const matches = await TournamentService.getAllMatches(tournament.id);
      setAllMatches(matches);
    } catch {
      // ignore
    }
  }, [tournament.id]);

  const scheduleTypeLabel =
    scheduleType === ScheduleType.ASSIGNED
      ? t('organize.schedule.scheduleType.assigned.title')
      : t('organize.schedule.scheduleType.nextAvailable.title');

  return (
    <VStack gap={4} align="stretch">
      <Heading size="md">{t('organize.schedule.title')}</Heading>

      {/* Schedule type */}
      <Flex
        align="center"
        justify="space-between"
        p={3}
        bg="gray.50"
        borderRadius="lg"
      >
        <Box>
          <Text fontSize="xs" color="gray.500">
            {t('organize.schedule.scheduleType.label')}
          </Text>
          <Badge colorScheme="gray" mt={1}>
            {scheduleTypeLabel}
          </Badge>
        </Box>
        <Button variant="ghost" size="sm" onClick={typeModal.onOpen}>
          <ArrowLeftRight size={14} />
          {t('organize.schedule.switchType')}
        </Button>
      </Flex>

      {/* Circular progress */}
      <Flex direction="column" align="center" py={4} gap={3}>
        <Box position="relative" w="100px" h="100px">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#38A169"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 0.3s' }}
            />
          </svg>
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            align="center"
            justify="center"
          >
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {scheduledMatches} / {totalMatches}
            </Text>
          </Flex>
        </Box>
      </Flex>

      {/* Stats */}
      <VStack gap={2} align="stretch">
        <Flex align="center" gap={2}>
          <Box w="8px" h="8px" borderRadius="full" bg="green.400" />
          <Text fontSize="sm">
            {scheduledMatches} {t('organize.schedule.scheduledMatches')}
          </Text>
        </Flex>
        <Flex align="center" gap={2}>
          <Box w="8px" h="8px" borderRadius="full" bg="gray.300" />
          <Text fontSize="sm" color="gray.500">
            {unscheduledMatches} {t('organize.schedule.unscheduledMatches')}
          </Text>
        </Flex>
      </VStack>

      {/* Manage schedule button */}
      <Button bg="gray.800" color="white" w="100%" onClick={manageModal.onOpen}>
        <Settings size={16} />
        {t('organize.schedule.manageSchedule')}
      </Button>

      {/* Schedule Type Modal */}
      <ScheduleTypeModal
        isOpen={typeModal.isOpen}
        onClose={typeModal.onClose}
        currentType={scheduleType}
        onConfirm={handleTypeChange}
      />

      {/* Manage Schedule Modal */}
      <ManageScheduleModal
        isOpen={manageModal.isOpen}
        onClose={manageModal.onClose}
        tournament={tournament}
        categories={categories}
        onScheduleSaved={handleScheduleSaved}
      />
    </VStack>
  );
}
