'use client';

import { IClubListItem, EClubJoinPolicy, IClubSchedule } from '@/types/club';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Text,
  VStack,
  Avatar,
} from '@chakra-ui/react';
import {
  Crown,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/chakra-compat';

interface ClubCardProps {
  club: IClubListItem;
}

const getJoinPolicyBadge = (
  policy: EClubJoinPolicy,
  t: (key: string) => string
) => {
  switch (policy) {
    case EClubJoinPolicy.OPEN:
      return {
        icon: Unlock,
        label: t('clubs.joinPolicy.open'),
        colorPalette: 'green',
      };
    case EClubJoinPolicy.APPROVAL_REQUIRED:
      return {
        icon: ShieldCheck,
        label: t('clubs.joinPolicy.approvalRequired'),
        colorPalette: 'orange',
      };
    case EClubJoinPolicy.INVITATION_ONLY:
      return {
        icon: Lock,
        label: t('clubs.joinPolicy.invitationOnly'),
        colorPalette: 'red',
      };
    default:
      return {
        icon: ShieldCheck,
        label: t('clubs.joinPolicy.approvalRequired'),
        colorPalette: 'orange',
      };
  }
};

// Helper function to group schedules by time slot
const groupSchedulesByTime = (
  schedules: IClubSchedule[],
  t: (key: string) => string
): string[] => {
  const timeMap = new Map<string, string[]>();

  schedules.forEach((schedule) => {
    const timeSlot = `${schedule.startTime}-${schedule.endTime}`;
    const dayName = t(`clubs.dayNames.${schedule.dayOfWeek}` as any);

    if (!timeMap.has(timeSlot)) {
      timeMap.set(timeSlot, []);
    }
    timeMap.get(timeSlot)!.push(dayName);
  });

  return Array.from(timeMap.entries()).map(
    ([timeSlot, days]) => `${days.join(', ')} • ${timeSlot}`
  );
};

export default function ClubCard({ club }: ClubCardProps) {
  const router = useRouter();
  const t = useTranslations();

  const joinPolicyBadge = getJoinPolicyBadge(club.joinPolicy, t);
  const JoinPolicyIcon = joinPolicyBadge.icon;

  const handleClick = () => {
    router.push(`/player/clubs/${club.id}`);
  };

  const venueName = club.defaultVenue?.name;
  const hasSchedules = club.schedules && club.schedules.length > 0;
  const groupedSchedules = hasSchedules
    ? groupSchedulesByTime(club.schedules!, t)
    : [];

  return (
    <Box
      position="relative"
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        shadow: 'xl',
        borderColor: 'blue.400',
        _dark: { borderColor: 'blue.500' },
      }}
      shadow="md"
    >
      {/* Gradient overlay at top */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="4px"
        bgGradient="to-r"
        gradientFrom="green.400"
        gradientVia="teal.400"
        gradientTo="blue.400"
      />

      {/* Club color indicator */}
      {club.color && (
        <Box
          position="absolute"
          top={4}
          right={4}
          w={4}
          h={4}
          borderRadius="full"
          bg={club.color}
          shadow="md"
        />
      )}

      {/* Header Section */}
      <Box px={5} pt={5} pb={3}>
        <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
          <Box flex="1" minW={0}>
            <Flex align="center" gap={2} mb={2} flexWrap="wrap">
              <Text
                fontWeight="bold"
                fontSize="xl"
                lineClamp={1}
                color="blue.600"
                _dark={{ color: 'blue.400' }}
                letterSpacing="tight"
              >
                {club.name}
              </Text>
              <Badge
                colorScheme="green"
                variant="subtle"
                px={2}
                py={0.5}
                borderRadius="full"
                fontSize="xs"
                fontWeight="medium"
              >
                {t('clubs.active')}
              </Badge>
            </Flex>

            {/* Description - with min height for consistent layout */}
            <Box minH="40px" mb={3}>
              {club.description && (
                <Text
                  fontSize="sm"
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                  lineClamp={2}
                >
                  {club.description}
                </Text>
              )}
            </Box>

            {/* Venue - with min height for consistent layout */}
            <Box minH="28px" mb={2}>
              {venueName && (
                <Flex
                  align="center"
                  gap={1.5}
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                >
                  <MapPin size={14} style={{ flexShrink: 0 }} />
                  <Text fontSize="sm" lineClamp={1} fontWeight="medium">
                    {venueName}
                  </Text>
                </Flex>
              )}

              {/* Location fallback if no venue */}
              {!venueName && club.location && (
                <Flex
                  align="center"
                  gap={1.5}
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                >
                  <MapPin size={14} style={{ flexShrink: 0 }} />
                  <Text fontSize="sm" lineClamp={1} fontWeight="medium">
                    {club.location}
                  </Text>
                </Flex>
              )}
            </Box>

            {/* Schedule - Grouped by time with min height */}
            <Box minH="60px" mb={2}>
              {hasSchedules && groupedSchedules.length > 0 && (
                <VStack align="stretch" gap={1.5}>
                  {groupedSchedules.map((scheduleText, idx) => (
                    <Flex
                      key={idx}
                      align="center"
                      gap={2}
                      color="gray.600"
                      _dark={{ color: 'gray.400' }}
                    >
                      <Box
                        p={1.5}
                        borderRadius="md"
                        bg="purple.50"
                        _dark={{ bg: 'purple.900/20' }}
                        flexShrink={0}
                      >
                        <Clock size={14} color="#805AD5" />
                      </Box>
                      <Text fontSize="sm" fontWeight="medium">
                        {scheduleText}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>
          </Box>
        </Flex>

        {/* Host info */}
        <Flex align="center" gap={2}>
          <Crown size={14} color="#DD6B20" />
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            {t('clubs.hostedBy')}{' '}
            <Text
              as="span"
              fontWeight="semibold"
              color="gray.800"
              _dark={{ color: 'gray.200' }}
            >
              {club.host.name}
            </Text>
          </Text>
        </Flex>
      </Box>

      {/* Divider */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />

      {/* Stats Section */}
      <Box px={5} py={4}>
        <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
          <HStack gap={4} flexWrap="wrap" flex="1">
            {/* Member count with avatars */}
            <Flex align="center" gap={2}>
              <Flex align="center">
                {/* Placeholder avatars - replace with actual member data if available */}
                {Array.from({ length: Math.min(club.memberCount, 3) }).map(
                  (_, i) => (
                    <Avatar.Root
                      key={i}
                      size="sm"
                      bg="blue.500"
                      ml={i > 0 ? '-2' : '0'}
                      borderWidth="2px"
                      borderColor="white"
                      _dark={{ borderColor: 'gray.800' }}
                    >
                      <Avatar.Fallback name={`Member ${i + 1}`} />
                    </Avatar.Root>
                  )
                )}
              </Flex>
              <Text
                fontSize="sm"
                color="gray.700"
                _dark={{ color: 'gray.300' }}
                fontWeight="medium"
              >
                {club.memberCount} {t('clubs.members')}
              </Text>
            </Flex>

            {/* Session count */}
            {club.sessionCount !== undefined && club.sessionCount > 0 && (
              <Flex align="center" gap={2}>
                <Box
                  p={1.5}
                  borderRadius="lg"
                  bg="green.50"
                  _dark={{ bg: 'green.900/20' }}
                >
                  <Calendar size={14} color="#38A169" />
                </Box>
                <Text
                  fontSize="sm"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                  fontWeight="medium"
                >
                  {club.sessionCount} {t('clubs.sessions')}
                </Text>
              </Flex>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Footer Section with CTA */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
      <Box px={5} py={4}>
        <Flex justify="space-between" align="center" gap={3}>
          {/* Max members info */}
          {club.maxMembers && (
            <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.500' }}>
              {t('clubs.maxMembers', { count: club.maxMembers })}
            </Text>
          )}

          {/* CTA Button */}
          <Button
            colorPalette="blue"
            size="sm"
            onClick={handleClick}
            _hover={{ transform: 'translateX(2px)' }}
            transition="transform 0.2s"
            ml="auto"
          >
            <Flex align="center" gap={2}>
              {t('clubs.viewDetails')}
              <ArrowRight size={16} />
            </Flex>
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
