'use client';

import { ISession } from '@/lib/api/types';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react';
import {
  Banknote,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Shield,
  SquareAsterisk,
  Ticket,
  Trophy,
  User,
  Users,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Locale } from '@/i18n/locales';
import { FeeService } from '@/lib/api/fee.service';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { formatVenueName } from '@/utils';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';
import dayjs from '@/lib/dayjs';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';

export type SessionShareTemplateId =
  | 'legacy-portrait'
  | 'legacy-social'
  | 'classic-clean'
  | 'social-poster'
  | 'story-vertical'
  | 'square-feed'
  | 'event-pass'
  | 'ai-neon-stadium'
  | 'ai-yellow-smash';

export type SessionShareThemeId =
  | 'default'
  | 'dark'
  | 'premium'
  | 'sport-yellow'
  | 'club-green';

export interface SessionShareTemplateMeta {
  id: SessionShareTemplateId;
  name: string;
  ratioLabel: string;
  width: number;
  height: number;
  description: string;
}

export interface SessionShareThemeMeta {
  id: SessionShareThemeId;
  name: string;
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textOnPrimary: string;
  mutedText: string;
  border: string;
  price: string;
  qr: string;
}

export const SESSION_SHARE_THEMES: SessionShareThemeMeta[] = [
  {
    id: 'default',
    name: 'Mặc định',
    primary: '#179a3b',
    primaryDark: '#0d7f31',
    accent: '#ffd84d',
    background: '#f7faf5',
    surface: '#ffffff',
    surfaceAlt: '#e7f8ec',
    text: '#222631',
    textOnPrimary: '#ffffff',
    mutedText: '#66706a',
    border: '#dfe8dd',
    price: '#e9292f',
    qr: '#179a3b',
  },
  {
    id: 'dark',
    name: 'Tối',
    primary: '#22c55e',
    primaryDark: '#0f3f25',
    accent: '#38bdf8',
    background: '#08111f',
    surface: '#111827',
    surfaceAlt: '#1f2937',
    text: '#f8fafc',
    textOnPrimary: '#ffffff',
    mutedText: '#cbd5e1',
    border: '#334155',
    price: '#fb7185',
    qr: '#22c55e',
  },
  {
    id: 'premium',
    name: 'Premium',
    primary: '#d4af37',
    primaryDark: '#172033',
    accent: '#f6d36b',
    background: '#0f172a',
    surface: '#172033',
    surfaceAlt: '#243047',
    text: '#f8fafc',
    textOnPrimary: '#ffffff',
    mutedText: '#d6deec',
    border: '#3a465d',
    price: '#d4af37',
    qr: '#d4af37',
  },
  {
    id: 'sport-yellow',
    name: 'Vàng thể thao',
    primary: '#facc15',
    primaryDark: '#111111',
    accent: '#f97316',
    background: '#111111',
    surface: '#1f1f1f',
    surfaceAlt: '#2b250d',
    text: '#fff7d6',
    textOnPrimary: '#ffffff',
    mutedText: '#f8e8a0',
    border: '#5f4a08',
    price: '#ef4444',
    qr: '#facc15',
  },
  {
    id: 'club-green',
    name: 'Xanh CLB',
    primary: '#16a34a',
    primaryDark: '#064e3b',
    accent: '#86efac',
    background: '#ecfdf5',
    surface: '#ffffff',
    surfaceAlt: '#dcfce7',
    text: '#173524',
    textOnPrimary: '#ffffff',
    mutedText: '#486557',
    border: '#bbf7d0',
    price: '#dc2626',
    qr: '#16a34a',
  },
];

export const SESSION_SHARE_TEMPLATES: SessionShareTemplateMeta[] = [
  {
    id: 'legacy-portrait',
    name: 'Mẫu chuẩn 2:3',
    ratioLabel: '2:3',
    width: 800,
    height: 1200,
    description: 'Thiết kế ban đầu dạng dọc, quen thuộc với host.',
  },
  {
    id: 'legacy-social',
    name: 'Mẫu chuẩn 4:5',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Thiết kế ban đầu dạng social poster.',
  },
  {
    id: 'event-pass',
    name: 'Vé tham gia',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Premium, giống vé mời tham gia kèo.',
  },
  {
    id: 'ai-neon-stadium',
    name: 'Sân neon',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Nền sân đêm, đèn neon xanh vàng, năng lượng cao.',
  },
  {
    id: 'ai-yellow-smash',
    name: 'Vàng đen năng động',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Nền thể thao vàng đen, nổi bật như poster tuyển người.',
  },
  {
    id: 'classic-clean',
    name: 'Gọn gàng',
    ratioLabel: '2:3',
    width: 800,
    height: 1200,
    description: 'Dễ đọc, đủ thông tin, hợp đăng nhóm.',
  },
  {
    id: 'social-poster',
    name: 'Poster nổi bật',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Nổi bật tên kèo, giờ chơi và chi phí.',
  },
  {
    id: 'story-vertical',
    name: 'Story',
    ratioLabel: '9:16',
    width: 1080,
    height: 1920,
    description: 'Tối ưu story Facebook, Instagram, Zalo.',
  },
  {
    id: 'square-feed',
    name: 'Feed vuông',
    ratioLabel: '1:1',
    width: 1080,
    height: 1080,
    description: 'Gọn đẹp cho feed và thumbnail.',
  },
];

export const getSessionShareCardElementId = (
  sessionId: string,
  templateId: SessionShareTemplateId
) => `session-share-card-${templateId}-${sessionId}`;

const legacyModeToTemplate = (
  mode?: 'portrait' | 'landscape' | 'social'
): SessionShareTemplateId => {
  if (mode === 'social') return 'legacy-social';
  if (mode === 'landscape') return 'square-feed';
  return 'legacy-portrait';
};

interface SessionShareCardProps {
  session: ISession;
  mode?: 'portrait' | 'landscape' | 'social';
  templateId?: SessionShareTemplateId;
  themeId?: SessionShareThemeId;
  captureId?: string | null;
}

interface ShareCardData {
  date: string;
  time: string;
  venue: string;
  address: string;
  host: string;
  courts: string;
  maxPlayers: string;
  phone?: string;
  shuttlecock?: string;
  fee?: string;
}

const AI_BACKGROUND_URLS: Record<
  Extract<SessionShareTemplateId, 'ai-neon-stadium' | 'ai-yellow-smash'>,
  string
