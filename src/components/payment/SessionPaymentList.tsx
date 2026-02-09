'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react';
import {
  PaymentRecord,
  PaymentStatus,
  ISession,
  FeeType,
} from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import { User, CheckCheck, Filter, UserCheck } from 'lucide-react';
import PaymentStatusBadge from './PaymentStatusBadge';
import PaymentApprovalModal from './PaymentApprovalModal';
import { Tooltip } from '@/components/ui/tooltip';

interface SessionPaymentListProps {
  session: ISession;
  payments: PaymentRecord[];
  onApprove: (paymentId: string, notes?: string) => Promise<void>;
  onReject: (paymentId: string, notes?: string) => Promise<void>;
  onBulkApprove?: (paymentIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

type FilterType = 'all' | PaymentStatus;
type MemberFilterType = 'all' | 'fixed' | 'regular' | string;

export default function SessionPaymentList({
  session,
  payments,
  onApprove,
  onReject,
  onBulkApprove,
  isLoading = false,
}: SessionPaymentListProps) {
  const t = useTranslations('payment');
  const tFixed = useTranslations('clubs');

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );
  const [filter, setFilter] = useState<FilterType>('all');
  const [memberFilter, setMemberFilter] = useState<MemberFilterType>('all');
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const paymentsArray = Array.isArray(payments) ? payments : [];

  // Extract unique fixed member groups from payments
  const fixedMemberGroups = useMemo(() => {
    const groupsMap = new Map<
      string,
      { id: string; name: string; color?: string }
    >();
    paymentsArray.forEach((p) => {
      if (p.player?.isClubMember && p.player?.club) {
        const group = p.player.club;
        if (!groupsMap.has(group.id)) {
          groupsMap.set(group.id, {
            id: group.id,
            name: group.name,
            color: group.color,
          });
        }
      }
    });
    return Array.from(groupsMap.values());
  }, [paymentsArray]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    let filtered = paymentsArray;

    // Status filter
    if (filter !== 'all') {
      filtered = filtered.filter((p) => p.status === filter);
    }

    // Member type filter
    if (memberFilter === 'fixed') {
      filtered = filtered.filter((p) => p.player?.isClubMember);
    } else if (memberFilter === 'regular') {
      filtered = filtered.filter((p) => !p.player?.isClubMember);
    } else if (memberFilter !== 'all') {
      // Filter by specific group ID
      filtered = filtered.filter(
        (p) => p.player?.club?.id === memberFilter
      );
    }

    return filtered;
  }, [paymentsArray, filter, memberFilter]);

  const pendingCount = paymentsArray.filter(
    (p) => p.status === PaymentStatus.PENDING
  ).length;
  const submittedCount = paymentsArray.filter(
    (p) => p.status === PaymentStatus.SUBMITTED
  ).length;
  const fixedMemberCount = paymentsArray.filter(
    (p) => p.player?.isClubMember
  ).length;

  const submittedPaymentIds = paymentsArray
    .filter((p) => p.status === PaymentStatus.SUBMITTED)
    .map((p) => p.id);

