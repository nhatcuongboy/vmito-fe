'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  HStack,
  Badge,
  SimpleGrid,
  Spinner,
  VStack,
  Icon,
  Separator,
  Avatar,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  MapPin,
  Users,
  Calendar,
  Crown,
  Info,
  ChevronLeft,
  ShieldCheck,
  Unlock,
  Lock,
  UserPlus,
  UserMinus,
  MessageSquare,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub, EClubJoinPolicy, EMemberRole } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ClubDetailsPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [club, setClub] = useState<IClub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const loadClubDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ClubsService.getClubDetails(clubId);
      setClub(data);
    } catch (error) {
      console.error('Failed to load club details:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsLoading(false);
    }
  }, [clubId, t]);

  useEffect(() => {
    if (clubId) {
      loadClubDetails();
    }
  }, [clubId, loadClubDetails]);

  const handleJoin = async () => {
    if (!currentUser) {
      router.push('/auth/signin');
      return;
    }

    try {
      setIsJoining(true);
      const response = await ClubsService.requestToJoin(clubId);
      if (response.status === 'joined') {
        toaster.success({ title: t('clubs.joinedSuccessfully') });
        loadClubDetails();
      } else {
        toaster.success({ title: t('clubs.joinRequestSent') });
        loadClubDetails();
      }
    } catch (error) {
      console.error('Failed to join club:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (
      !confirm(t('clubs.leaveClubConfirmation' as any) || t('common.confirm'))
    )
      return;

    try {
      setIsLeaving(true);
      await ClubsService.leaveClub(clubId);
      toaster.success({ title: t('clubs.leftSuccessfully') });
      loadClubDetails();
    } catch (error) {
      console.error('Failed to leave club:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" colorPalette="green" />
      </Flex>
    );
  }

  if (!club) {
    return (
      <Container maxW="container.md" py={16} textAlign="center">
        <Heading mb={4}>{t('common.error')}</Heading>
        <Button
          colorPalette="green"
          onClick={() => router.push('/player/clubs')}
        >
          {t('common.back')}
        </Button>
      </Container>
    );
  }

  const isMember = club.members?.some((m) => m.user.id === currentUser?.id);
  const memberInfo = club.members?.find((m) => m.user.id === currentUser?.id);

  const getJoinPolicyBadge = (policy: EClubJoinPolicy) => {
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

  const joinPolicy = getJoinPolicyBadge(club.joinPolicy);
  const JoinPolicyIcon = joinPolicy.icon;

  return (
    <Container maxW="container.xl" py={8}>
      {/* Back button */}
      <Button
        variant="ghost"
        mb={6}
        onClick={() => router.push('/player/clubs')}
        leftIcon={<ChevronLeft size={18} />}
      >
        {t('common.back')}
      </Button>

      <Box
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderRadius="2xl"
        overflow="hidden"
        shadow="sm"
        borderWidth="1px"
        borderColor="gray.100"
      >
        {/* Header Gradient */}
        <Box
          h="8px"
          bgGradient="to-r"
          gradientFrom="green.400"
          gradientVia="teal.400"
          gradientTo="blue.400"
        />

        <Box p={{ base: 6, md: 10 }}>
          <Flex direction={{ base: 'column', lg: 'row' }} gap={10}>
            {/* Club Identity */}
            <VStack align="start" flex="1" gap={6}>
              <VStack align="start" gap={2} w="full">
                <HStack justify="space-between" w="full" align="flex-start">
                  <VStack align="start" gap={2}>
                    <Heading
                      size="3xl"
                      color="gray.900"
                      _dark={{ color: 'white' }}
                    >
                      {club.name}
                    </Heading>
                    <HStack gap={3}>
                      <Badge
                        colorPalette={joinPolicy.colorPalette}
                        variant="subtle"
                        px={3}
                        py={1}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        gap={1}
                      >
                        <JoinPolicyIcon size={14} />
                        <Text fontSize="xs">{joinPolicy.label}</Text>
                      </Badge>
                      {club.color && (
                        <Box w={4} h={4} borderRadius="full" bg={club.color} />
                      )}
                    </HStack>
                  </VStack>

                  {/* Action Button */}
                  <Box>
                    {isMember ? (
                      <Button
                        colorPalette="red"
                        variant="outline"
                        onClick={handleLeave}
                        loading={isLeaving}
                        leftIcon={<UserMinus size={18} />}
                      >
                        {t('clubs.leaveClub')}
                      </Button>
                    ) : (
                      <Button
                        colorPalette="green"
                        onClick={handleJoin}
                        loading={isJoining}
                        leftIcon={<UserPlus size={18} />}
                        disabled={
                          club.joinPolicy === EClubJoinPolicy.INVITATION_ONLY
                        }
                      >
                        {t('clubs.joinClub')}
                      </Button>
                    )}
                  </Box>
                </HStack>

                {club.location && (
                  <Flex
                    align="center"
                    gap={2}
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                  >
                    <MapPin size={18} />
                    <Text fontWeight="medium">{club.location}</Text>
                  </Flex>
                )}
              </VStack>

              {club.description && (
                <Box>
                  <Heading
                    size="sm"
                    mb={2}
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                  >
                    {t('session.description')}
                  </Heading>
                  <Text
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                    lineHeight="tall"
                  >
                    {club.description}
                  </Text>
                </Box>
              )}

              <Separator />

              {/* Stats Grid */}
              <SimpleGrid columns={{ base: 2, sm: 4 }} gap={6} w="full">
                <VStack align="start" gap={1}>
                  <HStack color="blue.500">
                    <Users size={16} />
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                    >
                      {t('clubs.members')}
                    </Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold">
                    {club.memberCount}
                    {club.maxMembers ? ` / ${club.maxMembers}` : ''}
                  </Text>
                </VStack>
                <VStack align="start" gap={1}>
                  <HStack color="green.500">
                    <Calendar size={16} />
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                    >
                      {t('clubs.sessions')}
                    </Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold">
                    {club.sessionCount || 0}
                  </Text>
                </VStack>
                <VStack align="start" gap={1}>
                  <HStack color="orange.500">
                    <Crown size={16} />
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                    >
                      {t('clubs.hostedBy')}
                    </Text>
                  </HStack>
                  <Text fontSize="md" fontWeight="bold">
                    {club.host.name}
                  </Text>
                </VStack>
                <VStack align="start" gap={1}>
                  <HStack color="purple.500">
                    <Info size={16} />
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      textTransform="uppercase"
                    >
                      {t('common.status')}
                    </Text>
                  </HStack>
                  <Badge colorPalette={isMember ? 'green' : 'gray'}>
                    {isMember
                      ? memberInfo?.role || t('clubs.memberRole.member')
                      : t('common.notAvailable')}
                  </Badge>
                </VStack>
              </SimpleGrid>
            </VStack>

            {/* Recent Announcements */}
            <Box
              w={{ base: 'full', lg: '350px' }}
              p={6}
              bg="gray.50"
              _dark={{ bg: 'gray.900/40' }}
              borderRadius="xl"
            >
              <Flex align="center" gap={2} mb={4}>
                <MessageSquare size={20} color="#3182CE" />
                <Heading size="md">{t('clubs.recentAnnouncements')}</Heading>
              </Flex>

              <VStack gap={4} align="stretch">
                {club.announcements && club.announcements.length > 0 ? (
                  club.announcements.map((announcement) => (
                    <Box
                      key={announcement.id}
                      p={4}
                      bg="white"
                      _dark={{ bg: 'gray.800' }}
                      borderRadius="lg"
                      shadow="sm"
                      borderWidth="1px"
                      borderColor="gray.100"
                    >
                      <Text fontWeight="bold" fontSize="sm" mb={1}>
                        {announcement.title}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="gray.600"
                        _dark={{ color: 'gray.400' }}
                        lineClamp={3}
                      >
                        {announcement.content}
                      </Text>
                      <Flex justify="space-between" align="center" mt={3}>
                        <HStack gap={2}>
                          <Avatar.Root size="xs">
                            <Avatar.Image src={announcement.author.image} />
                            <Avatar.Fallback>
                              {announcement.author.name[0]}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <Text fontSize="2xs" color="gray.500">
                            {announcement.author.name}
                          </Text>
                        </HStack>
                        <Text fontSize="2xs" color="gray.400">
                          {new Date(
                            announcement.createdAt
                          ).toLocaleDateString()}
                        </Text>
                      </Flex>
                    </Box>
                  ))
                ) : (
                  <Text fontSize="sm" color="gray.500" fontStyle="italic">
                    {t('clubs.noAnnouncements')}
                  </Text>
                )}
              </VStack>
            </Box>
          </Flex>

          {/* Member List Section */}
          <Box mt={12}>
            <Flex align="center" gap={3} mb={6}>
              <Users size={24} />
              <Heading size="lg">{t('clubs.clubMembers')}</Heading>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {club.members?.map((member) => (
                <Flex
                  key={member.id}
                  p={4}
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  align="center"
                  gap={4}
                >
                  <Avatar.Root>
                    <Avatar.Image src={member.user.image} />
                    <Avatar.Fallback>{member.user.name[0]}</Avatar.Fallback>
                  </Avatar.Root>
                  <Box flex="1">
                    <Text fontWeight="bold">{member.user.name}</Text>
                    <HStack gap={2}>
                      <Badge
                        size="xs"
                        colorPalette={
                          member.role === EMemberRole.ADMIN
                            ? 'orange'
                            : member.role === EMemberRole.MODERATOR
                              ? 'blue'
                              : 'gray'
                        }
                      >
                        {t(
                          `clubs.memberRole.${member.role.toLowerCase()}` as any
                        )}
                      </Badge>
                      {member.user.level && (
                        <Text fontSize="xs" color="gray.500">
                          Lv.{member.user.level}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
