'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Flex,
  Badge,
  Skeleton,
  Stack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { VSelect } from '@/components/ui/VSelect';
import {
  PaymentRecord,
  PaymentStatus,
  PaymentMethod,
  ISession,
  FeeType,
} from '@/lib/api/types';
import { FeeService } from '@/lib/api/fee.service';
import {
  User,
  CheckCheck,
  Filter,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import PaymentStatusBadge from './PaymentStatusBadge';
import PaymentApprovalModal from './PaymentApprovalModal';
import { VTooltip } from '@/components/ui/VTooltip';

interface SessionPaymentListProps {
  session: ISession;
  payments: PaymentRecord[];
  onApprove: (
    paymentId: string,
    notes?: string,
    amount?: number,
    paymentMethod?: PaymentMethod
  ) => Promise<void>;
  onReject: (paymentId: string, notes?: string) => Promise<void>;
  onBulkApprove?: (paymentIds: string[]) => Promise<void>;
  totalExpenses?: number;
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
  totalExpenses = 0,
  isLoading = false,
}: SessionPaymentListProps) {
  const t = useTranslations('payment');
  const tFixed = useTranslations('clubs');
  const tCommon = useTranslations('common');

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );
  const [filter, setFilter] = useState<FilterType>('all');
  const [memberFilter, setMemberFilter] = useState<MemberFilterType>('all');
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set()
  );
  const [groupBulkLoading, setGroupBulkLoading] = useState<string | null>(null);

  const paymentsArray = useMemo(
    () => (Array.isArray(payments) ? payments : []),
    [payments]
  );

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
      filtered = filtered.filter((p) => p.player?.club?.id === memberFilter);
    }

    return filtered;
  }, [paymentsArray, filter, memberFilter]);

  // Group filtered payments by registeredByUserId (multi-slot registrations)
  const groupedPayments = useMemo(() => {
    const groups = new Map<string, PaymentRecord[]>();
    for (const payment of filteredPayments) {
      const key = payment.registeredByUserId || payment.playerId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(payment);
    }
    // Multi-slot groups first, then singles
    return Array.from(groups.entries())
      .map(([key, payments]) => ({ key, payments }))
      .sort((a, b) => b.payments.length - a.payments.length);
  }, [filteredPayments]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleGroupBulkApprove = async (
    key: string,
    group: PaymentRecord[]
  ) => {
    if (!onBulkApprove) return;
    setGroupBulkLoading(key);
    try {
      await onBulkApprove(group.map((p) => p.id));
    } finally {
      setGroupBulkLoading(null);
    }
  };

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

  const handleApprove = async (
    notes?: string,
    amount?: number,
    paymentMethod?: PaymentMethod
  ) => {
    if (!selectedPayment) return;
    await onApprove(selectedPayment.id, notes, amount, paymentMethod);
  };

  const handleReject = async (notes?: string) => {
    if (!selectedPayment) return;
    await onReject(selectedPayment.id, notes);
  };

  // Helper to get gender translation
  const getGenderText = (gender?: string) => {
    if (!gender) return '';
    switch (gender) {
      case 'MALE':
        return tCommon('male');
      case 'FEMALE':
        return tCommon('female');
      case 'OTHER':
        return tCommon('other');
      case 'PREFER_NOT_TO_SAY':
        return tCommon('preferNotToSay');
      default:
        return gender;
    }
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
        <Text fontWeight="semibold" color="green.600">
          {FeeService.formatFeeExact(payment.amount)}
        </Text>
      );
    }

    const groupName = player.club?.name || '';

    return (
      <VTooltip
        content={
          <Box>
            <Text fontWeight="bold" mb={1}>
              {tFixed('clubMember')}: {groupName}
            </Text>
            <Text fontSize="sm">
              {tFixed('perSessionFee')}:{' '}
              {FeeService.formatFeeExact(payment.amount)}
            </Text>
          </Box>
        }
      >
        <HStack gap={1} cursor="help" justify="flex-end">
          <Text fontWeight="semibold" color="teal.600">
            {FeeService.formatFeeExact(payment.amount)}
          </Text>
          <Badge colorPalette="teal" variant="subtle" fontSize="2xs" px={1}>
            {groupName}
          </Badge>
        </HStack>
      </VTooltip>
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
              {t('paidAmount')}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {approvedAmount === 0
                ? '0'
                : FeeService.formatFeeExact(approvedAmount)}
            </Text>
          </Box>
          <Box flex={1} minW="120px">
            <Text fontSize="sm" color="gray.600">
              {t('pendingAmount')}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="yellow.600">
              {totalAmount - approvedAmount === 0
                ? '0'
                : FeeService.formatFeeExact(totalAmount - approvedAmount)}
            </Text>
          </Box>
          <Box flex={1} minW="120px">
            <Text fontSize="sm" color="gray.600">
              {t('remainingAmount')}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              {totalAmount - approvedAmount === 0
                ? '0'
                : FeeService.formatFeeExact(totalAmount - approvedAmount)}
            </Text>
          </Box>
        </Flex>

        {/* Income / Expense / Net summary */}
        <Box mt={3} pt={3} borderTop="1px solid" borderColor="gray.100">
          <Flex gap={4} wrap="wrap">
            <Box flex={1} minW="120px">
              <Text fontSize="sm" color="gray.500">
                {t('income')}
              </Text>
              <Text fontSize="md" fontWeight="semibold" color="green.600">
                {totalAmount === 0
                  ? '0'
                  : FeeService.formatFeeExact(totalAmount)}
              </Text>
            </Box>
            <Box flex={1} minW="120px">
              <Text fontSize="sm" color="gray.500">
                {t('totalExpenses')}
              </Text>
              <Text fontSize="md" fontWeight="semibold" color="red.500">
                {totalExpenses === 0
                  ? '0'
                  : FeeService.formatFeeExact(totalExpenses)}
              </Text>
            </Box>
            <Box flex={1} minW="120px">
              <Text fontSize="sm" color="gray.500">
                {t('netTotal')}
              </Text>
              <Text
                fontSize="md"
                fontWeight="bold"
                color={
                  totalAmount - totalExpenses >= 0 ? 'green.600' : 'red.500'
                }
              >
                {FeeService.formatFeeExact(totalAmount - totalExpenses)}
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* Filters & Actions */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        <HStack gap={2} wrap="wrap">
          {/* Status Filter Button */}
          <VSelect
            size="sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            width={{ base: '100%', md: '200px' }}
            minWidth="200px"
            leftElement={<Filter size={16} />}
          >
            <option value="all">{t('all')}</option>
            <option value={PaymentStatus.PENDING}>
              {t('status.pending')}{' '}
              {pendingCount > 0 ? `(${pendingCount})` : ''}
            </option>
            <option value={PaymentStatus.SUBMITTED}>
              {t('status.submitted')}{' '}
              {submittedCount > 0 ? `(${submittedCount})` : ''}
            </option>
            <option value={PaymentStatus.APPROVED}>
              {t('status.approved')}
            </option>
          </VSelect>

          {/* Fixed Member Filter */}
          {fixedMemberGroups.length > 0 && (
            <Box minW="220px">
              <VSelect
                size="sm"
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                placeholder={tFixed('allMembers')}
                width="100%"
                minWidth="220px"
              >
                <option value="all">{tFixed('allMembers')}</option>
                <option value="fixed">{tFixed('fixedMembersOnly')}</option>
                <option value="regular">{tFixed('regularMembersOnly')}</option>
                {fixedMemberGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </VSelect>
            </Box>
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
        <Stack gap={2.5}>
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              p={3}
            >
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Skeleton height="32px" width="32px" borderRadius="full" />
                  <Stack gap={1}>
                    <Skeleton height="14px" width="110px" borderRadius="md" />
                    <Skeleton height="11px" width="60px" borderRadius="md" />
                  </Stack>
                </HStack>
                <HStack gap={2}>
                  <Skeleton height="16px" width="72px" borderRadius="md" />
                  <Skeleton height="22px" width="64px" borderRadius="full" />
                </HStack>
              </HStack>
            </Box>
          ))}
        </Stack>
      ) : filteredPayments.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Text color="gray.500">{t('noPayments')}</Text>
        </Box>
      ) : (
        <VStack gap={2} align="stretch">
          {groupedPayments.map(({ key, payments: group }) => {
            const isMulti = group.length > 1;
            const representative = group[0];
            const isExpanded = isMulti && !expandedGroups.has(key);
            const totalGroupAmount = group.reduce(
              (sum, p) => sum + p.amount,
              0
            );
            const males = group.filter(
              (p) => p.player?.gender === 'MALE'
            ).length;
            const females = group.filter(
              (p) => p.player?.gender === 'FEMALE'
            ).length;
            const allApproved = group.every(
              (p) => p.status === PaymentStatus.APPROVED
            );

            if (!isMulti) {
              // Single slot — render individual card
              const payment = representative;
              return (
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
                  <Flex align="center" justify="space-between">
                    <HStack gap={3} flex={1}>
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
                            {getGenderText(payment.player.gender)}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                    <HStack gap={3} flex={1} justify="flex-end">
                      <Box minW="100px" textAlign="right">
                        {renderFixedMemberAmount(payment)}
                      </Box>
                      <Box
                        minW="100px"
                        display="flex"
                        justifyContent="flex-end"
                      >
                        <PaymentStatusBadge status={payment.status} size="sm" />
                      </Box>
                    </HStack>
                  </Flex>
                  {payment.proofImageUrl && (
                    <HStack mt={2} ml={10}>
                      <Badge
                        colorPalette="green"
                        variant="subtle"
                        fontSize="xs"
                      >
                        {t('hasProof')}
                      </Badge>
                    </HStack>
                  )}
                </Box>
              );
            }

            // Multi-slot group card
            return (
              <Box
                key={key}
                border="1px solid"
                borderColor="blue.200"
                borderRadius="lg"
                overflow="hidden"
              >
                {/* Group header */}
                <Flex
                  px={3}
                  py={2.5}
                  bg="blue.50"
                  _dark={{ bg: 'blue.900/20' }}
                  align="center"
                  justify="space-between"
                  cursor="pointer"
                  onClick={() => toggleGroup(key)}
                >
                  <HStack gap={3}>
                    <Avatar.Root size="sm">
                      {representative.player?.user?.image ? (
                        <Avatar.Image src={representative.player.user.image} />
                      ) : (
                        <Avatar.Fallback>
                          <User size={16} />
                        </Avatar.Fallback>
                      )}
                    </Avatar.Root>
                    <Box>
                      <HStack gap={1.5}>
                        <Text fontWeight="semibold" fontSize="sm">
                          {representative.player?.name ||
                            representative.player?.user?.name ||
                            t('unknownPlayer')}
                        </Text>
                        <Badge colorPalette="blue" size="xs">
                          {group.length} slot
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {[
                          males > 0 && `${males} ${tCommon('male')}`,
                          females > 0 && `${females} ${tCommon('female')}`,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack gap={2}>
                    <Text fontWeight="semibold" color="green.600" fontSize="sm">
                      {FeeService.formatFeeExact(totalGroupAmount)}
                    </Text>
                    {!allApproved && onBulkApprove && (
                      <Button
                        size="xs"
                        colorPalette="green"
                        loading={groupBulkLoading === key}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupBulkApprove(key, group);
                        }}
                      >
                        <CheckCheck size={12} />
                        <Text ml={1}>{t('approveAll')}</Text>
                      </Button>
                    )}
                    <Box color="gray.500">
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Box>
                  </HStack>
                </Flex>

                {/* Individual slot rows */}
                {isExpanded && (
                  <VStack gap={0} align="stretch">
                    {group.map((payment, idx) => (
                      <Box
                        key={payment.id}
                        px={3}
                        py={2.5}
                        bg="white"
                        _dark={{ bg: 'gray.800' }}
                        borderTop="1px solid"
                        borderColor={idx === 0 ? 'blue.100' : 'gray.100'}
                        cursor="pointer"
                        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.750' } }}
                        transition="background 0.15s"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Flex align="center" justify="space-between">
                          <HStack gap={2.5}>
                            <Text
                              fontSize="xs"
                              color="gray.400"
                              fontWeight="medium"
                              minW="20px"
                            >
                              #{payment.player?.playerNumber}
                            </Text>
                            <Box>
                              <HStack gap={1.5}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {payment.player?.name || t('unknownPlayer')}
                                </Text>
                                {payment.player?.gender && (
                                  <Badge
                                    colorPalette={
                                      payment.player.gender === 'MALE'
                                        ? 'blue'
                                        : payment.player.gender === 'FEMALE'
                                          ? 'pink'
                                          : 'gray'
                                    }
                                    variant="subtle"
                                    size="xs"
                                  >
                                    {getGenderText(payment.player.gender)}
                                  </Badge>
                                )}
                                {payment.player?.isClubMember && (
                                  <Badge
                                    colorPalette="teal"
                                    variant="subtle"
                                    fontSize="2xs"
                                    px={1}
                                  >
                                    {payment.player?.club?.name ||
                                      tFixed('clubMember')}
                                  </Badge>
                                )}
                              </HStack>
                            </Box>
                          </HStack>
                          <HStack gap={3}>
                            {renderFixedMemberAmount(payment)}
                            <PaymentStatusBadge
                              status={payment.status}
                              size="sm"
                            />
                          </HStack>
                        </Flex>
                        {payment.proofImageUrl && (
                          <HStack mt={1} ml={8}>
                            <Badge
                              colorPalette="green"
                              variant="subtle"
                              fontSize="xs"
                            >
                              {t('hasProof')}
                            </Badge>
                          </HStack>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            );
          })}
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
