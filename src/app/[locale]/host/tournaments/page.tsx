'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  VStack,
  Input,
  Separator,
  Spinner,
} from '@chakra-ui/react';
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { TournamentService } from '@/lib/api/tournament.service';
import { Tournament, TournamentStatus, UserRole } from '@/lib/api/types';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import {
  Trophy,
  Plus,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  Settings,
  Trash2,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { toaster } from '@/components/ui/toaster';

function TournamentIcon() {
  return (
    <Box
      w="56px"
      h="56px"
      borderRadius="lg"
      bg="bg.muted"
      _dark={{ bg: 'gray.700' }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexShrink={0}
    >
      <Trophy size={24} color="var(--chakra-colors-gray-500)" />
    </Box>
  );
}

function StatusBadge({ status }: { status: TournamentStatus }) {
  const colorMap: Record<TournamentStatus, string> = {
    [TournamentStatus.PREPARING]: 'gray',
    [TournamentStatus.IN_PROGRESS]: 'green',
    [TournamentStatus.FINISHED]: 'blue',
    [TournamentStatus.CANCELLED]: 'red',
  };
  const labelMap: Record<TournamentStatus, string> = {
    [TournamentStatus.PREPARING]: 'Draft',
    [TournamentStatus.IN_PROGRESS]: 'In Progress',
    [TournamentStatus.FINISHED]: 'Finished',
    [TournamentStatus.CANCELLED]: 'Cancelled',
  };
  return (
    <Badge colorPalette={colorMap[status]} size="sm">
      {labelMap[status]}
    </Badge>
  );
}

export default function HostTournamentsPage() {
  const router = useRouter();
  const t = useTranslations('pages.tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await TournamentService.getMyTournaments();
      setTournaments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    try {
      setDeleting(id);
      await TournamentService.deleteTournament(id);
      setTournaments((prev) => prev.filter((t) => t.id !== id));
      toaster.success({ title: 'Tournament deleted' });
    } catch (err) {
      toaster.error({ title: 'Failed to delete tournament' });
    } finally {
      setDeleting(null);
    }
  };

  const filtered = tournaments.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <PageLayout
        title="Tournaments"
        rightContent={
          <MenuRoot>
            <MenuTrigger asChild>
              <Button colorPalette="gray" size="sm">
                New tournament <ChevronDown size={14} />
              </Button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem
                value="create"
                onClick={() => router.push(ROUTES.HOST.TOURNAMENTS.NEW)}
              >
                <Plus size={16} />
                Create new
              </MenuItem>
            </MenuContent>
          </MenuRoot>
        }
      >
        {/* Search */}
        <Flex gap={3} mb={4}>
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg="bg.muted"
            _dark={{ bg: 'gray.800' }}
            border="none"
            flex={1}
          />
          <Button variant="outline" size="md">
            Filter
          </Button>
        </Flex>

        <Separator mb={4} />

        {/* List */}
        {loading ? (
          <Flex justify="center" py={16}>
            <Spinner size="xl" />
          </Flex>
        ) : filtered.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={16}
            gap={3}
          >
            <Trophy size={48} color="var(--chakra-colors-gray-300)" />
            <Text color="fg.muted">
              {search ? 'No tournaments found' : 'No tournaments yet'}
            </Text>
            {!search && (
              <Button
                size="sm"
                colorPalette="green"
                onClick={() => router.push(ROUTES.HOST.TOURNAMENTS.NEW)}
              >
                <Plus size={16} />
                Create your first tournament
              </Button>
            )}
          </Flex>
        ) : (
          <VStack gap={0} align="stretch">
            {filtered.map((tournament, index) => (
              <Box key={tournament.id}>
                {index > 0 && <Separator />}
                <Flex
                  py={4}
                  px={1}
                  align="center"
                  gap={4}
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.800/50' } }}
                  borderRadius="md"
                  transition="background 0.15s"
                >
                  <TournamentIcon />

                  {/* Name + Date */}
                  <Box flex={1} minW={0}>
                    <Text fontWeight="semibold" truncate>
                      {tournament.name}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      {format(
                        new Date(tournament.startDate),
                        'EEE, MMM d, yyyy'
                      )}
                    </Text>
                  </Box>

                  {/* Status */}
                  <StatusBadge status={tournament.status} />

                  {/* Team count */}
                  {tournament._count && (
                    <VStack
                      gap={0}
                      align="center"
                      minW="50px"
                      display={{ base: 'none', sm: 'flex' }}
                    >
                      <Text fontWeight="semibold">
                        {tournament._count.categories}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Categories
                      </Text>
                    </VStack>
                  )}

                  {/* External link */}
                  <IconButton
                    aria-label="Open tournament"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(`/tournament/${tournament.slug}`)
                    }
                  >
                    <ExternalLink size={16} />
                  </IconButton>

                  {/* Actions menu */}
                  <MenuRoot positioning={{ placement: 'bottom-end' }}>
                    <MenuTrigger asChild>
                      <IconButton
                        aria-label="More actions"
                        variant="ghost"
                        size="sm"
                        loading={deleting === tournament.id}
                      >
                        <MoreHorizontal size={16} />
                      </IconButton>
                    </MenuTrigger>
                    <MenuContent minW="160px">
                      <MenuItem
                        value="manage"
                        onClick={() =>
                          router.push(`/tournament/${tournament.slug}`)
                        }
                      >
                        <HStack gap={2}>
                          <Settings size={16} />
                          <Text>Manage</Text>
                        </HStack>
                      </MenuItem>
                      <MenuItem
                        value="delete"
                        color="red.500"
                        onClick={() => handleDelete(tournament.id)}
                      >
                        <HStack gap={2}>
                          <Trash2 size={16} />
                          <Text>Delete</Text>
                        </HStack>
                      </MenuItem>
                    </MenuContent>
                  </MenuRoot>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
