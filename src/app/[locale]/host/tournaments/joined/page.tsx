'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  Image,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuPositioner,
  Portal,
  SimpleGrid,
} from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { TournamentService } from '@/lib/api/tournament.service';
import { Tournament, TournamentStatus, UserRole } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { format } from 'date-fns';
import { getPrimaryVenueDisplay } from '@/utils';
import { vi as viLocale, enUS, zhCN } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { useRegisterTopBarSearch } from '@/contexts/TopBarSearchContext';
import { HostTournamentListSkeleton } from '@/components/tournament/skeletons';
import { TournamentStatusSelect } from '@/components/tournament/TournamentStatusSelect';
import TournamentSortMenu, {
  type TournamentSortValue,
} from '@/components/tournament/TournamentSortMenu';
import {
  HostTournamentsHeader,
  type HostTournamentMobileTab,
} from '@/components/tournament/HostTournamentsHeader';
import HostTournamentsNavPanel from '@/components/tournament/HostTournamentsNavPanel';
import {
  Trophy,
  MoreHorizontal,
  Settings,
  Calendar,
  MapPin,
  Layers,
  Share2,
} from 'lucide-react';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';

const STATUS_THEME: Record<
  TournamentStatus,
  { palette: string; dotBg: string; gradient: string }
> = {
  [TournamentStatus.PREPARING]: {
    palette: 'gray',
    dotBg: 'gray.400',
    gradient: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
  },
  [TournamentStatus.IN_PROGRESS]: {
    palette: 'green',
    dotBg: 'green.500',
    gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
  },
  [TournamentStatus.FINISHED]: {
    palette: 'blue',
    dotBg: 'blue.500',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
  },
  [TournamentStatus.CANCELLED]: {
    palette: 'red',
    dotBg: 'red.500',
    gradient: 'linear-gradient(135deg, #fca5a5 0%, #dc2626 100%)',
  },
};

function StatusBadge({
  status,
  label,
}: {
  status: TournamentStatus;
  label: string;
}) {
  const theme = STATUS_THEME[status];
  return (
    <Badge
      colorPalette={theme.palette}
      variant="subtle"
      size="sm"
      borderRadius="full"
      px={2.5}
      py={1}
    >
      <HStack gap={1.5} align="center">
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg={theme.dotBg}
          flexShrink={0}
        />
        <Text fontSize="xs" fontWeight="semibold">
          {label}
        </Text>
      </HStack>
    </Badge>
  );
}

