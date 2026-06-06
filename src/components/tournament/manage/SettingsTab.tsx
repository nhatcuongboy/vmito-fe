'use client';

import { VStack } from '@/components/ui/chakra-compat';
import {
  Pencil,
  Calendar,
  MapPin,
  Globe,
  Image,
  Copy,
  Trash2,
  Phone,
  ShieldCheck,
  Youtube,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Tournament } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
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
  const locale = useLocale();
  const { user } = useAuthStore();
  const isHostOrAdmin =
    user?.id === tournament.hostId || user?.role === 'ADMIN';

  const formattedDate = new Date(tournament.startDate).toLocaleDateString(
    locale,
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

      {/* Banner */}
      <ManageMenuItem
        icon={Image}
        title={t('settings.banner.title')}
        description={t('settings.banner.description')}
        isActive={selectedItem === 'banner'}
        onClick={() => onItemClick('banner')}
      />

      <ManageMenuItem
        icon={Youtube}
        title={t('settings.videos.title')}
        description={t('settings.videos.description')}
        isActive={selectedItem === 'videos'}
        onClick={() => onItemClick('videos')}
      />

      {/* Contact */}
      <ManageMenuItem
        icon={Phone}
        title={t('settings.contact.title')}
        description={
          tournament.contactName ||
          tournament.contactEmail ||
          tournament.contactPhone ||
          t('settings.contact.description')
        }
        isActive={selectedItem === 'contact'}
        onClick={() => onItemClick('contact')}
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
