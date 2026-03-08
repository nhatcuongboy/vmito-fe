'use client';

import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/chakra-compat';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { useAuthStore } from '@/stores/useAuthStore';
import { EJoinRequestStatus, IClubJoinRequest, IMyClub } from '@/types/club';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { UserRole } from '@/lib/api/types';
import { ROUTES } from '@/constants';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import {
  ChevronRight,
  ClipboardList,
  Clock,
  Plus,
  UserCircle,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

export default function MyClubsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();

  const isHostOrAdmin = canAccessHostFeatures;

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

  if (isLoading) {
    return (
      <PageLayout title={t('clubs.myClubs')}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t('clubs.myClubs')}>
      <Text color="gray.600" _dark={{ color: 'gray.400' }} mb={8}>
        {t('clubs.manageMyClubsDescription')}
      </Text>

      {/* Section 1: Joined Clubs */}
      <Box mb={12}>
        <HStack mb={6} gap={2} justify="space-between">
          <HStack gap={2}>
            <Users size={20} />
            <Heading size="lg">{t('clubs.myClubs')}</Heading>
            <Badge
              colorPalette="green"
              variant="subtle"
              borderRadius="full"
              px={2}
            >
              {myClubs.length}
            </Badge>
          </HStack>
          {isHostOrAdmin && (
            <Button
              colorPalette="green"
              size="sm"
              onClick={() => router.push(ROUTES.HOST.CLUBS.CREATE)}
            >
              <Plus size={16} />
              {t('navigation.createClub')}
            </Button>
          )}
        </HStack>

        {myClubs.length === 0 ? (
          <VStack
            py={12}
            bg="gray.50"
            _dark={{ bg: 'gray.900/40' }}
            borderRadius="2xl"
            gap={4}
            borderWidth="1px"
            borderStyle="dashed"
          >
            <Users size={48} color="#A0AEC0" />
            <Text color="gray.500">{t('clubs.noClubsFound')}</Text>
            <Button
              colorPalette="green"
              variant="outline"
              onClick={() => router.push('/clubs')}
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
                  <Heading size="md" lineClamp={1}>
                    {club.name}
                  </Heading>
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
                      {t(`clubs.memberRole.${club.role.toLowerCase()}` as any)}
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

      {/* Section 2: Pending Requests */}
      <Box>
        <HStack mb={6} gap={2}>
          <ClipboardList size={20} />
          <Heading size="lg">{t('clubs.pendingRequest')}</Heading>
          {joinRequests.length > 0 && (
            <Badge
              colorPalette="orange"
              variant="subtle"
              borderRadius="full"
              px={2}
            >
              {joinRequests.length}
            </Badge>
          )}
        </HStack>

        {joinRequests.length === 0 ? (
          <VStack
            py={10}
            bg="gray.50"
            _dark={{ bg: 'gray.900/40' }}
            borderRadius="2xl"
          >
            <Text color="gray.500">{t('clubs.noPendingRequests')}</Text>
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
                    {t('common.view')}
                  </Button>
                </HStack>
              </Flex>
            ))}
          </VStack>
        )}
      </Box>
    </PageLayout>
  );
}
