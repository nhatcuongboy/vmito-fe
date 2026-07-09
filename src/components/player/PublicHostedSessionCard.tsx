'use client';

import { ISession, SessionStatus } from '@/lib/api/types';
import { Badge, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { Image } from '@/components/ui/chakra-compat';
import { CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { DEFAULT_COVER_PHOTO } from '@/constants';

interface IPublicHostedSessionCardProps {
  session: ISession;
}

const STATUS_COLOR_MAP: Record<SessionStatus, string> = {
  [SessionStatus.PREPARING]: 'yellow',
  [SessionStatus.IN_PROGRESS]: 'green',
  [SessionStatus.FINISHED]: 'gray',
  [SessionStatus.CANCELLED]: 'red',
};

const getSessionStatusLabel = (
  status: SessionStatus,
  tSession: ReturnType<typeof useTranslations>
): string => {
  if (status === SessionStatus.PREPARING) {
    return tSession('status.preparing');
  }

  if (status === SessionStatus.IN_PROGRESS) {
    return tSession('status.inProgress');
  }

  return tSession('status.finished');
};

const formatSessionTime = (
  input: Date | string | undefined,
  locale: string
): string => {
  if (!input) {
    return '--';
  }

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat(
    locale === 'vi' ? 'vi-VN' : locale === 'cn' ? 'zh-CN' : 'en-US',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  ).format(parsed);
};

export default function PublicHostedSessionCard({
  session,
}: IPublicHostedSessionCardProps) {
  const tSession = useTranslations('session');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedPlayersCount = session._count?.players ?? 0;
  const availableSlots = Math.max(maxPlayers - approvedPlayersCount, 0);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor="gray.100"
      bg="white"
      p={3}
      cursor="pointer"
      onClick={() => router.push(`/sessions/${session.slug || session.id}`)}
      _hover={{ borderColor: 'green.300', shadow: 'sm' }}
      transition="all 0.2s"
    >
      <Flex align="start" gap={3}>
        <Box
          w="96px"
          h="96px"
          borderRadius="md"
          bg="gray.100"
          overflow="hidden"
          flexShrink={0}
          position="relative"
        >
          <Image
            src={session.coverPhoto || DEFAULT_COVER_PHOTO}
            alt={session.name}
            w="full"
            h="full"
            objectFit="cover"
          />
          <Badge
            position="absolute"
            top={2}
            left={2}
            colorPalette={STATUS_COLOR_MAP[session.status]}
            variant="solid"
            fontSize="2xs"
          >
            {getSessionStatusLabel(session.status, tSession)}
          </Badge>
        </Box>

        <Box flex={1} minW={0}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            lineClamp={2}
            color="gray.800"
            mb={1}
          >
            {session.name}
          </Text>

          <HStack gap={1.5} align="start" mb={1.5} color="gray.600">
            <CalendarDays size={14} style={{ marginTop: 2 }} />
            <Text fontSize="xs">
              {formatSessionTime(session.startTime, locale)}
            </Text>
          </HStack>

          <HStack gap={1.5} align="start" mb={1.5} color="gray.600">
            <MapPin size={14} style={{ marginTop: 2 }} />
            <Text fontSize="xs" lineClamp={1}>
              {session.venue?.name ||
                session.location ||
                tCommon('notAvailable')}
            </Text>
          </HStack>

          <HStack justify="space-between" mt={2}>
            <HStack gap={1.5} align="start" color="gray.600">
              <Users size={14} style={{ marginTop: 2 }} />
              <Text fontSize="xs">
                {tSession('slotsAvailable', { count: availableSlots })}
              </Text>
            </HStack>
            <ChevronRight size={16} color="#9CA3AF" />
          </HStack>
        </Box>
      </Flex>
    </Box>
  );
}
