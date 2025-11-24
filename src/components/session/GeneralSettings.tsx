'use client';

import { Card, CardBody } from '@/components/ui/chakra-compat';
import { SessionService } from '@/lib/api/session.service';
import { Level } from '@/lib/api/types';
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
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
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface GeneralSettingsProps {
  session: any;
  onDataRefresh: () => void;
}

const GeneralSettings = ({ session, onDataRefresh }: GeneralSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingRequiredLevels, setPendingRequiredLevels] = useState<Level[]>(
    []
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
  });

  const handleInputChange = (
    field: string,
    value: string | number | boolean | Level[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLevelToggle = (level: Level) => {
    setFormData((prev) => {
      const currentLevels: Level[] = (prev.requiredLevels || []) as Level[];
      const isSelected = currentLevels.includes(level);

      return {
        ...prev,
        requiredLevels: isSelected
          ? currentLevels.filter((l: Level) => l !== level)
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
      const validLevels = Object.values(Level);
      const requiredLevelsArray = formData.requiredLevels as Level[];
      const invalidLevels = requiredLevelsArray.filter(
        (level: Level) => !validLevels.includes(level)
      );

      if (invalidLevels.length > 0) {
        toast.error(
          `Invalid level values: ${invalidLevels.join(', ')}. Please select valid levels.`
        );
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
      const updateData = {
        ...formData,
        startTime: formData.startTime
          ? new Date(formData.startTime)
          : undefined,
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
      };
      await SessionService.updateSession(session.id, updateData);
      toast.success('Session updated successfully');
      setShowConfirmDialog(false);
      onDataRefresh();
    } catch (error: any) {
      console.error('Failed to update session:', error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update session';
      toast.error(errorMessage);
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
        <Card maxW="4xl" w="full">
          <CardBody p={8}>
            <VStack gap={6} align="stretch">
              <Box>
                <HStack mb={3}>
                  <FileText size={16} color="#4a5568" />
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    Session Name
                  </Text>
                </HStack>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter session name"
                  size="lg"
                  borderRadius="lg"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #3182ce',
                  }}
                />
              </Box>

              <Box>
                <HStack mb={3}>
                  <FileText size={16} color="#4a5568" />
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    Description
                  </Text>
                </HStack>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Enter session description"
                  rows={4}
                  borderRadius="lg"
                  borderColor="gray.300"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px #3182ce',
                  }}
                />
              </Box>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <Box>
                  <HStack mb={3}>
                    <MapPin size={16} color="#4a5568" />
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Location
                    </Text>
                  </HStack>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange('location', e.target.value)
                    }
                    placeholder="Enter location"
                    size="lg"
                    borderRadius="lg"
                    borderColor="gray.300"
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                  />
                </Box>

                <Box>
                  <HStack mb={3}>
                    <Users size={16} color="#4a5568" />
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Max Players Per Court
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
                    borderColor="gray.300"
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                  />
                </Box>
              </Grid>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
                <Box>
                  <HStack mb={3}>
                    <Clock size={16} color="#4a5568" />
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      Start Time
                    </Text>
                  </HStack>
                  <Input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      handleInputChange('startTime', e.target.value)
                    }
                    size="lg"
                    borderRadius="lg"
                    borderColor="gray.300"
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                  />
                </Box>

                <Box>
                  <HStack mb={3}>
                    <Clock size={16} color="#4a5568" />
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      End Time
                    </Text>
                  </HStack>
                  <Input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                      handleInputChange('endTime', e.target.value)
                    }
                    size="lg"
                    borderRadius="lg"
                    borderColor="gray.300"
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                  />
                </Box>
              </Grid>

              <VStack gap={4} align="stretch">
                <Heading size="sm" color="gray.700">
                  Session Settings
                </Heading>

                <Flex
                  justify="space-between"
                  align="center"
                  p={4}
                  bg="gray.50"
                  borderRadius="lg"
                >
                  <HStack>
                    <UserCheck size={16} color="#4a5568" />
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        Require Player Info
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Players must provide personal information
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
                  bg="gray.50"
                  borderRadius="lg"
                >
                  <HStack>
                    <Users size={16} color="#4a5568" />
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        Allow Guest Join
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Allow guests to join without registration
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
                  bg="gray.50"
                  borderRadius="lg"
                >
                  <HStack>
                    <UserPlus size={16} color="#4a5568" />
                    <Box>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        Allow New Players
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Allow new players to join during session
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

              <VStack gap={4} align="stretch" mt={6}>
                <Heading size="sm" color="gray.700">
                  <HStack>
                    <Shield size={16} />
                    <Text>Required Player Levels</Text>
                  </HStack>
                </Heading>

                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontSize="xs" color="gray.600" mb={3}>
                    Select required levels for this session. Leave empty to
                    allow all levels.
                  </Text>

                  <Wrap gap={2}>
                    {Object.values(Level).map((level) => {
                      const isSelected =
                        formData.requiredLevels?.includes(level);
                      return (
                        <WrapItem key={level}>
                          <Badge
                            px={3}
                            py={2}
                            borderRadius="md"
                            cursor="pointer"
                            bg={isSelected ? 'blue.500' : 'gray.200'}
                            color={isSelected ? 'white' : 'gray.700'}
                            fontSize="sm"
                            fontWeight="semibold"
                            onClick={() => handleLevelToggle(level)}
                            _hover={{
                              transform: 'translateY(-1px)',
                              boxShadow: 'sm',
                            }}
                            transition="all 0.2s"
                          >
                            {level.replace('_', ' ')}
                          </Badge>
                        </WrapItem>
                      );
                    })}
                  </Wrap>

                  {formData.requiredLevels?.length > 0 && (
                    <Text fontSize="xs" color="blue.600" mt={2}>
                      ✓ {formData.requiredLevels.length} level(s) selected
                    </Text>
                  )}
                  {formData.requiredLevels &&
                    formData.requiredLevels.length > 0 &&
                    formData.requiredLevels.length ===
                      Object.values(Level).length && (
                      <Text fontSize="xs" color="orange.600" mt={2}>
                        ⚠️ All levels selected. Consider leaving empty to allow
                        all levels.
                      </Text>
                    )}
                </Box>
              </VStack>

              {/* Confirmation Dialog */}
              {showConfirmDialog && (
                <Box
                  position="fixed"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  bg="blackAlpha.600"
                  zIndex={9999}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onClick={handleCancelUpdate}
                >
                  <Box
                    bg="white"
                    borderRadius="lg"
                    boxShadow="xl"
                    p={6}
                    maxW="md"
                    mx={4}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HStack gap={3} mb={4}>
                      <Box as={AlertCircle} boxSize={6} color="orange.500" />
                      <Heading size="md" color="orange.600">
                        Confirm Level Requirements Change
                      </Heading>
                    </HStack>
                    <Text mb={4} color="gray.600" lineHeight="1.6">
                      You are changing the required levels for an active
                      session. This may affect players who are already in the
                      session.
                    </Text>
                    <VStack align="start" gap={2} mb={6} pl={4}>
                      <Text fontSize="sm" color="gray.700">
                        <strong>Current levels:</strong>{' '}
                        {(session.requiredLevels || []).length > 0
                          ? (session.requiredLevels || []).join(', ')
                          : 'All levels allowed'}
                      </Text>
                      <Text fontSize="sm" color="gray.700">
                        <strong>New levels:</strong>{' '}
                        {pendingRequiredLevels.length > 0
                          ? pendingRequiredLevels.join(', ')
                          : 'All levels allowed'}
                      </Text>
                    </VStack>
                    <Text
                      fontSize="sm"
                      color="red.600"
                      mb={6}
                      fontStyle="italic"
                    >
                      ⚠️ Players with levels not in the new list may need to
                      update their profiles or may be restricted from future
                      actions.
                    </Text>
                    <Flex gap={3} justifyContent="flex-end">
                      <Button
                        variant="outline"
                        onClick={handleCancelUpdate}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        colorScheme="orange"
                        onClick={handleConfirmUpdate}
                        loading={isLoading}
                      >
                        Confirm Change
                      </Button>
                    </Flex>
                  </Box>
                </Box>
              )}

              <Button
                colorScheme="blue"
                size="lg"
                borderRadius="lg"
                loading={isLoading}
                onClick={() => handleUpdateSession()}
                mt={4}
                _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
              >
                Update Session
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default GeneralSettings;
