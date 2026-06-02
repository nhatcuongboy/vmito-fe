'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Text, Heading, Badge, Spinner } from '@chakra-ui/react';
import {
  Button,
  IconButton,
  Input,
  VStack,
} from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Plus, Link2, Unlink, Trash2, UserCheck } from 'lucide-react';

import { TournamentService } from '@/lib/api/tournament.service';
import { CategoryService } from '@/lib/api/category.service';
import { CategoryMatch, Tournament, TournamentUmpire } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';
import LinkUmpireAccountModal from './LinkUmpireAccountModal';

interface Props {
  tournament: Tournament;
}

export default function UmpiresPanel({ tournament }: Props) {
  const t = useTranslations('pages.tournaments.umpires');

  const [umpires, setUmpires] = useState<TournamentUmpire[]>([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [linkTarget, setLinkTarget] = useState<TournamentUmpire | null>(null);

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

  if (loading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner />
      </Flex>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={1}>
        {t('title')}
      </Heading>
      <Text fontSize="sm" color="gray.500" mb={5}>
        {t('description')}
      </Text>

      {/* Add referee */}
      <Flex gap={2} mb={4} direction={{ base: 'column', sm: 'row' }}>
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
        >
          <Plus size={16} /> {t('addReferee')}
        </Button>
      </Flex>

      {/* Roster */}
      <VStack align="stretch" gap={2} mb={8}>
        {umpires.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            {t('noReferees')}
          </Text>
        ) : (
          umpires.map((u) => (
            <Flex
              key={u.id}
              align="center"
              gap={3}
              p={3}
              borderWidth="1px"
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
              borderRadius="lg"
            >
              <Box flex="1" minW={0}>
                <Text fontWeight="semibold">{u.name}</Text>
                {u.userId ? (
                  <Badge colorPalette="green" mt={1}>
                    <UserCheck size={12} />{' '}
                    {t('linkedTo', { email: u.user?.email ?? u.email ?? '' })}
                  </Badge>
                ) : (
                  <Text fontSize="xs" color="gray.500">
                    {t('notLinked')}
                  </Text>
                )}
              </Box>
              {u.userId ? (
                <Button
                  size="sm"
                  variant="outline"
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
          ))
        )}
      </VStack>

      {/* Match assignments */}
      <Heading size="sm" mb={3}>
        {t('assignReferee')}
      </Heading>
      <VStack align="stretch" gap={2}>
        {matches.map((m) => (
          <Flex
            key={m.id}
            align="center"
            gap={3}
            p={3}
            borderWidth="1px"
            borderColor="gray.100"
            _dark={{ borderColor: 'gray.700' }}
            borderRadius="lg"
          >
            <Box flex="1" minW={0}>
              <Flex gap={2} align="center" mb={1}>
                {m.court && (
                  <Badge colorPalette="blue" fontSize="xs">
                    {m.court.courtNumber}
                  </Badge>
                )}
                <Text fontSize="xs" color="gray.500">
                  {m.round}
                </Text>
              </Flex>
              <Text fontSize="sm" truncate>
                {getTeamLabel(m, 1)} – {getTeamLabel(m, 2)}
              </Text>
            </Box>
            <select
              value={m.refereeId ?? ''}
              onChange={(e) => void handleAssign(m.id, e.target.value)}
              style={{
                padding: '4px 8px',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--chakra-colors-gray-200)',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '160px',
                background: 'transparent',
              }}
            >
              <option value="">{t('noReferee')}</option>
              {umpires.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {!u.userId ? ' (⚠)' : ''}
                </option>
              ))}
            </select>
          </Flex>
        ))}
      </VStack>

      <LinkUmpireAccountModal
        isOpen={!!linkTarget}
        onClose={() => setLinkTarget(null)}
        umpire={linkTarget}
        onLinked={() => void loadAll()}
      />
    </Box>
  );
}