> = {
  'ai-neon-stadium':
    'https://res.cloudinary.com/dzehhkd9m/image/upload/v1783597597/badminton/session-ai-backgrounds/q9ycfvsbpasnzvmizp4v.png',
  'ai-yellow-smash':
    'https://res.cloudinary.com/dzehhkd9m/image/upload/v1783597467/badminton/session-ai-backgrounds/aqytyzubk5fbrw5f37ln.png',
};

const getShareTheme = (themeId?: SessionShareThemeId) =>
  SESSION_SHARE_THEMES.find((theme) => theme.id === themeId) ||
  SESSION_SHARE_THEMES[0];

const formatDate = (dateString: string | Date, locale: string): string => {
  const date = dayjs
    .tz(dateString)
    .locale(locale === Locale.VI ? Locale.VI : Locale.EN);
  const dayLabel = date.format('dddd');
  return `${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}, ${date.format(
    locale === Locale.VI ? 'DD/MM' : 'MM/DD'
  )}`;
};

const formatLegacyPortraitDate = (
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

const useShareCardData = (session: ISession): ShareCardData => {
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
      date: formatDate(startTime, locale),
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

const DetailItem = ({
  icon,
  label,
  color,
  labelColor,
  lineClamp = 2,
  size = 'md',
  theme = SESSION_SHARE_THEMES[0],
}: {
  icon: React.ElementType;
  label?: string;
  color?: string;
  labelColor?: string;
  lineClamp?: number;
  size?: 'sm' | 'md' | 'venue' | 'lg';
  theme?: SessionShareThemeMeta;
}) => {
  if (!label) return null;

  const iconSize =
    size === 'lg' ? 52 : size === 'venue' ? 44 : size === 'md' ? 38 : 28;
  const fontSize =
    size === 'lg'
      ? '34px'
      : size === 'venue'
        ? '30px'
        : size === 'md'
          ? '25px'
          : '18px';

  return (
    <Flex align="center" gap={size === 'lg' ? 5 : 3} minW={0}>
      <Icon
        as={icon}
        boxSize={`${iconSize}px`}
        color={color || theme.primary}
        flexShrink={0}
      />
      <Text
        fontSize={fontSize}
        fontWeight="800"
        color={labelColor || theme.text}
        lineHeight="1.12"
        lineClamp={lineClamp}
        overflowWrap="break-word"
        minW={0}
      >
        {label}
      </Text>
    </Flex>
  );
};

const LevelBadges = ({
  levels,
  size = 'md',
}: {
  levels?: ISession['requiredLevels'];
  size?: 'sm' | 'md' | 'lg';
}) => {
  const t = useTranslations('session');
  const { getLevelShortLabel } = useLevelLabel();
  const uniqueLevels = Array.from(new Set(levels || []));
  const fontSize = size === 'lg' ? '24px' : size === 'md' ? '18px' : '13px';
  const px = size === 'lg' ? 6 : size === 'md' ? 4 : 3;
  const getBadgeBg = (palette: string) => {
    if (palette === 'green') return '#e7f8ec';
    if (palette === 'yellow') return '#fff3bf';
    if (palette === 'red') return '#ffe4e6';
    return '#eef2f7';
  };

  if (uniqueLevels.length === 0) {
    return (
      <Badge
        bg="#eef2f7"
        color="#27313f"
        borderRadius="999px"
        px={px}
        py={size === 'sm' ? 1 : 2}
        fontSize={fontSize}
        fontWeight="900"
      >
        {t('allLevels')}
      </Badge>
    );
  }

  return (
    <Wrap gap={size === 'lg' ? 3 : 2}>
      {uniqueLevels
        .sort((a, b) =>
          typeof a === 'number' && typeof b === 'number' ? a - b : 0
        )
        .map((level) => {
          const levelColor = getSkillLevelColor([level]);
          return (
            <Badge
              key={level}
              bg={getBadgeBg(levelColor.colorPalette)}
              color={levelColor.color}
              borderColor={levelColor.borderColor}
              borderWidth="2px"
              borderRadius="999px"
              px={px}
              py={size === 'sm' ? 1 : 2}
              fontSize={fontSize}
              fontWeight="900"
            >
              {getLevelShortLabel(level)}
            </Badge>
          );
        })}
    </Wrap>
  );
};

const QrBlock = ({
  qrDataUrl,
  size,
  dark = false,
  showTitle = true,
  titleFontSize,
  captionFontSize,
  caption = 'Quét QR để xem kèo',
  theme = SESSION_SHARE_THEMES[0],
}: {
  qrDataUrl: string;
  size: number;
  dark?: boolean;
  showTitle?: boolean;
  titleFontSize?: string;
  captionFontSize?: string;
  caption?: string;
  theme?: SessionShareThemeMeta;
}) => (
  <Flex align="center" gap={4}>
    <Box bg="white" p="8px" borderRadius="18px" flexShrink={0}>
      <Image src={qrDataUrl} alt="VMITO QR Code" boxSize={`${size}px`} />
    </Box>
    <Box>
      {showTitle && (
        <Text
          fontSize={titleFontSize || (size >= 130 ? '27px' : '17px')}
          fontWeight="950"
          color={dark ? 'white' : theme.primaryDark}
          lineHeight="1.05"
        >
          VMITO.COM
        </Text>
      )}
      <Text
        fontSize={captionFontSize || (size >= 130 ? '20px' : '13px')}
        fontWeight="800"
        color={dark ? 'whiteAlpha.800' : theme.primary}
        lineHeight="1.15"
        whiteSpace="nowrap"
      >
        {caption}
      </Text>
    </Box>
  </Flex>
);

const CoverImage = ({
  session,
  height,
  rounded = '0',
  imageFilter,
  overlay,
}: {
  session: ISession;
  height: string;
  rounded?: string;
  imageFilter?: string;
  overlay?: string;
}) => (
  <Box
    position="relative"
    h={height}
    overflow="hidden"
    borderRadius={rounded}
    bg="#182233"
  >
    <Image
      src={session.coverPhoto || DEFAULT_COVER_PHOTO}
      alt={session.name}
      w="100%"
      h="100%"
      objectFit="cover"
      crossOrigin="anonymous"
      filter={imageFilter}
    />
    {overlay !== 'none' && (
      <Box
        position="absolute"
        inset={0}
        bg={
          overlay ||
          'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.42) 100%)'
        }
      />
    )}
  </Box>
);

const PricePill = ({
  fee,
  size = 'md',
  theme = SESSION_SHARE_THEMES[0],
}: {
  fee?: string;
  size?: 'md' | 'lg';
  theme?: SessionShareThemeMeta;
}) => {
  if (!fee) return null;

  return (
    <Flex
      align="center"
      gap={3}
      bg={theme.price}
      color="white"
      borderRadius="999px"
      px={size === 'lg' ? 8 : 5}
      py={size === 'lg' ? 4 : 2.5}
      w="fit-content"
      boxShadow="0 16px 40px rgba(233, 41, 47, 0.25)"
    >
      <Icon as={Banknote} boxSize={size === 'lg' ? '42px' : '28px'} />
      <Text
        fontSize={size === 'lg' ? '38px' : '24px'}
        fontWeight="950"
        lineHeight="1"
        letterSpacing="0"
      >
        {fee}
      </Text>
    </Flex>
  );
};

const CardShell = ({
  id,
  meta,
  children,
  bg = 'white',
}: {
  id?: string;
  meta: SessionShareTemplateMeta;
  children: React.ReactNode;
  bg?: string;
}) => (
  <Box
    id={id}
    w={`${meta.width}px`}
    h={`${meta.height}px`}
    bg={bg}
    color="#222631"
    overflow="hidden"
    position="relative"
    fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    letterSpacing="0"
    boxShadow="none"
  >
    {children}
  </Box>
);

const ClassicCleanCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: TemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.primaryDark}>
    <Box p="20px">
      <CoverImage session={session} height="330px" rounded="24px" />
      <Box color="white" textAlign="center" py={7}>
        <Text fontSize="26px" fontWeight="900" textTransform="uppercase">
          Tuyển vãng lai cầu lông
        </Text>
      </Box>
      <Box bg="#ffffff" borderRadius="24px" p="44px" minH="720px">
        <Stack gap={8}>
          <Heading
            fontSize="42px"
            fontWeight="950"
            color={theme.primaryDark}
            textAlign="center"
            textTransform="uppercase"
            lineHeight="1.08"
            lineClamp={2}
          >
            {session.name}
          </Heading>
          <DetailItem
            icon={MapPin}
            label={data.venue}
            size="md"
            labelColor="#252833"
            theme={theme}
          />
          {data.address && (
            <Text
              pl="54px"
              mt="-24px"
              fontSize="22px"
              color="#70727d"
              fontWeight="650"
              lineHeight="1.3"
              lineClamp={2}
            >
              {data.address}
            </Text>
          )}
          <DetailItem
            icon={User}
            label={`Host: ${data.host}`}
            size="md"
            labelColor="#252833"
            theme={theme}
          />
          <Grid templateColumns="1fr 1fr" gap={6}>
            <DetailItem
              icon={Calendar}
              label={data.date}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={Clock}
              label={data.time}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={SquareAsterisk}
              label={data.courts}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={Users}
              label={data.maxPlayers}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={Phone}
              label={data.phone}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
            <DetailItem
              icon={SquareAsterisk}
              label={data.shuttlecock}
              size="sm"
              labelColor="#252833"
              theme={theme}
            />
          </Grid>
          <Flex align="center" gap={4}>
            <Icon as={Shield} boxSize="34px" color="#c78400" />
            <LevelBadges levels={session.requiredLevels} size="sm" />
          </Flex>
          <PricePill fee={data.fee} theme={theme} />
          {session.description && (
            <Text
              fontSize="26px"
              color="#5c5f6a"
              lineClamp={3}
              lineHeight="1.3"
            >
              {session.description}
            </Text>
          )}
        </Stack>
        <Flex
          position="absolute"
          left="64px"
          right="64px"
          bottom="50px"
          borderTop="2px solid #e3e6ea"
          pt={5}
          justify="space-between"
          align="center"
        >
          <Text
            fontSize="22px"
            color={theme.primaryDark}
            fontWeight="950"
            lineHeight="1.16"
          >
            Truy cập VMITO.COM
            <br />
            để tìm thêm nhiều kèo hot hơn
          </Text>
          {qrDataUrl && (
            <QrBlock qrDataUrl={qrDataUrl} size={88} theme={theme} />
          )}
        </Flex>
      </Box>
    </Box>
  </CardShell>
);

