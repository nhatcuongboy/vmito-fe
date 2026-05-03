'use client';
import { Input } from '@/components/ui/Input';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';

import { Card, CardBody, Button, VSelect } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { SessionService } from '@/lib/api/session.service';
import { VenueService } from '@/lib/api/venue.service';
import { Venue, UserRole } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { formatVenueName } from '@/utils';
import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  AlertCircle,
  Clock,
  FileText,
  MapPin,
  Shield,
  Palette,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { toaster } from '@/components/ui/toaster';

interface GeneralSettingsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  onDataRefresh: () => void;
}

const GeneralSettings = ({ session, onDataRefresh }: GeneralSettingsProps) => {
  const t = useTranslations('session.generalSettings');
  const tValidation = useTranslations('session.validation');
  const tVenue = useTranslations('venue');
  const { getLevelLabel } = useLevelLabel();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRequiredLevels, setPendingRequiredLevels] = useState<number[]>(
    []
  );
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    session.venue?.id || ''
  );
  const [formData, setFormData] = useState({
    name: session.name || '',
    description: session.description || '',
    location: session.location || '',
    maxPlayersPerCourt: session.maxPlayersPerCourt || 4,
    requirePlayerInfo: session.requirePlayerInfo || false,
    allowGuestJoin: session.allowGuestJoin || false,
    allowNewPlayers: session.allowNewPlayers || false,
    requiredLevels: session.requiredLevels || [],
    startTime: session.startTime
      ? new Date(session.startTime).toISOString().slice(0, 16)
      : '',
    endTime: session.endTime
      ? new Date(session.endTime).toISOString().slice(0, 16)
      : '',
    courtColor: session.courtColor || '#179a3b',
    shuttlecock: session.shuttlecock || '',
    defaultMatchType: session.defaultMatchType || 'DOUBLES',
  });

  // Fetch venues on component mount
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const venueData = await VenueService.getAllVenues();
        setVenues(Array.isArray(venueData) ? venueData : []);
      } catch (error) {
        console.error('Error fetching venues:', error);
        setVenues([]); // Ensure venues is always an array
      }
    };
    fetchVenues();
  }, []);

  const COURT_COLORS = [
    { name: 'Green', value: '#179a3b' },
    { name: 'Grey', value: '#808080' },
    { name: 'Royal', value: '#364D63' },
    { name: 'Red', value: '#B24233' },
  ];

  const handleInputChange = (
    field: string,
    value: string | number | boolean | number[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLevelToggle = (level: number) => {
    setFormData((prev) => {
      const currentLevels: number[] = (prev.requiredLevels || []) as number[];
      const isSelected = currentLevels.includes(level);

      return {
        ...prev,
        requiredLevels: isSelected
          ? currentLevels.filter((l: number) => l !== level)
          : [...currentLevels, level],
      };
    });
  };

  /**
   * Check if requiredLevels has changed from original session
   * Used to determine if confirmation dialog should be shown
   */
  const hasRequiredLevelsChanged = () => {
    const originalLevels = (session.requiredLevels || []).sort().join(',');
    const newLevels = (formData.requiredLevels || []).sort().join(',');
    return originalLevels !== newLevels;
  };

  /**
   * Check if session is active (has players or is in progress)
   * Active sessions require confirmation when changing requiredLevels
   * to warn about potential impact on existing players
   */
  const isSessionActive = () => {
    return (
      session.status === 'IN_PROGRESS' ||
      (session.players && session.players.length > 0)
    );
  };

  /**
   * Handle session update with validation and confirmation
   * @param skipConfirmation - Skip confirmation dialog (used when user confirms)
   *
   * Validation:
   * - Validates requiredLevels contains only valid Level enum values
   * - Shows confirmation dialog if changing requiredLevels on active session
   */
  const handleUpdateSession = async (skipConfirmation = false) => {
    // Validate requiredLevels - ensure all values are valid Level enum values
    if (formData.requiredLevels && formData.requiredLevels.length > 0) {
      const requiredLevelsArray = formData.requiredLevels as number[];
      const invalidLevels = requiredLevelsArray.filter(
        (level: number) => !VALID_LEVELS.includes(level)
      );

      if (invalidLevels.length > 0) {
        toaster.error({
          title: tValidation('invalidLevels', {
            levels: invalidLevels.join(', '),
          }),
        });
        return;
      }
    }

    // Show confirmation if requiredLevels changed and session is active
    // This warns users about potential impact on existing players
    if (!skipConfirmation && hasRequiredLevelsChanged() && isSessionActive()) {
      setPendingRequiredLevels(formData.requiredLevels || []);
      setShowConfirmDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      // Find selected venue and prepare inline venue object
      const selectedVenue = venues.find((v) => v.id === selectedVenueId);
      const venueData = selectedVenue
        ? {
            placeId: selectedVenue.placeId,
            name: selectedVenue.name,
            address: selectedVenue.address,
            lat: selectedVenue.lat,
            lng: selectedVenue.lng,
            district: selectedVenue.district,
            city: selectedVenue.city,
          }
        : undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        ...formData,
        startTime: formData.startTime
          ? new Date(formData.startTime)
          : undefined,
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
        venue: venueData,
      };
      await SessionService.updateSession(session.id, updateData);
      // toaster.success({ title: tValidation('sessionUpdatedSuccessfully') });
      setShowConfirmDialog(false);
      onDataRefresh();
    } catch (error: unknown) {
      console.error('Failed to update session:', error);
      const err = error as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        tValidation('failedToUpdateSession');
      toaster.error({ title: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUpdate = () => {
    handleUpdateSession(true);
  };

  const handleCancelUpdate = () => {
    setShowConfirmDialog(false);
    setPendingRequiredLevels([]);
    // Revert to original requiredLevels
    setFormData((prev) => ({
      ...prev,
      requiredLevels: session.requiredLevels || [],
    }));
  };

  return (
    <Box maxW="6xl" mx="auto" px={4}>
      <VStack gap={8}>
        <Card
          maxW="4xl"
          w="full"
          bg={{ base: 'white', _dark: 'gray.800' }}
          border="1px solid"
          borderColor="border"
        >
          <CardBody p={8}>
            <VStack gap={6} align="stretch">
              <Box>
                <HStack mb={3}>
                  <FileText size={16} color="fg.muted" />
                  <Text fontSize="sm" fontWeight="semibold" color="fg">
                    {t('sessionName')}
                  </Text>
                </HStack>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('enterSessionName')}
                  size="lg"
                  borderRadius="lg"
                  borderColor="border"
                  bg={{ base: 'white', _dark: 'gray.700' }}
                  _focus={{
                    borderColor: 'brand.400',
                    boxShadow: '0 0 0 1px #3182ce',
                  }}
                />
              </Box>

              <Box>
                <HStack mb={3}>
                  <FileText size={16} color="fg.muted" />
                  <Text fontSize="sm" fontWeight="semibold" color="fg">
                    {t('description')}
                  </Text>
                </HStack>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder={t('enterDescription')}
                  rows={4}
                  borderRadius="lg"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: 'brand.400',
                    boxShadow: '0 0 0 1px #3182ce',
                  }}
                />
              </Box>

              <Box>
                <HStack mb={3}>
                  <MapPin size={16} color="fg.muted" />
                  <Text fontSize="sm" fontWeight="semibold" color="fg">
                    {t('location')}
                  </Text>
                </HStack>
                <VSelect
                  value={selectedVenueId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setSelectedVenueId(e.target.value)
                  }
                >
                  <option value="">
                    {t('selectVenue', {
                      defaultValue: 'Select a venue...',
                    })}
                  </option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {formatVenueName(
                        venue.name,
                        tVenue('nameFormat', { name: '{name}' })
                      )}{' '}
                      - {venue.address}
                    </option>
                  ))}
                </VSelect>
              </Box>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <Box>
                  <HStack mb={3}>
                    <Users size={16} color="fg.muted" />
                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                      {t('maxPlayersPerCourt')}
                    </Text>
                  </HStack>
                  <Input
                    type="number"
                    value={formData.maxPlayersPerCourt}
                    onChange={(e) =>
                      handleInputChange(
                        'maxPlayersPerCourt',
                        parseInt(e.target.value) || 4
                      )
                    }
                    min={2}
                    max={8}
                    size="lg"
                    borderRadius="lg"
                    borderColor="border"
                    bg={{ base: 'white', _dark: 'gray.700' }}
                    _focus={{
                      borderColor: 'brand.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                  />
                </Box>

                <Box>
                  <HStack mb={3}>
                    <FileText size={16} color="fg.muted" />
                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                      {t('shuttlecock', { defaultValue: 'Cầu' })}
                    </Text>
                  </HStack>
                  <Input
                    value={formData.shuttlecock || ''}
                    onChange={(e) =>
                      handleInputChange('shuttlecock', e.target.value)
                    }
                    placeholder={t('shuttlecock', {
                      defaultValue: 'Nhập loại cầu',
                    })}
                    size="lg"
                    borderRadius="lg"
                    borderColor="border"
                    bg={{ base: 'white', _dark: 'gray.700' }}
                    _focus={{
                      borderColor: 'brand.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                  />
                </Box>

                {/* Default Match Type */}
                <Box>
                  <HStack mb={3}>
                    <Users size={16} color="fg.muted" />
                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                      {t('defaultMatchType')}
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Button
                      variant={
                        formData.defaultMatchType === 'DOUBLES'
                          ? 'solid'
                          : 'outline'
                      }
                      colorPalette={
                        formData.defaultMatchType === 'DOUBLES'
                          ? 'blue'
                          : 'gray'
                      }
                      size="sm"
                      onClick={() =>
                        handleInputChange('defaultMatchType', 'DOUBLES')
                      }
                    >
                      <Box as={Users} boxSize={4} mr={1} />
                      {t('doubles')}
                    </Button>
                    <Button
                      variant={
                        formData.defaultMatchType === 'SINGLES'
                          ? 'solid'
                          : 'outline'
                      }
                      colorPalette={
                        formData.defaultMatchType === 'SINGLES'
                          ? 'blue'
                          : 'gray'
                      }
                      size="sm"
                      onClick={() =>
                        handleInputChange('defaultMatchType', 'SINGLES')
                      }
                    >
                      <Box as={User} boxSize={4} mr={1} />
                      {t('singles')}
                    </Button>
                  </HStack>
                </Box>
              </Grid>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <Box>
                  <HStack mb={3}>
                    <Clock size={16} color="fg.muted" />
                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                      {t('startTime')}
                    </Text>
                  </HStack>
                  <VDateTimeInput
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      handleInputChange('startTime', e.target.value)
                    }
                    size="lg"
                    borderRadius="lg"
                    borderColor="border"
                    bg={{ base: 'white', _dark: 'gray.700' }}
                    color="gray.800"
                    _dark={{ color: 'white' }}
                    _focus={{
                      borderColor: 'brand.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                    placeholder={t('startTime')}
                  />
                </Box>

                <Box>
                  <HStack mb={3}>
                    <Clock size={16} color="fg.muted" />
                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                      {t('endTime')}
                    </Text>
                  </HStack>
                  <VDateTimeInput
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                      handleInputChange('endTime', e.target.value)
                    }
                    size="lg"
                    borderRadius="lg"
                    borderColor="border"
                    bg={{ base: 'white', _dark: 'gray.700' }}
                    color="gray.800"
                    _dark={{ color: 'white' }}
                    _focus={{
                      borderColor: 'brand.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                    placeholder={t('endTime')}
                  />
                </Box>
              </Grid>

              {/* Temporarily hidden */}
              {false && user?.role !== UserRole.PLAYER && (
                <VStack gap={4} align="stretch">
                  <Heading size="sm" color="fg">
                    {t('sessionSettings')}
                  </Heading>

                  <Flex
                    justify="space-between"
                    align="center"
                    p={4}
                    bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                    borderRadius="lg"
                  >
                    <HStack>
                      <UserCheck size={16} color="fg.muted" />
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" color="fg">
                          {t('requirePlayerInfo')}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {t('requirePlayerInfoDesc')}
                        </Text>
                      </Box>
                    </HStack>
                    <input
                      type="checkbox"
                      checked={formData.requirePlayerInfo}
                      onChange={(e) =>
                        handleInputChange('requirePlayerInfo', e.target.checked)
                      }
                      style={{ width: '20px', height: '20px' }}
                    />
                  </Flex>

                  <Flex
                    justify="space-between"
                    align="center"
                    p={4}
                    bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                    borderRadius="lg"
                  >
                    <HStack>
                      <Users size={16} color="fg.muted" />
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" color="fg">
                          {t('allowGuestJoin')}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {t('allowGuestJoinDesc')}
                        </Text>
                      </Box>
                    </HStack>
                    <input
                      type="checkbox"
                      checked={formData.allowGuestJoin}
                      onChange={(e) =>
                        handleInputChange('allowGuestJoin', e.target.checked)
                      }
                      style={{ width: '20px', height: '20px' }}
                    />
                  </Flex>

                  <Flex
                    justify="space-between"
                    align="center"
                    p={4}
                    bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                    borderRadius="lg"
                  >
                    <HStack>
                      <UserPlus size={16} color="fg.muted" />
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" color="fg">
                          {t('allowNewPlayers')}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {t('allowNewPlayersDesc')}
                        </Text>
                      </Box>
                    </HStack>
                    <input
                      type="checkbox"
                      checked={formData.allowNewPlayers}
                      onChange={(e) =>
                        handleInputChange('allowNewPlayers', e.target.checked)
                      }
                      style={{ width: '20px', height: '20px' }}
                    />
                  </Flex>
                </VStack>
              )}

              <VStack gap={4} align="stretch" mt={6}>
                <Heading size="sm" color="fg">
                  <HStack>
                    <Shield size={16} />
                    <Text>{t('requiredPlayerLevels')}</Text>
                  </HStack>
                </Heading>

                <Box
                  p={4}
                  bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                  borderRadius="lg"
                >
                  <Text fontSize="xs" color="fg.muted" mb={3}>
                    {t('selectRequiredLevels')}
                  </Text>

                  <Wrap gap={2}>
                    {VALID_LEVELS.map((level) => {
                      const isSelected =
                        formData.requiredLevels?.includes(level);
                      return (
                        <WrapItem key={level}>
                          <Badge
                            px={3}
                            py={2}
                            borderRadius="md"
                            cursor="pointer"
                            bg={
                              isSelected
                                ? 'brand.500'
                                : { base: 'gray.200', _dark: 'gray.700' }
                            }
                            color={isSelected ? 'white' : 'fg'}
                            fontSize="sm"
                            fontWeight="semibold"
                            onClick={() => handleLevelToggle(level)}
                            _hover={{
                              transform: 'translateY(-1px)',
                              boxShadow: 'sm',
                            }}
                            transition="all 0.2s"
                          >
                            {getLevelLabel(level)}
                          </Badge>
                        </WrapItem>
                      );
                    })}
                  </Wrap>

                  {formData.requiredLevels?.length > 0 && (
                    <Text fontSize="xs" color="green.600" mt={2}>
                      {t('levelsSelected', {
                        count: formData.requiredLevels.length,
                      })}
                    </Text>
                  )}
                  {formData.requiredLevels &&
                    formData.requiredLevels.length > 0 &&
                    formData.requiredLevels.length === VALID_LEVELS.length && (
                      <Text fontSize="xs" color="orange.500" mt={2}>
                        {t('allLevelsSelected')}
                      </Text>
                    )}
                </Box>
              </VStack>

              <VStack gap={4} align="stretch" mt={6}>
                <Heading size="sm" color="fg">
                  <HStack>
                    <Palette size={16} />
                    <Text>Court Appearance</Text>
                  </HStack>
                </Heading>

                <Box
                  p={4}
                  bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                  borderRadius="lg"
                >
                  <Text fontSize="xs" color="fg.muted" mb={3}>
                    Select a color theme for your courts
                  </Text>
                  <Wrap gap={4}>
                    {COURT_COLORS.map((color) => {
                      const isSelected = formData.courtColor === color.value;
                      return (
                        <WrapItem key={color.value}>
                          <VStack>
                            <Box
                              w="60px"
                              h="60px"
                              borderRadius="md"
                              bg={color.value}
                              cursor="pointer"
                              position="relative"
                              onClick={() =>
                                handleInputChange('courtColor', color.value)
                              }
                              border="4px solid"
                              borderColor={isSelected ? 'brand.500' : 'border'}
                              boxShadow={isSelected ? 'lg' : 'sm'}
                              transition="all 0.2s"
                              _hover={{
                                transform: 'scale(1.05)',
                                boxShadow: 'md',
                              }}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {/* White lines representation */}
                              <Box
                                w="40px"
                                h="30px"
                                border="1px solid white"
                                position="absolute"
                              />
                              <Box
                                w="0px"
                                h="30px"
                                borderLeft="1px solid white"
                                position="absolute"
                              />
                            </Box>
                            <Text
                              fontSize="xs"
                              fontWeight={isSelected ? 'bold' : 'normal'}
                            >
                              {color.name}
                            </Text>
                          </VStack>
                        </WrapItem>
                      );
                    })}
                  </Wrap>
                </Box>
              </VStack>

              {/* Confirmation Dialog */}
              <VModal
                isOpen={showConfirmDialog}
                onClose={handleCancelUpdate}
                title={
                  <HStack gap={3}>
                    <Box as={AlertCircle} boxSize={6} color="orange.500" />
                    <Text>{t('confirmLevelChange')}</Text>
                  </HStack>
                }
                size="md"
                primaryActionText={t('confirmChange')}
                onPrimaryAction={handleConfirmUpdate}
                isPrimaryLoading={isLoading}
                primaryColorScheme="orange"
                secondaryActionText={t('cancel', { defaultValue: 'Cancel' })}
                isSecondaryDisabled={isLoading}
              >
                <VStack align="stretch" gap={4}>
                  <Text color="fg.muted" lineHeight="1.6">
                    {t('changeLevelWarning')}
                  </Text>
                  <VStack
                    align="start"
                    gap={2}
                    p={4}
                    bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                    borderRadius="md"
                  >
                    <Text fontSize="sm" color="fg">
                      <strong>{t('currentLevels')}</strong>{' '}
                      {(session.requiredLevels || []).length > 0
                        ? (session.requiredLevels || []).join(', ')
                        : t('allLevelsAllowed')}
                    </Text>
                    <Text fontSize="sm" color="fg">
                      <strong>{t('newLevels')}</strong>{' '}
                      {pendingRequiredLevels.length > 0
                        ? pendingRequiredLevels.join(', ')
                        : t('allLevelsAllowed')}
                    </Text>
                  </VStack>
                  <Text fontSize="sm" color="red.600" fontStyle="italic">
                    {t('playerImpactWarning')}
                  </Text>
                </VStack>
              </VModal>

              <Button
                colorPalette="green"
                size="lg"
                borderRadius="lg"
                loading={isLoading}
                onClick={() => handleUpdateSession()}
                mt={4}
                _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
              >
                {t('updateSession')}
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default GeneralSettings;
