'use client';

import MainLayout from '@/components/layout/MainLayout';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { VenueService } from '@/lib/api/venue.service';
import { UserRole, Venue } from '@/lib/api/types';
import {
  Badge,
  Box,
  Button,
  Container,
  Field,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Spinner,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, Plus, Search, RefreshCcw, MapPin } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import CommonModal from '@/components/ui/CommonModal';
import { useDebounce } from '@/hooks/useDebounce';

// Schema definitions
const venueSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  placeId: z.string().min(1, 'Place ID is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  district: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  isVerified: z.boolean(),
});

type VenueFormValues = z.infer<typeof venueSchema>;

export default function AdminVenuesPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isHydrated } = useAuthStore();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // Forms
  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      placeId: '',
      address: '',
      district: '',
      city: '',
      lat: undefined,
      lng: undefined,
      isVerified: false,
    },
  });

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const data = await VenueService.getAllVenues();
      // Ensure data is an array before filtering
      if (!Array.isArray(data)) {
        console.error('Venues data is not an array:', data);
        setVenues([]);
        return;
      }
      // Simple client-side filtering since backend doesn't support search yet
      const filteredData = data.filter(
        (venue) =>
          venue.name
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          venue.address
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())
      );
      setVenues(filteredData);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      toaster.error({ title: t('failedToLoadVenues') });
      setVenues([]); // Ensure venues is always an array
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, t]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/auth/signin');
      return;
    }
    if (!currentUser) return;
    if (currentUser.role !== UserRole.ADMIN) {
      toaster.error({ title: t('accessDenied') });
      router.replace('/dashboard');
      return;
    }
    fetchVenues();
  }, [isHydrated, isAuthenticated, currentUser, router, fetchVenues, t]);

  const handleCreate = async (data: VenueFormValues) => {
    try {
      await VenueService.createVenue(data);
      toaster.success({ title: t('venueCreatedSuccess') });
      setIsCreateOpen(false);
      form.reset();
      fetchVenues();
    } catch (error) {
      console.error('Failed to create venue:', error);
      toaster.error({ title: t('failedToCreateVenue') });
    }
  };

  const handleUpdate = async (data: VenueFormValues) => {
    if (!selectedVenue) return;
    try {
      await VenueService.updateVenue(selectedVenue.id, data);
      toaster.success({ title: t('venueUpdatedSuccess') });
      setIsEditOpen(false);
      fetchVenues();
    } catch (error) {
      console.error('Failed to update venue:', error);
      toaster.error({ title: t('failedToUpdateVenue') });
    }
  };

  const handleDelete = async () => {
    if (!selectedVenue) return;
    try {
      await VenueService.deleteVenue(selectedVenue.id);
      toaster.success({ title: t('venueDeletedSuccess') });
      setIsDeleteOpen(false);
      fetchVenues();
    } catch (error) {
      console.error('Failed to delete venue:', error);
      toaster.error({ title: t('failedToDeleteVenue') });
    }
  };

  const openEditModal = (venue: Venue) => {
    setSelectedVenue(venue);
    form.reset({
      name: venue.name,
      placeId: venue.placeId,
      address: venue.address,
      district: venue.district || '',
      city: venue.city || '',
      lat: venue.lat,
      lng: venue.lng,
      isVerified: venue.isVerified ?? false,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (venue: Venue) => {
    setSelectedVenue(venue);
    setIsDeleteOpen(true);
  };

  if (loading && venues.length === 0) {
    return (
      <MainLayout title={t('venues')}>
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={t('venues')}>
      <Container maxW="container.xl" py={6}>
        <VStack gap={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Heading size="lg">{t('venueManagement')}</Heading>
            <Button
              colorPalette="green"
              onClick={() => {
                form.reset({
                  name: '',
                  placeId: '',
                  address: '',
                  district: '',
                  city: '',
                  lat: undefined,
                  lng: undefined,
                  isVerified: false,
                });
                setIsCreateOpen(true);
              }}
            >
              <Plus size={18} />
              <Text ml={2}>{t('addVenue')}</Text>
            </Button>
          </Flex>

          {/* Filters */}
          <Flex gap={4} wrap="wrap">
            <Box position="relative" flex="1" minW="200px">
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                pl={10}
              />
              <Box
                position="absolute"
                left={3}
                top="50%"
                transform="translateY(-50%)"
              >
                <Search size={16} color="gray" />
              </Box>
            </Box>
            <IconButton aria-label="Refresh" onClick={fetchVenues}>
              <RefreshCcw size={18} />
            </IconButton>
          </Flex>

          {/* Venues Table */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            overflow="hidden"
            _dark={{ bg: 'gray.800' }}
          >
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{t('name')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('address')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('isVerified')}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">
                    {t('actions')}
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {venues.map((venue) => (
                  <Table.Row key={venue.id}>
                    <Table.Cell fontWeight="medium">
                      <HStack gap={2}>
                        <MapPin size={16} color="#179a3b" />
                        <Text>{venue.name}</Text>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell color="gray.600">
                      <Text fontSize="sm">{venue.address}</Text>
                      {venue.district && venue.city && (
                        <Text fontSize="xs" color="gray.400">
                          {venue.district}, {venue.city}
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={venue.isVerified ? 'green' : 'gray'}>
                        {venue.isVerified ? t('yes') : t('no')}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell textAlign="right">
                      <HStack gap={2} justify="flex-end">
                        <IconButton
                          aria-label="Edit venue"
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(venue)}
                        >
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton
                          aria-label="Delete venue"
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => openDeleteModal(venue)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>

            {venues.length === 0 && !loading && (
              <Box p={8} textAlign="center" color="gray.500">
                {t('noVenuesFound') || 'No venues found'}
              </Box>
            )}
          </Box>
        </VStack>

        {/* Create/Edit Venue Modal */}
        <CommonModal
          isOpen={isCreateOpen || isEditOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setIsEditOpen(false);
          }}
          title={isCreateOpen ? t('createVenue') : t('editVenue')}
          primaryActionText={isCreateOpen ? tCommon('create') : tCommon('save')}
          onPrimaryAction={() =>
            form.handleSubmit((data) =>
              isCreateOpen ? handleCreate(data) : handleUpdate(data)
            )()
          }
          isPrimaryLoading={form.formState.isSubmitting}
          secondaryActionText={tCommon('cancel')}
        >
          <VStack gap={4} as="form">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label>{t('name')}</Field.Label>
                  <Input {...field} />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={form.control}
              name="placeId"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label>{t('placeId')}</Field.Label>
                  <Input {...field} placeholder="Google Place ID" />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field.Root invalid={!!fieldState.error}>
                  <Field.Label>{t('address')}</Field.Label>
                  <Input {...field} />
                  <Field.ErrorText>{fieldState.error?.message}</Field.ErrorText>
                </Field.Root>
              )}
            />

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="district"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>{tCommon('filters.area')}</Field.Label>
                    <Input {...field} placeholder="District" />
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="city"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>{tCommon('filters.allCities')}</Field.Label>
                    <Input {...field} placeholder="City" />
                  </Field.Root>
                )}
              />
            </HStack>

            <HStack width="full" gap={4}>
              <Controller
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Latitude</Field.Label>
                    <Input
                      {...field}
                      type="number"
                      step="any"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field.Root>
                )}
              />
              <Controller
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <Field.Root flex={1}>
                    <Field.Label>Longitude</Field.Label>
                    <Input
                      {...field}
                      type="number"
                      step="any"
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </Field.Root>
                )}
              />
            </HStack>

            <Controller
              control={form.control}
              name="isVerified"
              render={({ field }) => (
                <Field.Root display="flex" alignItems="center" gap={4}>
                  <Field.Label mb={0}>{t('isVerified')}</Field.Label>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(details) =>
                      field.onChange(details.checked)
                    }
                  />
                </Field.Root>
              )}
            />
          </VStack>
        </CommonModal>

        {/* Delete Confirmation Modal */}
        <CommonModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title={t('deleteVenue')}
          primaryActionText={tCommon('delete')}
          onPrimaryAction={handleDelete}
          primaryColorScheme="red"
          secondaryActionText={tCommon('cancel')}
        >
          <Text>
            {t('deleteConfirmation', { name: selectedVenue?.name || '' })}
          </Text>
        </CommonModal>
      </Container>
    </MainLayout>
  );
}
