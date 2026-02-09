'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  VStack,
  HStack,
  Badge,
  Separator,
  Tabs,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  Users,
  ChevronRight,
  Clock,
  UserCircle,
  ClipboardList,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import {
  IMyClub,
  IClubJoinRequest,
  EJoinRequestStatus,
  EMemberRole,
} from '@/types/club';
import { useAuthStore } from '@/stores/useAuthStore';

export default function MyClubsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [myClubs, setMyClubs] = useState<IMyClub[]>([]);
  const [joinRequests, setJoinRequests] = useState<IClubJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [clubs, requests] = await Promise.all([
        ClubsService.getMyClubs(),
        ClubsService.getMyJoinRequests(),
      ]);
      setMyClubs(clubs);
      setJoinRequests(requests);
    } catch (error) {
      console.error('Failed to load my clubs data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!currentUser) {
    return (
      <Container maxW="container.md" py={16} textAlign="center">
        <Heading mb={4}>{t('auth.signin.title')}</Heading>
        <Button
          colorPalette="green"
          onClick={() => router.push('/auth/signin')}
        >
          {t('auth.signin.signInButton')}
        </Button>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" colorPalette="green" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading size="2xl" mb={2}>
          {t('clubs.myClubs')}
        </Heading>
        <Text color="gray.600" _dark={{ color: 'gray.400' }}>
          {t('clubs.manageMyClubsDescription' as any) ||
            "Manage the clubs you've joined and your join requests"}
        </Text>
      </Box>

      <Tabs.Root defaultValue="joined" variant="enclosed">
        <Tabs.List>
          <Tabs.Trigger value="joined" gap={2}>
            <Users size={16} />
            {t('clubs.myClubs')} ({myClubs.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="requests" gap={2}>
            <ClipboardList size={16} />
            {t('clubs.pendingRequest')} ({joinRequests.length})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="joined">
          <Box pt={6}>
            {myClubs.length === 0 ? (
              <VStack
                py={16}
                bg="gray.50"
                _dark={{ bg: 'gray.900/40' }}
                borderRadius="2xl"
                gap={4}
              >
                <Users size={48} color="#A0AEC0" />
                <Text color="gray.500">{t('clubs.noClubsFound')}</Text>
                <Button
                  colorPalette="green"
                  onClick={() => router.push('/player/clubs')}
                >
                  {t('clubs.browseClubs')}
                </Button>
              </VStack>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                {myClubs.map((club) => (
                  <Box
                    key={club.id}
                    p={6}
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="gray.100"
                    cursor="pointer"
                    onClick={() => router.push(`/player/clubs/${club.id}`)}
                    transition="all 0.2s"
                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                  >
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md">{club.name}</Heading>
                      <ChevronRight size={18} color="#CBD5E0" />
                    </HStack>

                    <VStack align="start" gap={3} mb={4}>
                      <HStack gap={2}>
                        <UserCircle size={16} />
                        <Text
                          fontSize="sm"
                          color="gray.600"
                          _dark={{ color: 'gray.400' }}
                        >
                          {t(
                            `clubs.memberRole.${club.role.toLowerCase()}` as any
                          )}
                        </Text>
                      </HStack>
                      <HStack gap={2}>
                        <Users size={16} />
                        <Text
                          fontSize="sm"
                          color="gray.600"
                          _dark={{ color: 'gray.400' }}
                        >
                          {club.memberCount} {t('clubs.members')}
                        </Text>
                      </HStack>
                      <HStack gap={2}>
                        <Clock size={16} />
                        <Text fontSize="xs" color="gray.500">
                          Joined {new Date(club.joinedAt).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </VStack>

                    <Separator mb={4} />

                    <HStack>
                      <Text fontSize="xs" color="gray.500">
                        Hosted by
                      </Text>
                      <Text fontSize="xs" fontWeight="bold">
                        {club.host.name}
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="requests">
          <Box pt={6}>
            {joinRequests.length === 0 ? (
              <VStack
                py={16}
                bg="gray.50"
                _dark={{ bg: 'gray.900/40' }}
                borderRadius="2xl"
              >
                <ClipboardList size={48} color="#A0AEC0" />
                <Text color="gray.500" mt={4}>
                  No pending join requests
                </Text>
              </VStack>
            ) : (
              <VStack gap={4} align="stretch">
                {joinRequests.map((request) => (
                  <Flex
                    key={request.id}
                    p={5}
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.100"
                    align="center"
                    justify="space-between"
                  >
                    <HStack gap={4}>
                      <Box
                        p={3}
                        bg="orange.50"
                        _dark={{ bg: 'orange.900/20' }}
                        borderRadius="lg"
                      >
                        <Clock size={24} color="#DD6B20" />
                      </Box>
                      <Box>
                        <Heading size="sm" mb={1}>
                          {request.club?.name}
                        </Heading>
                        <Text fontSize="xs" color="gray.500">
                          Requested on{' '}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack gap={4}>
                      <Badge
                        colorPalette={
                          request.status === EJoinRequestStatus.PENDING
                            ? 'orange'
                            : request.status === EJoinRequestStatus.APPROVED
                              ? 'green'
                              : 'red'
                        }
                      >
                        {request.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/player/clubs/${request.club?.id}`)
                        }
                      >
                        View Club
                      </Button>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
