'use client';

import { useTranslations } from 'next-intl';
import { Clock, GraduationCap } from 'lucide-react';
import { PreviewCardBase } from './PreviewCardBase';
import { ROUTES } from '@/constants/routes';
import type { IClass } from '@/types/class';

interface IClassPreviewCardProps {
  item: IClass;
}

const formatTuition = (item: IClass, t: (key: string) => string): string => {
  if (item.tuitionPeriod === 'CONTACT') return t('contactTuition');
  const periodKey: Record<string, string> = {
    PER_SESSION: 'tuitionPerSession',
    MONTHLY: 'tuitionMonthly',
    COURSE: 'tuitionCourse',
  };
  const label = t(periodKey[item.tuitionPeriod] ?? 'tuitionPerSession');
  return `${(item.tuitionAmount || 0).toLocaleString('vi-VN')}đ ${label}`;
};

export const ClassPreviewCard = ({ item }: IClassPreviewCardProps) => {
  const t = useTranslations('previewCards');

  const locationName =
    item.venue?.name || item.customLocationName || t('noLocation');

  const schedule = item.schedules[0];
  const scheduleText = schedule
    ? `${schedule.startTime}–${schedule.endTime}`
    : t('schedulePending');

  return (
    <PreviewCardBase
      href={ROUTES.CLASSES.DETAIL(item.slug)}
      image={item.coverPhoto || item.images?.[0]}
      title={item.name}
      subtitle={locationName}
      icon={<GraduationCap size={24} />}
      sportType={item.sportType}
      metadata={
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {formatTuition(item, t)}
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock size={12} />
            {scheduleText}
          </span>
        </div>
      }
    />
  );
};