const LegacyPortraitCard = ({
  id,
  session,
  qrDataUrl,
  meta,
  theme,
}: TemplateProps) => {
  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
  const tCommon = useTranslations('common');
  const { getLevelShortLabel } = useLevelLabel();
  const locale = useLocale();
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const displayHostName = session.hostName || session.host?.name || '';
  const compactDate = session.startTime
    ? formatLegacyPortraitDate(session.startTime, locale)
    : formatLegacyPortraitDate(session.createdAt, locale);
  const compactTime = session.startTime
    ? formatTimeRangeByDevicePreference(session.startTime, session.endTime)
    : '';
  const skillLevelColor = getSkillLevelColor(session.requiredLevels);

  return (
    <CardShell id={id} meta={meta} bg="white">
      <Box
        w="400px"
        transform={`scale(${meta.width / 400})`}
        transformOrigin="top left"
      >
        <Box
          w="400px"
          h="600px"
          bg="white"
          borderRadius="2xl"
          overflow="hidden"
          borderWidth="6px"
          borderColor={theme.primaryDark}
          boxShadow="none"
          position="relative"
        >
          <Box position="relative" h="180px" overflow="hidden">
            <Image
              src={session.coverPhoto || DEFAULT_COVER_PHOTO}
              alt={session.name}
              w="100%"
              h="100%"
              objectFit="cover"
              crossOrigin="anonymous"
            />
          </Box>

          <Box
            bg={theme.primaryDark}
            color={theme.textOnPrimary}
            py={2}
            px={5}
            textAlign="center"
          >
            <Heading size="md" fontWeight="bold" textTransform="uppercase">
              {t('shareCardHeader')}
            </Heading>
          </Box>

          <Box px={4} pt={4} h="300px" overflow="hidden">
            <Stack gap={1.5}>
              <Heading
                size="md"
                fontWeight="bold"
                color="green.600"
                textAlign="center"
                textTransform="uppercase"
              >
                {session.name}
              </Heading>

              {(session.venue?.name || session.location) && (
                <Flex align="flex-start">
                  <Icon
                    as={MapPin}
                    boxSize={5}
                    mr={2}
                    color={theme.primary}
                    mt={1}
                  />
                  <Box flex="1">
                    <Text fontWeight="semibold" color="gray.700" fontSize="sm">
                      {session.venue?.name
                        ? formatVenueName(
                            session.venue.name,
                            tVenue('nameFormat', { name: '{name}' })
                          )
                        : session.location}
                    </Text>
                    {session.venue?.address &&
                      session.venue.address !== session.venue.name && (
                        <AppAddressDisplay
                          address={session.venue.address}
                          district={session.venue.district}
                          color="gray.500"
                        />
                      )}
                  </Box>
                </Flex>
              )}

              <Flex align="center" gap={2}>
                <Icon as={User} boxSize={5} color={theme.primary} />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  {`Host: ${displayHostName}`}
                </Text>
              </Flex>

              <Stack gap={1.5}>
                <Grid templateColumns="1fr 1fr" gap={4}>
                  <Flex align="center" gap={2}>
                    <Icon as={Calendar} boxSize={5} color={theme.primary} />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {compactDate}
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Icon as={Clock} boxSize={5} color={theme.primary} />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {compactTime}
                    </Text>
                  </Flex>
                </Grid>

                <Grid templateColumns="1fr 1fr" gap={4}>
                  <Flex align="center" gap={2}>
                    <Icon
                      as={SquareAsterisk}
                      boxSize={5}
                      color={theme.primary}
                    />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {session.numberOfCourts} {t('courts')}
                      {session.courts && session.courts.length > 0 && (
                        <Text as="span" ml={1}>
                          (
                          {session.courts
                            .slice()
                            .sort((a, b) => a.courtNumber - b.courtNumber)
                            .map((c) => c.courtName || c.courtNumber)
                            .join(', ')}
                          )
                        </Text>
                      )}
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Icon as={Users} boxSize={5} color={theme.primary} />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {t('maxPlayers', { count: maxPlayers })}
                    </Text>
                  </Flex>
                </Grid>

                {(session.hostPhone || session.shuttlecock) && (
                  <Grid templateColumns="1fr 1fr" gap={4}>
                    {session.hostPhone ? (
                      <Flex align="center" gap={2}>
                        <Icon as={Phone} boxSize={5} color={theme.primary} />
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color="gray.700"
                        >
                          {session.hostPhone}
                        </Text>
                      </Flex>
                    ) : (
                      <Box />
                    )}
                    {session.shuttlecock && (
                      <Flex align="center" gap={2}>
                        <Icon
                          as={SquareAsterisk}
                          boxSize={5}
                          color={theme.primary}
                        />
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color="gray.700"
                        >
                          Cầu {session.shuttlecock}
                        </Text>
                      </Flex>
                    )}
                  </Grid>
                )}
              </Stack>

              <Flex align="center" gap={3}>
                <Icon as={Shield} boxSize={5} color={skillLevelColor.color} />
                <Wrap gap={1}>
                  {session.requiredLevels &&
                  session.requiredLevels.length > 0 ? (
                    Array.from(new Set(session.requiredLevels))
                      .sort((a, b) =>
                        typeof a === 'number' && typeof b === 'number'
                          ? a - b
                          : 0
                      )
                      .map((level) => {
                        const levelColor = getSkillLevelColor([level]);
                        return (
                          <Badge
                            key={level}
                            colorPalette={levelColor.colorPalette}
                            variant="solid"
                            size="sm"
                            fontSize="xs"
                            fontWeight="bold"
                            px={2.5}
                            py={0.5}
                            borderRadius="full"
                            borderWidth="1px"
                            borderColor={levelColor.borderColor}
                          >
                            {getLevelShortLabel(level)}
                          </Badge>
                        );
                      })
                  ) : (
                    <Badge colorPalette="gray" variant="subtle" size="sm">
                      {t('allLevels')}
                    </Badge>
                  )}
                </Wrap>
              </Flex>

              {session.feeConfig && (
                <Box py={1}>
                  <Flex align="center" gap={2}>
                    <Icon as={Banknote} boxSize={5} color={theme.price} />
                    <Text fontSize="md" fontWeight="bold" color={theme.price}>
                      {session.feeConfig.feeType === 'SPLIT_EVENLY'
                        ? session.feeConfig.splitPerPlayer
                          ? FeeService.formatFee(
                              session.feeConfig.splitPerPlayer
                            )
                          : t('splitEvenly')
                        : session.feeConfig.maleFee ===
                            session.feeConfig.femaleFee
                          ? FeeService.formatFee(session.feeConfig.maleFee || 0)
                          : `${tCommon('male')}: ${FeeService.formatFee(session.feeConfig.maleFee || 0)} - ${tCommon('female')}: ${FeeService.formatFee(session.feeConfig.femaleFee || 0)}`}
                    </Text>
                  </Flex>
                </Box>
              )}
            </Stack>
          </Box>

          <Box
            position="absolute"
            left={4}
            right={4}
            bottom={2}
            h="80px"
            bg="white"
          >
            {session.description && (
              <Text
                pr="50px"
                minW={0}
                fontSize="xs"
                color="gray.600"
                lineHeight="1.25"
                lineClamp={2}
              >
                {session.description}
              </Text>
            )}
            <Box position="absolute" left={0} right="54px" bottom={3.5}>
              <Box borderTopWidth="1px" borderColor="gray.200" />
              <Box pt={0.5}>
                <Text
                  fontSize="11px"
                  fontWeight="bold"
                  color={theme.primaryDark}
                  lineHeight="1.28"
                  textAlign="center"
                  whiteSpace="nowrap"
                >
                  Truy cập VMITO.com để tìm thêm nhiều kèo
                </Text>
              </Box>
            </Box>
            {qrDataUrl && (
              <Box
                position="absolute"
                right={0}
                bottom={1}
                p={0.5}
                border="1px solid"
                borderColor="gray.100"
                borderRadius="lg"
              >
                <Image src={qrDataUrl} alt="VMITO QR Code" boxSize="46px" />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </CardShell>
  );
};

const LegacySocialCard = ({ id, session, qrDataUrl, theme }: TemplateProps) => {
  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
  const tCommon = useTranslations('common');
  const { getLevelShortLabel } = useLevelLabel();
  const locale = useLocale();
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const displayHostName = session.hostName || session.host?.name || '';
  const compactDate = session.startTime
    ? formatDate(session.startTime, locale)
    : formatDate(session.createdAt, locale);
  const compactTime = session.startTime
    ? formatTimeRangeByDevicePreference(session.startTime, session.endTime)
    : '';
  const skillLevelColor = getSkillLevelColor(session.requiredLevels);

  return (
    <Box
      id={id}
      w="1080px"
      h="1350px"
      bg="white"
      borderRadius="3xl"
      overflow="hidden"
      borderWidth="16px"
      borderColor={theme.primaryDark}
      boxShadow="none"
    >
      <Box position="relative" h="420px" overflow="hidden">
        <Image
          src={session.coverPhoto || DEFAULT_COVER_PHOTO}
          alt={session.name}
          w="100%"
          h="100%"
          objectFit="cover"
          crossOrigin="anonymous"
        />
      </Box>

      <Box
        bg={theme.primaryDark}
        color={theme.textOnPrimary}
        py={5}
        px={10}
        textAlign="center"
      >
        <Heading size="4xl" fontWeight="bold" textTransform="uppercase">
          {t('shareCardHeader')}
        </Heading>
      </Box>

      <Box p={8} pb={6} bg="white">
        <Stack gap={6}>
          <Heading
            size="4xl"
            fontWeight="bold"
            color={theme.primaryDark}
            textAlign="center"
            textTransform="uppercase"
          >
            {session.name}
          </Heading>

          {(session.venue?.name || session.location) && (
            <Flex align="flex-start" gap={6}>
              <Icon as={MapPin} boxSize={14} color={theme.primary} mt={1} />
              <Box flex="1">
                <Text fontWeight="semibold" color="gray.700" fontSize="4xl">
                  {session.venue?.name
                    ? formatVenueName(
                        session.venue.name,
                        tVenue('nameFormat', { name: '{name}' })
                      )
                    : session.location}
                </Text>
                {session.venue?.address &&
                  session.venue.address !== session.venue.name && (
                    <AppAddressDisplay
                      address={session.venue.address}
                      district={session.venue.district}
                      fontSize="3xl"
                      color="gray.500"
                    />
                  )}
              </Box>
            </Flex>
          )}

          <Flex align="center" gap={6}>
            <Icon as={User} boxSize={14} color={theme.primary} />
            <Text fontSize="4xl" fontWeight="semibold" color="gray.700">
              Host: {displayHostName}
            </Text>
          </Flex>

          <Stack gap={5}>
            <Grid templateColumns="1fr 1fr" gap={10}>
              <Flex align="center" gap={6}>
                <Icon as={Calendar} boxSize={14} color={theme.primary} />
                <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                  {compactDate}
                </Text>
              </Flex>
              <Flex align="center" gap={6}>
                <Icon as={Clock} boxSize={14} color={theme.primary} />
                <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                  {compactTime}
                </Text>
              </Flex>
            </Grid>

            <Grid templateColumns="1fr 1fr" gap={10}>
              <Flex align="center" gap={6}>
                <Icon as={SquareAsterisk} boxSize={14} color={theme.primary} />
                <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                  {session.numberOfCourts} {t('courts')}
                  {session.courts && session.courts.length > 0 && (
                    <Text as="span" ml={2}>
                      (
                      {session.courts
                        .slice()
                        .sort((a, b) => a.courtNumber - b.courtNumber)
                        .map((c) => c.courtName || c.courtNumber)
                        .join(', ')}
                      )
                    </Text>
                  )}
                </Text>
              </Flex>
              <Flex align="center" gap={6}>
                <Icon as={Users} boxSize={14} color={theme.primary} />
                <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                  {t('maxPlayers', { count: maxPlayers })}
                </Text>
              </Flex>
            </Grid>

            {(session.hostPhone || session.shuttlecock) && (
              <Grid templateColumns="1fr 1fr" gap={10}>
                {session.hostPhone ? (
                  <Flex align="center" gap={6}>
                    <Icon as={Phone} boxSize={14} color={theme.primary} />
                    <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                      {session.hostPhone}
                    </Text>
                  </Flex>
                ) : (
                  <Box />
                )}
                {session.shuttlecock && (
                  <Flex align="center" gap={6}>
                    <Icon
                      as={SquareAsterisk}
                      boxSize={14}
                      color={theme.primary}
                    />
                    <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                      Cầu {session.shuttlecock}
                    </Text>
                  </Flex>
                )}
              </Grid>
            )}
          </Stack>

          <Flex gap={8} align="flex-start">
            <Box flex="1">
              <Flex align="center" gap={8}>
                <Icon as={Shield} boxSize={14} color={skillLevelColor.color} />
                <Wrap gap={4}>
                  {session.requiredLevels &&
                  session.requiredLevels.length > 0 ? (
                    Array.from(new Set(session.requiredLevels))
                      .sort((a, b) =>
                        typeof a === 'number' && typeof b === 'number'
                          ? a - b
                          : 0
                      )
                      .map((level) => {
                        const levelColor = getSkillLevelColor([level]);
                        return (
                          <Badge
                            key={level}
                            colorPalette={levelColor.colorPalette}
                            variant="solid"
                            size="lg"
                            fontSize="3xl"
                            fontWeight="bold"
                            px={8}
                            py={3}
                            borderRadius="full"
                            borderWidth="2px"
                            borderColor={levelColor.borderColor}
                          >
                            {getLevelShortLabel(level)}
                          </Badge>
                        );
                      })
                  ) : (
                    <Badge
                      colorPalette="gray"
                      variant="solid"
                      size="lg"
                      fontSize="3xl"
                      fontWeight="bold"
                      px={8}
                      py={3}
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor="gray.300"
                      bg="gray.100"
                      color="gray.700"
                    >
                      {t('allLevels')}
                    </Badge>
                  )}
                </Wrap>
              </Flex>

              {session.feeConfig && (
                <Box pt={5}>
                  <Flex align="center" gap={6}>
                    <Icon as={Banknote} boxSize={14} color={theme.price} />
                    <Text fontSize="4xl" fontWeight="bold" color={theme.price}>
                      {session.feeConfig.feeType === 'SPLIT_EVENLY'
                        ? session.feeConfig.splitPerPlayer
                          ? FeeService.formatFee(
                              session.feeConfig.splitPerPlayer
                            )
                          : t('splitEvenly')
                        : session.feeConfig.maleFee ===
                            session.feeConfig.femaleFee
                          ? FeeService.formatFee(session.feeConfig.maleFee || 0)
                          : `${tCommon('male')}: ${FeeService.formatFee(session.feeConfig.maleFee || 0)} - ${tCommon('female')}: ${FeeService.formatFee(session.feeConfig.femaleFee || 0)}`}
                    </Text>
                  </Flex>
                </Box>
              )}

              {session.description && (
                <Text fontSize="4xl" color="gray.600" lineClamp={2} mt={3}>
                  {session.description}
                </Text>
              )}
            </Box>

            {qrDataUrl && (
              <Box textAlign="center" flexShrink={0} mt={12}>
                <Box
                  p={1.5}
                  border="2px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                  bg="white"
                  display="inline-block"
                >
                  <Image src={qrDataUrl} alt="QR" boxSize="120px" />
                </Box>
                <Box mt={2}>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color={theme.primaryDark}
                    lineHeight="1.3"
                  >
                    Truy cập VMITO.com
                  </Text>
                  <Text
                    fontSize="xl"
                    fontWeight="bold"
                    color={theme.primaryDark}
                    lineHeight="1.3"
                  >
                    để tìm thêm nhiều kèo
                  </Text>
                </Box>
              </Box>
            )}
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

const SocialPosterCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: TemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.background}>
    <Box position="absolute" inset={0} bg={theme.background} />
    <Box
      position="absolute"
      top="-120px"
      right="-180px"
      w="520px"
      h="520px"
      bg={theme.accent}
      borderRadius="999px"
    />
    <Box
      position="absolute"
      bottom="-190px"
      left="-210px"
      w="560px"
      h="560px"
      bg={theme.primary}
      borderRadius="999px"
    />
    <Box p="48px" position="relative">
      <Box borderRadius="34px" overflow="hidden" h="430px" position="relative">
        <CoverImage session={session} height="430px" />
        <Box position="absolute" left="34px" right="34px" bottom="30px">
          <PricePill fee={data.fee} size="lg" />
        </Box>
      </Box>
      <Flex mt={9} align="center" gap={4}>
        <Box
          bg={theme.primaryDark}
          color={theme.textOnPrimary}
          borderRadius="999px"
          px={6}
          py={3}
        >
          <Text fontSize="24px" fontWeight="950" textTransform="uppercase">
            Tuyển vãng lai
          </Text>
        </Box>
      </Flex>
      <Heading
        mt={6}
        fontSize="64px"
        fontWeight="950"
        lineHeight="1.08"
        color={theme.text}
        textTransform="uppercase"
        lineClamp={2}
      >
        {session.name}
      </Heading>
      <Grid templateColumns="1fr 1fr" gap={5} mt={9}>
        <DetailItem icon={Calendar} label={data.date} size="lg" theme={theme} />
        <DetailItem icon={Clock} label={data.time} size="lg" theme={theme} />
      </Grid>
      <Box
        mt={8}
        bg={theme.surface}
        borderRadius="30px"
        p={8}
        border={`3px solid ${theme.border}`}
      >
        <Stack gap={6}>
          <DetailItem
            icon={MapPin}
            label={data.venue}
            size="lg"
            theme={theme}
          />
          {data.address && (
            <Text
              pl="72px"
              mt="-16px"
              fontSize="27px"
              color={theme.mutedText}
              fontWeight="700"
              lineClamp={2}
            >
              {data.address}
            </Text>
          )}
          <Grid templateColumns="1fr 1fr" gap={5}>
            <DetailItem
              icon={User}
              label={`Host: ${data.host}`}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={Users}
              label={data.maxPlayers}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={SquareAsterisk}
              label={data.courts}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={Phone}
              label={data.phone}
              size="md"
              theme={theme}
            />
          </Grid>
          <Flex align="center" gap={5}>
            <Icon as={Shield} boxSize="46px" color="#c78400" />
            <LevelBadges levels={session.requiredLevels} size="md" />
          </Flex>
        </Stack>
      </Box>
      <Flex
        position="absolute"
        left="56px"
        right="56px"
        bottom="-132px"
        justify="space-between"
        align="center"
      >
        {qrDataUrl && (
          <QrBlock qrDataUrl={qrDataUrl} size={125} dark theme={theme} />
        )}
        <Text
          fontSize="25px"
          fontWeight="950"
          color={theme.text}
          textAlign="right"
        >
          VMITO
          <br />
          Tìm kèo cầu lông cực dễ
        </Text>
      </Flex>
    </Box>
  </CardShell>
);

const StoryVerticalCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: TemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.primaryDark}>
    <CoverImage session={session} height="760px" />
    <Box
      position="absolute"
      inset={0}
      bg={`linear-gradient(180deg, rgba(0,0,0,0.05) 0%, ${theme.primaryDark}cc 48%, ${theme.primaryDark} 100%)`}
    />
    <Box position="absolute" inset={0} p="64px">
      <Text color="white" fontSize="30px" fontWeight="950">
        VMITO.COM
      </Text>
      <Flex
        position="absolute"
        top="550px"
        left="64px"
        right="64px"
        bottom="64px"
        direction="column"
        justify="space-between"
      >
        <Box>
          <Text
            color={theme.accent}
            fontSize="34px"
            fontWeight="950"
            textTransform="uppercase"
          >
            Tuyển vãng lai cầu lông
          </Text>
          <Heading
            mt={4}
            color="white"
            fontSize="72px"
            fontWeight="950"
            lineHeight="1.0"
            textTransform="uppercase"
            lineClamp={2}
          >
            {session.name}
          </Heading>
          <Box mt={7}>
            <PricePill fee={data.fee} size="lg" theme={theme} />
          </Box>
        </Box>
        <Box bg="white" borderRadius="36px" p={12}>
          <Stack gap={8}>
            <Grid templateColumns="1fr 1fr" gap={6}>
              <DetailItem
                icon={Calendar}
                label={data.date}
                size="lg"
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={Clock}
                label={data.time}
                size="lg"
                labelColor="#252833"
                theme={theme}
              />
            </Grid>
            <DetailItem
              icon={MapPin}
              label={data.venue}
              size="lg"
              labelColor="#252833"
              theme={theme}
            />
            <Grid templateColumns="1fr 1fr" gap={6}>
              <DetailItem
                icon={User}
                label={data.host}
                size="venue"
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={Users}
                label={data.maxPlayers}
                size="venue"
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={SquareAsterisk}
                label={data.courts}
                size="venue"
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={Phone}
                label={data.phone}
                size="venue"
                labelColor="#252833"
                theme={theme}
              />
              {data.shuttlecock && (
                <Box gridColumn="1 / -1">
                  <DetailItem
                    icon={Ticket}
                    label={data.shuttlecock}
                    size="venue"
                    labelColor="#252833"
                    theme={theme}
                  />
                </Box>
              )}
            </Grid>
            <LevelBadges levels={session.requiredLevels} size="md" />
          </Stack>
        </Box>
        <Flex justify="space-between" align="center">
          {qrDataUrl && (
            <QrBlock qrDataUrl={qrDataUrl} size={150} dark theme={theme} />
          )}
          <Text
            color="white"
            fontSize="31px"
            fontWeight="950"
            textAlign="right"
            lineHeight="1.08"
          >
            Quét mã
            <br />
            để đăng ký kèo
          </Text>
        </Flex>
      </Flex>
    </Box>
  </CardShell>
);

const SquareFeedCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: TemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.surface}>
    <Grid templateRows="430px 1fr" h="100%">
      <Box position="relative">
        <CoverImage session={session} height="430px" />
        <Box
          position="absolute"
          left="46px"
          bottom="-46px"
          bg={theme.accent}
          color={theme.textOnPrimary}
          borderRadius="28px"
          px={8}
          py={5}
        >
          <Text fontSize="32px" fontWeight="950">
            {data.date}
          </Text>
          <Text fontSize="26px" fontWeight="900">
            {data.time}
          </Text>
        </Box>
      </Box>
      <Flex direction="column" justify="space-between" minH={0}>
        <Box px="58px" pt="52px">
          <Text
            color={theme.accent}
            fontSize="27px"
            fontWeight="950"
            textTransform="uppercase"
          >
            Tuyển vãng lai cầu lông
          </Text>
          <Heading
            mt={3}
            fontSize="66px"
            fontWeight="950"
            lineHeight="0.98"
            color={theme.text}
            textTransform="uppercase"
            lineClamp={2}
          >
            {session.name}
          </Heading>
          <Box mt={6}>
            <PricePill fee={data.fee} theme={theme} />
          </Box>
          <Stack gap={5} mt={7}>
            <DetailItem
              icon={MapPin}
              label={data.venue}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={User}
              label={`Host: ${data.host}`}
              size="md"
              theme={theme}
            />
            <DetailItem
              icon={Users}
              label={data.maxPlayers}
              size="md"
              theme={theme}
            />
            <LevelBadges levels={session.requiredLevels} size="sm" />
          </Stack>
        </Box>
        {qrDataUrl && (
          <Flex
            justify="space-between"
            align="center"
            bg={theme.primaryDark}
            px="58px"
            py="24px"
          >
            <QrBlock qrDataUrl={qrDataUrl} size={100} dark theme={theme} />
            <Text
              color="white"
              fontSize="24px"
              fontWeight="950"
              textAlign="right"
              lineHeight="1.1"
            >
              Quét mã
              <br />
              để đăng ký kèo
            </Text>
          </Flex>
        )}
      </Flex>
    </Grid>
  </CardShell>
);

const EventPassCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
}: TemplateProps) => (
  <CardShell id={id} meta={meta} bg={theme.primaryDark}>
    <Box
      position="absolute"
      inset="32px"
      border={`3px solid ${theme.accent}`}
      borderRadius="34px"
      opacity={0.72}
    />
    <Box p="58px" position="relative" h="100%">
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={4}>
          <Icon as={Trophy} color={theme.accent} boxSize="46px" />
          <Text color="white" fontSize="30px" fontWeight="950">
            VMITO PASS
          </Text>
        </Flex>
      </Flex>
      <Box mt={9} borderRadius="30px" overflow="hidden" h="360px">
        <CoverImage
          session={session}
          height="360px"
          imageFilter="saturate(1.08) contrast(1.04)"
          overlay="linear-gradient(180deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.14) 100%)"
        />
      </Box>
      <Flex mt={9} gap={4} align="center">
        <Icon as={Ticket} color={theme.accent} boxSize="40px" />
        <Text
          color={theme.accent}
          fontSize="30px"
          fontWeight="950"
          textTransform="uppercase"
        >
          Vé tham gia kèo
        </Text>
      </Flex>
      <Heading
        mt={4}
        color="white"
        h="130px"
        fontSize="62px"
        fontWeight="950"
        lineHeight="1.02"
        textTransform="uppercase"
        lineClamp={2}
        overflowWrap="break-word"
      >
        {session.name}
      </Heading>
      <Grid templateColumns="1fr 1fr" gap={5} mt={6}>
        <Box bg="rgba(0, 0, 0, 0.22)" borderRadius="26px" p={7}>
          <DetailItem
            icon={Calendar}
            label={data.date}
            color={theme.accent}
            labelColor={theme.accent}
            size="md"
            theme={theme}
          />
        </Box>
        <Box bg="rgba(0, 0, 0, 0.22)" borderRadius="26px" p={7}>
          <DetailItem
            icon={Clock}
            label={data.time}
            color={theme.accent}
            labelColor={theme.accent}
            size="md"
            theme={theme}
          />
        </Box>
      </Grid>
      <Box mt={5} bg="white" borderRadius="30px" px={9} py={4} minH="270px">
        <Stack gap={4}>
          <DetailItem
            icon={MapPin}
            label={data.venue}
            size="venue"
            lineClamp={1}
            color={theme.primary}
            labelColor="#252833"
            theme={theme}
          />
          <Grid templateColumns="1fr 1fr" gap={5}>
            <Stack gap={4} minW={0}>
              <DetailItem
                icon={User}
                label={data.host}
                size="md"
                color={theme.primary}
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={SquareAsterisk}
                label={data.courts}
                size="md"
                color={theme.primary}
                labelColor="#252833"
                theme={theme}
              />
              <LevelBadges levels={session.requiredLevels} size="md" />
            </Stack>
            <Stack gap={4} minW={0} align="flex-start">
              <DetailItem
                icon={Users}
                label={data.maxPlayers}
                size="md"
                color={theme.primary}
                labelColor="#252833"
                theme={theme}
              />
              <DetailItem
                icon={Phone}
                label={data.phone}
                size="md"
                color={theme.primary}
                labelColor="#252833"
                theme={theme}
              />
              <PricePill fee={data.fee} theme={theme} />
            </Stack>
          </Grid>
        </Stack>
      </Box>
      <Flex
        position="absolute"
        left="58px"
        right="58px"
        bottom="54px"
        justify="space-between"
        align="center"
      >
        {qrDataUrl && (
          <QrBlock
            qrDataUrl={qrDataUrl}
            size={104}
            dark
            showTitle={false}
            titleFontSize="24px"
            captionFontSize="21px"
            caption="Quét QR để xem kèo"
            theme={theme}
          />
        )}
        <Text
          color="white"
          fontSize="23px"
          fontWeight="950"
          textAlign="right"
          lineHeight="1.1"
        >
          Tìm thêm nhiều kèo hot
          <br />
          tại VMITO.COM
        </Text>
      </Flex>
    </Box>
  </CardShell>
);

