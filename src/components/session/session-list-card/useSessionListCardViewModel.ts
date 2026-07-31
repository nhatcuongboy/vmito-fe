'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ISession } from '@/lib/api/types';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { FeeService } from '@/lib/api/fee.service';
import {
  VALID_LEVELS,
  getLevelRank,
  sortLevelsByRank,
} from '@/constants/levels';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { COMPACT_COVER_TRANSFORM } from '@/lib/images/coverTransforms';
import { formatCompactSessionDate } from '@/utils/session-helpers';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';
import { formatVenueName } from '@/utils/venue-helpers';
import { getSessionLocationName } from '@/utils/session-location';

const DISCRETE_LEVEL_CAP = 2;

export const useSessionListCardViewModel = (
  session: ISession,
  distance?: number
) => {
  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
  const locale = useLocale();
  const { showNewAddress } = useAppSettings();
  const { getLevelShortLabel } = useLevelLabel();

  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedPlayersCount = session._count?.players || 0;
  const availableSlots = Math.max(maxPlayers - approvedPlayersCount, 0);
  const isFull = approvedPlayersCount >= maxPlayers;
  const isCrawled = session.isCrawled === true;
  const isExpired = Boolean(
    session.status === 'PREPARING' &&
      session.endTime &&
      new Date(session.endTime) < new Date()
  );

  const dateLabel = formatCompactSessionDate(
    session.startTime || session.createdAt,
    locale,
    { today: t('today'), tomorrow: t('tomorrow') },
    { minimal: true }
  );
  const timeLabel = session.startTime
    ? formatTimeRangeByDevicePreference(
        session.startTime,
        session.endTime
      ).replace(' - ', '-')
    : '';

  const venueName = session.venue?.name
    ? formatVenueName(
        session.venue.name,
        tVenue('nameFormat', { name: '{name}' })
      )
    : getSessionLocationName(session);
  const rawDistrict = showNewAddress
    ? session.venue?.newDistrict ||
      session.venue?.district ||
      session.customLocationDistrict
    : session.venue?.district ||
      session.venue?.newDistrict ||
      session.customLocationDistrict;
  const rawCity = showNewAddress
    ? session.venue?.newCity ||
      session.venue?.city ||
      session.customLocationCity
    : session.venue?.city ||
      session.venue?.newCity ||
      session.customLocationCity;
  const district = (rawDistrict || '').replace(
    /^(Phường|Xã|Thị trấn)\s+(?=\D)/i,
    ''
  );
  const distanceLabel =
    distance !== undefined
      ? distance < 1
        ? `${Math.round(distance * 1000)}m`
        : `${distance.toFixed(1)}km`
      : undefined;

  const uniqueLevels = sortLevelsByRank(
    Array.from(new Set(session.requiredLevels || []))
  );
  const isAllLevels =
    uniqueLevels.length === 0 || uniqueLevels.length >= VALID_LEVELS.length;
  const minLevel = uniqueLevels[0];
  const maxLevel = uniqueLevels[uniqueLevels.length - 1];
  const isContiguous = uniqueLevels.every((level, index) => {
    if (index === 0) return true;
    const previousRank = getLevelRank(uniqueLevels[index - 1]);
    const rank = getLevelRank(level);
    return (
      previousRank !== undefined &&
      rank !== undefined &&
      rank === previousRank + 1
    );
  });
  const isLevelRange = !isAllLevels && uniqueLevels.length > 1 && isContiguous;
  const isDiscreteLevels =
    !isAllLevels && uniqueLevels.length > 1 && !isContiguous;
  const shownDiscreteLevels = isDiscreteLevels
    ? uniqueLevels.slice(0, DISCRETE_LEVEL_CAP)
    : [];
  const extraDiscreteLevelCount = isDiscreteLevels
    ? uniqueLevels.length - shownDiscreteLevels.length
    : 0;

  return {
    approvedPlayersCount,
    availableSlots,
    coverPhoto:
      normalizeImageUrl(session.coverPhoto, COMPACT_COVER_TRANSFORM) ||
      DEFAULT_COVER_PHOTO,
    dateLabel,
    dateTimeLine: timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel,
    displayHostName: session.hostName || session.host?.name || '',
    distanceLabel,
    extraDiscreteLevelCount,
    feeDisplayText: FeeService.getSessionFeeForCard(session),
    getLevelShortLabel,
    hiddenDiscreteLevelLabels: uniqueLevels
      .slice(DISCRETE_LEVEL_CAP)
      .map(getLevelShortLabel)
      .join(', '),
    isAllLevels,
    isCrawled,
    isExpired,
    isFull,
    isLevelRange,
    isRelativeDay: dateLabel === t('today') || dateLabel === t('tomorrow'),
    maxLevel,
    maxPlayers,
    minLevel,
    shownDiscreteLevels,
    timeLabel,
    venueName,
    venueSuffix: [district || rawCity, distanceLabel]
      .filter(Boolean)
      .join(' • '),
  };
};
