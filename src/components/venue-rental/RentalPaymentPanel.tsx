'use client';

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dynamic from 'next/dynamic';
import {
  Badge,
  Box,
  Center,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Banknote, Clock3, Copy, Eye, ReceiptText, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Image } from '@/components/ui/chakra-compat';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { VenueRentalService } from '@/lib/api/venue-rental.service';
import {
  EImageCategory,
  VenueRentalPaymentMethod,
  VenueRentalPaymentSummary,
  VenueRentalRequest,
  VenueRentalStatus,
  VenueRentalTransaction,
  VenueRentalTransactionPurpose,
  VenueRentalTransactionStatus,
} from '@/lib/api/types';
import { UserImageService } from '@/lib/api/user-image.service';
import { getVietnamBanks, getVietQRImageUrl } from '@/lib/banks';
import {
  getDepositStatus,
  getPaymentErrorCode,
  getTransferContent,
  isPaymentConflict,
} from '@/lib/venue-rental-payment';
import { useNotificationStore } from '@/stores/useNotificationStore';

const AppLightbox = dynamic(() => import('@/components/ui/AppLightbox'));

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(
    amount
  );

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';

function ProofPicker({
  value,
  disabled,
  category = EImageCategory.PAYMENT_PROOF,
  onChange,
}: {
  value: { url: string; publicId: string } | null;
  disabled?: boolean;
  category?: EImageCategory;
  onChange: (value: { url: string; publicId: string } | null) => void;
}) {
  const t = useTranslations('venueRental.payment');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toaster.error({ title: t('errors.invalidProof') });
      return;
    }
    setUploading(true);
    try {
      const result = await UserImageService.uploadImage(file, category);
      onChange({ url: result.url, publicId: result.publicId });
    } catch {
      // The shared API layer already surfaces an upload error to the user.
    } finally {
      setUploading(false);
    }
  };

  return (
    <VStack align="stretch" gap={2}>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={upload}
      />
      {value ? (
        <HStack borderWidth="1px" borderRadius="md" p={2}>
          <Image
            src={value.url}
            alt={t('proof')}
            boxSize="64px"
            objectFit="cover"
            borderRadius="md"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            {t('removeProof')}
          </Button>
        </HStack>
      ) : (
        <Button
          variant="outline"
          loading={uploading}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={16} /> {t('uploadProof')}
        </Button>
      )}
      <Text fontSize="xs" color="gray.500">
        {t('proofHelp')}
      </Text>
    </VStack>
  );
}

