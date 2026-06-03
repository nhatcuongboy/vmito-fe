'use client';

import { useMemo } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CategoryMatch, TournamentCourt, Category } from '@/lib/api/types';
import { getMatchDisplayCode } from '@/lib/tournament/codes';

const CATEGORY_COLORS = [
  '#ECC94B',
  '#90CDF4',
  '#68D391',
  '#B794F4',
  '#FBB6CE',
  '#FBD38D',
  '#76E4F7',
  '#FEB2B2',
];

const CATEGORY_BG_COLORS = [
  '#FEFCBF',
  '#BEE3F8',
  '#C6F6D5',
  '#E9D8FD',
  '#FED7E2',
  '#FEEBC8',
  '#C4F1F9',
  '#FED7D7',
];

const ROW_HEIGHT = 80;
const TIME_COL_WIDTH = 60;
const HOUR_START = 7;
const HOUR_END = 22;

interface ScheduleCalendarViewProps {
  matches: CategoryMatch[];
  categories: Category[];
  courts: TournamentCourt[];
  defaultMatchLength: number;
  onMatchMove: (
    matchId: string,
    courtId: string | null,
    startTime: string | null,
    endTime: string | null
  ) => void;
}

const getTeamLabel = (
  match: CategoryMatch,
  position: number,
  t: ReturnType<typeof useTranslations>
): string => {
  const participant = match.participants?.find((p) => p.position === position);
  if (!participant?.categoryRegistration) {
    if (match.round === 'SF' || match.round === 'F') {
      return t('winnerOf', { number: match.matchNumber });
    }
    if (match.round === '3RD') {
      return t('loserOf', { number: match.matchNumber });
    }
    return t('tbd');
  }
  const reg = participant.categoryRegistration;
  if (reg.pair?.members) {
    return (
      reg.pair.name ||
      reg.pair.members.map((m) => m.player?.name || '?').join(' / ')
    );
  }
  return reg.player?.name || t('unknown');
};

const getRoundLabel = (
  match: CategoryMatch,
  t: ReturnType<typeof useTranslations>
): string => {
  if (match.round === 'GROUP' && match.groupId) {
    return t('roundGroup');
  }
  return match.round;
};

function DraggableMatch({
  match,
  categoryIndex,
}: {
  match: CategoryMatch;
  categoryIndex: number;
}) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.list'
  );
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: match.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.7 : 1,
      }
    : {};

  const bgColor = CATEGORY_BG_COLORS[categoryIndex % CATEGORY_BG_COLORS.length];
  const borderColor = CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length];

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      bg={bgColor}
      borderLeftWidth="3px"
      borderLeftColor={borderColor}
      borderRadius="md"
      p={1.5}
      fontSize="xs"
      cursor="grab"
      minH="60px"
      overflow="hidden"
    >
      <Flex justify="space-between" mb={0.5}>
        <Text fontWeight="bold" truncate>
          {getMatchDisplayCode(match)} • {getRoundLabel(match, t)}
        </Text>
        {match.startTime && (
          <Text color="gray.500" flexShrink={0}>
            {formatTimeByDevicePreference(match.startTime)}
          </Text>
        )}
      </Flex>
      <Text truncate>{getTeamLabel(match, 1, t)}</Text>
      <Text truncate>{getTeamLabel(match, 2, t)}</Text>
    </Box>
  );
}

