'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Image,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Calculator, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import AppSingleImageUpload from '@/components/session/AppSingleImageUpload';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { VButton } from '@/components/ui/VButton';
import { VSwitch } from '@/components/ui/VSwitch';
import { toaster } from '@/components/ui/toaster';
import { VenueService } from '@/lib/api/venue.service';
import {
  EImageCategory,
  VenueCustomerType,
  VenueDayType,
  VenuePriceBook,
  VenuePriceRule,
  VenueRentalPriceCalculation,
} from '@/lib/api/types';

const dayTypeOptions = [
  { value: VenueDayType.EVERYDAY, label: 'Mỗi ngày' },
  { value: VenueDayType.WEEKDAY, label: 'Theo thứ' },
  { value: VenueDayType.WEEKEND, label: 'Cuối tuần' },
  { value: VenueDayType.HOLIDAY, label: 'Ngày lễ' },
  { value: VenueDayType.SPECIFIC_DATE, label: 'Ngày cụ thể' },
];

const customerTypeOptions = [
  { value: VenueCustomerType.FIXED, label: 'Cố định' },
  { value: VenueCustomerType.WALK_IN, label: 'Vãng lai' },
  { value: VenueCustomerType.STUDENT, label: 'HS-SV' },
  { value: VenueCustomerType.MEMBER, label: 'Thành viên' },
  { value: VenueCustomerType.CUSTOM, label: 'Tùy chỉnh' },
];

const weekDays = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 7, label: 'CN' },
];

const emptyPriceBook = {
  name: 'Bảng giá mới',
  currency: 'VND',
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: '',
  isActive: true,
  priority: 0,
  notes: '',
  priceImageUrl: '',
  priceImagePublicId: '',
};

const emptyRule = {
  dayType: VenueDayType.EVERYDAY,
  daysOfWeek: [] as number[],
  specificDate: '',
  startTime: '05:00',
  endTime: '23:00',
  customerType: VenueCustomerType.WALK_IN,
  pricePerHour: 0,
  minimumMinutes: '',
  billingStepMinutes: '',
  priority: 0,
  notes: '',
};

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function dateInputToIso(value?: string | null) {
  return value ? `${value}T00:00:00.000Z` : null;
}

const startTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const endTimePattern = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

