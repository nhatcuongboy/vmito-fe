'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Badge, Box, Flex, Heading, Text } from '@chakra-ui/react';
import { Button, HStack, VStack } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import { Link, useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import { toaster } from '@/components/ui/toaster';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  CategoryRegistration,
  CategoryType,
  MatchStatus,
  Tournament,
  TournamentPlayer,
} from '@/lib/api/types';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  MapPin,
  Medal,
  QrCode,
  Trophy,
  UserRound,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { AuthService } from '@/lib/api/auth.service';
import { ROUTES } from '@/constants';
import AiAssistantTopBarButton from '@/components/ui/AiAssistantTopBarButton';
import NotificationBell from '@/components/ui/NotificationBell';
import UserMenu from '@/components/ui/UserMenu';
import { PublicTournamentProfileSkeleton } from '@/components/tournament/skeletons';

function TournamentTopBarMenu() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, isLoading } = useAuthStore();

  const handleLogout = () => {
    AuthService.logout();
    router.push(ROUTES.HOME);
  };

  if (!isHydrated || isLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <Flex align="center" gap={2}>
      <AiAssistantTopBarButton />
      <NotificationBell color="fg" _hover={{ bg: 'bg.muted' }} />
      <UserMenu onLogout={handleLogout} />
    </Flex>
  );
}

interface PlayerCategorySummary {
  id: string;
  name: string;
  type: CategoryType;
  teamName: string;
}

type ResolvedPlayerState =
  | { status: 'found'; player: TournamentPlayer }
  | { status: 'missing' }
  | { status: 'ambiguous' };

const PLAYER_CODE_LENGTH = 8;

const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  [CategoryType.MENS_SINGLE]: 'Đơn nam',
  [CategoryType.WOMENS_SINGLE]: 'Đơn nữ',
  [CategoryType.MENS_DOUBLE]: 'Đôi nam',
  [CategoryType.WOMENS_DOUBLE]: 'Đôi nữ',
  [CategoryType.MIXED_DOUBLE]: 'Đôi nam nữ',
  [CategoryType.CUSTOM]: 'Nội dung',
};

const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  [MatchStatus.SCHEDULED]: 'Sắp diễn ra',
  [MatchStatus.IN_PROGRESS]: 'Đang thi đấu',
  [MatchStatus.FINISHED]: 'Đã kết thúc',
  [MatchStatus.CANCELLED]: 'Đã hủy',
};

const MATCH_STATUS_COLORS: Record<MatchStatus, string> = {
  [MatchStatus.SCHEDULED]: 'blue',
  [MatchStatus.IN_PROGRESS]: 'orange',
  [MatchStatus.FINISHED]: 'green',
  [MatchStatus.CANCELLED]: 'gray',
};

export const getTournamentPlayerCode = (playerId: string) =>
  playerId.slice(0, PLAYER_CODE_LENGTH).toLowerCase();

export const getUniqueTournamentPlayerCode = (
  playerId: string,
  tournamentPlayerIds: string[]
) => {
  const normalizedPlayerIds = tournamentPlayerIds.map((id) => id.toLowerCase());
  const normalizedPlayerId = playerId.toLowerCase();
  let codeLength = Math.min(PLAYER_CODE_LENGTH, playerId.length);

  while (codeLength < playerId.length) {
    const candidate = normalizedPlayerId.slice(0, codeLength);
    const matches = normalizedPlayerIds.filter((id) =>
      id.startsWith(candidate)
    );

    if (matches.length <= 1) return candidate;
    codeLength += 1;
  }

  return normalizedPlayerId;
};

