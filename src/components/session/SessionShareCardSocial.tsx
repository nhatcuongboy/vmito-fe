'use client';

import { ISession } from '@/lib/api/types';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  Stack,
  Text,
  Wrap,
  Badge,
} from '@chakra-ui/react';
import {
  Calendar,
  Clock,
  SquareAsterisk,
  Users,
  Shield,
  MapPin,
  Banknote,
  User,
  Phone,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Locale } from '@/i18n/locales';
import { FeeService } from '@/lib/api/fee.service';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import dayjs from '@/lib/dayjs';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface SessionShareCardSocialProps {
  session: ISession;
}

const formatDate = (dateString: string | Date, locale: string): string => {
  const date = dayjs(dateString).locale(
    locale === Locale.VI ? Locale.VI : Locale.EN
  );
  const formattedDate =
    locale === Locale.VI
      ? date.format('dddd, DD/MM')
      : date.format('ddd, MM/DD');
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

const formatTime = (dateString: string | Date, locale: string): string => {
  const date = dayjs(dateString).locale(
    locale === Locale.VI ? Locale.VI : Locale.EN
  );
  return date.format('HH:mm');
};

const SessionShareCardSocial = ({ session }: SessionShareCardSocialProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const { getLevelShortLabel } = useLevelLabel();
  const locale = useLocale();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const displayHostName = session.hostName || session.host?.name || '';

  const compactDate = session.startTime
    ? formatDate(session.startTime, locale)
    : formatDate(session.createdAt, locale);

  const compactTime = session.startTime
    ? `${formatTime(session.startTime, locale)} - ${session.endTime ? formatTime(session.endTime, locale) : ''}`
    : '';

  const skillLevelColor = getSkillLevelColor(session.requiredLevels);

  useEffect(() => {
    const url = `${window.location.origin}/${locale}/sessions/${session.id}`;
    QRCode.toDataURL(url, {
      margin: 0,
      width: 150,
      color: {
        dark: '#2563EB', // blue.600
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [locale, session.id]);

  return (
    <Box
      id={`session-share-card-social-${session.id}`}
      w="1080px"
      h="1350px"
      bg="white"
      borderRadius="3xl"
      overflow="hidden"
      borderWidth="16px"
      borderColor="blue.600"
      boxShadow="none"
    >
      {/* Cover Image */}
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

      {/* Share Header */}
      <Box bg="blue.600" color="white" py={5} px={10} textAlign="center">
        <Heading size="4xl" fontWeight="bold" textTransform="uppercase">
          {t('shareCardHeader')}
        </Heading>
      </Box>

      {/* Content Section */}
      <Box p={8} pb={6} bg="white">
        <Stack gap={6}>
          {/* Title */}
          <Heading
            size="4xl"
            fontWeight="bold"
            color="blue.600"
            textAlign="center"
          >
            {session.name}
          </Heading>

          {/* Location */}
          {(session.venue?.name || session.location) && (
            <Flex align="flex-start" gap={6}>
              <Icon as={MapPin} boxSize={14} color="blue.500" mt={1} />
              <Box flex="1">
                <Text fontWeight="semibold" color="gray.700" fontSize="4xl">
                  {session.venue?.name || session.location}
                </Text>
                {session.venue?.address &&
                  session.venue.address !== session.venue.name && (
                    <Text fontSize="3xl" color="gray.500" mt={1}>
                      {session.venue.address}
                    </Text>
                  )}
              </Box>
            </Flex>
          )}

          {/* Host Info */}
          <Flex align="center" gap={6}>
            <Icon as={User} boxSize={14} color="blue.500" />
            <Text fontSize="4xl" fontWeight="semibold" color="gray.700">
              Host: {displayHostName}
            </Text>
          </Flex>

          {/* Info Grid */}
          <Stack gap={5}>
            {/* Row 1: Date & Time */}
            <Grid templateColumns="1fr 1fr" gap={10}>
              <Flex align="center" gap={6}>
                <Icon as={Calendar} boxSize={14} color="blue.500" />
                <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                  {compactDate}
                </Text>
              </Flex>
              <Flex align="center" gap={6}>
                <Icon as={Clock} boxSize={14} color="blue.500" />
                <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                  {compactTime}
                </Text>
              </Flex>
            </Grid>

            {/* Row 2: Courts & Max Players */}
            <Grid templateColumns="1fr 1fr" gap={10}>
              <Flex align="center" gap={6}>
                <Icon as={SquareAsterisk} boxSize={14} color="blue.500" />
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
                <Icon as={Users} boxSize={14} color="blue.500" />
                <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                  {t('maxPlayers', { count: maxPlayers })}
                </Text>
              </Flex>
            </Grid>

            {/* Row 3: Host Phone & Shuttlecock */}
            {(session.hostPhone || session.shuttlecock) && (
              <Grid templateColumns="1fr 1fr" gap={10}>
                {session.hostPhone ? (
                  <Flex align="center" gap={6}>
                    <Icon as={Phone} boxSize={14} color="blue.500" />
                    <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                      {session.hostPhone}
                    </Text>
                  </Flex>
                ) : (
                  <Box />
                )}
                {session.shuttlecock && (
                  <Flex align="center" gap={6}>
                    <Icon as={SquareAsterisk} boxSize={14} color="blue.500" />
                    <Text fontSize="4xl" fontWeight="medium" color="gray.700">
                      Cầu {session.shuttlecock}
                    </Text>
                  </Flex>
                )}
              </Grid>
            )}
          </Stack>

          {/* Skill Levels */}
          <Flex align="center" gap={8}>
            <Icon as={Shield} boxSize={14} color={skillLevelColor.color} />
            <Wrap gap={4}>
              {session.requiredLevels && session.requiredLevels.length > 0 ? (
                Array.from(new Set(session.requiredLevels))
                  .sort((a, b) =>
                    typeof a === 'number' && typeof b === 'number' ? a - b : 0
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
                <Badge colorPalette="gray" variant="subtle" size="lg">
                  {t('allLevels')}
                </Badge>
              )}
            </Wrap>
          </Flex>

          {/* Price */}
          {session.feeConfig && (
            <Box pt={1}>
              <Flex align="center" gap={6}>
                <Icon as={Banknote} boxSize={14} color="red.600" />
                <Text fontSize="4xl" fontWeight="bold" color="red.600">
                  {session.feeConfig.feeType === 'SPLIT_EVENLY'
                    ? session.feeConfig.splitPerPlayer
                      ? FeeService.formatFee(session.feeConfig.splitPerPlayer)
                      : 'Chia đều'
                    : session.feeConfig.maleFee === session.feeConfig.femaleFee
                      ? FeeService.formatFee(session.feeConfig.maleFee || 0)
                      : `${tCommon('male')}: ${FeeService.formatFee(session.feeConfig.maleFee || 0)} - ${tCommon('female')}: ${FeeService.formatFee(session.feeConfig.femaleFee || 0)}`}
                </Text>
              </Flex>
            </Box>
          )}

          {/* Description */}
          {session.description && (
            <Text fontSize="4xl" color="gray.600" lineClamp={3}>
              {session.description}
            </Text>
          )}

          {/* Footer with QR and Branding */}
          <Flex
            mt={0}
            pt={6}
            pb={2}
            // borderTopWidth="3px"
            // borderColor="gray.200"
            align="flex-end"
            justify="space-between"
            gap={6}
          >
            <Box flex="1">
              <Text
                fontSize="2xl"
                fontWeight="bold"
                color="blue.700"
                lineHeight="1.5"
              >
                Truy cập{' '}
                <Text as="span" color="lime.500">
                  VMITO.COM
                </Text>
                <br />
                để tìm kiếm nhiều kèo hot hơn
              </Text>
            </Box>
            {qrDataUrl && (
              <Box textAlign="center">
                <Box
                  p={2}
                  border="3px solid"
                  borderColor="gray.200"
                  borderRadius="2xl"
                  bg="white"
                  mb={2}
                >
                  <Image src={qrDataUrl} alt="QR" boxSize="150px" />
                </Box>
                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                  vmito.com
                </Text>
              </Box>
            )}
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

export default SessionShareCardSocial;