function minuteToTime(value: number) {
  if (value === 1440) return '24:00';

  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function timeToMinute(value: string) {
  const [hours = '0', minutes = '0'] = value.split(':');
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}

function isValidStartTime(value: string) {
  return startTimePattern.test(value);
}

function isValidEndTime(value: string) {
  return endTimePattern.test(value);
}

function getEndDateTime(date: string, endTime: string) {
  if (endTime !== '24:00') {
    return `${date}T${endTime}:00+07:00`;
  }

  const [year, month, day] = date.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDateInput = nextDate.toISOString().slice(0, 10);
  return `${nextDateInput}T00:00:00+07:00`;
}

function formatCurrency(value: number, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

interface VenuePricingManagerProps {
  venueId: string;
  legacyFixed?: number;
  legacyWalkIn?: number;
}

export default function VenuePricingManager({
  venueId,
  legacyFixed,
  legacyWalkIn,
}: VenuePricingManagerProps) {
  const [priceBooks, setPriceBooks] = useState<VenuePriceBook[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookForm, setBookForm] = useState(emptyPriceBook);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [calcForm, setCalcForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '11:00',
    numberOfCourts: 1,
    customerType: VenueCustomerType.WALK_IN,
  });
  const [calculation, setCalculation] =
    useState<VenueRentalPriceCalculation | null>(null);

  const selectedBook = useMemo(
    () => priceBooks.find((book) => book.id === selectedId) || null,
    [priceBooks, selectedId]
  );

  const loadPriceBooks = async () => {
    setIsLoading(true);
    try {
      const data = await VenueService.getPriceBooks(venueId);
      setPriceBooks(data);
      const nextSelected = selectedId || data[0]?.id || null;
      setSelectedId(nextSelected);
      const nextBook = data.find((book) => book.id === nextSelected) || data[0];
      if (nextBook) {
        setBookForm({
          name: nextBook.name,
          currency: nextBook.currency || 'VND',
          effectiveFrom: toDateInput(nextBook.effectiveFrom),
          effectiveTo: toDateInput(nextBook.effectiveTo),
          isActive: nextBook.isActive,
          priority: nextBook.priority || 0,
          notes: nextBook.notes || '',
          priceImageUrl: nextBook.priceImageUrl || '',
          priceImagePublicId: nextBook.priceImagePublicId || '',
        });
      }
    } catch {
      toaster.error({ title: 'Không thể tải bảng giá thuê sân' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPriceBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const selectBook = (book: VenuePriceBook) => {
    setSelectedId(book.id);
    setEditingRuleId(null);
    setRuleForm(emptyRule);
    setBookForm({
      name: book.name,
      currency: book.currency || 'VND',
      effectiveFrom: toDateInput(book.effectiveFrom),
      effectiveTo: toDateInput(book.effectiveTo),
      isActive: book.isActive,
      priority: book.priority || 0,
      notes: book.notes || '',
      priceImageUrl: book.priceImageUrl || '',
      priceImagePublicId: book.priceImagePublicId || '',
    });
  };

  const createBook = async () => {
    try {
      const created = await VenueService.createPriceBook(venueId, {
        ...bookForm,
        effectiveFrom: dateInputToIso(bookForm.effectiveFrom)!,
        effectiveTo: dateInputToIso(bookForm.effectiveTo),
      });
      toaster.success({ title: 'Đã tạo bảng giá' });
      setSelectedId(created.id);
      await loadPriceBooks();
    } catch {
      toaster.error({ title: 'Không thể tạo bảng giá' });
    }
  };

  const saveBook = async () => {
    if (!selectedBook) return;
    try {
      await VenueService.updatePriceBook(venueId, selectedBook.id, {
        ...bookForm,
        effectiveFrom: dateInputToIso(bookForm.effectiveFrom)!,
        effectiveTo: dateInputToIso(bookForm.effectiveTo),
      });
      toaster.success({ title: 'Đã lưu bảng giá' });
      await loadPriceBooks();
    } catch {
      toaster.error({ title: 'Không thể lưu bảng giá' });
    }
  };

  const deleteBook = async () => {
    if (!selectedBook) return;
    try {
      await VenueService.deletePriceBook(venueId, selectedBook.id);
      toaster.success({ title: 'Đã xóa bảng giá' });
      setSelectedId(null);
      setBookForm(emptyPriceBook);
      await loadPriceBooks();
    } catch {
      toaster.error({ title: 'Không thể xóa bảng giá' });
    }
  };

  const saveRule = async () => {
    if (!selectedBook) return;
    if (
      !isValidStartTime(ruleForm.startTime) ||
      !isValidEndTime(ruleForm.endTime)
    ) {
      toaster.error({ title: 'Vui lòng nhập giờ theo định dạng HH:mm' });
      return;
    }

    const startMinute = timeToMinute(ruleForm.startTime);
    const endMinute = timeToMinute(ruleForm.endTime);
    if (endMinute <= startMinute) {
      toaster.error({ title: 'Giờ kết thúc phải sau giờ bắt đầu' });
      return;
    }

    const payload = {
      dayType: ruleForm.dayType,
      daysOfWeek: ruleForm.daysOfWeek,
      specificDate: dateInputToIso(ruleForm.specificDate),
      startMinute,
      endMinute,
      customerType: ruleForm.customerType,
      pricePerHour: ruleForm.pricePerHour,
      minimumMinutes: ruleForm.minimumMinutes
        ? Number(ruleForm.minimumMinutes)
        : null,
      billingStepMinutes: ruleForm.billingStepMinutes
        ? Number(ruleForm.billingStepMinutes)
        : null,
      priority: ruleForm.priority,
      notes: ruleForm.notes || null,
    };

    try {
      if (editingRuleId) {
        await VenueService.updatePriceRule(
          venueId,
          selectedBook.id,
          editingRuleId,
          payload
        );
      } else {
        await VenueService.createPriceRule(venueId, selectedBook.id, payload);
      }
      toaster.success({ title: 'Đã lưu dòng giá' });
      setEditingRuleId(null);
      setRuleForm(emptyRule);
      await loadPriceBooks();
    } catch {
      toaster.error({ title: 'Không thể lưu dòng giá' });
    }
  };

  const editRule = (rule: VenuePriceRule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      dayType: rule.dayType,
      daysOfWeek: rule.daysOfWeek || [],
      specificDate: toDateInput(rule.specificDate),
      startTime: minuteToTime(rule.startMinute),
      endTime: minuteToTime(rule.endMinute),
      customerType: rule.customerType,
      pricePerHour: rule.pricePerHour,
      minimumMinutes: rule.minimumMinutes ? String(rule.minimumMinutes) : '',
      billingStepMinutes: rule.billingStepMinutes
        ? String(rule.billingStepMinutes)
        : '',
      priority: rule.priority || 0,
      notes: rule.notes || '',
    });
  };

  const deleteRule = async (ruleId: string) => {
    if (!selectedBook) return;
    try {
      await VenueService.deletePriceRule(venueId, selectedBook.id, ruleId);
      toaster.success({ title: 'Đã xóa dòng giá' });
      await loadPriceBooks();
    } catch {
      toaster.error({ title: 'Không thể xóa dòng giá' });
    }
  };

  const calculatePrice = async () => {
    if (
      !isValidStartTime(calcForm.startTime) ||
      !isValidEndTime(calcForm.endTime)
    ) {
      toaster.error({ title: 'Vui lòng nhập giờ theo định dạng HH:mm' });
      return;
    }

    const startMinute = timeToMinute(calcForm.startTime);
    const endMinute = timeToMinute(calcForm.endTime);
    if (endMinute <= startMinute) {
      toaster.error({ title: 'Giờ kết thúc phải sau giờ bắt đầu' });
      return;
    }

    try {
      const result = await VenueService.calculateRentalPrice(venueId, {
        startTime: `${calcForm.date}T${calcForm.startTime}:00+07:00`,
        endTime: getEndDateTime(calcForm.date, calcForm.endTime),
        numberOfCourts: calcForm.numberOfCourts,
        customerType: calcForm.customerType,
      });
      setCalculation(result);
    } catch {
      toaster.error({ title: 'Không thể tính thử giá thuê sân' });
    }
  };

  const toggleDay = (day: number) => {
    setRuleForm((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter((item) => item !== day)
        : [...current.daysOfWeek, day].sort(),
    }));
  };

  return (
    <VStack gap={5} align="stretch">
      <Flex justify="space-between" gap={3} align="center">
        <Box>
          <Text fontWeight="semibold">Bảng giá thuê sân</Text>
          <Text fontSize="sm" color="gray.500">
            Quản lý version bảng giá, ảnh gốc và rule theo ngày/khung giờ.
          </Text>
        </Box>
        <VButton
          size="sm"
          variant="outline"
          leftIcon={<RefreshCw size={14} />}
          loading={isLoading}
          onClick={loadPriceBooks}
          type="button"
        >
          Tải lại
        </VButton>
      </Flex>

      <Box bg="gray.50" _dark={{ bg: 'gray.800' }} p={3} borderRadius="md">
        <Text fontSize="sm" fontWeight="medium">
          Giá đơn giản / legacy
        </Text>
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
          Cố định: {legacyFixed ? formatCurrency(legacyFixed) : 'Chưa có'} ·
          Vãng lai: {legacyWalkIn ? formatCurrency(legacyWalkIn) : 'Chưa có'}
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <VStack align="stretch" gap={3}>
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="semibold">
              Danh sách bảng giá
            </Text>
            <VButton
              size="xs"
              variant="outline"
              leftIcon={<Plus size={13} />}
              onClick={() => {
                setSelectedId(null);
                setBookForm(emptyPriceBook);
              }}
              type="button"
            >
              Mới
            </VButton>
          </Flex>

          {priceBooks.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              Chưa có bảng giá. Có thể tạo mới hoặc chạy migration backfill.
            </Text>
          ) : (
            priceBooks.map((book) => (
              <Box
                key={book.id}
                borderWidth="1px"
                borderColor={book.id === selectedId ? 'green.400' : 'gray.200'}
                _dark={{
                  borderColor:
                    book.id === selectedId ? 'green.400' : 'gray.700',
                }}
                borderRadius="md"
                p={3}
                cursor="pointer"
                onClick={() => selectBook(book)}
              >
                <Flex justify="space-between" gap={3}>
                  <Box>
                    <Text fontWeight="medium">{book.name}</Text>
                    <Text fontSize="xs" color="gray.500">
                      Từ {toDateInput(book.effectiveFrom)}
                      {book.effectiveTo
                        ? ` đến ${toDateInput(book.effectiveTo)}`
                        : ''}
                    </Text>
                  </Box>
                  <Badge colorPalette={book.isActive ? 'green' : 'gray'}>
                    {book.isActive ? 'Active' : 'Off'}
                  </Badge>
                </Flex>
              </Box>
            ))
          )}
        </VStack>

        <VStack align="stretch" gap={3}>
          <Text fontSize="sm" fontWeight="semibold">
            {selectedBook ? 'Thông tin bảng giá' : 'Tạo bảng giá'}
          </Text>
          <Field label="Tên bảng giá">
            <Input
              value={bookForm.name}
              onChange={(event) =>
                setBookForm({ ...bookForm, name: event.target.value })
              }
            />
          </Field>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            <Field label="Hiệu lực từ">
              <Input
                type="date"
                value={bookForm.effectiveFrom}
                onChange={(event) =>
                  setBookForm({
                    ...bookForm,
                    effectiveFrom: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="Hiệu lực đến">
              <Input
                type="date"
                value={bookForm.effectiveTo}
                onChange={(event) =>
                  setBookForm({ ...bookForm, effectiveTo: event.target.value })
                }
              />
            </Field>
          </SimpleGrid>
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            <Field label="Độ ưu tiên">
              <Input
                type="number"
                value={bookForm.priority}
                onChange={(event) =>
                  setBookForm({
                    ...bookForm,
                    priority: Number(event.target.value || 0),
                  })
                }
              />
            </Field>
            <Field label="Tiền tệ">
              <Input
                value={bookForm.currency}
                onChange={(event) =>
                  setBookForm({ ...bookForm, currency: event.target.value })
                }
              />
            </Field>
          </SimpleGrid>
          <VSwitch
            checked={bookForm.isActive}
            onCheckedChange={(details) =>
              setBookForm({ ...bookForm, isActive: details.checked })
            }
            label="Đang áp dụng"
            colorPalette="green"
          />
          <Field label="Ảnh bảng giá gốc">
            <AppSingleImageUpload
              value={bookForm.priceImageUrl}
              publicId={bookForm.priceImagePublicId}
              category={EImageCategory.OTHER}
              alt="Ảnh bảng giá thuê sân"
              uploadText="Tải ảnh bảng giá"
              emptyTitle="Chưa có ảnh bảng giá"
              urlPlaceholder="Dán URL ảnh bảng giá..."
              onChange={(image) =>
                setBookForm({
                  ...bookForm,
                  priceImageUrl: image.url,
                  priceImagePublicId: image.publicId || '',
                })
              }
              onClear={() =>
                setBookForm({
                  ...bookForm,
                  priceImageUrl: '',
                  priceImagePublicId: '',
                })
              }
            />
          </Field>
          <Field label="Ghi chú">
            <Textarea
              value={bookForm.notes}
              rows={3}
              onChange={(event) =>
                setBookForm({ ...bookForm, notes: event.target.value })
              }
            />
          </Field>
          <HStack>
            <VButton
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={selectedBook ? saveBook : createBook}
              type="button"
            >
              {selectedBook ? 'Lưu bảng giá' : 'Tạo bảng giá'}
            </VButton>
            {selectedBook && (
              <VButton
                size="sm"
                variant="outline"
                colorPalette="red"
                leftIcon={<Trash2 size={14} />}
                onClick={deleteBook}
                type="button"
              >
                Xóa
              </VButton>
            )}
          </HStack>
        </VStack>
      </SimpleGrid>

      {selectedBook && (
        <VStack align="stretch" gap={4}>
          <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.800' }} />
          <Text fontWeight="semibold">Dòng giá</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            <Field label="Loại ngày">
              <SearchableSelect
                options={dayTypeOptions}
                value={ruleForm.dayType}
                onChange={(value) =>
                  setRuleForm({
                    ...ruleForm,
                    dayType: value as VenueDayType,
                  })
                }
              />
            </Field>
            <Field label="Loại khách">
              <SearchableSelect
                options={customerTypeOptions}
                value={ruleForm.customerType}
                onChange={(value) =>
                  setRuleForm({
                    ...ruleForm,
                    customerType: value as VenueCustomerType,
                  })
                }
              />
            </Field>
          </SimpleGrid>

          {ruleForm.dayType === VenueDayType.WEEKDAY && (
            <Field label="Áp dụng cho thứ">
              <Flex gap={2} wrap="wrap">
                {weekDays.map((day) => (
                  <VButton
                    key={day.value}
                    size="xs"
                    variant={
                      ruleForm.daysOfWeek.includes(day.value)
                        ? 'solid'
                        : 'outline'
                    }
                    onClick={() => toggleDay(day.value)}
                    type="button"
                  >
                    {day.label}
                  </VButton>
                ))}
              </Flex>
            </Field>
          )}

          {(ruleForm.dayType === VenueDayType.SPECIFIC_DATE ||
            ruleForm.dayType === VenueDayType.HOLIDAY) && (
            <Field label="Ngày cụ thể">
              <Input
                type="date"
                value={ruleForm.specificDate}
                onChange={(event) =>
                  setRuleForm({
                    ...ruleForm,
                    specificDate: event.target.value,
                  })
                }
              />
            </Field>
          )}

          <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={3}>
            <Field label="Từ giờ">
              <Input
                type="time"
                value={ruleForm.startTime}
                onChange={(event) =>
                  setRuleForm({ ...ruleForm, startTime: event.target.value })
                }
              />
            </Field>
            <Field label="Đến giờ">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="24:00"
                pattern="([01][0-9]|2[0-3]):[0-5][0-9]|24:00"
                value={ruleForm.endTime}
                onChange={(event) =>
                  setRuleForm({ ...ruleForm, endTime: event.target.value })
                }
              />
            </Field>
            <Field label="Giá/giờ">
              <MoneyInput
                value={ruleForm.pricePerHour}
                onValueChange={(value) =>
                  setRuleForm({
                    ...ruleForm,
                    pricePerHour: value ?? 0,
                  })
                }
              />
            </Field>
            <Field label="Ưu tiên">
              <Input
                type="number"
                value={ruleForm.priority}
                onChange={(event) =>
                  setRuleForm({
                    ...ruleForm,
                    priority: Number(event.target.value || 0),
                  })
                }
              />
            </Field>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
            <Field label="Tối thiểu phút">
              <Input
                type="number"
                value={ruleForm.minimumMinutes}
                onChange={(event) =>
                  setRuleForm({
                    ...ruleForm,
                    minimumMinutes: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="Làm tròn mỗi phút">
              <Input
                type="number"
                value={ruleForm.billingStepMinutes}
                onChange={(event) =>
                  setRuleForm({
                    ...ruleForm,
                    billingStepMinutes: event.target.value,
                  })
                }
              />
            </Field>
          </SimpleGrid>

          <Field label="Ghi chú dòng giá">
            <Input
              value={ruleForm.notes}
              onChange={(event) =>
                setRuleForm({ ...ruleForm, notes: event.target.value })
              }
            />
          </Field>

          <HStack>
            <VButton
              size="sm"
              leftIcon={<Save size={14} />}
              onClick={saveRule}
              type="button"
            >
              {editingRuleId ? 'Cập nhật dòng giá' : 'Thêm dòng giá'}
            </VButton>
            {editingRuleId && (
              <VButton
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingRuleId(null);
                  setRuleForm(emptyRule);
                }}
                type="button"
              >
                Hủy sửa
              </VButton>
            )}
          </HStack>

          <VStack align="stretch" gap={2}>
            {(selectedBook.rules || []).map((rule) => (
              <Flex
                key={rule.id}
                gap={3}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                borderColor="gray.200"
                _dark={{ borderColor: 'gray.700' }}
                justify="space-between"
                align={{ base: 'stretch', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
              >
                <Box>
                  <Text fontSize="sm" fontWeight="medium">
                    {dayTypeOptions.find((item) => item.value === rule.dayType)
                      ?.label || rule.dayType}{' '}
                    · {minuteToTime(rule.startMinute)}-
                    {minuteToTime(rule.endMinute)} ·{' '}
                    {customerTypeOptions.find(
                      (item) => item.value === rule.customerType
                    )?.label || rule.customerType}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {formatCurrency(rule.pricePerHour)} / giờ · ưu tiên{' '}
                    {rule.priority}
                  </Text>
                </Box>
                <HStack>
                  <VButton
                    size="xs"
                    variant="outline"
                    onClick={() => editRule(rule)}
                    type="button"
                  >
                    Sửa
                  </VButton>
                  <VButton
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => deleteRule(rule.id)}
                    type="button"
                  >
                    Xóa
                  </VButton>
                </HStack>
              </Flex>
            ))}
            {(selectedBook.rules || []).length === 0 && (
              <Text fontSize="sm" color="gray.500">
                Chưa có dòng giá nào trong bảng giá này.
              </Text>
            )}
          </VStack>
        </VStack>
      )}

      <VStack align="stretch" gap={3}>
        <Box h="1px" bg="gray.100" _dark={{ bg: 'gray.800' }} />
        <Text fontWeight="semibold">Tính thử giá thuê sân</Text>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 5 }} gap={3}>
          <Field label="Ngày">
            <Input
              type="date"
              value={calcForm.date}
              onChange={(event) =>
                setCalcForm({ ...calcForm, date: event.target.value })
              }
            />
          </Field>
          <Field label="Bắt đầu">
            <Input
              type="time"
              value={calcForm.startTime}
              onChange={(event) =>
                setCalcForm({ ...calcForm, startTime: event.target.value })
              }
            />
          </Field>
          <Field label="Kết thúc">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="24:00"
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]|24:00"
              value={calcForm.endTime}
              onChange={(event) =>
                setCalcForm({ ...calcForm, endTime: event.target.value })
              }
            />
          </Field>
          <Field label="Số sân">
            <Input
              type="number"
              value={calcForm.numberOfCourts}
              onChange={(event) =>
                setCalcForm({
                  ...calcForm,
                  numberOfCourts: Number(event.target.value || 1),
                })
              }
            />
          </Field>
          <Field label="Loại khách">
            <SearchableSelect
              options={customerTypeOptions}
              value={calcForm.customerType}
              onChange={(value) =>
                setCalcForm({
                  ...calcForm,
                  customerType: value as VenueCustomerType,
                })
              }
            />
          </Field>
        </SimpleGrid>
        <VButton
          alignSelf="flex-start"
          size="sm"
          leftIcon={<Calculator size={14} />}
          onClick={calculatePrice}
          type="button"
        >
          Tính thử
        </VButton>

        {calculation && (
          <Box
            bg="green.50"
            _dark={{ bg: 'green.950' }}
            p={3}
            borderRadius="md"
          >
            <Text fontWeight="semibold">
              Tổng: {formatCurrency(calculation.totalAmount)}
            </Text>
            <VStack align="stretch" gap={1} mt={2}>
              {calculation.breakdown.map((item, index) => (
                <Text key={`${item.from}-${item.to}-${index}`} fontSize="sm">
                  {item.from}-{item.to}: {formatCurrency(item.pricePerHour)} x{' '}
                  {item.billableMinutes} phút x {item.numberOfCourts} sân ={' '}
                  {formatCurrency(item.amount)}
                  {item.source === 'LEGACY' ? ' (legacy)' : ''}
                </Text>
              ))}
            </VStack>
          </Box>
        )}

        {bookForm.priceImageUrl && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Xem nhanh ảnh bảng giá đang chọn
            </Text>
            <Image
              src={bookForm.priceImageUrl}
              alt="Ảnh bảng giá"
              maxH="320px"
              objectFit="contain"
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
            />
          </Box>
        )}
      </VStack>
    </VStack>
  );
}