const formatDate = (value?: Date | string) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatDateTime = (value?: Date | string) => {
  if (!value) return 'Chưa xếp lịch';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa xếp lịch';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getCategoryName = (category: Category) =>
  category.name?.trim() || CATEGORY_TYPE_LABELS[category.type];

const getRegistrationName = (registration: CategoryRegistration) =>
  registration.player?.name ||
  registration.pair?.name ||
  registration.pair?.members
    ?.map((member) => member.player?.name)
    .filter(Boolean)
    .join(' & ') ||
  'Đội chưa có tên';

const registrationIncludesPlayer = (
  registration: CategoryRegistration,
  playerId: string
) => {
  if (registration.tournamentPlayerId === playerId) return true;
  if (registration.player?.id === playerId) return true;

  return (
    registration.pair?.members?.some(
      (member) => member.playerId === playerId || member.player?.id === playerId
    ) ?? false
  );
};

const resolvePlayerByCode = (
  players: TournamentPlayer[],
  playerCode: string
): ResolvedPlayerState => {
  const normalizedCode = playerCode.toLowerCase();
  const matches = players.filter((player) =>
    player.id.toLowerCase().startsWith(normalizedCode)
  );

  if (matches.length === 0) return { status: 'missing' };
  if (matches.length > 1) return { status: 'ambiguous' };

  return { status: 'found', player: matches[0] };
};

const buildPlayerCategories = async (
  categories: Category[],
  playerId: string
) => {
  const categorySummaries = await Promise.all(
    categories.map(async (category) => {
      const registrations = await CategoryService.getRegistrations(category.id);
      const playerRegistration = registrations.find((registration) =>
        registrationIncludesPlayer(registration, playerId)
      );

      if (!playerRegistration) return null;

      return {
        id: category.id,
        name: getCategoryName(category),
        type: category.type,
        teamName: getRegistrationName(playerRegistration),
      } satisfies PlayerCategorySummary;
    })
  );

  return categorySummaries.filter(
    (category): category is PlayerCategorySummary => category !== null
  );
};

const getMatchTitle = (match: CategoryMatch, categories: Category[]) => {
  const category = categories.find((item) => item.id === match.categoryId);
  const categoryName = category ? getCategoryName(category) : 'Nội dung';
  return `${categoryName} · ${match.round}`;
};

const getMatchOpponentNames = (match: CategoryMatch, playerId: string) => {
  const opponents =
    match.participants
      ?.filter((participant) => {
        if (!participant.categoryRegistration) return false;
        return !registrationIncludesPlayer(
          participant.categoryRegistration,
          playerId
        );
      })
      .map((participant) =>
        participant.categoryRegistration
          ? getRegistrationName(participant.categoryRegistration)
          : ''
      )
      .filter(Boolean) ?? [];

  return opponents.length > 0 ? opponents.join(' / ') : 'Chưa có đối thủ';
};

export default function PublicTournamentPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const playerCode = params.playerCode as string;

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [playerState, setPlayerState] = useState<ResolvedPlayerState>({
    status: 'missing',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [playerCategories, setPlayerCategories] = useState<
    PlayerCategorySummary[]
  >([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);

  const sharePath = useMemo(
    () => `/t/${tournamentId}/p/${playerCode}`,
    [playerCode, tournamentId]
  );

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return sharePath;
    return `${window.location.origin}${window.location.pathname}`;
  }, [sharePath]);

  const loadPlayerPage = useCallback(async () => {
    try {
      setLoading(true);
      const tournamentData =
        await TournamentService.getTournament(tournamentId);
      const [players, categoryData] = await Promise.all([
        TournamentPlayerService.getPlayers(tournamentData.id),
        CategoryService.getCategories(tournamentData.id),
      ]);
      const resolvedPlayer = resolvePlayerByCode(players, playerCode);

      setTournament(tournamentData);
      setCategories(categoryData);
      setPlayerState(resolvedPlayer);

      if (resolvedPlayer.status !== 'found') {
        setPlayerCategories([]);
        setMatches([]);
        return;
      }

      const [categorySummaries, playerMatches] = await Promise.all([
        buildPlayerCategories(categoryData, resolvedPlayer.player.id),
        TournamentPlayerService.getPlayerMatches(resolvedPlayer.player.id),
      ]);

      setPlayerCategories(categorySummaries);
      setMatches(playerMatches);
    } catch (error) {
      console.error('Error loading tournament player page:', error);
      setTournament(null);
      setPlayerState({ status: 'missing' });
      setPlayerCategories([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [playerCode, tournamentId]);

  useEffect(() => {
    loadPlayerPage();
  }, [loadPlayerPage]);

  useEffect(() => {
    if (playerState.status !== 'found') return;

    QRCode.toDataURL(shareUrl, {
      width: 184,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((error) => {
        console.error('QR code generation error:', error);
      });
  }, [playerState.status, shareUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toaster.success({ title: 'Đã sao chép link' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toaster.error({ title: 'Không thể sao chép link' });
    }
  };

  if (loading) {
    return (
      <PageLayout
        title="Thông tin VĐV"
        showBackButton={false}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo={false}
        showTopBarAuthActions={false}
        disableSidebarOffset
        rightContent={<TournamentTopBarMenu />}
      >
        <PublicTournamentProfileSkeleton />
      </PageLayout>
    );
  }

  if (!tournament || playerState.status !== 'found') {
    const message =
      playerState.status === 'ambiguous'
        ? 'Mã VĐV này đang bị trùng. Vui lòng dùng mã dài hơn hoặc mở lại từ danh sách đội.'
        : 'Không tìm thấy VĐV trong giải đấu này.';

    return (
      <PageLayout
        title="Thông tin VĐV"
        showBackButton={false}
        topBarVariant="main"
        showTopBarMenuButton={false}
        showTopBarLogo={false}
        showTopBarAuthActions={false}
        disableSidebarOffset
        rightContent={<TournamentTopBarMenu />}
      >
        <VStack align="stretch" gap={4}>
          <Button
            alignSelf="flex-start"
            variant="ghost"
            colorPalette="gray"
            leftIcon={<ChevronLeft size={16} />}
            onClick={() => router.push(`/tournament/${tournamentId}/teams`)}
          >
            Quay lại danh sách đội
          </Button>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="white"
            p={6}
          >
            <Heading size="md" mb={2}>
              Không mở được trang VĐV
            </Heading>
            <Text color="gray.600">{message}</Text>
          </Box>
        </VStack>
      </PageLayout>
    );
  }

  const { player } = playerState;
  const tournamentDates =
    formatDate(tournament.startDate) === formatDate(tournament.endDate)
      ? formatDate(tournament.startDate)
      : `${formatDate(tournament.startDate)} - ${formatDate(
          tournament.endDate
        )}`;

  return (
    <PageLayout
      title="Thông tin VĐV"
      showBackButton={false}
      topBarVariant="main"
      showTopBarMenuButton={false}
      showTopBarLogo={false}
      showTopBarAuthActions={false}
      disableSidebarOffset
      rightContent={<TournamentTopBarMenu />}
      maxW="container.lg"
      bg="gray.50"
    >
      <VStack align="stretch" gap={5}>
        <Button
          alignSelf="flex-start"
          variant="ghost"
          colorPalette="gray"
          leftIcon={<ChevronLeft size={16} />}
          onClick={() => router.push(`/tournament/${tournamentId}/teams`)}
        >
          Danh sách đội
        </Button>

        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          bg="white"
          overflow="hidden"
        >
          <Box bg="green.600" color="white" px={{ base: 5, md: 6 }} py={6}>
            <VStack align="stretch" gap={4}>
              <Flex align="center" gap={3}>
                <Flex
                  w="48px"
                  h="48px"
                  borderRadius="full"
                  bg="whiteAlpha.300"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <UserRound size={26} />
                </Flex>
                <Box minW={0}>
                  <Text fontSize="sm" opacity={0.9}>
                    Vận động viên
                  </Text>
                  <Heading size={{ base: 'lg', md: 'xl' }} lineHeight="short">
                    {player.name}
                  </Heading>
                </Box>
              </Flex>

              <VStack align="stretch" gap={2}>
                <HStack gap={2}>
                  <Trophy size={16} />
                  <Text fontWeight="medium">{tournament.name}</Text>
                </HStack>
                {tournamentDates && (
                  <HStack gap={2}>
                    <CalendarDays size={16} />
                    <Text>{tournamentDates}</Text>
                  </HStack>
                )}
                {tournament.venue?.name && (
                  <HStack gap={2}>
                    <MapPin size={16} />
                    <Text>{tournament.venue.name}</Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Box>

          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'flex-start' }}
            gap={6}
            p={{ base: 5, md: 6 }}
          >
            <VStack align="stretch" gap={5} flex="1" minW={0}>
              <Box>
                <HStack gap={2} mb={3}>
                  <Medal size={18} color="var(--chakra-colors-green-600)" />
                  <Heading size="md">Nội dung tham gia</Heading>
                </HStack>

                {playerCategories.length === 0 ? (
                  <Text color="gray.500">Chưa có nội dung thi đấu.</Text>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {playerCategories.map((category) => (
                      <Box
                        key={category.id}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p={4}
                      >
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                          wrap="wrap"
                        >
                          <Box minW={0}>
                            <Text fontWeight="semibold">{category.name}</Text>
                            <Text color="gray.600" fontSize="sm" mt={1}>
                              {category.teamName}
                            </Text>
                          </Box>
                          <Badge colorPalette="green">
                            {CATEGORY_TYPE_LABELS[category.type]}
                          </Badge>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>

              <Box>
                <HStack gap={2} mb={3}>
                  <CalendarDays
                    size={18}
                    color="var(--chakra-colors-green-600)"
                  />
                  <Heading size="md">Lịch và kết quả</Heading>
                </HStack>

                {matches.length === 0 ? (
                  <Text color="gray.500">Chưa có trận đấu.</Text>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {matches.map((match) => (
                      <Box
                        key={match.id}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p={4}
                      >
                        <Flex
                          justify="space-between"
                          align="flex-start"
                          gap={3}
                          wrap="wrap"
                        >
                          <Box minW={0}>
                            <Text fontWeight="semibold">
                              {getMatchTitle(match, categories)}
                            </Text>
                            <Text color="gray.600" fontSize="sm" mt={1}>
                              Đối thủ: {getMatchOpponentNames(match, player.id)}
                            </Text>
                            <Text color="gray.600" fontSize="sm" mt={1}>
                              {formatDateTime(match.startTime)}
                              {match.court?.courtName
                                ? ` · ${match.court.courtName}`
                                : match.court?.courtNumber
                                  ? ` · Sân ${match.court.courtNumber}`
                                  : ''}
                            </Text>
                            {match.score && (
                              <Text fontWeight="medium" mt={2}>
                                Tỉ số: {match.score}
                              </Text>
                            )}
                          </Box>
                          <Badge
                            colorPalette={MATCH_STATUS_COLORS[match.status]}
                          >
                            {MATCH_STATUS_LABELS[match.status]}
                          </Badge>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>

            <Box
              w={{ base: 'full', md: '260px' }}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="xl"
              p={4}
              bg="gray.50"
              flexShrink={0}
            >
              <VStack gap={3}>
                <HStack gap={2}>
                  <QrCode size={18} />
                  <Text fontWeight="semibold">QR trang này</Text>
                </HStack>
                <Box bg="white" borderRadius="lg" p={3}>
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="QR code"
                      width={184}
                      height={184}
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <Box w="184px" h="184px" />
                  )}
                </Box>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  textAlign="center"
                  wordBreak="break-all"
                >
                  {shareUrl}
                </Text>
                <Button
                  w="full"
                  variant="outline"
                  colorPalette={copied ? 'green' : 'gray'}
                  leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                  onClick={copyLink}
                >
                  {copied ? 'Đã sao chép' : 'Sao chép link'}
                </Button>
                <Button
                  as={Link}
                  href={sharePath}
                  w="full"
                  variant="ghost"
                  colorPalette="gray"
                  leftIcon={<ExternalLink size={16} />}
                >
                  Mở link
                </Button>
              </VStack>
            </Box>
          </Flex>
        </Box>
      </VStack>
    </PageLayout>
  );
}
