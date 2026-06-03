'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Avatar,
} from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  Flag,
  Info,
  Mail,
  MapPin,
  NotebookText,
  Play,
  ShieldAlert,
  Signal,
  TimerReset,
  Trophy,
  UserRound,
  VenusAndMars,
  Phone,
} from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import {
  CategoryMatch,
  CategoryRegistration,
  Tournament,
  TournamentPlayer,
  UserRole,
} from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import ScoreEntryBoard from './ScoreEntryBoard';
import ForfeitMatchModal from './ForfeitMatchModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

export default function RefereeScoringPage() {
  const params = useParams();
  const tournamentParam = String(params?.id ?? '');
  const matchId = String(params?.matchId ?? '');
  const t = useTranslations('pages.tournaments.scoreEntry');
  const tRounds = useTranslations('pages.tournaments.scoreEntry.rounds');
  const tGuard = useTranslations('auth.guard');
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();

  const [match, setMatch] = useState<CategoryMatch | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [playerInfoOpen, setPlayerInfoOpen] = useState(false);
  const [forfeitOpen, setForfeitOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [m, tour] = await Promise.all([
          CategoryService.getMatch(matchId),
          TournamentService.getTournament(tournamentParam),
        ]);
        if (!active) return;
        setMatch(m);
        setTournament(tour);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [matchId, tournamentParam]);

  const canAccess =
    !!tournament &&
    (user?.id === tournament.hostId ||
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.REFEREE);

  const handleStart = useCallback(async () => {
    setStarting(true);
    try {
      const resp = await CategoryService.startMatch(matchId);
      setMatch(resp);
    } finally {
      setStarting(false);
    }
  }, [matchId]);

  const goBack = () => router.push(`/tournament/${tournamentParam}/referee`);

  const formatDateTime = (value?: Date | string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Box minH="100dvh" bg="gray.50" p={4} _dark={{ bg: 'gray.900' }}>
        <TournamentMatchListSkeleton count={4} />
      </Box>
    );
  }

  if (!match || !tournament) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="100dvh"
        gap={3}
      >
        <Text color="gray.500">{t('matchNotFound')}</Text>
        <Button onClick={goBack}>{t('back')}</Button>
      </Flex>
    );
  }

  if (!canAccess) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="100dvh"
        gap={3}
        px={4}
        textAlign="center"
      >
        <Text fontWeight="semibold">{tGuard('accessDenied')}</Text>
        <Text color="gray.500">{tGuard('permissionDenied')}</Text>
        <Button onClick={goBack}>{t('back')}</Button>
      </Flex>
    );
  }

  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);
  const roundLabel = getRoundDisplayLabel(match.round ?? 'group', tRounds);
  const matchTitle = `${team1} ${t('vs')} ${team2}`;
  const courtLabel = match.court
    ? `${t('court')} ${match.court.courtNumber}`
    : '—';
  const scheduledTime = formatDateTime(
    match.estimatedEndTime ?? match.startTime
  );
  const matchSides = getMatchSides(match);

  return (
    <Box
      minH="100dvh"
      bg="linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)"
      _dark={{ bg: 'gray.900' }}
    >
      <Box
        position="relative"
        overflow="hidden"
        px={{ base: 2, md: 4 }}
        pt={{ base: 2, md: 4 }}
        pb={{ base: 2, md: 4 }}
      >
        <Box
          position="absolute"
          inset="auto -40px -70px auto"
          w="180px"
          h="180px"
          borderRadius="full"
          bg="green.200"
          opacity={0.22}
          filter="blur(18px)"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          inset="-60px auto auto -40px"
          w="140px"
          h="140px"
          borderRadius="full"
          bg="blue.200"
          opacity={0.2}
          filter="blur(18px)"
          pointerEvents="none"
        />

        <Flex
          align="center"
          gap={3}
          px={{ base: 1, md: 0 }}
          mb={4}
          position="relative"
          zIndex={1}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            borderRadius="full"
            bg="white"
            boxShadow="sm"
            _dark={{ bg: 'gray.800' }}
          >
            <ArrowLeft size={18} />
          </Button>

          <Box flex="1" minW={0}>
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {t('refereeArea')}
            </Text>
            <Text
              fontWeight="bold"
              fontSize={{ base: 'md', md: 'lg' }}
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {matchTitle}
            </Text>
          </Box>

          <Badge
            colorPalette="blue"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="sm"
          >
            {courtLabel}
          </Badge>
        </Flex>

        <Box
          position="relative"
          zIndex={1}
          borderWidth="1px"
          borderColor="whiteAlpha.500"
          borderRadius="3xl"
          bg="white"
          boxShadow="0 18px 50px rgba(15, 23, 42, 0.08)"
          overflow="hidden"
          _dark={{
            bg: 'gray.800',
            borderColor: 'whiteAlpha.200',
          }}
        >
          <Box
            px={{ base: 3, md: 5 }}
            py={{ base: 3, md: 4 }}
            bg="linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(59, 130, 246, 0.08))"
            borderBottomWidth="1px"
            borderBottomColor="gray.100"
            _dark={{ borderBottomColor: 'whiteAlpha.200' }}
          >
            <Flex
              gap={3}
              align={{ base: 'start', md: 'center' }}
              justify="space-between"
              direction={{ base: 'column', md: 'row' }}
            >
              <Box minW={0}>
                <HStack gap={2} flexWrap="wrap" mb={2}>
                  <Badge colorPalette="green" borderRadius="full" px={3} py={1}>
                    {t(`status.${match.status}`)}
                  </Badge>
                  <Badge
                    variant="subtle"
                    colorPalette="gray"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {roundLabel}
                  </Badge>
                  {!!match.startTime && (
                    <Badge
                      variant="subtle"
                      colorPalette="purple"
                      borderRadius="full"
                      px={3}
                      py={1}
                    >
                      {formatDateTime(match.startTime)}
                    </Badge>
                  )}
                </HStack>

                <Heading size={{ base: 'md', md: 'lg' }} lineHeight={1.15}>
                  {matchTitle}
                </Heading>
              </Box>

              <IconButton
                aria-label={t('playerInfo')}
                title={t('playerInfo')}
                variant="outline"
                size="sm"
                borderRadius="full"
                colorPalette="gray"
                onClick={() => setPlayerInfoOpen(true)}
                flexShrink={0}
              >
                <Info size={17} />
              </IconButton>
            </Flex>
          </Box>

          <Box px={{ base: 3, md: 5 }} py={{ base: 3, md: 4 }}>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={2} mb={3}>
              <InfoCard
                icon={<MapPin size={16} />}
                label={t('court')}
                value={match.court ? `${match.court.courtNumber}` : '—'}
              />
              <InfoCard
                icon={<Clock3 size={16} />}
                label={t('statusLabel')}
                value={t(`status.${match.status}`)}
              />
              <InfoCard
                icon={<CalendarClock size={16} />}
                label={t('roundLabel')}
                value={roundLabel}
              />
              <InfoCard
                icon={<TimerReset size={16} />}
                label={t('scheduledAt')}
                value={scheduledTime}
              />
            </SimpleGrid>

            <VModal
              isOpen={playerInfoOpen}
              onClose={() => setPlayerInfoOpen(false)}
              title={t('playerInfo')}
              size="xl"
              maxBodyHeight={{ base: '72vh', md: '76vh' }}
              hideSecondaryAction
              closeButtonAriaLabel={t('cancel')}
            >
              <HStack justify="flex-end" mb={3}>
                <Badge variant="subtle" colorPalette="gray" borderRadius="full">
                  {matchSides.reduce(
                    (total, side) => total + side.players.length,
                    0
                  )}{' '}
                  {t('players')}
                </Badge>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                {matchSides.map((side) => (
                  <MatchSideCard
                    key={side.position}
                    teamName={side.teamName}
                    players={side.players}
                    labels={{
                      code: t('playerCode'),
                      email: t('email'),
                      phone: t('phone'),
                      gender: t('gender'),
                      level: t('level'),
                      levelDescription: t('levelDescription'),
                      notes: t('notes'),
                      noDetails: t('noPlayerDetails'),
                    }}
                  />
                ))}
              </SimpleGrid>
            </VModal>

            {match.status === 'SCHEDULED' && (
              <VStack align="stretch" gap={4} py={{ base: 2, md: 3 }}>
                <Box
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="2xl"
                  bg="gray.50"
                  px={4}
                  py={4}
                  _dark={{ bg: 'whiteAlpha.50', borderColor: 'whiteAlpha.200' }}
                >
                  <HStack gap={3} align="start">
                    <Box
                      bg="red.100"
                      color="red.700"
                      borderRadius="full"
                      p={2}
                      _dark={{ bg: 'red.900', color: 'red.200' }}
                    >
                      <ShieldAlert size={18} />
                    </Box>
                    <Box flex="1">
                      <Text fontWeight="semibold" mb={1}>
                        {t('matchPrepTitle')}
                      </Text>
                      <Text color="gray.600" _dark={{ color: 'gray.300' }}>
                        {t('matchPrepDescription')}
                      </Text>
                    </Box>
                  </HStack>
                </Box>

                <Flex
                  direction={{ base: 'column', sm: 'row' }}
                  gap={3}
                  align={{ base: 'stretch', sm: 'center' }}
                  justify="space-between"
                >
                  <Box>
                    <Text fontSize="sm" color="gray.500" mb={1}>
                      {t('scheduledAt')}
                    </Text>
                    <Text fontWeight="semibold">{scheduledTime}</Text>
                  </Box>

                  <HStack gap={2} flexWrap="wrap">
                    <Button
                      variant="outline"
                      colorPalette="red"
                      size="lg"
                      onClick={() => setForfeitOpen(true)}
                      borderRadius="xl"
                    >
                      <Flag size={18} /> {t('forfeit')}
                    </Button>
                    <Button
                      colorPalette="green"
                      size="lg"
                      onClick={() => void handleStart()}
                      loading={starting}
                      borderRadius="xl"
                      boxShadow="0 10px 24px rgba(22, 163, 74, 0.24)"
                    >
                      <Play size={18} /> {t('startMatch')}
                    </Button>
                  </HStack>
                </Flex>
              </VStack>
            )}

            {match.status === 'IN_PROGRESS' && (
              <Box borderRadius="2xl" overflow="hidden">
                <ScoreEntryBoard
                  match={match}
                  tournamentId={tournament.id}
                  onMatchUpdate={setMatch}
                  onForfeit={() => setForfeitOpen(true)}
                />
              </Box>
            )}

            {(match.status === 'FINISHED' || match.status === 'CANCELLED') && (
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap={4}
                py={10}
              >
                <Box
                  bg="yellow.100"
                  color="yellow.700"
                  borderRadius="full"
                  p={4}
                  _dark={{ bg: 'yellow.900', color: 'yellow.200' }}
                >
                  <Trophy size={44} />
                </Box>
                <Heading size="md">{t('finalResult')}</Heading>
                <Text fontSize="2xl" fontWeight="bold">
                  {match.score || '—'}
                </Text>
                <Flex gap={2} wrap="wrap" justify="center">
                  {(match.sets ?? []).map((s, i) => (
                    <Badge key={i} colorPalette="gray" fontSize="sm">
                      {s.player1Score}-{s.player2Score}
                    </Badge>
                  ))}
                </Flex>
                <Button variant="outline" onClick={goBack}>
                  {t('back')}
                </Button>
              </Flex>
            )}

            <ForfeitMatchModal
              isOpen={forfeitOpen}
              onClose={() => setForfeitOpen(false)}
              match={match}
              onForfeited={(updated) => {
                setForfeitOpen(false);
                setMatch(updated);
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="white"
      px={3}
      py={3}
      _dark={{ bg: 'whiteAlpha.50', borderColor: 'whiteAlpha.200' }}
    >
      <HStack gap={2} mb={1}>
        <Box color="gray.500">{icon}</Box>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase">
          {label}
        </Text>
      </HStack>
      <Text
        fontWeight="semibold"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {value}
      </Text>
    </Box>
  );
}

interface MatchPlayerInfo {
  id: string;
  name: string;
  code?: string;
  image?: string;
  email?: string;
  phone?: string;
  gender?: string;
  level?: number;
  levelDescription?: string;
  notes?: string;
}

interface MatchSideInfo {
  position: number;
  teamName: string;
  players: MatchPlayerInfo[];
}

function getMatchSides(match: CategoryMatch): MatchSideInfo[] {
  const participants = [...(match.participants ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return [1, 2].map((position) => {
    const participant = participants.find((p) => p.position === position);
    return {
      position,
      teamName: getTeamLabel(match, position as 1 | 2),
      players: participant?.categoryRegistration
        ? getPlayersFromRegistration(participant.categoryRegistration)
        : [],
    };
  });
}

function getPlayersFromRegistration(
  registration: CategoryRegistration
): MatchPlayerInfo[] {
  if (registration.player) {
    return [toMatchPlayerInfo(registration.player)];
  }

  const pairMembers = registration.pair?.members ?? [];
  if (pairMembers.length > 0) {
    return pairMembers
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((member) =>
        member.player
          ? toMatchPlayerInfo(member.player)
          : {
              id: member.playerId,
              name: `#${member.playerId.slice(0, 6)}`,
            }
      );
  }

  if (registration.pair?.name) {
    return [
      {
        id: registration.pair.id,
        name: registration.pair.name,
      },
    ];
  }

  return [];
}

function toMatchPlayerInfo(player: TournamentPlayer): MatchPlayerInfo {
  return {
    id: player.id,
    name: player.name,
    code: player.code,
    image: player.image ?? player.user?.image,
    email: player.email,
    phone: player.phone,
    gender: player.gender,
    level: player.level,
    levelDescription: player.levelDescription,
    notes: player.notes,
  };
}

function MatchSideCard({
  teamName,
  players,
  labels,
}: {
  teamName: string;
  players: MatchPlayerInfo[];
  labels: {
    code: string;
    email: string;
    phone: string;
    gender: string;
    level: string;
    levelDescription: string;
    notes: string;
    noDetails: string;
  };
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="white"
      overflow="hidden"
      _dark={{ bg: 'whiteAlpha.50', borderColor: 'whiteAlpha.200' }}
    >
      <Box
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderBottomColor="gray.100"
        _dark={{ borderBottomColor: 'whiteAlpha.200' }}
      >
        <Text
          fontWeight="bold"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {teamName}
        </Text>
      </Box>

      <VStack align="stretch" gap={0}>
        {players.length > 0 ? (
          players.map((player, index) => (
            <PlayerInfoRow
              key={`${player.id}-${index}`}
              player={player}
              labels={labels}
            />
          ))
        ) : (
          <Text px={4} py={4} color="gray.500">
            {labels.noDetails}
          </Text>
        )}
      </VStack>
    </Box>
  );
}

function PlayerInfoRow({
  player,
  labels,
}: {
  player: MatchPlayerInfo;
  labels: {
    code: string;
    email: string;
    phone: string;
    gender: string;
    level: string;
    levelDescription: string;
    notes: string;
    noDetails: string;
  };
}) {
  return (
    <Box px={4} py={4} borderBottomWidth="1px" borderBottomColor="gray.100">
      <HStack align="start" gap={3} mb={3}>
        <Avatar.Root size="sm" borderRadius="full" flexShrink={0}>
          <Avatar.Fallback name={player.name}>
            <UserRound size={16} />
          </Avatar.Fallback>
          {player.image && <Avatar.Image src={player.image} />}
        </Avatar.Root>

        <Box minW={0} flex="1">
          <HStack gap={2} align="center" flexWrap="wrap">
            <Text fontWeight="bold" lineHeight={1.2}>
              {player.name}
            </Text>
            {player.code && (
              <Badge colorPalette="green" variant="subtle" borderRadius="full">
                {player.code}
              </Badge>
            )}
          </HStack>
          {player.levelDescription && (
            <Text fontSize="sm" color="gray.600" mt={1}>
              {player.levelDescription}
            </Text>
          )}
        </Box>
      </HStack>

      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={2}>
        <PlayerMeta
          icon={<UserRound size={14} />}
          label={labels.code}
          value={player.code}
        />
        <PlayerMeta
          icon={<VenusAndMars size={14} />}
          label={labels.gender}
          value={player.gender}
        />
        <PlayerMeta
          icon={<Signal size={14} />}
          label={labels.level}
          value={player.level != null ? String(player.level) : undefined}
        />
        <PlayerMeta
          icon={<Mail size={14} />}
          label={labels.email}
          value={player.email}
        />
        <PlayerMeta
          icon={<Phone size={14} />}
          label={labels.phone}
          value={player.phone}
        />
        {player.notes && (
          <PlayerMeta
            icon={<NotebookText size={14} />}
            label={labels.notes}
            value={player.notes}
          />
        )}
      </SimpleGrid>
    </Box>
  );
}

function PlayerMeta({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <HStack
      gap={2}
      align="start"
      minW={0}
      color={value ? 'gray.700' : 'gray.400'}
      _dark={{ color: value ? 'gray.200' : 'gray.500' }}
    >
      <Box mt={0.5} flexShrink={0}>
        {icon}
      </Box>
      <Box minW={0}>
        <Text fontSize="xs" color="gray.500">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="medium" wordBreak="break-word">
          {value || '—'}
        </Text>
      </Box>
    </HStack>
  );
}
