'use client';

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
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament, Category } from '@/lib/api/types';
import ManageMenuItem from './ManageMenuItem';
import PublishStatusBanner from './PublishStatusBanner';
import { getPrimaryVenueDisplay } from '@/utils';

interface OrganizeTabProps {
  tournament: Tournament;
  categories: Category[];
  selectedItem: string | null;
  onItemClick: (item: string) => void;
  onTournamentUpdate: (updated: Tournament) => void;
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

  const totalRegistrations = categories.reduce(
    (sum, cat) => sum + (cat._count?.registrations || 0),
    0
  );

  return (
    <VStack gap={2.5} align="stretch">
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
        description={t('organize.categories.description')}
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
        description={
          getPrimaryVenueDisplay(tournament)?.name ||
          t('organize.venues.noVenue')
        }
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