const AiBackgroundCard = ({
  id,
  session,
  data,
  qrDataUrl,
  meta,
  theme,
  variant,
}: TemplateProps & {
  variant: Extract<
    SessionShareTemplateId,
    'ai-neon-stadium' | 'ai-yellow-smash'
  >;
}) => {
  const isYellow = variant === 'ai-yellow-smash';
  const accent = isYellow ? '#facc15' : theme.accent;
  const panelBg = isYellow ? 'rgba(17, 17, 17, 0.78)' : 'rgba(8, 17, 31, 0.76)';
  const panelBorder = isYellow
    ? 'rgba(250, 204, 21, 0.55)'
    : 'rgba(56, 189, 248, 0.34)';

  return (
    <CardShell id={id} meta={meta} bg={isYellow ? '#111111' : '#07111f'}>
      <Image
        src={AI_BACKGROUND_URLS[variant]}
        alt={session.name}
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        objectFit="cover"
        crossOrigin="anonymous"
      />
      <Box
        position="absolute"
        inset={0}
        bg={
          isYellow
            ? 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.56) 45%, rgba(0,0,0,0.84) 100%)'
            : 'linear-gradient(180deg, rgba(3,7,18,0.16) 0%, rgba(3,7,18,0.44) 48%, rgba(3,7,18,0.88) 100%)'
        }
      />
      <Box position="relative" h="100%" p="58px">
        <Flex justify="space-between" align="center">
          <Box
            bg={isYellow ? '#facc15' : 'rgba(34, 197, 94, 0.9)'}
            color={isYellow ? '#111111' : 'white'}
            borderRadius="999px"
            px={6}
            py={3}
          >
            <Text fontSize="24px" fontWeight="950" textTransform="uppercase">
              Tuyển vãng lai
            </Text>
          </Box>
          {data.fee && <PricePill fee={data.fee} size="lg" theme={theme} />}
        </Flex>

        <Box position="absolute" left="58px" right="58px" top="405px">
          <Text
            color={accent}
            fontSize="31px"
            fontWeight="950"
            textTransform="uppercase"
          >
            {data.date} · {data.time}
          </Text>
          <Heading
            mt={4}
            color="white"
            fontSize="74px"
            fontWeight="950"
            lineHeight="0.98"
            textTransform="uppercase"
            lineClamp={3}
            overflowWrap="break-word"
          >
            {session.name}
          </Heading>
        </Box>

        <Box
          position="absolute"
          left="58px"
          right="58px"
          bottom="210px"
          bg={panelBg}
          border={`2px solid ${panelBorder}`}
          borderRadius="34px"
          p={8}
          color="white"
          backdropFilter="blur(2px)"
        >
          <Stack gap={5}>
            <DetailItem
              icon={MapPin}
              label={data.venue}
              size="venue"
              color={accent}
              labelColor="white"
              lineClamp={1}
              theme={theme}
            />
            <Grid templateColumns="1fr 1fr" gap={5}>
              <DetailItem
                icon={User}
                label={data.host}
                size="md"
                color={accent}
                labelColor="white"
                theme={theme}
              />
              <DetailItem
                icon={Users}
                label={data.maxPlayers}
                size="md"
                color={accent}
                labelColor="white"
                theme={theme}
              />
              <DetailItem
                icon={SquareAsterisk}
                label={data.courts}
                size="md"
                color={accent}
                labelColor="white"
                theme={theme}
              />
              <DetailItem
                icon={Phone}
                label={data.phone}
                size="md"
                color={accent}
                labelColor="white"
                theme={theme}
              />
            </Grid>
            <LevelBadges levels={session.requiredLevels} size="md" />
          </Stack>
        </Box>

        <Flex
          position="absolute"
          left="58px"
          right="58px"
          bottom="54px"
          justify="space-between"
          align="center"
        >
          {qrDataUrl && (
            <QrBlock
              qrDataUrl={qrDataUrl}
              size={122}
              dark
              caption="Quét QR để xem kèo"
              theme={theme}
            />
          )}
          <Text
            color="white"
            fontSize="25px"
            fontWeight="950"
            textAlign="right"
            lineHeight="1.1"
          >
            VMITO.COM
            <br />
            Tìm kèo cầu lông cực dễ
          </Text>
        </Flex>
      </Box>
    </CardShell>
  );
};