export default function RentalPaymentPanel({
  request,
  manage,
  onRentalRefresh,
}: {
  request: VenueRentalRequest;
  manage: boolean;
  onRentalRefresh: () => Promise<void>;
}) {
  const t = useTranslations('venueRental.payment');
  const notifications = useNotificationStore((state) => state.notifications);
  const [summary, setSummary] = useState<VenueRentalPaymentSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [purposeFilter, setPurposeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [submitPurpose, setSubmitPurpose] =
    useState<VenueRentalTransactionPurpose | null>(null);
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState<{ url: string; publicId: string } | null>(
    null
  );
  const [rejecting, setRejecting] = useState<VenueRentalTransaction | null>(
    null
  );
  const [cashOpen, setCashOpen] = useState(false);
  const [cashPurpose, setCashPurpose] = useState<VenueRentalTransactionPurpose>(
    VenueRentalTransactionPurpose.DEPOSIT
  );
  const [refunding, setRefunding] = useState<VenueRentalTransaction | null>(
    null
  );
  const [refundMethod, setRefundMethod] = useState(
    VenueRentalPaymentMethod.BANK_TRANSFER
  );
  const [banks, setBanks] = useState<
    Awaited<ReturnType<typeof getVietnamBanks>>
  >([]);
  const previousRequestUpdate = useRef(request.updatedAt);

  const load = useCallback(
    async (quiet = false) => {
      try {
        if (!quiet) setLoading(true);
        setSummary(
          await VenueRentalService.getPaymentSummary(request.id, {
            skipGlobalError: quiet,
          })
        );
      } catch {
        if (!quiet) setSummary(null);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [request.id]
  );

  useEffect(() => {
    load();
    getVietnamBanks().then(setBanks);
  }, [load]);

  useEffect(() => {
    if (previousRequestUpdate.current === request.updatedAt) return;
    previousRequestUpdate.current = request.updatedAt;
    load(true);
  }, [load, request.updatedAt]);

  useEffect(() => {
    if (
      request.status !== VenueRentalStatus.AWAITING_DEPOSIT ||
      !summary?.depositDueAt
    )
      return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [request.status, summary?.depositDueAt]);

  const latestRelevantNotificationId = notifications.find(
    (item) =>
      String(item.type).toUpperCase() === 'VENUE_RENTAL' &&
      item.data?.rentalRequestId === request.id &&
      item.data?.route === 'rental-payment'
  )?.id;

  useEffect(() => {
    if (latestRelevantNotificationId) {
      Promise.all([load(true), onRentalRefresh()]).catch(() => undefined);
    }
  }, [latestRelevantNotificationId, load, onRentalRefresh]);

  const deadlineMs = summary?.depositDueAt
    ? new Date(summary.depositDueAt).getTime()
    : null;
  const remainingMs = deadlineMs ? Math.max(0, deadlineMs - now) : 0;
  const depositExpired = deadlineMs !== null && remainingMs <= 0;
  const countdown = `${String(Math.floor(remainingMs / 3_600_000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 3_600_000) / 60_000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 60_000) / 1000)).padStart(2, '0')}`;

  useEffect(() => {
    if (
      !depositExpired ||
      request.status !== VenueRentalStatus.AWAITING_DEPOSIT
    )
      return;
    Promise.all([load(true), onRentalRefresh()]).catch(() => undefined);
  }, [depositExpired, load, onRentalRefresh, request.status]);

  const refreshAll = useCallback(async () => {
    await Promise.all([load(true), onRentalRefresh()]);
  }, [load, onRentalRefresh]);

  const runAction = async (name: string, operation: () => Promise<unknown>) => {
    setAction(name);
    try {
      await operation();
      toaster.success({ title: t('messages.updated') });
      await refreshAll();
      return true;
    } catch (error) {
      const code = getPaymentErrorCode(error);
      if (isPaymentConflict(error)) await refreshAll();
      toaster.error({
        title: code ? t(`errors.${code}`) : t('errors.action'),
      });
      return false;
    } finally {
      setAction(null);
    }
  };

  const openSubmit = (purpose: VenueRentalTransactionPurpose) => {
    if (!summary) return;
    setSubmitPurpose(purpose);
    setAmount(
      purpose === VenueRentalTransactionPurpose.DEPOSIT
        ? Math.max(0, summary.depositAmount - summary.depositPaid)
        : Math.max(0, summary.balanceAmount - summary.balancePaid)
    );
    setNotes('');
    setProof(null);
  };

  const filteredTransactions = useMemo(
    () =>
      (summary?.transactions || []).filter(
        (transaction) =>
          (!purposeFilter || transaction.purpose === purposeFilter) &&
          (!statusFilter || transaction.status === statusFilter)
      ),
    [purposeFilter, statusFilter, summary?.transactions]
  );

  if (loading)
    return (
      <Center py={8}>
        <Spinner />
      </Center>
    );
  if (!summary) return null;

  const transferContent = getTransferContent(request.id);
  const paymentAmount =
    request.status === VenueRentalStatus.AWAITING_DEPOSIT
      ? Math.max(0, summary.depositAmount - summary.depositPaid)
      : Math.max(0, summary.balanceAmount - summary.balancePaid);
  const generatedQr = getVietQRImageUrl(
    summary.recipient.bankName || '',
    summary.recipient.bankAccountNumber || '',
    {
      accountName: summary.recipient.bankAccountName || undefined,
      addInfo: transferContent,
      amount: paymentAmount,
      bankList: banks,
    }
  );
  const depositStatus = getDepositStatus(summary, request.cancellationReason);
  const canSubmitDeposit =
    !manage &&
    request.status === VenueRentalStatus.AWAITING_DEPOSIT &&
    !depositExpired &&
    summary.depositPaid < summary.depositAmount &&
    depositStatus !== 'SUBMITTED';
  const canSubmitBalance =
    !manage &&
    request.status === VenueRentalStatus.CONFIRMED &&
    summary.balancePaid < summary.balanceAmount &&
    summary.balanceStatus !== 'SUBMITTED';
  const submitMaxAmount =
    submitPurpose === VenueRentalTransactionPurpose.DEPOSIT
      ? Math.max(0, summary.depositAmount - summary.depositPaid)
      : Math.max(0, summary.balanceAmount - summary.balancePaid);
  const cashMaxAmount =
    cashPurpose === VenueRentalTransactionPurpose.DEPOSIT
      ? Math.max(0, summary.depositAmount - summary.depositPaid)
      : Math.max(0, summary.balanceAmount - summary.balancePaid);
  const canRecordCash =
    manage &&
    summary.outstanding > 0 &&
    [VenueRentalStatus.AWAITING_DEPOSIT, VenueRentalStatus.CONFIRMED].includes(
      request.status
    );

  return (
    <Box
      id="rental-payment"
      scrollMarginTop="80px"
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
    >
      <Box px={{ base: 4, md: 5 }} py={4} borderBottomWidth="1px">
        <HStack justify="space-between" flexWrap="wrap">
          <HStack>
            <ReceiptText size={20} />
            <Text fontWeight="bold">
              {manage ? t('transactionsTitle') : t('title')}
            </Text>
          </HStack>
          <Button size="sm" variant="ghost" onClick={() => load()}>
            {t('refresh')}
          </Button>
        </HStack>
      </Box>
      <VStack align="stretch" gap={5} p={{ base: 4, md: 5 }}>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
          {[
            ['total', summary.totalAmount],
            ['paid', summary.totalPaid],
            ['outstanding', summary.outstanding],
            ['refundEstimate', summary.refundEstimate],
          ].map(([label, value]) => (
            <Box
              key={String(label)}
              bg={{ base: 'gray.50', _dark: 'gray.800' }}
              borderRadius="lg"
              p={3}
            >
              <Text fontSize="xs" color="gray.500">
                {t(String(label))}
              </Text>
              <Text fontWeight="bold">
                {money(Number(value), summary.currency)}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Box borderWidth="1px" borderRadius="lg" p={4}>
            <HStack justify="space-between">
              <Text fontWeight="semibold">{t('deposit')}</Text>
              <Badge
                colorPalette={
                  depositStatus === 'PAID'
                    ? 'green'
                    : depositStatus === 'SUBMITTED'
                      ? 'blue'
                      : depositStatus === 'EXPIRED'
                        ? 'red'
                        : 'orange'
                }
              >
                {t(`depositStatus.${depositStatus}`)}
              </Badge>
            </HStack>
            <Text mt={2}>
              {money(summary.depositPaid, summary.currency)} /{' '}
              {money(summary.depositAmount, summary.currency)}
            </Text>
            {summary.depositDueAt ? (
              <Text
                fontSize="sm"
                color={depositExpired ? 'red.500' : 'gray.500'}
                mt={1}
              >
                <Clock3
                  size={14}
                  style={{ display: 'inline', marginRight: 4 }}
                />
                {formatDateTime(summary.depositDueAt)}
                {request.status === VenueRentalStatus.AWAITING_DEPOSIT
                  ? ` · ${countdown}`
                  : ''}
              </Text>
            ) : null}
          </Box>
          <Box borderWidth="1px" borderRadius="lg" p={4}>
            <HStack justify="space-between">
              <Text fontWeight="semibold">{t('balance')}</Text>
              <Badge
                colorPalette={
                  summary.balanceStatus === 'PAID'
                    ? 'green'
                    : summary.balanceStatus === 'OVERDUE'
                      ? 'red'
                      : summary.balanceStatus === 'SUBMITTED'
                        ? 'blue'
                        : 'orange'
                }
              >
                {t(`balanceStatus.${summary.balanceStatus}`)}
              </Badge>
            </HStack>
            <Text mt={2}>
              {money(summary.balancePaid, summary.currency)} /{' '}
              {money(summary.balanceAmount, summary.currency)}
            </Text>
            {summary.balanceDueAt ? (
              <Text fontSize="sm" color="gray.500" mt={1}>
                {formatDateTime(summary.balanceDueAt)}
              </Text>
            ) : null}
          </Box>
        </SimpleGrid>

        {!manage && (canSubmitDeposit || canSubmitBalance) ? (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
            <Box borderWidth="1px" borderRadius="lg" p={4}>
              <Text fontWeight="semibold">{t('bankTransfer')}</Text>
              <VStack align="stretch" gap={1} mt={3} fontSize="sm">
                <Text>{summary.recipient.bankName || '—'}</Text>
                <Text fontWeight="bold">
                  {summary.recipient.bankAccountNumber || '—'}
                </Text>
                <Text>{summary.recipient.bankAccountName || '—'}</Text>
                <HStack mt={2}>
                  <Text fontFamily="mono" fontWeight="semibold">
                    {transferContent}
                  </Text>
                  <Button
                    size="xs"
                    variant="ghost"
                    aria-label={t('copyContent')}
                    onClick={() =>
                      navigator.clipboard
                        .writeText(transferContent)
                        .then(() => toaster.success({ title: t('copied') }))
                    }
                  >
                    <Copy size={14} />
                  </Button>
                </HStack>
              </VStack>
            </Box>
            <Box borderWidth="1px" borderRadius="lg" p={4} textAlign="center">
              {generatedQr || summary.recipient.qrUrl ? (
                <Image
                  src={generatedQr || summary.recipient.qrUrl || ''}
                  alt={t('qrAlt')}
                  maxH="230px"
                  mx="auto"
                  objectFit="contain"
                />
              ) : (
                <Text color="gray.500">{t('noQr')}</Text>
              )}
              <Text fontSize="xs" color="gray.500" mt={2}>
                {t('qrAmount', {
                  amount: money(paymentAmount, summary.currency),
                })}
              </Text>
            </Box>
          </SimpleGrid>
        ) : null}

        {!manage ? (
          <HStack flexWrap="wrap">
            {canSubmitDeposit ? (
              <Button
                colorPalette="green"
                onClick={() =>
                  openSubmit(VenueRentalTransactionPurpose.DEPOSIT)
                }
              >
                {t('submitDeposit')}
              </Button>
            ) : null}
            {canSubmitBalance ? (
              <Button
                colorPalette="green"
                onClick={() =>
                  openSubmit(VenueRentalTransactionPurpose.BALANCE)
                }
              >
                {t('submitBalance')}
              </Button>
            ) : null}
            {depositExpired &&
            request.status === VenueRentalStatus.AWAITING_DEPOSIT ? (
              <Text color="red.500" fontSize="sm">
                {t('depositExpired')}
              </Text>
            ) : null}
          </HStack>
        ) : canRecordCash ? (
          <Button
            alignSelf="start"
            variant="outline"
            onClick={() => {
              setCashPurpose(
                summary.depositPaid < summary.depositAmount
                  ? VenueRentalTransactionPurpose.DEPOSIT
                  : VenueRentalTransactionPurpose.BALANCE
              );
              setAmount(
                summary.depositPaid < summary.depositAmount
                  ? summary.depositAmount - summary.depositPaid
                  : summary.balanceAmount - summary.balancePaid
              );
              setNotes('');
              setCashOpen(true);
            }}
          >
            <Banknote size={16} />
            {t('recordCash')}
          </Button>
        ) : null}

        <Box>
          <HStack justify="space-between" flexWrap="wrap" mb={3}>
            <Text fontWeight="semibold">{t('history')}</Text>
            {manage ? (
              <HStack flexWrap="wrap">
                <SearchableSelect
                  size="sm"
                  value={purposeFilter}
                  onChange={setPurposeFilter}
                  options={[
                    { value: '', label: t('filters.allPurposes') },
                    ...Object.values(VenueRentalTransactionPurpose).map(
                      (value) => ({ value, label: t(`purpose.${value}`) })
                    ),
                  ]}
                />
                <SearchableSelect
                  size="sm"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: '', label: t('filters.allStatuses') },
                    ...Object.values(VenueRentalTransactionStatus).map(
                      (value) => ({
                        value,
                        label: t(`transactionStatus.${value}`),
                      })
                    ),
                  ]}
                />
              </HStack>
            ) : null}
          </HStack>
          <VStack align="stretch" gap={3}>
            {filteredTransactions.length ? (
              filteredTransactions.map((transaction) => (
                <Box
                  key={transaction.id}
                  borderWidth="1px"
                  borderRadius="lg"
                  p={3}
                >
                  <HStack justify="space-between" align="start" gap={3}>
                    <Box minW={0}>
                      <HStack flexWrap="wrap">
                        <Badge>{t(`purpose.${transaction.purpose}`)}</Badge>
                        <Badge
                          colorPalette={
                            transaction.status ===
                            VenueRentalTransactionStatus.APPROVED
                              ? 'green'
                              : transaction.status ===
                                  VenueRentalTransactionStatus.REJECTED
                                ? 'red'
                                : transaction.status ===
                                    VenueRentalTransactionStatus.SUBMITTED
                                  ? 'blue'
                                  : 'orange'
                          }
                        >
                          {t(`transactionStatus.${transaction.status}`)}
                        </Badge>
                        <Text fontWeight="bold">
                          {money(transaction.amount, transaction.currency)}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {formatDateTime(
                          transaction.submittedAt || transaction.createdAt
                        )}
                        {transaction.submittedBy?.name
                          ? ` · ${transaction.submittedBy.name}`
                          : ''}
                        {transaction.processedBy?.name
                          ? ` · ${transaction.processedBy.name}`
                          : ''}
                      </Text>
                      {transaction.notes ? (
                        <Text fontSize="sm" mt={1} whiteSpace="pre-wrap">
                          {transaction.notes}
                        </Text>
                      ) : null}
                    </Box>
                    {transaction.proofUrl ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t('viewProof')}
                        onClick={() => setLightboxUrl(transaction.proofUrl)}
                      >
                        <Eye size={16} />
                      </Button>
                    ) : null}
                  </HStack>
                  {manage &&
                  transaction.status ===
                    VenueRentalTransactionStatus.SUBMITTED ? (
                    <HStack mt={3}>
                      <Button
                        size="sm"
                        colorPalette="green"
                        loading={action === `approve-${transaction.id}`}
                        onClick={() =>
                          runAction(`approve-${transaction.id}`, () =>
                            VenueRentalService.approvePayment(
                              request.id,
                              transaction.id
                            )
                          )
                        }
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette="red"
                        disabled={!!action}
                        onClick={() => {
                          setRejecting(transaction);
                          setNotes('');
                        }}
                      >
                        {t('reject')}
                      </Button>
                    </HStack>
                  ) : null}
                  {manage &&
                  transaction.purpose ===
                    VenueRentalTransactionPurpose.REFUND &&
                  transaction.status ===
                    VenueRentalTransactionStatus.PENDING ? (
                    <Button
                      mt={3}
                      size="sm"
                      colorPalette="green"
                      disabled={!!action}
                      onClick={() => {
                        setRefunding(transaction);
                        setRefundMethod(VenueRentalPaymentMethod.BANK_TRANSFER);
                        setNotes('');
                        setProof(null);
                      }}
                    >
                      {t('completeRefund')}
                    </Button>
                  ) : null}
                </Box>
              ))
            ) : (
              <Text fontSize="sm" color="gray.500">
                {t('noTransactions')}
              </Text>
            )}
          </VStack>
        </Box>
      </VStack>

      <VModal
        isOpen={!!submitPurpose}
        onClose={() => setSubmitPurpose(null)}
        title={
          submitPurpose === VenueRentalTransactionPurpose.DEPOSIT
            ? t('submitDeposit')
            : t('submitBalance')
        }
        primaryActionText={t('submitProof')}
        isPrimaryLoading={action === 'submit'}
        isPrimaryDisabled={
          !proof ||
          amount <= 0 ||
          amount > submitMaxAmount ||
          (submitPurpose === VenueRentalTransactionPurpose.DEPOSIT &&
            depositExpired)
        }
        onPrimaryAction={async () => {
          if (!submitPurpose || !proof) return;
          const success = await runAction('submit', () =>
            VenueRentalService.submitPayment(request.id, {
              purpose: submitPurpose as
                | VenueRentalTransactionPurpose.DEPOSIT
                | VenueRentalTransactionPurpose.BALANCE,
              amount,
              proofUrl: proof.url,
              proofPublicId: proof.publicId,
              notes: notes.trim() || undefined,
            })
          );
          if (success) setSubmitPurpose(null);
        }}
      >
        <VStack align="stretch" gap={4}>
          <Field label={t('amount')}>
            <Input
              type="number"
              min={1}
              max={submitMaxAmount}
              step={1000}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value) || 0)}
            />
          </Field>
          <Field label={t('proof')} required>
            <ProofPicker value={proof} onChange={setProof} />
          </Field>
          <Field label={t('notes')}>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        </VStack>
      </VModal>

      <VModal
        isOpen={!!rejecting}
        onClose={() => setRejecting(null)}
        title={t('rejectTitle')}
        primaryColorScheme="red"
        primaryActionText={t('reject')}
        isPrimaryLoading={action === 'reject'}
        isPrimaryDisabled={!notes.trim()}
        onPrimaryAction={async () => {
          if (!rejecting) return;
          const success = await runAction('reject', () =>
            VenueRentalService.rejectPayment(
              request.id,
              rejecting.id,
              notes.trim()
            )
          );
          if (success) setRejecting(null);
        }}
      >
        <Field label={t('rejectReason')} required>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
      </VModal>

      <VModal
        isOpen={cashOpen}
        onClose={() => setCashOpen(false)}
        title={t('recordCash')}
        primaryActionText={t('confirmCash')}
        isPrimaryLoading={action === 'cash'}
        isPrimaryDisabled={amount <= 0 || amount > cashMaxAmount}
        onPrimaryAction={async () => {
          const success = await runAction('cash', () =>
            VenueRentalService.recordCashPayment(request.id, {
              purpose: cashPurpose as
                | VenueRentalTransactionPurpose.DEPOSIT
                | VenueRentalTransactionPurpose.BALANCE,
              amount,
              notes: notes.trim() || undefined,
            })
          );
          if (success) setCashOpen(false);
        }}
      >
        <VStack align="stretch" gap={4}>
          <Field label={t('purposeLabel')}>
            <SearchableSelect
              value={cashPurpose}
              onChange={(value) => {
                const purpose = value as VenueRentalTransactionPurpose;
                setCashPurpose(purpose);
                setAmount(
                  purpose === VenueRentalTransactionPurpose.DEPOSIT
                    ? Math.max(0, summary.depositAmount - summary.depositPaid)
                    : Math.max(0, summary.balanceAmount - summary.balancePaid)
                );
              }}
              options={[
                request.status === VenueRentalStatus.AWAITING_DEPOSIT
                  ? VenueRentalTransactionPurpose.DEPOSIT
                  : VenueRentalTransactionPurpose.BALANCE,
              ].map((value) => ({ value, label: t(`purpose.${value}`) }))}
            />
          </Field>
          <Field label={t('amount')}>
            <Input
              type="number"
              min={1}
              max={cashMaxAmount}
              step={1000}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value) || 0)}
            />
          </Field>
          <Field label={t('notes')}>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        </VStack>
      </VModal>

      <VModal
        isOpen={!!refunding}
        onClose={() => setRefunding(null)}
        title={t('completeRefund')}
        primaryActionText={t('confirmRefund')}
        isPrimaryLoading={action === 'refund'}
        isPrimaryDisabled={!notes.trim() && !proof}
        onPrimaryAction={async () => {
          if (!refunding) return;
          const success = await runAction('refund', () =>
            VenueRentalService.completeRefund(request.id, refunding.id, {
              method: refundMethod,
              notes: notes.trim() || undefined,
              proofUrl: proof?.url,
              proofPublicId: proof?.publicId,
            })
          );
          if (success) setRefunding(null);
        }}
      >
        <VStack align="stretch" gap={4}>
          <Text>
            {refunding ? money(refunding.amount, refunding.currency) : ''}
          </Text>
          <Field label={t('method')}>
            <SearchableSelect
              value={refundMethod}
              onChange={(value) =>
                setRefundMethod(value as VenueRentalPaymentMethod)
              }
              options={Object.values(VenueRentalPaymentMethod).map((value) => ({
                value,
                label: t(`methodValue.${value}`),
              }))}
            />
          </Field>
          <Field label={t('proof')}>
            <ProofPicker value={proof} onChange={setProof} />
          </Field>
          <Field label={t('notes')}>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        </VStack>
      </VModal>

      {lightboxUrl ? (
        <AppLightbox
          images={[lightboxUrl]}
          onClose={() => setLightboxUrl(null)}
          alt={t('proof')}
        />
      ) : null}
    </Box>
  );
}
