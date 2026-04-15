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
  Phone,
  User,
} from 'lucide-react';
import { formatVenueName } from '@/utils';
import { useTranslations, useLocale } from 'next-intl';
import { Locale } from '@/i18n/locales';
import { FeeService } from '@/lib/api/fee.service';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import dayjs from '@/lib/dayjs';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import SessionShareCardSocial from './SessionShareCardSocial';

interface SessionShareCardProps {
  session: ISession;
  mode?: 'portrait' | 'landscape' | 'social';
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

const SessionShareCard = ({
  session,
  mode = 'portrait',
}: SessionShareCardProps) => {
  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
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
    const qrWidth = mode === 'landscape' ? 120 : mode === 'social' ? 100 : 80;
    QRCode.toDataURL(url, {
      margin: 0,
      width: qrWidth,
      color: {
        dark: '#179a3b', // primary green
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [mode, locale, session.id]);

  // Social media mode (4x5 ratio - 1080x1350px)
  if (mode === 'social') {
    return <SessionShareCardSocial session={session} />;
  }

  if (mode === 'landscape') {
    return (
      <Box
        id={`session-share-card-landscape-${session.id}`}
        w="1200px"
        h="630px"
        bg="white"
        borderRadius="2xl"
        overflow="hidden"
        borderWidth="12px"
        borderColor="green.600"
        position="relative"
      >
        <Grid templateColumns="450px 1fr" h="100%">
          {/* Left: Image and QR */}
          <Box
            bg="gray.50"
            borderRightWidth="2px"
            borderRightColor="gray.100"
            position="relative"
          >
            <Box h="400px" overflow="hidden">
              <Image
                src={session.coverPhoto || DEFAULT_COVER_PHOTO}
                alt={session.name}
                w="100%"
                h="100%"
                objectFit="cover"
                crossOrigin="anonymous"
              />
            </Box>
            <Box p={8} textAlign="center">
              <Box
                bg="green.600"
                color="white"
                py={4}
                px={6}
                mb={6}
                borderRadius="xl"
              >
                <Heading size="lg" fontWeight="bold" textTransform="uppercase">
                  {t('shareCardHeader')}
                </Heading>
              </Box>
              <Flex align="center" justify="center" gap={6}>
                <Box textAlign="left">
                  <Text fontSize="xl" fontWeight="bold" color="lime.500">
                    VMITO.COM
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Tìm kèo cầu lông cực dễ
                  </Text>
                </Box>
                {qrDataUrl && (
                  <Box
                    p={2}
                    border="1px solid"
                    borderColor="gray.100"
                    borderRadius="xl"
                    bg="white"
                  >
                    <Image src={qrDataUrl} alt="QR" boxSize="100px" />
                  </Box>
                )}
              </Flex>
            </Box>
          </Box>

          {/* Right: Info */}
          <Box p={10}>
            <Stack gap={8}>
              <Box>
                <Heading
                  size="2xl"
                  fontWeight="black"
                  color="gray.800"
                  mb={3}
                  textTransform="uppercase"
                >
                  {session.name}
                </Heading>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  Host: {displayHostName}
                </Text>
              </Box>

              <Stack gap={6}>
                <Flex align="center">
                  <Icon as={MapPin} boxSize={8} mr={4} color="green.500" />
                  <Box>
                    <Text fontWeight="bold" color="gray.700" fontSize="2xl">
                      {session.venue?.name || session.location}
                    </Text>
                    <Text fontSize="md" color="gray.500">
                      {session.venue?.address}
                    </Text>
                  </Box>
                </Flex>

                <Grid templateColumns="1fr 1fr" gap={10}>
                  <Stack gap={6}>
                    <Flex align="center" gap={4}>
                      <Icon as={Calendar} boxSize={8} color="green.500" />
                      <Text
                        fontSize="xl"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        {compactDate}
                      </Text>
                    </Flex>
                    <Flex align="center" gap={4}>
                      <Icon as={SquareAsterisk} boxSize={8} color="green.500" />
                      <Text
                        fontSize="xl"
                        fontWeight="semibold"
                        color="gray.700"
                      >
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
                  </Stack>
                  <Stack gap={6}>
                    <Flex align="center" gap={4}>
                      <Icon as={Clock} boxSize={8} color="green.500" />
                      <Text
                        fontSize="xl"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        {compactTime}
                      </Text>
                    </Flex>
                    <Flex align="center" gap={4}>
                      <Icon as={Users} boxSize={8} color="green.500" />
                      <Text
                        fontSize="xl"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        {t('maxPlayers', { count: maxPlayers })}
                      </Text>
                    </Flex>
                    {session.hostPhone && (
                      <Flex align="center" gap={4}>
                        <Icon as={Phone} boxSize={8} color="green.500" />
                        <Text
                          fontSize="xl"
                          fontWeight="semibold"
                          color="gray.700"
                        >
                          {session.hostPhone}
                        </Text>
                      </Flex>
                    )}
                  </Stack>
                </Grid>

                <Flex align="center" gap={4}>
                  <Icon as={Shield} boxSize={8} color={skillLevelColor.color} />
                  <Wrap gap={2}>
                    {session.requiredLevels?.map((level) => {
                      const levelColor = getSkillLevelColor([level]);
                      return (
                        <Badge
                          key={level}
                          colorPalette={levelColor.colorPalette}
                          variant="solid"
                          size="lg"
                          fontSize="md"
                          px={4}
                          py={1}
                          borderRadius="lg"
                        >
                          {getLevelShortLabel(level)}
                        </Badge>
                      );
                    })}
                  </Wrap>
                </Flex>

                <Box py={6} borderY="2px" borderColor="gray.100">
                  <Flex align="center" gap={4}>
                    <Icon as={Banknote} boxSize={10} color="red.600" />
                    <Text fontSize="4xl" fontWeight="black" color="red.600">
                      {session.feeConfig?.feeType === 'SPLIT_EVENLY'
                        ? session.feeConfig.splitPerPlayer
                          ? FeeService.formatFee(
                              session.feeConfig.splitPerPlayer
                            )
                          : 'Chia đều'
                        : session.feeConfig?.maleFee ===
                            session.feeConfig?.femaleFee
                          ? FeeService.formatFee(
                              session.feeConfig?.maleFee || 0
                            )
                          : `${tCommon('male')}: ${FeeService.formatFee(session.feeConfig?.maleFee || 0)}, ${tCommon('female')}: ${FeeService.formatFee(session.feeConfig?.femaleFee || 0)}`}
                    </Text>
                  </Flex>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Box>
    );
  }

  return (
    <Box
      id={`session-share-card-portrait-${session.id}`}
      w="400px"
      bg="white"
      borderRadius="2xl"
      overflow="hidden"
      borderWidth="6px"
      borderColor="green.600"
      boxShadow="none" // No shadow to avoid artifacts in captured image
    >
      {/* Cover Image Section */}
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

      {/* Share Header */}
      <Box bg="green.600" color="white" py={2} px={5} textAlign="center">
        <Heading size="md" fontWeight="bold" textTransform="uppercase">
          {t('shareCardHeader')}
        </Heading>
      </Box>

      {/* Content Section */}
      <Box p={4} pb={2}>
        <Stack gap={3}>
          {/* Title */}
          <Heading
            size="md"
            fontWeight="bold"
            color="green.600"
            textAlign="center"
            textTransform="uppercase"
          >
            {session.name}
          </Heading>

          {/* Location */}
          {(session.venue?.name || session.location) && (
            <Flex align="flex-start">
              <Icon as={MapPin} boxSize={5} mr={2} color="green.500" mt={1} />
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
                    <Text fontSize="xs" color="gray.500">
                      {session.venue.address}
                    </Text>
                  )}
              </Box>
            </Flex>
          )}

          {/* Host Info */}
          <Flex align="center" gap={2}>
            <Icon as={User} boxSize={5} color="green.500" />
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              {`Host: ${displayHostName}`}
            </Text>
          </Flex>

          {/* Info Grid */}
          <Stack gap={2}>
            {/* Row 1: Date & Time */}
            <Grid templateColumns="1fr 1fr" gap={4}>
              <Flex align="center" gap={2}>
                <Icon as={Calendar} boxSize={5} color="green.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  {compactDate}
                </Text>
              </Flex>
              <Flex align="center" gap={2}>
                <Icon as={Clock} boxSize={5} color="green.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  {compactTime}
                </Text>
              </Flex>
            </Grid>

            {/* Row 2: Courts & Max Players */}
            <Grid templateColumns="1fr 1fr" gap={4}>
              <Flex align="center" gap={2}>
                <Icon as={SquareAsterisk} boxSize={5} color="green.500" />
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
                <Icon as={Users} boxSize={5} color="green.500" />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  {t('maxPlayers', { count: maxPlayers })}
                </Text>
              </Flex>
            </Grid>

            {/* Row 3: Host Phone & Shuttlecock */}
            {(session.hostPhone || session.shuttlecock) && (
              <Grid templateColumns="1fr 1fr" gap={4}>
                {session.hostPhone ? (
                  <Flex align="center" gap={2}>
                    <Icon as={Phone} boxSize={5} color="green.500" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {session.hostPhone}
                    </Text>
                  </Flex>
                ) : (
                  <Box />
                )}
                {session.shuttlecock && (
                  <Flex align="center" gap={2}>
                    <Icon as={SquareAsterisk} boxSize={5} color="green.500" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Cầu {session.shuttlecock}
                    </Text>
                  </Flex>
                )}
              </Grid>
            )}
          </Stack>

          {/* Skill Levels Row */}
          <Flex align="center" gap={3}>
            <Icon as={Shield} boxSize={5} color={skillLevelColor.color} />
            <Wrap gap={1}>
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

          {/* Price */}
          {session.feeConfig && (
            <Box py={1} borderY="1px" borderColor="gray.100">
              <Flex align="center" gap={2}>
                <Icon as={Banknote} boxSize={5} color="red.600" />
                <Text fontSize="md" fontWeight="bold" color="red.600">
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
            <Text fontSize="sm" color="gray.600" lineClamp={3}>
              {session.description}
            </Text>
          )}

          {/* Call to Action Footer with QR Code */}
          <Flex
            mt={0}
            pt={1.5}
            pb={0.5}
            borderTopWidth="1px"
            borderColor="gray.200"
            align="center"
            justify="space-between"
            gap={2}
          >
            <Box flex="1">
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="green.700"
                lineHeight="1.4"
                textAlign="center"
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
              <Box
                p={0.5}
                border="1px solid"
                borderColor="gray.100"
                borderRadius="lg"
                flexShrink={0}
              >
                <Image src={qrDataUrl} alt="VMITO QR Code" boxSize="50px" />
              </Box>
            )}
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

export default SessionShareCard;
