'use client';

import { IClubListItem, EClubJoinPolicy } from '@/types/club';
import { Badge, Box, Flex, HStack, Text } from '@chakra-ui/react';
import {
  Crown,
  MapPin,
  Users,
  Calendar,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { useTranslations } from 'next-intl';

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

export default function ClubCard({ club }: ClubCardProps) {
  const router = useRouter();
  const t = useTranslations();

  const joinPolicyBadge = getJoinPolicyBadge(club.joinPolicy, t);
  const JoinPolicyIcon = joinPolicyBadge.icon;

  const handleClick = () => {
    router.push(`/player/clubs/${club.id}`);
  };

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
        shadow: '2xl',
        transform: 'translateY(-4px)',
        borderColor: 'green.400',
        _dark: { borderColor: 'green.500' },
      }}
      cursor="pointer"
      onClick={handleClick}
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
            <Flex align="center" gap={2} mb={2}>
              <Text
                fontWeight="bold"
                fontSize="xl"
                lineClamp={1}
                color="gray.900"
                _dark={{ color: 'white' }}
                letterSpacing="tight"
              >
                {club.name}
              </Text>
            </Flex>

            {/* Description */}
            {club.description && (
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: 'gray.400' }}
                lineClamp={2}
                mb={3}
              >
                {club.description}
              </Text>
            )}

            {/* Location */}
            {club.location && (
              <Flex
                align="center"
                gap={1.5}
                color="gray.600"
                _dark={{ color: 'gray.400' }}
                mb={2}
              >
                <MapPin size={14} style={{ flexShrink: 0 }} />
                <Text fontSize="sm" lineClamp={1} fontWeight="medium">
                  {club.location}
                </Text>
              </Flex>
            )}
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
        <HStack gap={4} flexWrap="wrap">
          {/* Member count */}
          <Flex align="center" gap={2}>
            <Box
              p={1.5}
              borderRadius="lg"
              bg="blue.50"
              _dark={{ bg: 'blue.900/20' }}
            >
              <Users size={14} color="#3182CE" />
            </Box>
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
      </Box>

      {/* Footer Section */}
      <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.700' }} mx={5} />
      <Box px={5} py={3}>
        <Flex justify="space-between" align="center">
          {/* Join policy badge */}
          <Badge
            colorPalette={joinPolicyBadge.colorPalette}
            variant="subtle"
            size="sm"
            borderRadius="md"
            display="flex"
            alignItems="center"
            gap={1}
            px={2}
            py={1}
          >
            <JoinPolicyIcon size={12} />
            <Text fontSize="xs">{joinPolicyBadge.label}</Text>
          </Badge>

          {/* Max members */}
          {club.maxMembers && (
            <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.500' }}>
              {t('clubs.maxMembers', { count: club.maxMembers })}
            </Text>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