function DroppableCell({
  courtId,
  hour,
  children,
}: {
  courtId: string;
  hour: number;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${courtId}-${hour}`,
    data: { courtId, hour },
  });

  return (
    <Box
      ref={setNodeRef}
      minH={`${ROW_HEIGHT}px`}
      borderBottomWidth="1px"
      borderRightWidth="1px"
      borderColor="gray.100"
      bg={isOver ? 'blue.50' : 'transparent'}
      p={0.5}
      transition="background 0.15s"
    >
      {children}
    </Box>
  );
}

export default function ScheduleCalendarView({
  matches,
  categories,
  courts,
  defaultMatchLength,
  onMatchMove,
}: ScheduleCalendarViewProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.list'
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Category index map
  const categoryIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((c, i) => map.set(c.id, i));
    return map;
  }, [categories]);

  // Split matches into scheduled and unscheduled
  const scheduledMatches = matches.filter((m) => m.startTime && m.courtId);
  const unscheduledMatches = matches.filter((m) => !m.startTime || !m.courtId);

  // Build a map from court+hour to matches
  const matchGrid = useMemo(() => {
    const grid = new Map<string, CategoryMatch[]>();
    for (const match of scheduledMatches) {
      if (!match.startTime || !match.courtId) continue;
      const hour = new Date(match.startTime).getHours();
      const key = `${match.courtId}-${hour}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(match);
    }
    return grid;
  }, [scheduledMatches]);

  // Get unique days from scheduled matches
  const days = useMemo(() => {
    const daySet = new Set<string>();
    for (const match of scheduledMatches) {
      if (match.startTime) {
        const d = new Date(match.startTime);
        daySet.add(
          `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
        );
      }
    }
    return Array.from(daySet).sort();
  }, [scheduledMatches]);

  const hours = Array.from(
    { length: HOUR_END - HOUR_START },
    (_, i) => HOUR_START + i
  );

  const formatHour = (hour: number): string => {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}:00${ampm}`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const matchId = active.id as string;
    const dropId = over.id as string;

    // Dropping on unscheduled panel
    if (dropId === 'unscheduled-panel') {
      onMatchMove(matchId, null, null, null);
      return;
    }

    // Dropping on court-hour cell
    const parts = dropId.split('-');
    if (parts.length >= 2) {
      const courtId = parts.slice(0, -1).join('-');
      const hour = parseInt(parts[parts.length - 1]);
      if (isNaN(hour)) return;

      const day = days[0] || new Date().toISOString().split('T')[0];
      const startTime = new Date(
        `${day}T${hour.toString().padStart(2, '0')}:00:00`
      );
      const endTime = new Date(
        startTime.getTime() + defaultMatchLength * 60000
      );

      onMatchMove(
        matchId,
        courtId,
        startTime.toISOString(),
        endTime.toISOString()
      );
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <Flex h="100%">
        {/* Main calendar area */}
        <Box flex={1} overflow="auto">
          {days.map((day) => (
            <Box key={day} mb={4}>
              {/* Day header */}
              <Box
                bg="orange.50"
                py={2}
                textAlign="center"
                borderRadius="lg"
                mb={2}
              >
                <Text fontSize="sm" fontWeight="semibold">
                  {new Date(day + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </Box>

              {/* Grid */}
              <Box
                display="grid"
                gridTemplateColumns={`${TIME_COL_WIDTH}px repeat(${courts.length}, 1fr)`}
                minW={`${TIME_COL_WIDTH + courts.length * 180}px`}
              >
                {/* Header row */}
                <Box borderBottomWidth="2px" borderColor="gray.200" />
                {courts.map((court) => (
                  <Box
                    key={court.id}
                    borderBottomWidth="2px"
                    borderColor="gray.200"
                    px={2}
                    py={1}
                    textAlign="center"
                  >
                    <Text fontSize="xs" fontWeight="bold" color="gray.500">
                      {court.courtName ||
                        `${t('courtPrefix')} ${court.courtNumber}`}
                    </Text>
                  </Box>
                ))}

                {/* Time rows */}
                {hours.map((hour) => (
                  <>
                    {/* Time label */}
                    <Box
                      key={`time-${hour}`}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      pr={2}
                      pt={1}
                      textAlign="right"
                      minH={`${ROW_HEIGHT}px`}
                    >
                      <Text fontSize="xs" color="gray.400">
                        {formatHour(hour)}
                      </Text>
                    </Box>

                    {/* Court cells */}
                    {courts.map((court) => {
                      const key = `${court.id}-${hour}`;
                      const cellMatches = matchGrid.get(key) || [];
                      return (
                        <DroppableCell key={key} courtId={court.id} hour={hour}>
                          <VStack gap={1} align="stretch">
                            {cellMatches.map((match) => (
                              <DraggableMatch
                                key={match.id}
                                match={match}
                                categoryIndex={
                                  categoryIndexMap.get(match.categoryId) || 0
                                }
                              />
                            ))}
                          </VStack>
                        </DroppableCell>
                      );
                    })}
                  </>
                ))}
              </Box>
            </Box>
          ))}

          {days.length === 0 && (
            <Flex justify="center" align="center" minH="200px">
              <Text color="gray.400" fontSize="sm">
                No scheduled matches to display
              </Text>
            </Flex>
          )}
        </Box>

        {/* Unscheduled sidebar */}
        <UnscheduledPanel
          matches={unscheduledMatches}
          categoryIndexMap={categoryIndexMap}
          defaultMatchLength={defaultMatchLength}
        />
      </Flex>
    </DndContext>
  );
}

function UnscheduledPanel({
  matches,
  categoryIndexMap,
  defaultMatchLength,
}: {
  matches: CategoryMatch[];
  categoryIndexMap: Map<string, number>;
  defaultMatchLength: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unscheduled-panel' });

  return (
    <Box
      ref={setNodeRef}
      w="220px"
      borderLeftWidth="1px"
      borderColor="gray.200"
      p={3}
      overflowY="auto"
      bg={isOver ? 'red.50' : 'gray.50'}
      flexShrink={0}
    >
      <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2}>
        Unscheduled
      </Text>

      <Box mb={3}>
        <Text fontSize="xs" color="gray.400">
          Default match length
        </Text>
        <Text fontSize="sm" fontWeight="semibold">
          {defaultMatchLength} min
        </Text>
      </Box>

      <VStack gap={2} align="stretch">
        {matches.map((match) => (
          <DraggableMatch
            key={match.id}
            match={match}
            categoryIndex={categoryIndexMap.get(match.categoryId) || 0}
          />
        ))}
      </VStack>

      {matches.length === 0 && (
        <Text fontSize="xs" color="gray.400" textAlign="center" mt={4}>
          All matches scheduled!
        </Text>
      )}
    </Box>
  );
}
