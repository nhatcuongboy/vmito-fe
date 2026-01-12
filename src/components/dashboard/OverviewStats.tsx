'use client';

import { ISession } from '@/lib/api/types';
import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Calendar, List, Play, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OverviewStatsProps {
  sessions: ISession[];
}

export default function OverviewStats({ sessions }: OverviewStatsProps) {
  const t = useTranslations('pages.dashboard.stats');

  // Calculate stats
  const totalSessions = sessions.length;
  // 'IN_PROGRESS' matches the enum in types.ts
  const activeSessions = sessions.filter(
    (s) => s.status === 'IN_PROGRESS'
  ).length;
  // 'PREPARING' matches the enum
  const upcomingSessions = sessions.filter(
    (s) => s.status === 'PREPARING'
  ).length;
  // _count.players comes from the API include count
  const totalPlayers = sessions.reduce(
    (acc, s) => acc + (s._count?.players || 0),
    0
  );

  const stats = [
    {
      label: t('totalSessions'),
      value: totalSessions,
      icon: List,
      color: 'blue.500',
    },
    {
      label: t('upcomingSessions'),
      value: upcomingSessions,
      icon: Calendar,
      color: 'purple.500',
    },
    {
      label: t('activeSessions'),
      value: activeSessions,
      icon: Play,
      color: 'green.500',
    },
    {
      label: t('totalPlayers'),
      value: totalPlayers,
      icon: Users,
      color: 'orange.500',
    },
  ];

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} mb={8}>
      {stats.map((stat, index) => (
        <Box
          key={index}
          px={{ base: 4, md: 6 }}
          py={5}
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
          bg="white"
          borderRadius="lg"
        >
          <Flex justifyContent="space-between" alignItems="center">
            <Box>
              <Text
                fontWeight="medium"
                truncate
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {stat.label}
              </Text>
              <Text fontSize="3xl" fontWeight="bold">
                {stat.value}
              </Text>
            </Box>
            <Box my="auto" color={stat.color} alignContent="center">
              <Icon as={stat.icon} width="32px" height="32px" />
            </Box>
          </Flex>
        </Box>
      ))}
    </SimpleGrid>
  );
}
