'use client';

import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  Heading,
  Textarea,
  Grid,
  Badge,
  HStack,
} from '@chakra-ui/react';
import {
  Settings,
  MapPin,
  Users,
  FileText,
  Clock,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/chakra-compat';
import { useState } from 'react';
import { SessionService } from '@/lib/api/session.service';
import toast from 'react-hot-toast';

interface GeneralSettingsProps {
  session: any;
  onDataRefresh: () => void;
}

const GeneralSettings = ({ session, onDataRefresh }: GeneralSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session.name || '',
    description: session.description || '',
    location: session.location || '',
    maxPlayersPerCourt: session.maxPlayersPerCourt || 4,
    requirePlayerInfo: session.requirePlayerInfo || false,
    allowGuestJoin: session.allowGuestJoin || false,
    allowNewPlayers: session.allowNewPlayers || false,
    startTime: session.startTime
      ? new Date(session.startTime).toISOString().slice(0, 16)
      : '',
    endTime: session.endTime
      ? new Date(session.endTime).toISOString().slice(0, 16)
      : '',
  });

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateSession = async () => {
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
      onDataRefresh();
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session');
    } finally {
      setIsLoading(false);
    }
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

              <Button
                colorScheme="blue"
                size="lg"
                borderRadius="lg"
                loading={isLoading}
                onClick={handleUpdateSession}
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
