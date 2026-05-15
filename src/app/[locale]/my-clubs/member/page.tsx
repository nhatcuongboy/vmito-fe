'use client';

import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Separator,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import VModal from '@/components/ui/VModal';
import ClubCardSkeleton from '@/components/club/ClubCardSkeleton';
import ClubRequestRowSkeleton from '@/components/club/ClubRequestRowSkeleton';
import { useRouter } from '@/i18n/config';
import {
  Clock,
  Plus,
  Users,
  UserCircle,
  ChevronRight,
  Check,
  X,
  Shield,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useMyClubsData } from '@/hooks/useMyClubsData';
import { IMyClub } from '@/types/club';

type RejectTarget =
  | { type: 'club'; clubId: string }
  | { type: 'member'; clubId: string; requestId: string };

export default function MemberPage() {
  const t = useTranslations();
  const router = useRouter();
  const {
    memberClubs,
    pendingOutgoing,
    isLoading,
    isActionLoading,
    handleReject,
  } = useMyClubsData();

  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const isRejectDialogOpen = rejectTarget !== null;

  const renderClubCard = (club: IMyClub) => (
    <Box
      key={club.id}
      p={{ base: 4, md: 6 }}
      bg="bg"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius={{ base: 'xl', md: '2xl' }}
      borderWidth="1px"
      borderColor="border"
      cursor="pointer"
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
        {club.status !== 'PENDING' && (
          <ChevronRight size={18} color="#CBD5E0" />
        )}
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
      <VStack gap={{ base: 6, md: 10 }} align="stretch">
        {/* Member clubs section skeleton */}
        <Box>
          <HStack mb={{ base: 4, md: 6 }} gap={2}>
            <Skeleton height="20px" width="20px" borderRadius="sm" />
            <Skeleton height="28px" width="180px" borderRadius="md" />
            <Skeleton height="20px" width="32px" borderRadius="full" />
          </HStack>
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            gap={{ base: 4, md: 6 }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <ClubCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        </Box>

        {/* Awaiting approval section skeleton */}
        <Box>
          <HStack mb={{ base: 4, md: 6 }} gap={2}>
            <Skeleton height="20px" width="20px" borderRadius="sm" />
            <Skeleton height="28px" width="200px" borderRadius="md" />
          </HStack>
          <VStack gap={{ base: 3, md: 4 }} align="stretch">
            {Array.from({ length: 3 }).map((_, i) => (
              <ClubRequestRowSkeleton key={i} />
            ))}
          </VStack>
        </Box>
      </VStack>
    );
  }

  return (
    <>
      <VStack gap={{ base: 6, md: 10 }} align="stretch">
        <Box>
          <HStack mb={{ base: 4, md: 6 }} gap={2}>
            <Users size={20} />
            <Heading size={{ base: 'md', md: 'lg' }}>
              {t('clubs.memberClubsTab')}
            </Heading>
            <Badge
              colorPalette="blue"
              variant="subtle"
              borderRadius="full"
              px={2}
            >
              {memberClubs.length}
            </Badge>
          </HStack>

          {memberClubs.length === 0 ? (
            <VStack
              py={{ base: 10, md: 12 }}
              bg="bg.muted"
              _dark={{ bg: 'gray.900/40' }}
              borderRadius={{ base: 'xl', md: '2xl' }}
              gap={4}
              borderWidth="1px"
              borderStyle="dashed"
            >
              <Users size={48} color="#A0AEC0" />
              <Text fontSize={{ base: 'sm', md: 'md' }} color="fg.muted">
                {t('clubs.noMemberClubsTab')}
              </Text>
              <Button
                colorPalette="green"
                variant="outline"
                size={{ base: 'sm', md: 'md' }}
                onClick={() => router.push('/clubs')}
              >
                {t('clubs.browseClubs')}
              </Button>
            </VStack>
          ) : (
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              gap={{ base: 4, md: 6 }}
            >
              {memberClubs.map((club) => renderClubCard(club))}
            </SimpleGrid>
          )}
        </Box>

        <Box>
          <HStack mb={{ base: 4, md: 6 }} gap={2}>
            <Clock size={20} />
            <Heading size={{ base: 'md', md: 'lg' }}>
              {t('clubs.awaitingApproval')}
            </Heading>
            {pendingOutgoing.length > 0 && (
              <Badge
                colorPalette="orange"
                variant="subtle"
                borderRadius="full"
                px={2}
              >
                {pendingOutgoing.length}
              </Badge>
            )}
          </HStack>

          {pendingOutgoing.length === 0 ? (
            <VStack
              py={{ base: 8, md: 10 }}
              bg="bg.muted"
              _dark={{ bg: 'gray.900/40' }}
              borderRadius={{ base: 'xl', md: '2xl' }}
            >
              <Text fontSize={{ base: 'sm', md: 'md' }} color="fg.muted">
                {t('clubs.noAwaitingApproval')}
              </Text>
            </VStack>
          ) : (
            <VStack gap={{ base: 3, md: 4 }} align="stretch">
              {pendingOutgoing.map((request) => (
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
                      bg="orange.50"
                      _dark={{ bg: 'orange.900/20' }}
                      borderRadius="lg"
                      flexShrink={0}
                    >
                      <Clock size={24} color="#DD6B20" />
                    </Box>
                    <Box flex={1} minW={0}>
                      <Heading size={{ base: 'xs', md: 'sm' }} mb={1}>
                        {request.club?.name}
                      </Heading>
                      <Text fontSize="xs" color="fg.muted">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack
                    gap={{ base: 2, md: 4 }}
                    w={{ base: 'full', sm: 'auto' }}
                  >
                    <Badge
                      colorPalette="orange"
                      flex={{ base: 1, sm: 'initial' }}
                    >
                      {request.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      flex={{ base: 1, sm: 'initial' }}
                      onClick={() =>
                        router.push(
                          `/clubs/${request.club?.slug ?? request.club?.id}`
                        )
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
      </VStack>

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
