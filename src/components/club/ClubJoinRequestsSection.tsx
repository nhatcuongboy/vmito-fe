'use client';

import ClubJoinRequestRow from '@/components/club/ClubJoinRequestRow';
import ClubRequestRowSkeleton from '@/components/club/ClubRequestRowSkeleton';
import { ROUTES } from '@/constants';
import { IClubJoinRequest } from '@/types/club';
import { Badge, Box, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { ClipboardList } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

interface IClubJoinRequestsSectionProps {
  requests: IClubJoinRequest[];
  isLoading: boolean;
  onApprove: (clubId: string, requestId: string) => Promise<void>;
  onReject: (request: IClubJoinRequest) => void;
}

const ClubJoinRequestsSection = ({
  requests,
  isLoading,
  onApprove,
  onReject,
}: IClubJoinRequestsSectionProps) => {
  const t = useTranslations();
  const tNotification = useTranslations('notification');
  const format = useFormatter();
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(
    null
  );

  const handleApprove = async (request: IClubJoinRequest) => {
    setApprovingRequestId(request.id);
    try {
      await onApprove(request.clubId, request.id);
    } finally {
      setApprovingRequestId(null);
    }
  };

  return (
    <Box>
      <HStack mb={{ base: 4, md: 6 }} gap={2}>
        <ClipboardList size={20} />
        <Heading size={{ base: 'md', md: 'lg' }}>
          {t('clubs.joinRequests')}
        </Heading>
        {requests.length > 0 && (
          <Badge
            colorPalette="orange"
            variant="subtle"
            borderRadius="full"
            px={2}
          >
            {requests.length}
          </Badge>
        )}
      </HStack>

      {isLoading ? (
        <VStack gap={{ base: 3, md: 4 }} align="stretch">
          {Array.from({ length: 3 }).map((_, index) => (
            <ClubRequestRowSkeleton key={index} />
          ))}
        </VStack>
      ) : requests.length === 0 ? (
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
          {requests.map((request) => (
            <ClubJoinRequestRow
              key={request.id}
              request={request}
              contextText={request.club?.name}
              submittedText={format.dateTime(new Date(request.createdAt), {
                dateStyle: 'medium',
              })}
              sessionsPlayedText={
                request.sessionsPlayedCount
                  ? tNotification('approvalSessionsPlayedCount', {
                      count: request.sessionsPlayedCount,
                    })
                  : undefined
              }
              detailHref={ROUTES.HOST.APPROVAL.CLUB_REQUEST(
                request.clubId,
                request.id
              )}
              viewDetailsLabel={t('clubs.viewDetails')}
              approveLabel={t('clubs.approve')}
              rejectLabel={t('clubs.reject')}
              loadingAction={
                approvingRequestId === request.id ? 'APPROVED' : null
              }
              onApprove={handleApprove}
              onReject={onReject}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ClubJoinRequestsSection;