function TournamentJoinedRow({
  tournament,
  onOpen,
  onShare,
  dateFormatted,
  statusLabel,
  t,
}: {
  tournament: Tournament;
  onOpen: () => void;
  onShare: () => void;
  dateFormatted: string;
  statusLabel: string;
  t: (key: string) => string;
}) {
  const theme = STATUS_THEME[tournament.status];
  const venueName = getPrimaryVenueDisplay(tournament)?.name;
  const categoriesCount = tournament._count?.categories ?? 0;

  return (
    <Box
      p={{ base: 3, md: 4 }}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderWidth="1px"
      borderColor="gray.100"
      borderRadius="2xl"
      transition="all 0.2s ease"
      _hover={{
        boxShadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: 'green.200',
        cursor: 'pointer',
      }}
      position="relative"
      overflow="hidden"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('[role="menuitem"]') ||
          target.closest('[data-part="menu-content"]')
        ) {
          return;
        }
        onOpen();
      }}
    >
      <Box
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        w="3px"
        style={{ background: theme.gradient }}
      />

      <Flex gap={{ base: 3, md: 4 }} align="center" pl={2}>
        <Box
          w={{ base: '56px', md: '72px' }}
          h={{ base: '56px', md: '72px' }}
          borderRadius="xl"
          flexShrink={0}
          overflow="hidden"
          position="relative"
          style={
            tournament.coverPhoto ? undefined : { background: theme.gradient }
          }
          bg={tournament.coverPhoto ? 'gray.100' : undefined}
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="sm"
        >
          {tournament.coverPhoto ? (
            <Image
              src={tournament.coverPhoto}
              alt={tournament.name}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          ) : (
            <Trophy size={28} color="white" strokeWidth={2.25} />
          )}
        </Box>

        <Box flex={1} minW={0}>
          <HStack gap={2} mb={1} align="center" flexWrap="wrap">
            <StatusBadge status={tournament.status} label={statusLabel} />
          </HStack>
          <Text
            fontWeight="bold"
            fontSize={{ base: 'md', md: 'lg' }}
            color="fg"
            truncate
            lineHeight="1.3"
          >
            {tournament.name}
          </Text>
          <HStack
            gap={3}
            mt={1.5}
            color="fg.muted"
            fontSize="sm"
            flexWrap="wrap"
          >
            <HStack gap={1.5}>
              <Calendar size={14} />
              <Text>{dateFormatted}</Text>
            </HStack>
            {venueName && (
              <HStack gap={1.5} minW={0}>
                <MapPin size={14} />
                <Text truncate maxW="200px">
                  {venueName}
                </Text>
              </HStack>
            )}
            <HStack gap={1.5}>
              <Layers size={14} />
              <Text>
                {categoriesCount} {t('card.categories').toLowerCase()}
              </Text>
            </HStack>
          </HStack>
        </Box>

        <HStack gap={1} flexShrink={0}>
          <MenuRoot positioning={{ placement: 'bottom-end' }}>
            <MenuTrigger asChild>
              <IconButton
                aria-label={t('card.moreActions')}
                variant="ghost"
                size="sm"
              >
                <MoreHorizontal size={16} />
              </IconButton>
            </MenuTrigger>
            <Portal>
              <MenuPositioner zIndex={2000}>
                <MenuContent
                  minW="180px"
                  zIndex={2001}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  boxShadow="lg"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="gray.200"
                  p={1}
                >
                  <MenuItem value="open" onClick={onOpen}>
                    <HStack gap={2}>
                      <Settings size={16} />
                      <Text>{t('card.viewDetail') || 'Xem chi tiết'}</Text>
                    </HStack>
                  </MenuItem>
                  <MenuItem value="share" onClick={onShare}>
                    <HStack gap={2}>
                      <Share2 size={16} />
                      <Text>{t('card.share')}</Text>
                    </HStack>
                  </MenuItem>
                </MenuContent>
              </MenuPositioner>
            </Portal>
          </MenuRoot>
        </HStack>
      </Flex>
    </Box>
  );
}

