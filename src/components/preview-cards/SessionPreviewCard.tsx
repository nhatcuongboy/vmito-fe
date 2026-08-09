'use client';

import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, MapPin } from 'lucide-react';
import { PreviewCardBase } from './PreviewCardBase';
import { ROUTES } from '@/constants/routes';
import type { ISession } from '@/lib/api/types';

const formatSessionTime = (
  input: Date | string | undefined,
  locale: string
): string => {
  if (!input) return '--';
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return '--';
  return new Intl.DateTimeFormat(
    locale === 'vi' ? 'vi-VN' : locale === 'cn' ? 'zh-CN' : 'en-US',
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  ).format(parsed);
};

interface ISessionPreviewCardProps {
  session: ISession;
}

export const SessionPreviewCard = ({ session }: ISessionPreviewCardProps) => {
  const t = useTranslations('previewCards');
  const locale = useLocale();

  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedCount = session._count?.players ?? 0;
  const availableSlots = Math.max(maxPlayers - approvedCount, 0);

  const locationName =
    session.venue?.name || session.customLocationName || session.location;

  return (
    <PreviewCardBase
      href={ROUTES.SESSIONS.DETAIL(session.id, session.slug)}
      image={session.coverPhoto}
      title={session.name}
      subtitle={locationName}
      icon={<CalendarDays size={24} />}
      sportType={session.sportType}
      metadata={
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {session.startTime && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <CalendarDays size={12} />
              {formatSessionTime(session.startTime, locale)}
            </span>
          )}
          {locationName && (
            <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <MapPin size={12} />
              <span className="truncate max-w-[120px]">{locationName}</span>
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {t('slotsAvailable', { count: availableSlots })}
          </span>
        </div>
      }
    />
  );
};
