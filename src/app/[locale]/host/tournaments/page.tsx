'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  VStack,
  SimpleGrid,
  Image,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuPositioner,
  Portal,
} from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { TournamentService } from '@/lib/api/tournament.service';
import { Tournament, TournamentStatus, UserRole } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { format } from 'date-fns';
import { vi as viLocale, enUS, zhCN } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { AppSearchBar } from '@/components/common/AppSearchBar';
import { HostTournamentListSkeleton } from '@/components/tournament/skeletons';
import {
  Trophy,
  Plus,
  ExternalLink,
  MoreHorizontal,
  Settings,
  Trash2,
  Calendar,
  MapPin,
  Layers,
  FileText,
  PlayCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { toaster } from '@/components/ui/toaster';

type TStatusFilter = 'all' | TournamentStatus;

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

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Box
      p={{ base: 3, md: 4 }}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderWidth="1px"
      borderColor="gray.100"
      borderRadius="xl"
      transition="all 0.2s"
      _hover={{ boxShadow: 'sm', transform: 'translateY(-1px)' }}
    >
      <Flex align="center" gap={3}>
        <Flex
          w="40px"
          h="40px"
          borderRadius="lg"
          align="center"
          justify="center"
          flexShrink={0}
          style={{ background: accent, color: 'white' }}
        >
          {icon}
        </Flex>
        <Box minW={0}>
          <Text
            fontSize="xs"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="0.04em"
            fontWeight="semibold"
            truncate
          >
            {label}
          </Text>
          <Text fontSize="xl" fontWeight="bold" lineHeight="1.2">
            {value}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}

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

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      px={3.5}
      py={1.5}
      borderRadius="full"
      borderWidth="1px"
      borderColor={active ? 'green.500' : 'gray.200'}
      bg={active ? 'green.500' : 'white'}
      color={active ? 'white' : 'fg'}
      _dark={{
        bg: active ? 'green.500' : 'gray.800',
        borderColor: active ? 'green.500' : 'gray.700',
        color: active ? 'white' : 'fg',
      }}
      fontSize="sm"
      fontWeight="medium"
      transition="all 0.15s"
      cursor="pointer"
      _hover={{
        borderColor: active ? 'green.500' : 'green.300',
      }}
    >
      <HStack gap={2} align="center">
        <Text>{label}</Text>
        <Box
          px={1.5}
          minW="20px"
          textAlign="center"
          borderRadius="full"
          fontSize="xs"
          fontWeight="bold"
          bg={active ? 'whiteAlpha.300' : 'gray.100'}
          color={active ? 'white' : 'fg.muted'}
          _dark={{
            bg: active ? 'whiteAlpha.300' : 'gray.700',
          }}
        >
          {count}
        </Box>
      </HStack>
    </Box>
  );
}

function TournamentRow({
  tournament,
  deleting,
  onManage,
  onDelete,
  onOpenPublic,
  dateFormatted,
  statusLabel,
  publishLabel,
  t,
}: {
  tournament: Tournament;
  deleting: boolean;
  onManage: () => void;
  onDelete: () => void;
  onOpenPublic: () => void;
  dateFormatted: string;
  statusLabel: string;
  publishLabel: string;
  t: (key: string) => string;
}) {
  const theme = STATUS_THEME[tournament.status];
  const venueName = tournament.venue?.name;
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
      }}
      position="relative"
      overflow="hidden"
    >
      {/* status accent strip */}
      <Box
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        w="3px"
        style={{ background: theme.gradient }}
      />

      <Flex gap={{ base: 3, md: 4 }} align="center" pl={2}>
        {/* Cover or icon */}
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

        {/* Main info */}
        <Box flex={1} minW={0}>
          <HStack gap={2} mb={1} align="center" flexWrap="wrap">
            <StatusBadge status={tournament.status} label={statusLabel} />
            {!tournament.isPublished && (
              <Badge
                size="sm"
                variant="outline"
                colorPalette="orange"
                borderRadius="full"
                px={2}
              >
                {publishLabel}
              </Badge>
            )}
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

        {/* Actions */}
        <HStack gap={1} flexShrink={0}>
          <Button
            size="sm"
            colorPalette="green"
            variant="solid"
            borderRadius="full"
            onClick={onManage}
            display={{ base: 'none', md: 'inline-flex' }}
            loading={deleting}
          >
            <Settings size={14} style={{ marginRight: 6 }} />
            {t('card.manage')}
          </Button>
          <IconButton
            aria-label={t('card.openPublic')}
            variant="ghost"
            size="sm"
            onClick={onOpenPublic}
          >
            <ExternalLink size={16} />
          </IconButton>
          <MenuRoot positioning={{ placement: 'bottom-end' }}>
            <MenuTrigger asChild>
              <IconButton
                aria-label={t('card.moreActions')}
                variant="ghost"
                size="sm"
                loading={deleting}
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
                  <MenuItem value="manage" onClick={onManage}>
                    <HStack gap={2}>
                      <Settings size={16} />
                      <Text>{t('card.manage')}</Text>
                    </HStack>
                  </MenuItem>
                  <MenuItem value="delete" color="red.500" onClick={onDelete}>
                    <HStack gap={2}>
                      <Trash2 size={16} />
                      <Text>{t('card.delete')}</Text>
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

