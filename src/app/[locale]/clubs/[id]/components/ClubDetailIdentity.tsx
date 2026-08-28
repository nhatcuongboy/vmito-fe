'use client';

import {
  Box,
  Flex,
  Heading,
  Image,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
  Text,
} from '@chakra-ui/react';
import {
  Clock,
  DollarSign,
  MapPin,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/chakra-compat';
import { IClub } from '@/types/club';

interface ClubMembershipActionProps {
  isUserAdmin: boolean;
  isUserMember: boolean;
  isMembershipStatusLoading: boolean;
  hasPendingRequest: boolean;
  isRejected: boolean;
  isInvitationOnly: boolean;
  isJoining: boolean;
  onJoin: () => void;
  onOpenPending: () => void;
}

type ClubMembershipActionState = 'join' | 'pending' | null;

const resolveClubMembershipAction = ({
  isUserAdmin,
  isUserMember,
  isMembershipStatusLoading,
  hasPendingRequest,
  isInvitationOnly,
}: ClubMembershipActionProps): ClubMembershipActionState => {
  if (
    isUserMember ||
    isMembershipStatusLoading ||
    isUserAdmin ||
    isInvitationOnly
  ) {
    return null;
  }
  return hasPendingRequest ? 'pending' : 'join';
};

const ClubMembershipAction = ({
  isUserAdmin,
  isUserMember,
  isMembershipStatusLoading,
  hasPendingRequest,
  isRejected,
  isInvitationOnly,
  isJoining,
  onJoin,
  onOpenPending,
}: ClubMembershipActionProps) => {
  const t = useTranslations();
  const action = resolveClubMembershipAction({
    isUserAdmin,
    isUserMember,
    isMembershipStatusLoading,
    hasPendingRequest,
    isRejected,
    isInvitationOnly,
    isJoining,
    onJoin,
    onOpenPending,
  });

  if (action === 'pending') {
    return (
      <Button
        variant="subtle"
        colorPalette="yellow"
        size="md"
        w={{ base: 'full', md: 'auto' }}
        minH={{ base: '44px', md: 'auto' }}
        onClick={onOpenPending}
        borderRadius="xl"
      >
        <Clock size={18} />
        {t('clubs.pendingApproval')}
      </Button>
    );
  }

  if (action === 'join') {
    return (
      <Button
        colorPalette="green"
        size="md"
        w={{ base: 'full', md: 'auto' }}
        minH={{ base: '44px', md: 'auto' }}
        loading={isJoining}
        onClick={onJoin}
        borderRadius="xl"
      >
        <UserPlus size={18} />
        {isRejected ? 'Gửi lại yêu cầu' : t('clubs.joinClub')}
      </Button>
    );
  }

  return null;
};

interface ClubDetailIdentityProps extends ClubMembershipActionProps {
  club: IClub;
  isClubOwner: boolean;
  onEdit: () => void;
  onFees: () => void;
}

interface ClubManagementActionsProps {
  onEdit: () => void;
  onFees: () => void;
}

const ClubManagementActions = ({
  onEdit,
  onFees,
}: ClubManagementActionsProps) => {
  const t = useTranslations();

  return (
    <Flex gap={2} w="full">
      <Button
        flex={1}
        variant="outline"
        size="sm"
        colorPalette="gray"
        onClick={onEdit}
      >
        <Settings size={14} />
        {t('common.edit')}
      </Button>
      <Button
        flex={1}
        variant="outline"
        size="sm"
        colorPalette="green"
        onClick={onFees}
      >
        <DollarSign size={14} />
        {t('clubs.feeConfiguration')}
      </Button>
    </Flex>
  );
};

export const ClubDetailIdentity = ({
  club,
  isClubOwner,
  onEdit,
  onFees,
  ...membershipProps
}: ClubDetailIdentityProps) => {
  const t = useTranslations();
  const tAdmin = useTranslations('admin');
  const firstVenue = club.scheduleVenues?.[0] || club.defaultVenue;
  const usingOldLocation = !!(firstVenue?.district || firstVenue?.city);
  const locationParts = (
    usingOldLocation
      ? [firstVenue?.district, firstVenue?.city]
      : [firstVenue?.newDistrict, firstVenue?.newCity]
  ).filter(Boolean);
  const location = locationParts.join(', ') || club.location;

  return (
    <Box
      w="full"
      mx={0}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      shadow="sm"
      px={{ base: 4, md: 5 }}
      py={{ base: 3, md: 3 }}
      borderWidth="1px"
      borderColor="gray.100"
      mb={4}
    >
      <Flex gap={{ base: 3, md: 3 }} align="flex-start">
        <Box
          w={{ base: '64px', md: '64px' }}
          h={{ base: '64px', md: '64px' }}
          flexShrink={0}
          borderRadius={{ base: 'full', md: 'var(--chakra-radii-2xl)' }}
          overflow="hidden"
          bg={club.logo ? 'gray.100' : 'green.50'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderWidth="1px"
          borderColor={club.logo ? 'gray.100' : 'green.100'}
          boxShadow="0 4px 12px rgba(15, 23, 42, 0.12)"
        >
          {club.logo ? (
            <Image
              src={club.logo}
              alt={club.name}
              objectFit="cover"
              w="full"
              h="full"
            />
          ) : (
            <Text
              fontSize={{ base: '2xl', md: '2xl' }}
              fontWeight="bold"
              color="green.600"
            >
              {club.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </Box>

        <Box flex="1" minW="0">
          <Heading size="xl" mb={0} letterSpacing="tight" lineClamp={2}>
            {club.name}
          </Heading>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'stretch', md: 'center' }}
            gap={{ base: 1, md: 4 }}
            mt={{ base: 1.5, md: 1.5 }}
          >
            <Flex
              align="center"
              gap={1.5}
              color="gray.500"
              _dark={{ color: 'gray.400' }}
              flexShrink={0}
            >
              <Users size={18} aria-hidden="true" />
              <Text fontSize="sm" lineClamp={1}>
                {club.memberCount} {t('clubs.members')}
              </Text>
            </Flex>
            {location && (
              <Flex
                align="center"
                gap={1.5}
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                minW={0}
              >
                <Box flexShrink={0} aria-hidden="true">
                  <MapPin size={16} />
                </Box>
                <Text fontSize="sm" lineClamp={{ base: 2, md: 1 }}>
                  {location}
                  {locationParts.length > 0 &&
                    !usingOldLocation &&
                    ` (${tAdmin('newAddressBadge')})`}
                </Text>
              </Flex>
            )}
          </Flex>
        </Box>

        <Box display={{ base: 'none', md: 'block' }} flexShrink={0}>
          <ClubMembershipAction {...membershipProps} />
        </Box>
        {isClubOwner && (
          <MenuRoot positioning={{ placement: 'bottom-end' }}>
            <MenuTrigger asChild>
              <Button
                display={{ base: 'none', md: 'inline-flex' }}
                variant="outline"
                size="sm"
              >
                <Settings size={18} aria-hidden="true" />
                {t('clubs.manage')}
              </Button>
            </MenuTrigger>
            <Portal>
              <MenuPositioner zIndex={2000}>
                <MenuContent
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderWidth="1px"
                  borderColor="gray.200"
                  p={2}
                  minW="220px"
                >
                  <MenuItem value="edit-club" onClick={onEdit}>
                    <Settings size={16} />
                    {t('common.edit')}
                  </MenuItem>
                  <MenuItem value="club-fees" onClick={onFees}>
                    <DollarSign size={16} />
                    {t('clubs.feeConfiguration')}
                  </MenuItem>
                </MenuContent>
              </MenuPositioner>
            </Portal>
          </MenuRoot>
        )}
      </Flex>
    </Box>
  );
};

interface ClubMembershipBottomBarProps extends ClubMembershipActionProps {
  isClubOwner: boolean;
  onEdit: () => void;
  onFees: () => void;
}

export const ClubMembershipBottomBar = ({
  isClubOwner,
  onEdit,
  onFees,
  ...membershipProps
}: ClubMembershipBottomBarProps) => {
  const membershipAction = resolveClubMembershipAction(membershipProps);
  if (!isClubOwner && membershipAction === null) return null;

  return (
    <Flex
      display={{ base: 'flex', md: 'none' }}
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex={30}
      bg="white"
      _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
      borderTopWidth="1px"
      borderColor="gray.100"
      boxShadow="0 -4px 16px rgba(15, 23, 42, 0.12)"
      pb="env(safe-area-inset-bottom)"
    >
      <Box w="full" maxW="800px" mx="auto" px={3} py={2}>
        {isClubOwner && (
          <ClubManagementActions onEdit={onEdit} onFees={onFees} />
        )}
        {membershipAction !== null && (
          <Box w="full" mt={isClubOwner ? 2 : 0}>
            <ClubMembershipAction {...membershipProps} />
          </Box>
        )}
      </Box>
    </Flex>
  );
};
