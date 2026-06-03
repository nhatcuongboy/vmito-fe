'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { VStack } from '@/components/ui/chakra-compat';
import {
  Users,
  UserCog,
  Layers,
  Workflow,
  BarChart3,
  GitBranch,
  MapPin,
  Calendar,
  Heart,
  Gavel,
  ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament, Category } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import ManageMenuItem from './ManageMenuItem';
import PublishStatusBanner from './PublishStatusBanner';

interface OrganizeTabProps {
  tournament: Tournament;
  categories: Category[];
  selectedItem: string | null;
  onItemClick: (item: string) => void;
  onTournamentUpdate: (updated: Tournament) => void;
}

const CATEGORY_COLORS = [
  'yellow.400',
  'blue.300',
  'green.400',
  'purple.400',
  'pink.400',
  'orange.400',
  'cyan.400',
  'red.400',
];

function CategoryDotsPreview({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <Flex gap={4} flexWrap="wrap">
      {categories.map((cat, idx) => (
        <Flex key={cat.id} align="center" gap={1.5}>
          <Box
            w="8px"
            h="8px"
            borderRadius="full"
            bg={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
          />
          <Text fontSize="xs" color="gray.600">
            {cat.name}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}

export default function OrganizeTab({
  tournament,
  categories,
  selectedItem,
  onItemClick,
  onTournamentUpdate,
}: OrganizeTabProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const tu = useTranslations('pages.tournaments.umpires');
  const { user } = useAuthStore();
  const isHostOrAdmin =
    user?.id === tournament.hostId || user?.role === 'ADMIN';

  const totalRegistrations = categories.reduce(
    (sum, cat) => sum + (cat._count?.registrations || 0),
    0
  );

  return (
    <VStack gap={3} align="stretch">
      {/* Publish status banner - always visible */}
      <PublishStatusBanner
        tournament={tournament}
        onUpdate={onTournamentUpdate}
      />

      {/* Teams */}
      <ManageMenuItem
        icon={Users}
        title={t('organize.teams.title')}
        description={t('organize.teams.description', {
          count: totalRegistrations,
        })}
        isActive={selectedItem === 'teams'}
        onClick={() => onItemClick('teams')}
      />

      {/* Players */}
      <ManageMenuItem
        icon={UserCog}
        title={t('organize.players.title')}
        description={t('organize.players.description')}
        isActive={selectedItem === 'players'}
        onClick={() => onItemClick('players')}
      />

      {/* Categories */}
      <ManageMenuItem
        icon={Layers}
        title={t('organize.categories.title')}
        preview={<CategoryDotsPreview categories={categories} />}
        isActive={selectedItem === 'categories'}
        onClick={() => onItemClick('categories')}
      />

      {/* Format */}
      <ManageMenuItem
        icon={Workflow}
        title={t('organize.format.title')}
        description={t('organize.format.description')}
        // preview={<FormatPreview categories={categories} />}
        isActive={selectedItem === 'format'}
        onClick={() => onItemClick('format')}
      />

      {/* Standings */}
      <ManageMenuItem
        icon={BarChart3}
        title={t('organize.standings.title')}
        description={t('organize.standings.description')}
        isActive={selectedItem === 'standings'}
        onClick={() => onItemClick('standings')}
      />

      {/* Rounds */}
      <ManageMenuItem
        icon={GitBranch}
        title={t('organize.rounds.title')}
        description={t('organize.rounds.description')}
        isActive={selectedItem === 'rounds'}
        onClick={() => onItemClick('rounds')}
      />

      {/* Venues */}
      <ManageMenuItem
        icon={MapPin}
        title={t('organize.venues.title')}
        description={tournament.venue?.name || t('organize.venues.noVenue')}
        isActive={selectedItem === 'venues'}
        onClick={() => onItemClick('venues')}
      />

      {/* Schedule */}
      <ManageMenuItem
        icon={Calendar}
        title={t('organize.schedule.title')}
        description={t('organize.schedule.description')}
        isActive={selectedItem === 'schedule'}
        onClick={() => onItemClick('schedule')}
      />

      {/* Referees & Umpires */}
      <ManageMenuItem
        icon={Gavel}
        title={tu('title')}
        description={tu('description')}
        isActive={selectedItem === 'umpires'}
        onClick={() => onItemClick('umpires')}
      />

      {/* Tournament managers (host/admin only) */}
      {isHostOrAdmin && (
        <ManageMenuItem
          icon={ShieldCheck}
          title={t('organize.managers.title')}
          description={t('organize.managers.description')}
          isActive={selectedItem === 'managers'}
          onClick={() => onItemClick('managers')}
        />
      )}

      {/* Sponsors */}
      <ManageMenuItem
        icon={Heart}
        title={t('organize.sponsors.title')}
        description={t('organize.sponsors.description')}
        isActive={selectedItem === 'sponsors'}
        onClick={() => onItemClick('sponsors')}
      />
    </VStack>
  );
}
