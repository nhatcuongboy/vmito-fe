'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  VStack,
  Separator,
  Spinner,
} from '@chakra-ui/react';
import {
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
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';
import { AppSearchBar } from '@/components/common/AppSearchBar';
import {
  Trophy,
  Plus,
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
    } catch (error: unknown) {
      console.error('Failed to load tournaments:', error);
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
    } catch (error: unknown) {
      console.error('Failed to delete tournament:', error);
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
      <PageLayout title="Tournaments">
        {/* Search Bar */}
        <Box
          position="sticky"
          top={{
            base: `${TOP_BAR_HEIGHT_MOBILE}px`,
            md: `${TOP_BAR_HEIGHT_DESKTOP}px`,
          }}
          left={0}
          right={0}
          width="100vw"
          marginLeft="calc(50% - 50vw)"
          zIndex={1100}
          bg="transparent"
          py={2}
          transition="all 0.2s"
        >
          <Flex align="center" gap={2} w="100%" maxW="650px" mx="auto">
            <Box flex={1} w="100%">
              <AppSearchBar
                placeholder="Search tournaments..."
                value={search}
                onChange={setSearch}
                showFilter={false}
              />
            </Box>
          </Flex>
        </Box>

        {/* Section Header */}
        <Flex justify="space-between" align="center" mb={4} mt={2}>
          <Text fontSize="lg" fontWeight="bold" color="fg">
            My Tournaments
          </Text>

          <Button
            colorPalette="green"
            size="sm"
            borderRadius="full"
            onClick={() => router.push(ROUTES.HOST.TOURNAMENTS.NEW)}
          >
            <Plus size={16} style={{ marginRight: '4px' }} />
            New tournament
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
          <VStack gap={4} align="stretch">
            {filtered.map((tournament) => (
              <Box key={tournament.id}>
                <Flex
                  p={4}
                  align="center"
                  gap={4}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderWidth="1px"
                  borderColor="gray.100"
                  boxShadow="sm"
                  borderRadius="xl"
                  transition="all 0.2s"
                  _hover={{
                    boxShadow: 'md',
                    transform: 'translateY(-2px)',
                  }}
                >
                  <TournamentIcon />

                  {/* Name + Date */}
                  <Box flex={1} minW={0}>
                    <Text fontWeight="semibold" truncate>
                      {tournament.name}
                    </Text>
                    <Text fontSize="sm" color="fg.muted" truncate>
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
                  <Box position="relative" flexShrink={0} w="32px">
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
                      <Portal>
                        <MenuPositioner zIndex={2000}>
                          <MenuContent
                            minW="160px"
                            zIndex={2001}
                            bg="white"
                            _dark={{ bg: 'gray.800' }}
                            boxShadow="lg"
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor="gray.200"
                            _hover={{}}
                          >
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
                        </MenuPositioner>
                      </Portal>
                    </MenuRoot>
                  </Box>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
