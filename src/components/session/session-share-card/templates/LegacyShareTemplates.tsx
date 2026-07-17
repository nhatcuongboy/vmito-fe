'use client';

import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import { FeeService } from '@/lib/api/fee.service';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { formatVenueName } from '@/utils';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';
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
  User,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  formatLegacyPortraitDate,
  formatSessionShareDate,
} from '../useSessionShareCardData';
import { CardShell } from '../SessionShareCardPrimitives';
import { ISessionShareTemplateProps } from '../types';

export const LegacyPortraitCard = ({
  id,
  session,
  qrDataUrl,
  meta,
  theme,
}: ISessionShareTemplateProps) => {
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

export const LegacySocialCard = ({
  id,
  session,
  qrDataUrl,
  theme,
}: ISessionShareTemplateProps) => {
  const t = useTranslations('session');
  const tVenue = useTranslations('venue');
  const tCommon = useTranslations('common');
  const { getLevelShortLabel } = useLevelLabel();
  const locale = useLocale();
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const displayHostName = session.hostName || session.host?.name || '';
  const compactDate = session.startTime
    ? formatSessionShareDate(session.startTime, locale)
    : formatSessionShareDate(session.createdAt, locale);
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
      textAlign="left"
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
