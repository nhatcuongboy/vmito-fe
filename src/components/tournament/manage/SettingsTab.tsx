'use client';

import { VStack } from '@/components/ui/chakra-compat';
import {
  UserCog,
  Pencil,
  Calendar,
  MapPin,
  Globe,
  Link,
  Image,
  FileText,
  Copy,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import ManageMenuItem from './ManageMenuItem';

interface SettingsTabProps {
  tournament: Tournament;
  selectedItem: string | null;
  onItemClick: (item: string) => void;
}

export default function SettingsTab({
  tournament,
  selectedItem,
  onItemClick,
}: SettingsTabProps) {
  const t = useTranslations('pages.tournaments.detail.manage');

  const formattedDate = new Date(tournament.startDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );

  const location = tournament.venue
    ? `${tournament.venue.city || tournament.venue.address}${tournament.venue.newCity && tournament.venue.newCity !== tournament.venue.city ? ` (${tournament.venue.newCity})` : ''}`
    : undefined;

  return (
    <VStack gap={3} align="stretch">
      {/* Admins */}
      <ManageMenuItem
        icon={UserCog}
        title={t('settings.admins.title')}
        description={t('settings.admins.description')}
        isActive={selectedItem === 'admins'}
        onClick={() => onItemClick('admins')}
      />

      {/* Name */}
      <ManageMenuItem
        icon={Pencil}
        title={t('settings.name.title')}
        description={tournament.name}
        isActive={selectedItem === 'name'}
        onClick={() => onItemClick('name')}
      />

      {/* Dates */}
      <ManageMenuItem
        icon={Calendar}
        title={t('settings.dates.title')}
        description={formattedDate}
        isActive={selectedItem === 'dates'}
        onClick={() => onItemClick('dates')}
      />

      {/* Location */}
      <ManageMenuItem
        icon={MapPin}
        title={t('settings.location.title')}
        description={location || t('settings.location.noLocation')}
        isActive={selectedItem === 'location'}
        onClick={() => onItemClick('location')}
      />

      {/* Visibility */}
      <ManageMenuItem
        icon={Globe}
        title={t('settings.visibility.title')}
        description={t('settings.visibility.description')}
        isActive={selectedItem === 'visibility'}
        onClick={() => onItemClick('visibility')}
      />

      {/* Custom link */}
      <ManageMenuItem
        icon={Link}
        title={t('settings.customLink.title')}
        description={`tourny.ca/t/${tournament.slug}`}
        isActive={selectedItem === 'customLink'}
        onClick={() => onItemClick('customLink')}
      />

      {/* Banner */}
      <ManageMenuItem
        icon={Image}
        title={t('settings.banner.title')}
        description={t('settings.banner.description')}
        isActive={selectedItem === 'banner'}
        onClick={() => onItemClick('banner')}
      />

      {/* Rosters */}
      <ManageMenuItem
        icon={FileText}
        title={t('settings.rosters.title')}
        description={t('settings.rosters.description')}
        isActive={selectedItem === 'rosters'}
        onClick={() => onItemClick('rosters')}
      />

      {/* Duplicate tournament */}
      <ManageMenuItem
        icon={Copy}
        title={t('settings.duplicate.title')}
        description={t('settings.duplicate.description')}
        isActive={selectedItem === 'duplicate'}
        onClick={() => onItemClick('duplicate')}
      />

      {/* Delete tournament */}
      <ManageMenuItem
        icon={Trash2}
        title={t('settings.delete.title')}
        description={t('settings.delete.description')}
        variant="danger"
        isActive={selectedItem === 'delete'}
        onClick={() => onItemClick('delete')}
      />
    </VStack>
  );
}
