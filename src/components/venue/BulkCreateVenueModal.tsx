'use client';

import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Tabs,
  Text,
  VStack,
  Input,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { Trash2, Plus, UploadCloud, Download, AlertCircle } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Papa from 'papaparse';
import VModal from '@/components/ui/VModal';
import { VButton } from '@/components/ui/VButton';
import { toaster } from '@/components/ui/toaster';
import { VenueService } from '@/lib/api/venue.service';
import { Venue } from '@/lib/api/types';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@/components/ui/VTable';
import { Field } from '@/components/ui/Field';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useNewAdminUnits } from '@/hooks/useNewAdminUnits';
import { composeNewAddress, guessStreetAddress } from '@/utils/venue-helpers';
import { useTranslations } from 'next-intl';

const venueSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  placeId: z.string().min(1, 'Place ID is required'),
  address: z.string().min(5, 'Address is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  newDistrict: z.string().optional(),
  newCity: z.string().optional(),
  phone: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isVerified: z.boolean(),
});

const bulkSchema = z.object({
  venues: z.array(venueSchema).min(1, 'At least one venue is required'),
});

type BulkFormValues = z.infer<typeof bulkSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkCreateVenueModal({
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const [tab, setTab] = useState<string>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 1: Form Array
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BulkFormValues>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      venues: [
        {
          name: '',
          placeId: '',
          address: '',
          district: '',
          city: 'Hồ Chí Minh',
          phone: '',
          newDistrict: '',
          newCity: '',
          isVerified: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'venues',
  });

  const { cityOptions: newCityOptions, getWardsByCity } = useNewAdminUnits();

  // Tab 2: CSV Data
  const [csvData, setCsvData] = useState<Omit<Venue, 'id'>[]>([]);
  const [csvErrors, setCsvErrors] = useState<
    { row: number; errors: Record<string, string[]> }[]
  >([]);

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/template_venues.csv';
    link.download = 'template_venues.csv';
    link.click();
  };

  const processCsvData = (data: Record<string, string>[]) => {
    const parsedVenues = data.map((row) => ({
      name: row.name || '',
      placeId: row.placeId || '',
      address: row.address || '',
      district: row.district || '',
      city: row.city || 'Hồ Chí Minh',
      newDistrict: row.newDistrict || undefined,
      newCity: row.newCity || undefined,
      phone: row.phone || undefined,
      lat: row.lat ? parseFloat(row.lat) : undefined,
      lng: row.lng ? parseFloat(row.lng) : undefined,
      isVerified: false,
    }));

    // Validate
    const validationErrors: {
      row: number;
      errors: Record<string, string[]>;
    }[] = [];
    parsedVenues.forEach((venue, index) => {
      const result = venueSchema.safeParse(venue);
      if (!result.success) {
        validationErrors.push({
          row: index,
          errors: result.error.flatten().fieldErrors,
        });
      }
    });

    setCsvData(parsedVenues);
    setCsvErrors(validationErrors);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processCsvData(results.data as Record<string, string>[]);
      },
      error: (error: Error) => {
        toaster.error({
          title: t('bulkCsvParseError'),
          description: error.message,
        });
      },
    });

    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmitManual = async (data: BulkFormValues) => {
    await submitData(data.venues);
  };

  const onSubmitCsv = async () => {
    if (csvErrors.length > 0) {
      toaster.error({ title: t('bulkFixValidationErrors') });
      return;
    }
    if (csvData.length === 0) return;

    await submitData(csvData);
  };

  const submitData = async (venuesData: Omit<Venue, 'id'>[]) => {
    setIsSubmitting(true);
    try {
      const res = await VenueService.createBulkVenues(venuesData);
      toaster.success({
        title: t('bulkCreateSuccess'),
        description: `${res.count} ${t('bulkVenuesProcessed')}`,
      });
      onSuccess();
      handleClose();
    } catch (error) {
      toaster.error({
        title: tc('error'),
        description:
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || t('bulkCreateError'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setCsvData([]);
    setCsvErrors([]);
    onClose();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('bulkCreateTitle')}
      size="xl"
    >
      <Tabs.Root
        value={tab}
        onValueChange={(e) => setTab(e.value as string)}
        variant="line"
        size="md"
      >
        <Tabs.List mb={4}>
          <Tabs.Trigger value="manual">{t('bulkManualTab')}</Tabs.Trigger>
          <Tabs.Trigger value="csv">{t('bulkCsvTab')}</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="manual">
          <form id="bulk-manual-form" onSubmit={handleSubmit(onSubmitManual)}>
            <VStack
              align="stretch"
              gap={4}
              maxH="50vh"
              overflowY="auto"
              pr={2}
              mb={4}
            >
              {fields.map((field, index) => (
                <Box
                  key={field.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  position="relative"
                  mb={3}
                >
                  <HStack justify="space-between" mb={3}>
                    <Text fontWeight="bold">
                      {t('bulkVenueTitle', { index: index + 1 })}
                    </Text>
                    {fields.length > 1 && (
                      <IconButton
                        aria-label="Thu hồi"
                        variant="ghost"
                        colorPalette="red"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    )}
                  </HStack>

                  <Flex gap={4} mb={3}>
                    <Box flex={1}>
                      <Field
                        label="Tên *"
                        invalid={!!errors.venues?.[index]?.name}
                      >
                        <Input
                          {...register(`venues.${index}.name`)}
                          placeholder="Nhập tên"
                        />
                      </Field>
                    </Box>
                    <Box flex={1}>
                      <Field
                        label="Mã địa điểm (Place ID) *"
                        invalid={!!errors.venues?.[index]?.placeId}
                      >
                        <Input
                          {...register(`venues.${index}.placeId`)}
                          placeholder="Google Place ID"
                        />
                      </Field>
                    </Box>
                  </Flex>

                  <Flex gap={4} mb={3}>
                    <Box flex={2}>
                      <Field
                        label="Địa chỉ *"
                        invalid={!!errors.venues?.[index]?.address}
                      >
                        <Input
                          {...register(`venues.${index}.address`)}
                          placeholder="Địa chỉ chi tiết"
                        />
                      </Field>
                    </Box>
                  </Flex>

                  <Flex gap={4}>
                    <Box flex={1}>
                      <Field
                        label="Quận/Huyện *"
                        invalid={!!errors.venues?.[index]?.district}
                      >
                        <Input
                          {...register(`venues.${index}.district`)}
                          placeholder="Quận/Huyện"
                        />
                      </Field>
                    </Box>
                    <Box flex={1}>
                      <Field
                        label="Thành phố *"
                        invalid={!!errors.venues?.[index]?.city}
                      >
                        <Input
                          {...register(`venues.${index}.city`)}
                          placeholder="Thành phố"
                        />
                      </Field>
                    </Box>
                    <Box flex={1}>
                      <Field
                        label="Số điện thoại"
                        invalid={!!errors.venues?.[index]?.phone}
                      >
                        <Input
                          {...register(`venues.${index}.phone`)}
                          placeholder="SĐT"
                        />
                      </Field>
                    </Box>
                  </Flex>

                  <Box
                    mt={3}
                    p={3}
                    borderRadius="md"
                    bg="blue.50"
                    _dark={{ bg: 'blue.900' }}
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="blue.600"
                      _dark={{ color: 'blue.300' }}
                      mb={2}
                    >
                      {t('newAddressSection')}
                    </Text>
                    <Text fontSize="xs" color="gray.600" mb={3}>
                      {t('newAddressHelper')}
                    </Text>
                    <Flex gap={3}>
                      <Box flex={1}>
                        <Field label={t('newCity')}>
                          <Controller
                            control={control}
                            name={`venues.${index}.newCity`}
                            render={({ field }) => (
                              <SearchableSelect
                                options={newCityOptions}
                                value={field.value}
                                onChange={(val) => {
                                  field.onChange(val);
                                  setValue(`venues.${index}.newDistrict`, '');
                                }}
                                placeholder="Tỉnh/thành mới"
                                size="sm"
                              />
                            )}
                          />
                        </Field>
                      </Box>
                      <Box flex={1}>
                        <Field label={t('newDistrict')}>
                          <Controller
                            control={control}
                            name={`venues.${index}.newDistrict`}
                            render={({ field }) => (
                              <SearchableSelect
                                options={getWardsByCity(
                                  watch(`venues.${index}.newCity`)
                                )}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Phường/xã/đặc khu mới"
                                isDisabled={!watch(`venues.${index}.newCity`)}
                                size="sm"
                              />
                            )}
                          />
                        </Field>
                      </Box>
                    </Flex>
                    {(() => {
                      const preview = composeNewAddress(
                        guessStreetAddress(watch(`venues.${index}.address`)),
                        watch(`venues.${index}.newDistrict`),
                        watch(`venues.${index}.newCity`)
                      );
                      return preview ? (
                        <Text fontSize="xs" color="gray.500" mt={2}>
                          Địa chỉ mới (tự động): {preview}
                        </Text>
                      ) : null;
                    })()}
                  </Box>
                </Box>
              ))}

              <Button
                variant="outline"
                onClick={() =>
                  append({
                    name: '',
                    placeId: '',
                    address: '',
                    district: '',
                    city: 'Hồ Chí Minh',
                    phone: '',
                    newDistrict: '',
                    newCity: '',
                    isVerified: false,
                  })
                }
                alignSelf="flex-start"
                mt={2}
              >
                <Plus size={16} style={{ marginRight: 8 }} />
                {t('bulkAddAnother')}
              </Button>
            </VStack>
          </form>

          <Flex justify="flex-end" mt={6}>
            <VButton variant="outline" mr={3} onClick={handleClose}>
              Hủy
            </VButton>
            <Button
              type="submit"
              form="bulk-manual-form"
              loading={isSubmitting}
            >
              {t('bulkSubmitManual')}
            </Button>
          </Flex>
        </Tabs.Content>

        <Tabs.Content value="csv">
          <VStack align="stretch" gap={4}>
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderWidth={1}
              borderStyle="dashed"
              borderRadius="md"
              bg="gray.50"
            >
              <VStack align="start" gap={1}>
                <Text fontWeight="bold">{t('bulkCsvUploadTitle')}</Text>
                <Text fontSize="sm" color="gray.500">
                  {t('bulkCsvUploadHint')}
                </Text>
              </VStack>
              <HStack>
                <Button variant="ghost" onClick={handleDownloadTemplate}>
                  <Download size={16} style={{ marginRight: 8 }} />
                  {t('bulkCsvTemplate')}
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <VButton onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud size={16} style={{ marginRight: 8 }} />
                  {t('bulkChooseFile')}
                </VButton>
              </HStack>
            </Flex>

            {csvData.length > 0 && (
              <Box maxH="40vh" overflowY="auto">
                <Text fontWeight="bold" mb={2}>
                  {t('bulkPreviewTitle', { count: csvData.length })}
                </Text>
                {csvErrors.length > 0 && (
                  <HStack
                    color="red.500"
                    mb={3}
                    p={2}
                    bg="red.50"
                    borderRadius="md"
                  >
                    <AlertCircle size={16} />
                    <Text fontSize="sm">
                      {t('bulkCsvValidationError', {
                        count: csvErrors.length,
                      })}
                    </Text>
                  </HStack>
                )}

                <TableContainer>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Dòng</Th>
                        <Th>Tên sân</Th>
                        <Th>Place ID</Th>
                        <Th>Địa chỉ</Th>
                        <Th>Quận / TP</Th>
                        <Th>TT</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {csvData.map((row, i) => {
                        const error = csvErrors.find((e) => e.row === i);
                        return (
                          <Tr key={i} bg={error ? 'red.50' : 'transparent'}>
                            <Td>{i + 1}</Td>
                            <Td minW="150px">{row.name}</Td>
                            <Td
                              maxW="100px"
                              whiteSpace="nowrap"
                              overflow="hidden"
                              textOverflow="ellipsis"
                            >
                              {row.placeId}
                            </Td>
                            <Td whiteSpace="normal" minW="150px">
                              {row.address}
                            </Td>
                            <Td>
                              {row.district}, {row.city}
                            </Td>
                            <Td>
                              {error ? (
                                <Badge colorPalette="red">Lỗi</Badge>
                              ) : (
                                <Badge colorPalette="green">Hợp lệ</Badge>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Flex justify="flex-end" mt={4}>
              <VButton variant="outline" mr={3} onClick={handleClose}>
                Hủy
              </VButton>
              <VButton
                onClick={onSubmitCsv}
                loading={isSubmitting}
                disabled={csvData.length === 0 || csvErrors.length > 0}
              >
                {t('bulkCreateCsv')}
              </VButton>
            </Flex>
          </VStack>
        </Tabs.Content>
      </Tabs.Root>
    </VModal>
  );
}
