'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Flex,
  Badge,
  SimpleGrid,
  Skeleton,
  Stack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, useMemo } from 'react';
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
  Check,
  X,
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
  showSummary?: boolean;
  headerTitle?: string;
}

type FilterType = 'all' | PaymentStatus;
type MemberFilterType = 'all' | 'fixed' | 'regular' | string;

interface PaymentStatusFilterProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
  counts: Record<FilterType, number>;
}

function PaymentStatusFilter({
  value,
  onChange,
  counts,
}: PaymentStatusFilterProps) {
  const t = useTranslations('payment');
  const tPlayers = useTranslations('SessionDetail.playersTab');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAllSelected = value === 'all';

  const options: { value: FilterType; label: string; colorPalette: string }[] =
    [
      { value: 'all', label: t('all'), colorPalette: 'green' },
      {
        value: PaymentStatus.PENDING,
        label: t('status.pending'),
        colorPalette: 'yellow',
      },
      {
        value: PaymentStatus.SUBMITTED,
        label: t('status.submitted'),
        colorPalette: 'blue',
      },
      {
        value: PaymentStatus.APPROVED,
        label: t('status.approved'),
        colorPalette: 'green',
      },
    ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const CheckIndicator = ({
    checked,
    colorPalette,
  }: {
    checked: boolean;
    colorPalette: string;
  }) => (
    <Box
      w="18px"
      h="18px"
      border="1px solid"
      borderColor={
        checked
          ? `${colorPalette}.500`
          : { base: 'gray.300', _dark: 'whiteAlpha.300' }
      }
      bg={checked ? `${colorPalette}.500` : 'transparent'}
      borderRadius="sm"
      display="flex"
      alignItems="center"
      justifyContent="center"
      transition="all 0.2s"
      flexShrink={0}
    >
      {checked && <Check size={12} color="white" strokeWidth={3} />}
    </Box>
  );

  const CountBadge = ({
    count,
    colorPalette = 'gray',
  }: {
    count: number;
    colorPalette?: string;
  }) => (
    <Badge
      variant="subtle"
      colorPalette={colorPalette}
      minW="30px"
      h="24px"
      px={2}
      borderRadius="md"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      fontSize="xs"
      fontWeight="semibold"
      fontVariantNumeric="tabular-nums"
    >
      {count}
    </Badge>
  );

  return (
    <Box position="relative" ref={containerRef}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        colorPalette={!isAllSelected ? 'green' : 'gray'}
        borderWidth="1px"
        borderRadius="full"
        h="36px"
        px={3}
        bg={!isAllSelected ? { base: 'green.50', _dark: 'green.900/20' } : 'bg'}
        borderColor={!isAllSelected ? 'green.200' : 'border'}
        _hover={{
          bg: !isAllSelected
            ? { base: 'green.100', _dark: 'green.900/30' }
            : { base: 'gray.50', _dark: 'whiteAlpha.100' },
        }}
      >
        <HStack gap={1.5}>
          <Filter size={14} />
          <Text fontSize="sm" fontWeight="medium">
            {tPlayers('filter')}
          </Text>
          {!isAllSelected && (
            <Badge
              colorPalette="green"
              variant="solid"
              borderRadius="full"
              fontSize="2xs"
              px={1.5}
              minW="18px"
              textAlign="center"
            >
              1
            </Badge>
          )}
          <Box
            as={ChevronDown}
            boxSize={3.5}
            color="fg.muted"
            transform={isOpen ? 'rotate(180deg)' : 'none'}
            transition="transform 0.16s ease"
          />
        </HStack>
      </Button>

      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          mt={2}
          bg={{ base: 'white', _dark: 'gray.800' }}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          boxShadow="lg"
          borderRadius="lg"
          border="1px solid"
          borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
          zIndex={10}
          width="224px"
          overflow="hidden"
          p={1.5}
        >
          <VStack align="stretch" gap={1}>
            {options.map((option) => {
              const checked = value === option.value;
              return (
                <Box
                  key={option.value}
                  px={2.5}
                  py={2}
                  borderRadius="md"
                  cursor="pointer"
                  bg={
                    checked
                      ? {
                          base: `${option.colorPalette}.50`,
                          _dark: `${option.colorPalette}.900/20`,
                        }
                      : undefined
                  }
                  _hover={{
                    bg: checked
                      ? {
                          base: `${option.colorPalette}.100`,
                          _dark: `${option.colorPalette}.900/30`,
                        }
                      : { base: 'gray.50', _dark: 'gray.700' },
                  }}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <HStack justify="space-between" width="100%" gap={3}>
                    <HStack gap={2.5} minW={0}>
                      <CheckIndicator
                        checked={checked}
                        colorPalette={option.colorPalette}
                      />
                      <Text
                        fontSize="sm"
                        fontWeight={checked ? 'semibold' : 'medium'}
                        color={checked ? 'fg' : 'fg.muted'}
                      >
                        {option.label}
                      </Text>
                    </HStack>
                    <CountBadge
                      count={counts[option.value]}
                      colorPalette={option.colorPalette}
                    />
                  </HStack>
                </Box>
              );
            })}
            {!isAllSelected && (
              <Box pt={1}>
                <Button
                  size="xs"
                  width="full"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => {
                    onChange('all');
                    setIsOpen(false);
                  }}
                >
                  <HStack gap={1} justify="center">
                    <X size={12} />
                    <Text>{tPlayers('clearFilter')}</Text>
                  </HStack>
                </Button>
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

interface SessionPaymentSummaryProps {
  session: ISession;
  payments: PaymentRecord[];
  totalExpenses?: number;
}

export function SessionPaymentSummary({
  session,
  payments,
  totalExpenses = 0,
}: SessionPaymentSummaryProps) {
  const t = useTranslations('payment');

  const paymentsArray = useMemo(
    () => (Array.isArray(payments) ? payments : []),
    [payments]
  );
  const totalAmount = paymentsArray.reduce((sum, p) => sum + p.amount, 0);
  const approvedAmount = paymentsArray
    .filter((p) => p.status === PaymentStatus.APPROVED)
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = totalAmount - approvedAmount;
  const netAmount = totalAmount - totalExpenses;

  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      p={4}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold">{t('paymentSummary')}</Text>
        <HStack gap={2}>
          {session.feeConfig?.feeType === FeeType.SPLIT_EVENLY && (
            <Badge colorPalette="purple">{t('splitEvenly')}</Badge>
          )}
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
        <Box p={3} borderRadius="lg" bg="green.50" _dark={{ bg: 'green.950' }}>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            {t('income')}
          </Text>
          <Text fontSize="md" fontWeight="bold" color="green.600">
            {totalAmount === 0 ? '0' : FeeService.formatFeeExact(totalAmount)}
          </Text>
        </Box>
        <Box p={3} borderRadius="lg" bg="red.50" _dark={{ bg: 'red.950' }}>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            {t('totalExpenses')}
          </Text>
          <Text fontSize="md" fontWeight="bold" color="red.500">
            {totalExpenses === 0
              ? '0'
              : FeeService.formatFeeExact(totalExpenses)}
          </Text>
        </Box>
        <Box p={3} borderRadius="lg" bg="green.50" _dark={{ bg: 'green.950' }}>
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            {t('paidAmount')}
          </Text>
          <Text fontSize="md" fontWeight="bold" color="green.600">
            {approvedAmount === 0
              ? '0'
              : FeeService.formatFeeExact(approvedAmount)}
          </Text>
        </Box>
        <Box
          p={3}
          borderRadius="lg"
          bg="yellow.50"
          _dark={{ bg: 'yellow.950' }}
        >
          <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
            {t('pendingAmount')}
          </Text>
          <Text fontSize="md" fontWeight="bold" color="yellow.700">
            {pendingAmount === 0
              ? '0'
              : FeeService.formatFeeExact(pendingAmount)}
          </Text>
        </Box>
        <Box
          p={3}
          borderRadius="lg"
          bg={netAmount >= 0 ? 'green.50' : 'red.50'}
          _dark={{ bg: netAmount >= 0 ? 'green.950' : 'red.950' }}
          gridColumn={{ base: '1 / -1', md: '2 / 3' }}
          justifySelf="center"
          w={{ base: 'calc(50% - 6px)', md: '100%' }}
          textAlign="center"
        >
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="gray.700"
            _dark={{ color: 'gray.300' }}
          >
            {t('netTotal')}
          </Text>
          <Text
            fontSize="md"
            fontWeight="bold"
            color={netAmount >= 0 ? 'green.600' : 'red.500'}
          >
            {FeeService.formatFeeExact(netAmount)}
          </Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

export default function SessionPaymentList({
  session,
  payments,
  onApprove,
  onReject,
  onBulkApprove,
  totalExpenses = 0,
  isLoading = false,
  showSummary = true,
  headerTitle,
}: SessionPaymentListProps) {
  const t = useTranslations('payment');
  const tFixed = useTranslations('clubs');
  const tCommon = useTranslations('common');

  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );
  const [filter, setFilter] = useState<FilterType>('all');
  const [memberFilter, setMemberFilter] = useState<MemberFilterType>('all');
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
      if (p.player?.clubFeeApplied && p.player?.club) {
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
      filtered = filtered.filter((p) => p.player?.clubFeeApplied);
    } else if (memberFilter === 'regular') {
      filtered = filtered.filter((p) => !p.player?.clubFeeApplied);
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

  const handleGroupBulkApprove = async (key: string, paymentIds: string[]) => {
    if (!onBulkApprove || paymentIds.length === 0) return;
    setGroupBulkLoading(key);
    try {
      await onBulkApprove(paymentIds);
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
  const approvedCount = paymentsArray.filter(
    (p) => p.status === PaymentStatus.APPROVED
  ).length;
  const filterCounts: Record<FilterType, number> = {
    all: paymentsArray.length,
    [PaymentStatus.PENDING]: pendingCount,
    [PaymentStatus.SUBMITTED]: submittedCount,
    [PaymentStatus.APPROVED]: approvedCount,
    [PaymentStatus.REJECTED]: 0,
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

  // Helper to render fixed member info with tooltip
  const renderFixedMemberAmount = (payment: PaymentRecord) => {
    const player = payment.player;
    const isFixed = player?.clubFeeApplied && player?.club;

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
              {tFixed('monthlyFixedMember')}: {groupName}
            </Text>
            <Text fontSize="sm">
              {tFixed('perSessionFee')}:{' '}
              {FeeService.formatFeeExact(payment.amount)}
            </Text>
          </Box>
        }
      >
        <Text
          fontWeight="semibold"
          color="teal.600"
          cursor="help"
          textAlign="right"
        >
          {FeeService.formatFeeExact(payment.amount)}
        </Text>
      </VTooltip>
    );
  };

  return (
    <VStack gap={4} align="stretch">
      {showSummary && (
        <SessionPaymentSummary
          session={session}
          payments={paymentsArray}
          totalExpenses={totalExpenses}
        />
      )}

      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        {headerTitle && (
          <Text fontWeight="semibold" fontSize="lg">
            {headerTitle}
          </Text>
        )}
        <HStack gap={2} wrap="wrap">
          <PaymentStatusFilter
            value={filter}
            onChange={setFilter}
            counts={filterCounts}
          />

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
            const hasSubmitted = group.some(
              (p) => p.status === PaymentStatus.SUBMITTED
            );
            const hasRejected = group.some(
              (p) => p.status === PaymentStatus.REJECTED
            );
            const groupSubmittedPaymentIds = group
              .filter((p) => p.status === PaymentStatus.SUBMITTED)
              .map((p) => p.id);
            const groupStatus = allApproved
              ? PaymentStatus.APPROVED
              : hasSubmitted
                ? PaymentStatus.SUBMITTED
                : hasRejected
                  ? PaymentStatus.REJECTED
                  : PaymentStatus.PENDING;
            const groupApproveLabel = `${t('approveAll')} (${groupSubmittedPaymentIds.length})`;

            if (!isMulti) {
              // Single slot — render individual card
              const payment = representative;
              return (
                <Box
                  key={payment.id}
                  bg="white"
                  border="1px solid"
                  borderColor={
                    payment.player?.clubFeeApplied ? 'teal.200' : 'gray.200'
                  }
                  borderRadius="lg"
                  p={3}
                  cursor="pointer"
                  transition="all 0.2s"
                  _dark={{
                    bg: 'gray.800',
                    borderColor: payment.player?.clubFeeApplied
                      ? 'teal.600'
                      : 'gray.700',
                  }}
                  _hover={{ borderColor: 'blue.300', shadow: 'sm' }}
                  onClick={() => setSelectedPayment(payment)}
                >
                  <Flex align="center" justify="space-between" gap={3}>
                    <HStack gap={3} flex={1} minW={0}>
                      <Avatar.Root size="sm">
                        {payment.player?.user?.image ? (
                          <Avatar.Image src={payment.player.user.image} />
                        ) : (
                          <Avatar.Fallback>
                            <User size={16} />
                          </Avatar.Fallback>
                        )}
                      </Avatar.Root>
                      <Box flex={1} minW={0}>
                        <VStack align="stretch" gap={0.5}>
                          <Text fontWeight="medium" fontSize="sm" lineClamp={2}>
                            {payment.player?.name ||
                              payment.player?.user?.name ||
                              t('unknownPlayer')}
                          </Text>
                          <HStack gap={1.5} wrap="wrap">
                            {payment.player?.gender && (
                              <Text fontSize="xs" color="gray.500">
                                {getGenderText(payment.player.gender)}
                              </Text>
                            )}
                            {payment.player?.clubFeeApplied && (
                              <Badge
                                colorPalette="teal"
                                variant="subtle"
                                fontSize="2xs"
                                px={1}
                              >
                                <UserCheck size={10} />
                                <Text ml={0.5}>
                                  {payment.player?.club?.name ||
                                    tFixed('monthlyFixedMember')}
                                </Text>
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      </Box>
                    </HStack>
                    <VStack gap={1.5} align="flex-end" flexShrink={0}>
                      <Box textAlign="right">
                        {renderFixedMemberAmount(payment)}
                      </Box>
                      <PaymentStatusBadge status={payment.status} size="sm" />
                    </VStack>
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
                borderColor="green.200"
                borderRadius="xl"
                overflow="hidden"
                bg="white"
                _dark={{ bg: 'gray.800', borderColor: 'green.700' }}
              >
                {/* Group header */}
                <Box
                  px={3.5}
                  py={3}
                  bg="green.50"
                  _dark={{ bg: 'green.900/20' }}
                  cursor="pointer"
                  onClick={() => toggleGroup(key)}
                >
                  <VStack align="stretch" gap={3}>
                    <Flex align="flex-start" justify="space-between" gap={3}>
                      <HStack gap={3} flex={1} minW={0} align="flex-start">
                        <Avatar.Root size="md" flexShrink={0}>
                          {representative.player?.user?.image ? (
                            <Avatar.Image
                              src={representative.player.user.image}
                            />
                          ) : (
                            <Avatar.Fallback>
                              <User size={18} />
                            </Avatar.Fallback>
                          )}
                        </Avatar.Root>
                        <Box flex={1} minW={0}>
                          <HStack gap={2} wrap="wrap" mb={1}>
                            <Badge colorPalette="green" size="sm">
                              {group.length} slot
                            </Badge>
                          </HStack>
                          <Text
                            fontWeight="semibold"
                            fontSize="md"
                            lineClamp={2}
                          >
                            {representative.player?.name ||
                              representative.player?.user?.name ||
                              t('unknownPlayer')}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {[
                              males > 0 && `${males} ${tCommon('male')}`,
                              females > 0 && `${females} ${tCommon('female')}`,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                        </Box>
                      </HStack>
                      <HStack gap={2} align="flex-start" flexShrink={0}>
                        <VStack gap={1.5} align="flex-end">
                          <Text
                            fontWeight="semibold"
                            color="green.600"
                            fontSize="lg"
                            lineHeight="1.15"
                          >
                            {FeeService.formatFeeExact(totalGroupAmount)}
                          </Text>
                          <PaymentStatusBadge status={groupStatus} size="sm" />
                        </VStack>
                        <Box color="gray.500" pt={1}>
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </Box>
                      </HStack>
                    </Flex>

                    {onBulkApprove && groupSubmittedPaymentIds.length > 0 && (
                      <Flex justify="flex-end">
                        <Button
                          size="sm"
                          colorPalette="green"
                          loading={groupBulkLoading === key}
                          alignSelf={{ base: 'stretch', sm: 'flex-end' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGroupBulkApprove(
                              key,
                              groupSubmittedPaymentIds
                            );
                          }}
                        >
                          <CheckCheck size={14} />
                          <Text ml={1}>{groupApproveLabel}</Text>
                        </Button>
                      </Flex>
                    )}
                  </VStack>
                </Box>

                {/* Individual slot rows */}
                {isExpanded && (
                  <VStack gap={0} align="stretch" bg="white">
                    {group.map((payment, idx) => (
                      <Box
                        key={payment.id}
                        px={3.5}
                        py={3}
                        bg="white"
                        _dark={{ bg: 'gray.800' }}
                        borderTop="1px solid"
                        borderColor={idx === 0 ? 'green.100' : 'gray.100'}
                        cursor="pointer"
                        _hover={{ bg: 'gray.50', _dark: { bg: 'gray.750' } }}
                        transition="background 0.15s"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Flex
                          align={{ base: 'flex-start', sm: 'center' }}
                          justify="space-between"
                          gap={3}
                        >
                          <HStack gap={3} flex={1} minW={0} align="flex-start">
                            <Text
                              fontSize="xs"
                              color="gray.400"
                              fontWeight="medium"
                              minW="28px"
                              pt={1}
                            >
                              #{payment.player?.playerNumber}
                            </Text>
                            <Box flex={1} minW={0}>
                              <VStack align="stretch" gap={0.5}>
                                <Text
                                  fontSize="sm"
                                  fontWeight="medium"
                                  lineClamp={2}
                                >
                                  {payment.player?.name || t('unknownPlayer')}
                                </Text>
                                <HStack gap={1.5} wrap="wrap">
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
                                  {payment.player?.clubFeeApplied && (
                                    <Badge
                                      colorPalette="teal"
                                      variant="subtle"
                                      fontSize="2xs"
                                      px={1}
                                    >
                                      {payment.player?.club?.name ||
                                        tFixed('monthlyFixedMember')}
                                    </Badge>
                                  )}
                                </HStack>
                              </VStack>
                            </Box>
                          </HStack>
                          <VStack
                            gap={1.5}
                            align="flex-end"
                            flexShrink={0}
                            minW={{ base: '96px', sm: '120px' }}
                          >
                            {renderFixedMemberAmount(payment)}
                            <PaymentStatusBadge
                              status={payment.status}
                              size="sm"
                            />
                          </VStack>
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
