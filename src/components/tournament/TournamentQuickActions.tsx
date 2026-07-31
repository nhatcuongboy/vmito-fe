'use client';

import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { BarChart3, CalendarDays, MonitorPlay, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/config';

interface TournamentQuickActionsProps {
  slug: string;
}

export default function TournamentQuickActions({
  slug,
}: TournamentQuickActionsProps) {
  const t = useTranslations('pages.tournaments.detail.homeTab');
  const tBoard = useTranslations('pages.tournaments.scoreboard');
  const actions = [
    {
      id: 'schedule',
      label: t('overview.viewSchedule'),
      href: `/tournament/${slug}/schedule`,
      icon: CalendarDays,
      color: 'green',
    },
    {
      id: 'standings',
      label: t('overview.viewStandings'),
      href: `/tournament/${slug}/standings`,
      icon: BarChart3,
      color: 'blue',
    },
    {
      id: 'scoreboard',
      label: tBoard('liveScoreboard'),
      href: `/tournament/${slug}/scoreboard`,
      icon: MonitorPlay,
      color: 'teal',
    },
    {
      id: 'showcase',
      label: t('overview.viewShowcase'),
      href: `/tournament/${slug}/showcase`,
      icon: Sparkles,
      color: 'purple',
    },
  ];

  return (
    <Grid
      templateColumns={{
        base: 'repeat(2, minmax(0, 1fr))',
        md: 'repeat(4, minmax(0, 1fr))',
      }}
      gap={2}
    >
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Box
            asChild
            key={action.id}
            minH="56px"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="white"
            color="gray.800"
            boxShadow="none"
            transition="border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease"
            _hover={{
              borderColor: `${action.color}.300`,
              boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
              transform: 'translateY(-1px)',
              textDecoration: 'none',
            }}
            _active={{ transform: 'translateY(0)' }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: `${action.color}.400`,
              outlineOffset: '2px',
            }}
            _dark={{
              bg: 'var(--tournament-surface-raised)',
              color: 'gray.100',
              borderColor: 'var(--tournament-border)',
            }}
          >
            <Link href={action.href}>
              <Flex align="center" gap={2.5} h="full" px={3} py={2.5}>
                <Flex
                  align="center"
                  justify="center"
                  w="30px"
                  h="30px"
                  borderRadius="lg"
                  bg="gray.50"
                  color={`${action.color}.600`}
                  flexShrink={0}
                  _dark={{
                    bg: 'var(--tournament-surface-muted)',
                    color: `${action.color}.300`,
                  }}
                >
                  <Icon size={17} aria-hidden="true" />
                </Flex>
                <Text fontSize="sm" fontWeight="700" lineHeight="1.3">
                  {action.label}
                </Text>
              </Flex>
            </Link>
          </Box>
        );
      })}
    </Grid>
  );
}