interface TemplateProps {
  id?: string;
  session: ISession;
  data: ShareCardData;
  qrDataUrl: string;
  meta: SessionShareTemplateMeta;
  theme: SessionShareThemeMeta;
}

const SessionShareCard = ({
  session,
  mode,
  templateId,
  themeId,
  captureId,
}: SessionShareCardProps) => {
  const locale = useLocale();
  const resolvedTemplateId = templateId || legacyModeToTemplate(mode);
  const meta =
    SESSION_SHARE_TEMPLATES.find(
      (template) => template.id === resolvedTemplateId
    ) || SESSION_SHARE_TEMPLATES[0];
  const theme = getShareTheme(themeId);
  const data = useShareCardData(session);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const elementId =
    captureId === null
      ? undefined
      : captureId ||
        getSessionShareCardElementId(session.id, resolvedTemplateId);

  useEffect(() => {
    const url = `${window.location.origin}/${locale}/sessions/${session.id}`;
    const qrWidth =
      resolvedTemplateId === 'story-vertical'
        ? 180
        : resolvedTemplateId === 'legacy-portrait'
          ? 80
          : 150;

    QRCode.toDataURL(url, {
      margin: 0,
      width: qrWidth,
      color: {
        dark: theme.qr,
        light: '#FFFFFF',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('Error generating QR code:', err));
  }, [locale, resolvedTemplateId, session.id, theme.qr]);

  const props = { id: elementId, session, data, qrDataUrl, meta, theme };

  switch (resolvedTemplateId) {
    case 'legacy-portrait':
      return <LegacyPortraitCard {...props} />;
    case 'legacy-social':
      return <LegacySocialCard {...props} />;
    case 'social-poster':
      return <SocialPosterCard {...props} />;
    case 'story-vertical':
      return <StoryVerticalCard {...props} />;
    case 'square-feed':
      return <SquareFeedCard {...props} />;
    case 'event-pass':
      return <EventPassCard {...props} />;
    case 'ai-neon-stadium':
      return <AiBackgroundCard {...props} variant="ai-neon-stadium" />;
    case 'ai-yellow-smash':
      return <AiBackgroundCard {...props} variant="ai-yellow-smash" />;
    case 'classic-clean':
    default:
      return <ClassicCleanCard {...props} />;
  }
};

export default SessionShareCard;
