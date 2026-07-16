import { ISession } from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { Locale } from '@/i18n/locales';
import dayjs from '@/lib/dayjs';
import { formatVenueName } from '@/utils';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { IShareCardData } from './types';

export const formatSessionShareDate = (
  dateString: string | Date,
  locale: string
): string => {
  const date = dayjs
    .tz(dateString)
    .locale(locale === Locale.VI ? Locale.VI : Locale.EN);
  const dayLabel = date.format('dddd');
  return `${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}, ${date.format(
    locale === Locale.VI ? 'DD/MM' : 'MM/DD'
  )}`;
};

export const formatLegacyPortraitDate = (
  dateString: string | Date,
  locale: string
): string => {
  const date = dayjs
    .tz(dateString)
    .locale(locale === Locale.VI ? Locale.VI : Locale.EN);
  const formattedDate =
    locale === Locale.VI
      ? date.format('dddd, DD/MM')
      : date.format('ddd, MM/DD');
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

const getCourtLabel = (session: ISession, courtsLabel: string) => {
  const courtNames =
    session.courts && session.courts.length > 0
      ? session.courts
          .slice()
          .sort((a, b) => a.courtNumber - b.courtNumber)
          .map((court) => court.courtName || court.courtNumber)
          .join(', ')
      : '';

  return `${session.numberOfCourts} ${courtsLabel}${courtNames ? ` (${courtNames})` : ''}`;
};

const getAddressLabel = (session: ISession) => {
  const venue = session.venue;
  const address = venue?.address || '';
  const district = venue?.district || '';

  if (address && district && !address.includes(district)) {
    return `${address}, ${district}`;
  }

  return address || session.location || '';
};

export const useSessionShareCardData = (session: ISession): IShareCardData => {
  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  return useMemo(() => {
    const startTime = session.startTime || session.createdAt;
    const endTime = session.endTime;
    const venueName = session.venue?.name
      ? formatVenueName(
          session.venue.name,
          tVenue('nameFormat', { name: '{name}' })
        )
      : session.location || '';

    const fee =
      session.feeConfig?.feeType === 'SPLIT_EVENLY'
        ? session.feeConfig.splitPerPlayer
          ? FeeService.formatFee(session.feeConfig.splitPerPlayer)
          : t('splitEvenly')
        : session.feeConfig
          ? session.feeConfig.maleFee === session.feeConfig.femaleFee
            ? FeeService.formatFee(session.feeConfig.maleFee || 0)
            : `${tCommon('male')}: ${FeeService.formatFee(
                session.feeConfig.maleFee || 0
              )} - ${tCommon('female')}: ${FeeService.formatFee(
                session.feeConfig.femaleFee || 0
              )}`
          : undefined;

    return {
      date: formatSessionShareDate(startTime, locale),
      time: session.startTime
        ? formatTimeRangeByDevicePreference(session.startTime, endTime)
        : t('timeNotSet'),
      venue: venueName,
      address: getAddressLabel(session),
      host: session.hostName || session.host?.name || '',
      courts: getCourtLabel(session, t('courts')),
      maxPlayers: t('maxPlayers', {
        count: session.numberOfCourts * session.maxPlayersPerCourt,
      }),
      phone: session.hostPhone,
      shuttlecock: session.shuttlecock ? `Cầu ${session.shuttlecock}` : '',
      fee,
    };
  }, [locale, session, t, tCommon, tVenue]);
};
