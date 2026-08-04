'use client';

import {
  Badge,
  Box,
  Heading,
  HStack,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import VModal from '@/components/ui/VModal';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import AppPendingClubRequestCard from '@/components/club/AppPendingClubRequestCard';
import AppPendingClubRequestCardSkeleton from '@/components/club/AppPendingClubRequestCardSkeleton';
import ClubCardSkeleton from '@/components/club/ClubCardSkeleton';
import ManagedClubCard from '@/components/club/ManagedClubCard';
import { useRouter } from '@/i18n/config';
import { Clock, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useMyClubsData } from '@/hooks/useMyClubsData';
import { IClubJoinRequest } from '@/types/club';

function MemberPageContent() {
  const t = useTranslations();
  const format = useFormatter();
  const router = useRouter();
  const { memberClubs, pendingOutgoing, isLoading, handleCancelJoinRequest } =
    useMyClubsData();

  const [withdrawRequest, setWithdrawRequest] =
    useState<IClubJoinRequest | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleConfirmWithdraw = async () => {
    if (!withdrawRequest) return;

    try {
      setIsWithdrawing(true);
      await handleCancelJoinRequest(withdrawRequest.clubId);
      setWithdrawRequest(null);
    } catch {
      return;
    } finally {
      setIsWithdrawing(false);
    }
  };

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
              <AppPendingClubRequestCardSkeleton key={i} />
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
              {memberClubs.map((club) => (
                <ManagedClubCard key={club.id} club={club} />
              ))}
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
                <AppPendingClubRequestCard
                  key={request.id}
                  request={request}
                  submittedText={t('clubs.requestSubmittedOn', {
                    date: format.dateTime(new Date(request.createdAt), {
                      dateStyle: 'medium',
                    }),
                  })}
                  statusLabel={t('clubs.clubStatus.pending')}
                  hostedByLabel={t('clubs.hostedBy')}
                  viewClubLabel={t('clubs.viewClub')}
                  withdrawLabel={t('clubs.withdrawJoinRequest')}
                  isWithdrawing={
                    isWithdrawing && withdrawRequest?.id === request.id
                  }
                  onWithdraw={setWithdrawRequest}
                />
              ))}
            </VStack>
          )}
        </Box>
      </VStack>

      <VModal
        isOpen={withdrawRequest !== null}
        onClose={() => {
          if (!isWithdrawing) setWithdrawRequest(null);
        }}
        title={t('clubs.withdrawJoinRequestTitle')}
        primaryActionText={t('clubs.withdrawJoinRequest')}
        onPrimaryAction={handleConfirmWithdraw}
        isPrimaryLoading={isWithdrawing}
        primaryColorScheme="red"
        secondaryActionText={t('common.cancel')}
        isSecondaryDisabled={isWithdrawing}
        closeOnOverlayClick={!isWithdrawing}
        closeButtonAriaLabel={t('common.close')}
      >
        <Text color="fg.muted">
          {t('clubs.withdrawJoinRequestConfirmation', {
            clubName: withdrawRequest?.club?.name ?? '',
          })}
        </Text>
      </VModal>
    </>
  );
}

export default function MemberPage() {
  return (
    <ProtectedRouteGuard>
      <MemberPageContent />
    </ProtectedRouteGuard>
  );
}