export default function HostTournamentsPage() {
  const router = useRouter();
  const t = useTranslations('pages.tournaments.hostList');
  const locale = useLocale();
  const dateLocale = locale === 'vi' ? viLocale : locale === 'cn' ? zhCN : enUS;

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await TournamentService.getMyTournaments();
      setTournaments(data);
    } catch (error: unknown) {
      console.error('Failed to load tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      setDeleting(id);
      await TournamentService.deleteTournament(id);
      setTournaments((prev) => prev.filter((x) => x.id !== id));
      toaster.success({ title: t('deleted') });
    } catch (error: unknown) {
      console.error('Failed to delete tournament:', error);
      toaster.error({ title: t('deleteFailed') });
    } finally {
      setDeleting(null);
    }
  };

  const stats = useMemo(() => {
    return {
      total: tournaments.length,
      draft: tournaments.filter((x) => x.status === TournamentStatus.PREPARING)
        .length,
      inProgress: tournaments.filter(
        (x) => x.status === TournamentStatus.IN_PROGRESS
      ).length,
      finished: tournaments.filter(
        (x) => x.status === TournamentStatus.FINISHED
      ).length,
      cancelled: tournaments.filter(
        (x) => x.status === TournamentStatus.CANCELLED
      ).length,
    };
  }, [tournaments]);

  const filtered = useMemo(() => {
    return tournaments.filter((x) => {
      const matchesSearch = x.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ? true : x.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tournaments, search, statusFilter]);

  const statusLabelFor = (status: TournamentStatus): string => {
    switch (status) {
      case TournamentStatus.PREPARING:
        return t('filters.draft');
      case TournamentStatus.IN_PROGRESS:
        return t('filters.inProgress');
      case TournamentStatus.FINISHED:
        return t('filters.finished');
      case TournamentStatus.CANCELLED:
        return t('filters.cancelled');
      default:
        return '';
    }
  };

  const handleCreate = () => router.push(ROUTES.HOST.TOURNAMENTS.NEW);

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <PageLayout title={t('pageTitle')} mobileIcon={<Trophy size={20} />}>
        {/* Hero */}
        <Box
          mb={6}
          p={{ base: 5, md: 6 }}
          borderRadius="2xl"
          position="relative"
          overflow="hidden"
          style={{
            background:
              'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 45%, #ffffff 100%)',
          }}
          borderWidth="1px"
          borderColor="green.100"
          _dark={{
            borderColor: 'green.900',
          }}
        >
          {/* decorative blob */}
          <Box
            position="absolute"
            top="-40px"
            right="-40px"
            w="180px"
            h="180px"
            borderRadius="full"
            opacity={0.35}
            style={{
              background:
                'radial-gradient(circle, rgba(16,185,129,0.45) 0%, rgba(16,185,129,0) 70%)',
            }}
            pointerEvents="none"
          />
          <Flex
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            gap={4}
            direction={{ base: 'column', md: 'row' }}
            position="relative"
          >
            <HStack gap={3} align="center">
              <Flex
                w={{ base: '44px', md: '52px' }}
                h={{ base: '44px', md: '52px' }}
                borderRadius="xl"
                align="center"
                justify="center"
                bg="green.500"
                color="white"
                boxShadow="md"
              >
                <Trophy size={24} />
              </Flex>
              <Box>
                <Text
                  fontSize={{ base: 'xl', md: '2xl' }}
                  fontWeight="bold"
                  lineHeight="1.1"
                  color="fg"
                >
                  {t('pageTitle')}
                </Text>
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color="fg.muted"
                  mt={1}
                  maxW="520px"
                >
                  {t('subtitle')}
                </Text>
              </Box>
            </HStack>
            <Button
              colorPalette="green"
              size="md"
              borderRadius="full"
              onClick={handleCreate}
              boxShadow="md"
              alignSelf={{ base: 'stretch', md: 'auto' }}
            >
              <Plus size={18} style={{ marginRight: 6 }} />
              {t('newTournament')}
            </Button>
          </Flex>
        </Box>

        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mb={6}>
          <StatCard
            icon={<Sparkles size={20} />}
            label={t('stats.total')}
            value={stats.total}
            accent="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          />
          <StatCard
            icon={<FileText size={20} />}
            label={t('stats.draft')}
            value={stats.draft}
            accent="linear-gradient(135deg, #94a3b8 0%, #64748b 100%)"
          />
          <StatCard
            icon={<PlayCircle size={20} />}
            label={t('stats.inProgress')}
            value={stats.inProgress}
            accent="linear-gradient(135deg, #34d399 0%, #059669 100%)"
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            label={t('stats.finished')}
            value={stats.finished}
            accent="linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)"
          />
        </SimpleGrid>

        {/* Search + filter pills */}
        <Box mb={4}>
          <Box mx={{ base: '-16px', md: 0 }}>
            <AppSearchBar
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={setSearch}
              showFilter={false}
            />
          </Box>
          <HStack
            gap={2}
            mt={4}
            flexWrap="wrap"
            overflowX={{ base: 'auto', md: 'visible' }}
          >
            <FilterPill
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              label={t('filters.all')}
              count={stats.total}
            />
            <FilterPill
              active={statusFilter === TournamentStatus.PREPARING}
              onClick={() => setStatusFilter(TournamentStatus.PREPARING)}
              label={t('filters.draft')}
              count={stats.draft}
            />
            <FilterPill
              active={statusFilter === TournamentStatus.IN_PROGRESS}
              onClick={() => setStatusFilter(TournamentStatus.IN_PROGRESS)}
              label={t('filters.inProgress')}
              count={stats.inProgress}
            />
            <FilterPill
              active={statusFilter === TournamentStatus.FINISHED}
              onClick={() => setStatusFilter(TournamentStatus.FINISHED)}
              label={t('filters.finished')}
              count={stats.finished}
            />
            {stats.cancelled > 0 && (
              <FilterPill
                active={statusFilter === TournamentStatus.CANCELLED}
                onClick={() => setStatusFilter(TournamentStatus.CANCELLED)}
                label={t('filters.cancelled')}
                count={stats.cancelled}
              />
            )}
          </HStack>
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
              {search || statusFilter !== 'all'
                ? t('noResultsTitle')
                : t('emptyTitle')}
            </Text>
            <Text color="fg.muted" maxW="420px">
              {search || statusFilter !== 'all'
                ? t('noResultsDesc')
                : t('emptyDesc')}
            </Text>
            {!search && statusFilter === 'all' && (
              <Button
                colorPalette="green"
                borderRadius="full"
                onClick={handleCreate}
                mt={2}
              >
                <Plus size={16} style={{ marginRight: 6 }} />
                {t('createFirst')}
              </Button>
            )}
          </Flex>
        ) : (
          <VStack gap={3} align="stretch">
            {filtered.map((tournament) => (
              <TournamentRow
                key={tournament.id}
                tournament={tournament}
                deleting={deleting === tournament.id}
                onManage={() => router.push(`/tournament/${tournament.slug}`)}
                onOpenPublic={() =>
                  router.push(`/tournament/${tournament.slug}`)
                }
                onDelete={() => handleDelete(tournament.id)}
                dateFormatted={format(
                  new Date(tournament.startDate),
                  'EEE, MMM d, yyyy',
                  { locale: dateLocale }
                )}
                statusLabel={statusLabelFor(tournament.status)}
                publishLabel={t('card.draftBadge')}
                t={t}
              />
            ))}
          </VStack>
        )}
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
