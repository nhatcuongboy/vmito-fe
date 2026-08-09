'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Trophy, Users } from 'lucide-react';
import { PreviewCardBase } from './PreviewCardBase';
import { ROUTES } from '@/constants/routes';
import type { Tournament } from '@/lib/api/types';

interface ITournamentPreviewCardProps {
  tournament: Tournament;
}

const STATUS_STYLE: Record<string, string> = {
  PREPARING:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  IN_PROGRESS:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  FINISHED: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const formatDateRange = (
  start: Date | string,
  end: Date | string,
  locale: string
): string => {
  const fmt = (d: Date | string) => {
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return '--';
    return new Intl.DateTimeFormat(
      locale === 'vi' ? 'vi-VN' : locale === 'cn' ? 'zh-CN' : 'en-US',
      { day: '2-digit', month: '2-digit' }
    ).format(parsed);
  };
  return `${fmt(start)} – ${fmt(end)}`;
};

export const TournamentPreviewCard = ({
  tournament,
}: ITournamentPreviewCardProps) => {
  const t = useTranslations('previewCards');
  const locale = useLocale();

  const statusStyle = STATUS_STYLE[tournament.status] ?? STATUS_STYLE.PREPARING;
  const playerCount = tournament._count?.players ?? 0;
  const dateRange = formatDateRange(
    tournament.startDate,
    tournament.endDate,
    locale
  );

  return (
    <PreviewCardBase
      href={ROUTES.TOURNAMENT.DETAIL(tournament.slug || tournament.id)}
      image={tournament.coverPhoto}
      title={tournament.name}
      subtitle={tournament.venue?.name}
      icon={<Trophy size={24} />}
      sportType={tournament.sportType}
      metadata={
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-gray-500 dark:text-gray-400">{dateRange}</span>
          {playerCount > 0 && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Users size={12} />
              {t('playersCount', { count: playerCount })}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyle}`}
          >
            {t(`tournamentStatus.${tournament.status}`)}
          </span>
        </div>
      }
    />
  );
};