export default function JoinedTournamentsPage() {
  const router = useRouter();
  const t = useTranslations('pages.tournaments.hostList');
  const tTournaments = useTranslations('pages.tournaments');
  const tStatus = useTranslations('pages.tournaments.status');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? viLocale : locale === 'cn' ? zhCN : enUS;
  const user = useAuthStore((state) => state.user);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<TournamentStatus[]>([
    TournamentStatus.IN_PROGRESS,
    TournamentStatus.PREPARING,
  ]);
  const [mobileTab, setMobileTab] = useState<HostTournamentMobileTab>('open');
  const [sort, setSort] = useState<TournamentSortValue>('start_asc');

  useRegisterTopBarSearch({
    placeholder: t('searchPlaceholder'),
    value: search,
    onChange: setSearch,
    showFilter: false,
  });

  const handleMobileTabChange = (tab: HostTournamentMobileTab) => {
    setMobileTab(tab);
    if (tab === 'open') {
      setStatuses([TournamentStatus.IN_PROGRESS, TournamentStatus.PREPARING]);
    } else if (tab === 'ended') {
      setStatuses([TournamentStatus.FINISHED]);
    } else if (tab === 'all') {
      setStatuses([]);
    }
  };

  const loadTournaments = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Fetch tournaments and filter client-side for joined tournaments
      const data = await TournamentService.getMyTournaments();
      setTournaments(data);
    } catch (error: unknown) {
      console.error('Failed to load joined tournaments:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadTournaments();
  }, [loadTournaments]);

  const handleShare = async (tournament: Tournament) => {
    const shareUrl = `${window.location.origin}/${locale}/tournament/${tournament.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: tournament.name,
          text: tournament.name,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toaster.success({ title: t('shareSuccess') });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toaster.error({ title: t('shareFailed') });
    }
  };

  const filtered = useMemo(() => {
    const matchingTournaments = tournaments.filter((x) => {
      const matchesSearch = x.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statuses.length === 0 || statuses.includes(x.status);
      return matchesSearch && matchesStatus;
    });

    return matchingTournaments.sort((first, second) => {
      switch (sort) {
        case 'newest':
          return (
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime()
          );
        case 'name_asc':
          return first.name.localeCompare(second.name, locale);
        case 'name_desc':
          return second.name.localeCompare(first.name, locale);
        case 'start_asc':
          return (
            new Date(first.startDate).getTime() -
            new Date(second.startDate).getTime()
          );
      }
    });
  }, [locale, search, sort, statuses, tournaments]);

  const statusLabelFor = (status: TournamentStatus): string => {
    switch (status) {
      case TournamentStatus.PREPARING:
        return tStatus('preparing');
      case TournamentStatus.IN_PROGRESS:
        return tStatus('inProgress');
      case TournamentStatus.FINISHED:
        return tStatus('finished');
      case TournamentStatus.CANCELLED:
        return tStatus('cancelled');
      default:
        return '';
    }
  };

  return (
    <ProtectedRouteGuard
      requiredRole={[
        UserRole.PLAYER,
        UserRole.HOST,
        UserRole.ADMIN,
        UserRole.REFEREE,
      ]}
    >
      <PageLayout
        title={t('joinedTab') || 'Giải tham gia'}
        mobileIcon={<Trophy size={20} />}
        showBackButton={true}
        onBack={() => router.back()}
        hideTopBarBorder={true}
        subHeader={
          <HostTournamentsHeader
            search={search}
            onSearchChange={setSearch}
            activeTab={mobileTab}
            onTabChange={handleMobileTabChange}
          />
        }
        mobileSubHeaderOffset="98px"
      >
        <Box mb={4}>
          <Flex
            justify="space-between"
            align="center"
            gap={3}
            mt={{ base: 1, md: 4 }}
            flexWrap="wrap"
          >
            <Box minW={0} display={{ base: 'none', md: 'block' }}>
              {!loading && (
                <Text fontSize="sm" color="fg.muted">
                  {tTournaments('resultCount', { count: filtered.length })}
                </Text>
              )}
            </Box>

            <HStack
              gap={2}
              ml="auto"
              flexShrink={0}
              display={{ base: 'none', md: 'flex' }}
            >
              <TournamentStatusSelect value={statuses} onChange={setStatuses} />
              <TournamentSortMenu value={sort} onChange={setSort} />
            </HStack>
          </Flex>
        </Box>

        {/* List */}
        {loading ? (
          <HostTournamentListSkeleton />
        ) : filtered.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={14}
            px={6}
            gap={3}
            bg="white"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            borderWidth="1px"
            borderColor="gray.100"
            borderRadius="2xl"
            textAlign="center"
          >
            <Flex
              w="64px"
              h="64px"
              borderRadius="2xl"
              align="center"
              justify="center"
              bg="green.50"
              color="green.500"
              _dark={{ bg: 'green.900', color: 'green.300' }}
            >
              <Trophy size={32} />
            </Flex>
            <Text fontSize="lg" fontWeight="semibold" color="fg">
              {search || statuses.length > 0
                ? t('noResultsTitle')
                : 'Chưa có giải tham gia nào'}
            </Text>
            <Text color="fg.muted" maxW="420px">
              {search || statuses.length > 0
                ? t('noResultsDesc')
                : 'Các giải đấu bạn tham gia sẽ xuất hiện ở đây.'}
            </Text>
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {filtered.map((tournament) => (
              <TournamentJoinedRow
                key={tournament.id}
                tournament={tournament}
                onOpen={() => router.push(`/tournament/${tournament.slug}`)}
                onShare={() => void handleShare(tournament)}
                dateFormatted={format(
                  new Date(tournament.startDate),
                  'EEE, MMM d, yyyy',
                  { locale: dateLocale }
                )}
                statusLabel={statusLabelFor(tournament.status)}
                t={t}
              />
            ))}
          </SimpleGrid>
        )}
        <HostTournamentsNavPanel />
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