  const handleBulkApprove = async () => {
    if (!onBulkApprove || submittedPaymentIds.length === 0) return;

    setIsBulkApproving(true);
    try {
      await onBulkApprove(submittedPaymentIds);
    } catch (error) {
      console.error('Bulk approve failed:', error);
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleApprove = async (notes?: string) => {
    if (!selectedPayment) return;
    await onApprove(selectedPayment.id, notes);
  };

  const handleReject = async (notes?: string) => {
    if (!selectedPayment) return;
    await onReject(selectedPayment.id, notes);
  };

  // Calculate totals
  const totalAmount = paymentsArray.reduce((sum, p) => sum + p.amount, 0);
  const approvedAmount = paymentsArray
    .filter((p) => p.status === PaymentStatus.APPROVED)
    .reduce((sum, p) => sum + p.amount, 0);

  // Helper to render fixed member info with tooltip
  const renderFixedMemberAmount = (payment: PaymentRecord) => {
    const player = payment.player;
    const isFixed = player?.isClubMember && player?.club;

    if (!isFixed) {
      return (
        <Text fontWeight="semibold" color="blue.600">
          {FeeService.formatFee(payment.amount)}
        </Text>
      );
    }

    const groupName = player.club?.name || '';

    return (
      <Tooltip
        content={
          <Box>
            <Text fontWeight="bold" mb={1}>
              {tFixed('clubMember')}: {groupName}
            </Text>
            <Text fontSize="sm">
              {tFixed('perSessionFee')}: {FeeService.formatFee(payment.amount)}
            </Text>
          </Box>
        }
      >
        <HStack gap={1} cursor="help">
          <Text fontWeight="semibold" color="teal.600">
            {FeeService.formatFee(payment.amount)}
          </Text>
          <Badge colorPalette="teal" variant="subtle" fontSize="2xs" px={1}>
            {groupName}
          </Badge>
        </HStack>
      </Tooltip>
    );
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Summary */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
      >
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="semibold">{t('paymentSummary')}</Text>
          <HStack gap={2}>
            {fixedMemberCount > 0 && (
              <Badge colorPalette="teal">
                <UserCheck size={12} />
                <Text ml={1}>
                  {fixedMemberCount} {tFixed('clubMember')}
                </Text>
              </Badge>
            )}
            {session.feeConfig?.feeType === FeeType.SPLIT_EVENLY && (
              <Badge colorPalette="purple">{t('splitEvenly')}</Badge>
            )}
          </HStack>
        </HStack>

        <Flex gap={4} wrap="wrap">
          <Box flex={1} minW="120px">
            <Text fontSize="sm" color="gray.600">
              {t('totalFee')}
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {FeeService.formatFee(totalAmount)}
            </Text>
          </Box>
          <Box flex={1} minW="120px">
            <Text fontSize="sm" color="gray.600">
              {t('paidAmount')}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {FeeService.formatFee(approvedAmount)}
            </Text>
          </Box>
          <Box flex={1} minW="120px">
            <Text fontSize="sm" color="gray.600">
              {t('pendingAmount')}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="yellow.600">
              {FeeService.formatFee(totalAmount - approvedAmount)}
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Filters & Actions */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        <HStack gap={2} wrap="wrap">
          <HStack gap={1}>
            <Filter size={16} />
            <HStack gap={1}>
              {(
                [
                  'all',
                  PaymentStatus.PENDING,
                  PaymentStatus.SUBMITTED,
                  PaymentStatus.APPROVED,
                ] as FilterType[]
              ).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'solid' : 'outline'}
                  colorPalette={filter === f ? 'blue' : 'gray'}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? t('all') : t(`status.${f.toLowerCase()}`)}
                  {f === PaymentStatus.PENDING && pendingCount > 0 && (
                    <Badge ml={1} colorPalette="yellow">
                      {pendingCount}
                    </Badge>
                  )}
                  {f === PaymentStatus.SUBMITTED && submittedCount > 0 && (
                    <Badge ml={1} colorPalette="blue">
                      {submittedCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </HStack>
          </HStack>

          {/* Fixed Member Filter */}
          {fixedMemberGroups.length > 0 && (
            <NativeSelectRoot size="sm" minW="150px">
              <NativeSelectField
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
              >
                <option value="all">{tFixed('allMembers')}</option>
                <option value="fixed">{tFixed('fixedMembersOnly')}</option>
                <option value="regular">{tFixed('regularMembersOnly')}</option>
                {fixedMemberGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </NativeSelectField>
            </NativeSelectRoot>
          )}
        </HStack>

        {onBulkApprove && submittedPaymentIds.length > 0 && (
          <Button
            size="sm"
            colorPalette="green"
            onClick={handleBulkApprove}
            loading={isBulkApproving}
          >
            <CheckCheck size={16} />
            <Text ml={1}>
              {t('approveAll')} ({submittedPaymentIds.length})
            </Text>
          </Button>
        )}
      </Flex>

      {/* Payment List */}
      {isLoading ? (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">{t('loading')}</Text>
        </Box>
      ) : filteredPayments.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">{t('noPayments')}</Text>
        </Box>
      ) : (
        <VStack gap={2} align="stretch">
          {filteredPayments.map((payment) => (
            <Box
              key={payment.id}
              bg="white"
              border="1px solid"
              borderColor={
                payment.player?.isClubMember ? 'teal.200' : 'gray.200'
              }
              borderRadius="lg"
              p={3}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ borderColor: 'blue.300', shadow: 'sm' }}
              onClick={() => setSelectedPayment(payment)}
            >
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Avatar.Root size="sm">
                    {payment.player?.user?.image ? (
                      <Avatar.Image src={payment.player.user.image} />
                    ) : (
                      <Avatar.Fallback>
                        <User size={16} />
                      </Avatar.Fallback>
                    )}
                  </Avatar.Root>
                  <Box>
                    <HStack gap={2}>
                      <Text fontWeight="medium" fontSize="sm">
                        {payment.player?.name ||
                          payment.player?.user?.name ||
                          t('unknownPlayer')}
                      </Text>
                      {/* Fixed Member Badge */}
                      {payment.player?.isClubMember && (
                        <Badge
                          colorPalette="teal"
                          variant="subtle"
                          fontSize="2xs"
                          px={1}
                        >
                          <UserCheck size={10} />
                          <Text ml={0.5}>
                            {payment.player?.club?.name ||
                              tFixed('clubMember')}
                          </Text>
                        </Badge>
                      )}
                    </HStack>
                    {payment.player?.gender && (
                      <Text fontSize="xs" color="gray.500">
                        {payment.player.gender}
                      </Text>
                    )}
                  </Box>
                </HStack>

                <HStack gap={3}>
                  {renderFixedMemberAmount(payment)}
                  <PaymentStatusBadge status={payment.status} size="sm" />
                </HStack>
              </HStack>

              {payment.proofImageUrl && (
                <HStack mt={2} ml={10}>
                  <Badge colorPalette="green" variant="subtle" fontSize="xs">
                    {t('hasProof')}
                  </Badge>
                </HStack>
              )}
            </Box>
          ))}
        </VStack>
      )}

      {/* Approval Modal */}
      {selectedPayment && (
        <PaymentApprovalModal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          paymentRecord={selectedPayment}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </VStack>
  );
}
