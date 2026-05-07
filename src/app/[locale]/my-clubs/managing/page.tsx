'use client';

import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import VModal from '@/components/ui/VModal';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ROUTES } from '@/constants';
import {
  ChevronRight,
  Check,
  ClipboardList,
  MapPin,
  Plus,
  Shield,
  UserCircle,
  Users,
  Settings,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useMyClubsData } from '@/hooks/useMyClubsData';
import { IMyClub, IClub } from '@/types/club';

type RejectTarget =
  | { type: 'club'; clubId: string }
  | { type: 'member'; clubId: string; requestId: string };

export default function ManagingPage() {
  const t = useTranslations();
  const router = useRouter();
  const {
    uniqueClubs,
    managedClubs,
    incomingRequests,
    pendingClubs,
    isLoading,
    isLoadingIncoming,
    isLoadingPending,
    isActionLoading,
    canAccessHostFeatures,
    isAdmin,
    handleApprove,
    handleApproveJoinRequest,
    handleReject,
  } = useMyClubsData();

  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const isRejectDialogOpen = rejectTarget !== null;

  const renderClubCard = (club: IMyClub, isManaged: boolean) => (
    <Box
      key={club.id}
      p={{ base: 4, md: 6 }}
      bg="bg"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius={{ base: 'xl', md: '2xl' }}
      borderWidth="1px"
      borderColor="border"
      cursor={club.status === 'PENDING' ? 'default' : 'pointer'}
      onClick={() => {
        if (club.status !== 'PENDING') {
          router.push(`/clubs/${club.slug ?? club.id}`);
        }
      }}
      transition="all 0.2s"
      _hover={
        club.status === 'PENDING'
          ? {}
          : { shadow: 'md', transform: 'translateY(-2px)' }
      }
    >
      <HStack justify="space-between" mb={{ base: 3, md: 4 }}>
        <HStack gap={2} flex={1} minW={0}>
          <Heading size={{ base: 'sm', md: 'md' }} lineClamp={1}>
            {club.name}
          </Heading>
          {club.status === 'PENDING' && (
            <Badge colorPalette="yellow" size="xs">
              {t('clubs.clubStatus.pending')}
            </Badge>
          )}
        </HStack>
        <HStack flexShrink={0}>
          {isManaged && (
            <Button
              size="sm"
              variant="ghost"
              colorPalette="gray"
              p={{ base: 1, md: 2 }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/host/clubs/${club.id}/edit`);
              }}
            >
              <Settings size={16} />
            </Button>
          )}
          {club.status !== 'PENDING' && (
            <ChevronRight size={18} color="#CBD5E0" />
          )}
        </HStack>
      </HStack>

      <VStack align="start" gap={{ base: 2, md: 3 }} mb={{ base: 3, md: 4 }}>
        <HStack gap={2}>
          <UserCircle size={16} />
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            color="fg.muted"
            _dark={{ color: 'gray.400' }}
          >
            {t(
              `clubs.memberRole.${club.role.toLowerCase()}` as Parameters<
                typeof t
              >[0]
            )}
          </Text>
        </HStack>
        <HStack gap={2}>
          <Users size={16} />
          <Text
            fontSize={{ base: 'xs', md: 'sm' }}
            color="fg.muted"
            _dark={{ color: 'gray.400' }}
          >
            {club.memberCount} {t('clubs.members')}
          </Text>
        </HStack>
      </VStack>

      <Separator mb={{ base: 3, md: 4 }} />

      <HStack>
        <Text fontSize="xs" color="fg.muted">
          {t('clubs.hostedBy')}
        </Text>
        <Text fontSize="xs" fontWeight="bold">
          {club.host.name}
        </Text>
      </HStack>
    </Box>
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" colorPalette="green" />
      </Flex>
    );
  }

  return (
    <>
      <VStack gap={{ base: 6, md: 10 }} align="stretch">
        <Box>
          <HStack
            mb={{ base: 4, md: 6 }}
            gap={2}
            justify="space-between"
            flexWrap={{ base: 'wrap', md: 'nowrap' }}
          >
            <HStack gap={2} flex={{ base: '1 1 100%', md: 'initial' }}>
              <Shield size={20} />
              <Heading size={{ base: 'md', md: 'lg' }}>
                {t('clubs.managingGroups')}
              </Heading>
              <Badge
                colorPalette="green"
                variant="subtle"
                borderRadius="full"
                px={2}
              >
                {managedClubs.length}
              </Badge>
            </HStack>
            {canAccessHostFeatures && (
              <Button
                colorPalette="green"
                size={{ base: 'sm', md: 'sm' }}
                w={{ base: 'full', md: 'auto' }}
                onClick={() => router.push(ROUTES.HOST.CLUBS.CREATE)}
              >
                <Plus size={16} />
                {t('navigation.createClub')}
              </Button>
            )}
          </HStack>

          {managedClubs.length === 0 ? (
            <VStack
              py={12}
              bg="bg.muted"
              _dark={{ bg: 'gray.900/40' }}
              borderRadius="2xl"
              gap={4}
              borderWidth="1px"
              borderStyle="dashed"
            >
              <Shield size={48} color="#A0AEC0" />
              <Text color="fg.muted">{t('clubs.noManagedClubs')}</Text>
              {canAccessHostFeatures && (
                <Button
                  colorPalette="green"
                  variant="outline"
                  onClick={() => router.push(ROUTES.HOST.CLUBS.CREATE)}
                >
                  <Plus size={16} />
                  {t('clubs.createClub')}
                </Button>
              )}
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              {managedClubs.map((club) => renderClubCard(club, true))}
            </SimpleGrid>
          )}
        </Box>

        <Box>
          <HStack mb={{ base: 4, md: 6 }} gap={2}>
            <ClipboardList size={20} />
            <Heading size={{ base: 'md', md: 'lg' }}>
              {t('clubs.joinRequests')}
            </Heading>
            {incomingRequests.length > 0 && (
              <Badge
                colorPalette="orange"
                variant="subtle"
                borderRadius="full"
                px={2}
              >
                {incomingRequests.length}
              </Badge>
            )}
          </HStack>

          {isLoadingIncoming ? (
            <Flex justify="center" align="center" minH="100px">
              <Spinner size="md" colorPalette="green" />
            </Flex>
          ) : incomingRequests.length === 0 ? (
            <VStack
              py={{ base: 8, md: 10 }}
              bg="bg.muted"
              _dark={{ bg: 'gray.900/40' }}
              borderRadius={{ base: 'xl', md: '2xl' }}
            >
              <Text fontSize={{ base: 'sm', md: 'md' }} color="fg.muted">
                {t('clubs.noPendingRequests')}
              </Text>
            </VStack>
          ) : (
            <VStack gap={{ base: 3, md: 4 }} align="stretch">
              {incomingRequests.map((request) => (
                <Flex
                  key={request.id}
                  p={{ base: 4, md: 5 }}
                  bg="bg"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius={{ base: 'xl', md: 'xl' }}
                  borderWidth="1px"
                  borderColor="border"
                  align="center"
                  justify="space-between"
                  gap={{ base: 3, md: 4 }}
                  flexDirection={{ base: 'column', sm: 'row' }}
                >
                  <HStack
                    gap={{ base: 3, md: 4 }}
                    w={{ base: 'full', sm: 'auto' }}
                  >
                    <Box
                      p={{ base: 2, md: 3 }}
                      bg="blue.50"
                      _dark={{ bg: 'blue.900/20' }}
                      borderRadius="lg"
                      flexShrink={0}
                    >
                      <UserCircle size={24} color="#3182CE" />
                    </Box>
                    <Box flex={1} minW={0}>
                      <Heading size={{ base: 'xs', md: 'sm' }} mb={1}>
                        {request.user.name}
                      </Heading>
                      <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                        {request.club?.name} &middot;{' '}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack gap={2} w={{ base: 'full', sm: 'auto' }}>
                    <Button
                      size="sm"
                      colorPalette="green"
                      flex={{ base: 1, sm: 'initial' }}
                      onClick={() =>
                        handleApproveJoinRequest(request.clubId, request.id)
                      }
                      loading={isActionLoading}
                    >
                      <Check size={14} />
                      <Text display={{ base: 'inline', sm: 'inline' }}>
                        {t('clubs.approve')}
                      </Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="red"
                      flex={{ base: 1, sm: 'initial' }}
                      onClick={() =>
                        setRejectTarget({
                          type: 'member',
                          clubId: request.clubId,
                          requestId: request.id,
                        })
                      }
                      loading={isActionLoading}
                    >
                      <X size={14} />
                      <Text display={{ base: 'inline', sm: 'inline' }}>
                        {t('clubs.reject')}
                      </Text>
                    </Button>
                  </HStack>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>

      {isAdmin && (
        <Box mt={12}>
          <HStack mb={6} gap={2} justify="space-between">
            <HStack gap={2}>
              <Shield size={20} />
              <Heading size="lg">{t('clubs.adminApproval.title')}</Heading>
              {pendingClubs.length > 0 && (
                <Badge
                  colorPalette="yellow"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                >
                  {pendingClubs.length}
                </Badge>
              )}
            </HStack>
            <Button
              colorPalette="green"
              size="sm"
              onClick={() => router.push('/admin/clubs/create')}
            >
              <Plus size={16} />
              {t('clubs.adminApproval.createClub')}
            </Button>
          </HStack>

          {isLoadingPending ? (
            <Flex justify="center" align="center" minH="200px">
              <Spinner size="xl" colorPalette="green" />
            </Flex>
          ) : pendingClubs.length === 0 ? (
            <VStack
              py={12}
              bg="bg.muted"
              _dark={{ bg: 'gray.900/40' }}
              borderRadius="2xl"
              gap={4}
              borderWidth="1px"
              borderStyle="dashed"
            >
              <Shield size={48} color="#A0AEC0" />
              <Text color="fg.muted">
                {t('clubs.adminApproval.noPendingClubs')}
              </Text>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
              {pendingClubs.map((club: IClub) => (
                <Box
                  key={club.id}
                  p={6}
                  bg="bg"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="border"
                  _hover={{ shadow: 'md' }}
                >
                  <Flex gap={4}>
                    <Box
                      w="100px"
                      h="100px"
                      borderRadius="lg"
                      overflow="hidden"
                      bg="gray.100"
                      flexShrink={0}
                    >
                      {club.image ? (
                        <Image
                          src={club.image}
                          alt={club.name}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      ) : (
                        <Flex
                          w="full"
                          h="full"
                          align="center"
                          justify="center"
                          bg={club.color || 'green.500'}
                        >
                          <Users size={32} color="white" />
                        </Flex>
                      )}
                    </Box>
                    <VStack align="start" flex={1} gap={2}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold" fontSize="xl">
                          {club.name}
                        </Text>
                        <Badge colorPalette="yellow">
                          {t('clubs.clubStatus.pending')}
                        </Badge>
                      </HStack>
                      <HStack
                        fontSize="sm"
                        color="fg.muted"
                        _dark={{ color: 'gray.400' }}
                      >
                        <MapPin size={14} />
                        <Text>{club.location || t('common.notSpecified')}</Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        lineClamp={2}
                        color="gray.500"
                        dangerouslySetInnerHTML={{
                          __html: club.description || t('clubs.noDescription'),
                        }}
                        css={{
                          '& p': { display: 'inline' },
                          '& br': { display: 'none' },
                          '& *': { margin: 0, padding: 0 },
                        }}
                      />
                      <HStack pt={2} fontSize="xs" color="gray.400">
                        <Text>{t('clubs.hostedBy')}</Text>
                        <Text
                          fontWeight="medium"
                          color="fg.muted"
                          _dark={{ color: 'gray.300' }}
                        >
                          {club.host.name}
                        </Text>
                      </HStack>
                    </VStack>
                  </Flex>

                  <Flex mt={6} gap={3}>
                    <Button
                      flex={1}
                      colorPalette="green"
                      onClick={() => handleApprove(club.id)}
                      loading={isActionLoading}
                    >
                      <Check size={18} />
                      {t('clubs.approve')}
                    </Button>
                    <Button
                      flex={1}
                      variant="outline"
                      colorPalette="red"
                      onClick={() =>
                        setRejectTarget({
                          type: 'club',
                          clubId: club.id,
                        })
                      }
                      loading={isActionLoading}
                    >
                      <X size={18} />
                      {t('clubs.reject')}
                    </Button>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}

      <VModal
        isOpen={isRejectDialogOpen}
        onClose={() => setRejectTarget(null)}
        title={t('clubs.reject')}
        primaryActionText={t('clubs.reject')}
        onPrimaryAction={() => {
          if (rejectTarget) {
            handleReject(rejectTarget, rejectionReason);
            setRejectTarget(null);
          }
        }}
        isPrimaryLoading={isActionLoading}
        primaryColorScheme="red"
        secondaryActionText={t('common.cancel')}
        isPrimaryDisabled={!rejectionReason.trim()}
      >
        <Field
          label={t('clubs.rejectionReason', { reason: '' }).replace(': ', '')}
          required
        >
          <Input
            placeholder={t('clubs.joinMessagePlaceholder')}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </Field>
      </VModal>
    </>
  );
}
