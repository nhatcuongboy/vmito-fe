'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { Box, Flex, Text, Heading, Badge } from '@chakra-ui/react';
import {
  Button,
  IconButton,
  Input,
  SimpleGrid,
  VStack,
} from '@/components/ui/chakra-compat';
import { Checkbox } from '@/components/ui/checkbox';
import { toaster } from '@/components/ui/toaster';
import { useTranslations } from 'next-intl';
import { Plus, Link2, Unlink, Trash2, UserCheck } from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import { CategoryMatch, Tournament, TournamentUmpire } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import LinkUmpireAccountModal from './LinkUmpireAccountModal';
import { TournamentMatchListSkeleton } from '@/components/tournament/skeletons';

interface Props {
  tournament: Tournament;
}

export default function UmpiresPanel({ tournament }: Props) {
  const t = useTranslations('pages.tournaments.umpires');
  const tRounds = useTranslations('pages.tournaments.umpires.rounds');

  const [umpires, setUmpires] = useState<TournamentUmpire[]>([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [linkTarget, setLinkTarget] = useState<TournamentUmpire | null>(null);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(
    () => new Set()
  );
  const [bulkRefereeId, setBulkRefereeId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [byCourtId, setByCourtId] = useState('');
  const [byCourtRefereeId, setByCourtRefereeId] = useState('');

  const loadAll = useCallback(async () => {
    const [u, m] = await Promise.all([
      TournamentService.getUmpires(tournament.id),
      TournamentService.getAllMatches(tournament.id),
    ]);
    setUmpires(u);
    setMatches(m);
  }, [tournament.id]);

  useEffect(() => {
    void loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  useEffect(() => {
    const availableMatchIds = new Set(matches.map((match) => match.id));
    setSelectedMatchIds(
      (current) =>
        new Set(
          [...current].filter((matchId) => availableMatchIds.has(matchId))
        )
    );
  }, [matches]);

  const selectedMatches = useMemo(
    () => matches.filter((match) => selectedMatchIds.has(match.id)),
    [matches, selectedMatchIds]
  );

  const allMatchesSelected =
    matches.length > 0 && selectedMatchIds.size === matches.length;
  const linkedUmpires = umpires.filter((umpire) => umpire.userId).length;
  const assignedMatches = matches.filter((match) => match.refereeId).length;

  // Distinct courts that currently have scheduled matches, sorted by number.
  const courtsInMatches = useMemo(() => {
    const map = new Map<
      string,
      { id: string; courtNumber: number; courtName?: string }
    >();
    matches.forEach((match) => {
      if (match.courtId && match.court) {
        map.set(match.courtId, {
          id: match.courtId,
          courtNumber: match.court.courtNumber,
          courtName: match.court.courtName ?? undefined,
        });
      }
    });
    return [...map.values()].sort((a, b) => a.courtNumber - b.courtNumber);
  }, [matches]);

  const byCourtMatchCount = useMemo(
    () =>
      byCourtId
        ? matches.filter((match) => match.courtId === byCourtId).length
        : 0,
    [matches, byCourtId]
  );

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await TournamentService.addUmpire(tournament.id, {
        name: name.trim(),
        email: email.trim() || undefined,
      });
      setName('');
      setEmail('');
      await loadAll();
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await TournamentService.deleteUmpire(id);
    await loadAll();
  };

  const handleUnlink = async (id: string) => {
    await TournamentService.unlinkUmpireAccount(id);
    await loadAll();
  };

  const handleAssign = async (matchId: string, refereeId: string) => {
    if (refereeId) {
      await CategoryService.assignReferee(matchId, refereeId);
    } else {
      await CategoryService.unassignReferee(matchId);
    }
    await loadAll();
  };

  const handleToggleMatch = (matchId: string, checked: boolean) => {
    setSelectedMatchIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(matchId);
      } else {
        next.delete(matchId);
      }
      return next;
    });
  };

  const handleToggleAllMatches = (checked: boolean) => {
    setSelectedMatchIds(
      checked ? new Set(matches.map((match) => match.id)) : new Set()
    );
  };

  const assignRefereeToMatches = async (
    matchIds: string[],
    refereeId: string
  ) => {
    if (!refereeId || matchIds.length === 0) return;

    setBulkAssigning(true);
    try {
      await Promise.all(
        matchIds.map((matchId) =>
          CategoryService.assignReferee(matchId, refereeId, {
            showToast: false,
          })
        )
      );
      toaster.success({
        title: t('bulkAssignSuccess', { count: matchIds.length }),
      });
      setSelectedMatchIds(new Set());
      await loadAll();
    } finally {
      setBulkAssigning(false);
    }
  };

  const handleBulkAssign = async () => {
    await assignRefereeToMatches(
      selectedMatches.map((match) => match.id),
      bulkRefereeId
    );
  };

  const handleAssignAll = async () => {
    await assignRefereeToMatches(
      matches.map((match) => match.id),
      bulkRefereeId
    );
  };

  const handleAssignByCourt = async () => {
    const matchIds = matches
      .filter((match) => match.courtId === byCourtId)
      .map((match) => match.id);
    await assignRefereeToMatches(matchIds, byCourtRefereeId);
  };

  if (loading) {
    return <TournamentMatchListSkeleton count={5} />;
  }

  return (
    <VStack align="stretch" gap={6}>
      <Box>
        <Heading size="md" mb={1}>
          {t('title')}
        </Heading>
        <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
          {t('description')}
        </Text>
      </Box>

      {/* Add referee */}
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="white"
        p={{ base: 4, md: 5 }}
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      >
        <SimpleGrid columns={{ base: 1, lg: 3 }} gap={3} alignItems="end">
          <Input
            placeholder={t('name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            colorPalette="blue"
            onClick={() => void handleAdd()}
            loading={adding}
            disabled={!name.trim()}
            w="100%"
          >
            <Plus size={16} /> {t('addReferee')}
          </Button>
        </SimpleGrid>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
        <StatTile label={t('title')} value={umpires.length} />
        <StatTile label={t('linked')} value={linkedUmpires} />
        <StatTile label={t('assignReferee')} value={assignedMatches} />
      </SimpleGrid>

      {/* Roster */}
      <VStack align="stretch" gap={3}>
        <Flex align="center" justify="space-between" gap={3}>
          <Heading size="sm">{t('title')}</Heading>
          <Badge colorPalette="gray" borderRadius="full">
            {umpires.length}
          </Badge>
        </Flex>

        {umpires.length === 0 ? (
          <EmptyCard>{t('noReferees')}</EmptyCard>
        ) : (
          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={3}>
            {umpires.map((u) => (
              <Flex
                key={u.id}
                align={{ base: 'stretch', sm: 'center' }}
                justify="space-between"
                direction={{ base: 'column', sm: 'row' }}
                gap={3}
                p={4}
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
                borderRadius="xl"
                bg="white"
              >
                <Box flex="1" minW={0}>
                  <Text fontWeight="bold" fontSize="md" lineClamp={1}>
                    {u.name}
                  </Text>
                  {u.userId ? (
                    <Badge
                      colorPalette="green"
                      mt={2}
                      maxW="100%"
                      borderRadius="md"
                    >
                      <Flex align="center" gap={1} minW={0}>
                        <UserCheck size={12} />
                        <Text as="span" truncate>
                          {t('linkedTo', {
                            email: u.user?.email ?? u.email ?? '',
                          })}
                        </Text>
                      </Flex>
                    </Badge>
                  ) : (
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      mt={1}
                      _dark={{ color: 'gray.400' }}
                    >
                      {t('notLinked')}
                    </Text>
                  )}
                </Box>

                <Flex align="center" gap={2} flexShrink={0}>
                  {u.userId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="green"
                      onClick={() => void handleUnlink(u.id)}
                    >
                      <Unlink size={14} /> {t('unlinkAccount')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLinkTarget(u)}
                    >
                      <Link2 size={14} /> {t('linkAccount')}
                    </Button>
                  )}
                  <IconButton
                    aria-label={t('delete')}
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => void handleDelete(u.id)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </Flex>
              </Flex>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Match assignments */}
      <VStack align="stretch" gap={3}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Box>
            <Heading size="sm">{t('assignReferee')}</Heading>
            <Text
              fontSize="sm"
              color="gray.500"
              mt={1}
              _dark={{ color: 'gray.400' }}
            >
              {t('selectedMatches', { count: selectedMatchIds.size })}
            </Text>
          </Box>
        </Flex>

        <Box
          p={{ base: 4, md: 5 }}
          borderWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
          borderRadius="xl"
          bg="gray.50"
        >
          <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} gap={3}>
            <Checkbox
              checked={allMatchesSelected}
              onCheckedChange={(details) =>
                handleToggleAllMatches(details.checked === true)
              }
              disabled={matches.length === 0 || bulkAssigning}
            >
              <Text fontSize="sm" fontWeight="medium">
                {t('selectAll')}
              </Text>
            </Checkbox>

            <NativeSelect
              value={bulkRefereeId}
              onChange={(e) => setBulkRefereeId(e.target.value)}
              disabled={umpires.length === 0 || bulkAssigning}
              aria-label={t('selectReferee')}
            >
              <option value="">{t('selectReferee')}</option>
              {umpires.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {!u.userId ? ' (!)' : ''}
                </option>
              ))}
            </NativeSelect>

            <Button
              colorPalette="blue"
              onClick={() => void handleBulkAssign()}
              loading={bulkAssigning}
              disabled={
                selectedMatchIds.size === 0 || !bulkRefereeId || bulkAssigning
              }
              w="100%"
            >
              {t('applyToSelected')}
            </Button>
            <Button
              variant="outline"
              colorPalette="green"
              onClick={() => void handleAssignAll()}
              loading={bulkAssigning}
              disabled={matches.length === 0 || !bulkRefereeId || bulkAssigning}
              w="100%"
            >
              {t('applyToAll')}
            </Button>
            <Button
              variant="ghost"
              colorPalette="gray"
              onClick={() => setSelectedMatchIds(new Set())}
              disabled={selectedMatchIds.size === 0 || bulkAssigning}
              w="100%"
            >
              {t('clearSelection')}
            </Button>
          </SimpleGrid>
        </Box>

        {/* Assign by court */}
        <Box
          p={{ base: 4, md: 5 }}
          borderWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
          borderRadius="xl"
          bg="gray.50"
        >
          <Box mb={3}>
            <Heading size="sm">{t('assignByCourt')}</Heading>
            <Text
              fontSize="sm"
              color="gray.500"
              mt={1}
              _dark={{ color: 'gray.400' }}
            >
              {t('assignByCourtDesc')}
            </Text>
          </Box>

          {courtsInMatches.length === 0 ? (
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {t('noCourtMatches')}
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
              <NativeSelect
                value={byCourtId}
                onChange={(e) => setByCourtId(e.target.value)}
                disabled={bulkAssigning}
                aria-label={t('selectCourt')}
              >
                <option value="">{t('selectCourt')}</option>
                {courtsInMatches.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.courtName || `${t('court')} ${court.courtNumber}`}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                value={byCourtRefereeId}
                onChange={(e) => setByCourtRefereeId(e.target.value)}
                disabled={umpires.length === 0 || bulkAssigning}
                aria-label={t('selectReferee')}
              >
                <option value="">{t('selectReferee')}</option>
                {umpires.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                    {!u.userId ? ' (!)' : ''}
                  </option>
                ))}
              </NativeSelect>

              <Button
                colorPalette="blue"
                onClick={() => void handleAssignByCourt()}
                loading={bulkAssigning}
                disabled={
                  !byCourtId ||
                  !byCourtRefereeId ||
                  byCourtMatchCount === 0 ||
                  bulkAssigning
                }
                w="100%"
              >
                {t('applyToCourt')}
                {byCourtMatchCount > 0
                  ? ` (${t('courtMatchesCount', { count: byCourtMatchCount })})`
                  : ''}
              </Button>
            </SimpleGrid>
          )}
        </Box>

        <VStack align="stretch" gap={3}>
          {matches.length === 0 ? (
            <EmptyCard>{t('noMatches')}</EmptyCard>
          ) : (
            matches.map((m) => (
              <Flex
                key={m.id}
                align={{ base: 'stretch', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                gap={3}
                p={4}
                borderWidth="1px"
                borderColor={
                  selectedMatchIds.has(m.id) ? 'green.300' : 'gray.200'
                }
                _dark={{
                  borderColor: selectedMatchIds.has(m.id)
                    ? 'green.600'
                    : 'gray.700',
                  bg: 'gray.800',
                }}
                borderRadius="xl"
                bg={selectedMatchIds.has(m.id) ? 'green.50' : 'white'}
                transition="border-color 0.15s, background 0.15s"
              >
                <Flex align="flex-start" gap={3} flex="1" minW={0}>
                  <Checkbox
                    checked={selectedMatchIds.has(m.id)}
                    onCheckedChange={(details) =>
                      handleToggleMatch(m.id, details.checked === true)
                    }
                    disabled={bulkAssigning}
                    aria-label={t('selectMatch')}
                  />
                  <Box minW={0} flex="1">
                    <Flex gap={2} align="center" mb={1} wrap="wrap">
                      {m.court && (
                        <Badge colorPalette="blue" fontSize="xs">
                          {t('court')} {m.court.courtNumber}
                        </Badge>
                      )}
                      <Badge variant="subtle" colorPalette="gray" fontSize="xs">
                        {getRoundDisplayLabel(m.round, tRounds)}
                      </Badge>
                    </Flex>
                    <Text fontSize="md" fontWeight="semibold" lineClamp={2}>
                      {getTeamLabel(m, 1)} - {getTeamLabel(m, 2)}
                    </Text>
                  </Box>
                </Flex>

                <Box w={{ base: '100%', md: '280px' }} flexShrink={0}>
                  <NativeSelect
                    value={m.refereeId ?? ''}
                    onChange={(e) => void handleAssign(m.id, e.target.value)}
                    aria-label={t('assignReferee')}
                  >
                    <option value="">{t('noReferee')}</option>
                    {umpires.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                        {!u.userId ? ' (!)' : ''}
                      </option>
                    ))}
                  </NativeSelect>
                </Box>
              </Flex>
            ))
          )}
        </VStack>
      </VStack>

      <LinkUmpireAccountModal
        isOpen={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        umpire={linkTarget}
        onLinked={() => void loadAll()}
      />
    </VStack>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="white"
      px={4}
      py={3}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <Text
        fontSize="xs"
        color="gray.500"
        fontWeight="medium"
        lineClamp={1}
        _dark={{ color: 'gray.400' }}
      >
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" lineHeight={1.2}>
        {value}
      </Text>
    </Box>
  );
}

function EmptyCard({ children }: { children: ReactNode }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="gray.50"
      p={5}
      textAlign="center"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <Text color="gray.500" fontSize="sm" _dark={{ color: 'gray.400' }}>
        {children}
      </Text>
    </Box>
  );
}

function NativeSelect({
  children,
  style,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        height: '44px',
        paddingInline: '12px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--chakra-colors-gray-200)',
        borderRadius: 'var(--chakra-radii-lg)',
        background: 'var(--chakra-colors-white)',
        color: 'var(--chakra-colors-gray-900)',
        fontSize: '14px',
        outline: 'none',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.55 : 1,
        ...style,
      }}
    >
      {children}
    </select>
  );
}
