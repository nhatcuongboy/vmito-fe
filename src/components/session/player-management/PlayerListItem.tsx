import {
  Badge,
  Box,
  Flex,
  Grid,
  Input,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  Card,
  CardBody,
  HStack,
  IconButton,
  VStack,
} from '@/components/ui/chakra-compat';
import { Level } from '@/lib/api/types';
import { getLevelLabel } from '@/utils/level-mapping';
import {
  AlertCircle,
  Edit,
  HelpCircle,
  Mars,
  QrCode,
  Save,
  Trash2,
  User,
  UserCheck,
  Venus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

// Helper functions for gender display
function getGenderIcon(gender?: string) {
  if (gender === 'MALE') return Mars;
  if (gender === 'FEMALE') return Venus;
  if (gender === 'OTHER') return User;
  if (gender === 'PREFER_NOT_TO_SAY') return HelpCircle;
  return User;
}

function getGenderColor(gender?: string): string {
  if (gender === 'MALE') return 'blue';
  if (gender === 'FEMALE') return 'pink';
  if (gender === 'OTHER') return 'purple';
  if (gender === 'PREFER_NOT_TO_SAY') return 'gray';
  return 'gray';
}

function getGenderLabel(gender?: string): string {
  if (gender === 'MALE') return 'M';
  if (gender === 'FEMALE') return 'F';
  if (gender === 'OTHER') return 'O';
  if (gender === 'PREFER_NOT_TO_SAY') return 'P';
  return '?';
}

import { Player } from './types';

interface PlayerListItemProps {
  player: Player;
  isEditing: Player | undefined;
  availableLevels: Level[];
  isSaving: boolean;
  onEdit: (player: Player) => void;
  onCancelEdit: (playerId: string) => void;
  onSave: (playerId: string) => void;
  onUpdateEditing: (playerId: string, field: string, value: string | boolean) => void;
  onDelete: (playerId: string) => void;
  onShowQR: (player: Player) => void;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  isEditing,
  availableLevels,
  isSaving,
  onEdit,
  onCancelEdit,
  onSave,
  onUpdateEditing,
  onDelete,
  onShowQR,
}) => {
  const t = useTranslations('pages.playerManagement');

  if (isEditing) {
    return (
      <Card
        width="100%"
        variant="outline"
        bg="blue.50"
        borderColor="blue.200"
        boxShadow="md"
        mb={4}
      >
        <CardBody p={{ base: 4, md: 5 }}>
          <VStack spacing={4} align="stretch">
            {/* Header with player number and action buttons */}
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  borderRadius="full"
                  px={3}
                >
                  #{player.playerNumber}
                </Badge>
                <Text
                  fontSize="sm"
                  color="blue.600"
                  fontWeight="medium"
                >
                  {t('editingPlayer')}
                </Text>
              </HStack>
              <HStack>
                <IconButton
                  aria-label="Save changes"
                  icon={<Box as={Save} boxSize={4} />}
                  size="sm"
                  colorScheme="green"
                  onClick={() => onSave(player.id)}
                  loading={isSaving}
                />
                <IconButton
                  aria-label="Cancel editing"
                  icon={<Text fontSize="sm">✕</Text>}
                  size="sm"
                  colorScheme="gray"
                  variant="ghost"
                  onClick={() => onCancelEdit(player.id)}
                />
              </HStack>
            </Flex>

            {/* Player name */}
            <Box>
              <Text
                fontSize="sm"
                mb={2}
                color="gray.600"
                fontWeight="medium"
              >
                {t('playerName')}
              </Text>
              <Input
                value={isEditing.name}
                onChange={(e) =>
                  onUpdateEditing(player.id, 'name', e.target.value)
                }
                size="md"
                placeholder={t('enterPlayerName')}
              />
            </Box>

            {/* Gender and Level */}
            <Grid
              templateColumns={{ base: '1fr', md: '1fr 1fr' }}
              gap={4}
            >
              <Box>
                <Text
                  fontSize="sm"
                  mb={2}
                  color="gray.600"
                  fontWeight="medium"
                >
                  {t('gender')}
                </Text>
                <select
                  value={isEditing.gender}
                  onChange={(e) =>
                    onUpdateEditing(player.id, 'gender', e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value="MALE">{t('male')}</option>
                  <option value="FEMALE">{t('female')}</option>
                  <option value="OTHER">{t('other')}</option>
                  <option value="PREFER_NOT_TO_SAY">
                    {t('preferNotToSay')}
                  </option>
                </select>
              </Box>
              <Box>
                <Text
                  fontSize="sm"
                  mb={2}
                  color="gray.600"
                  fontWeight="medium"
                >
                  {t('level')}
                </Text>
                <select
                  value={isEditing.level}
                  onChange={(e) =>
                    onUpdateEditing(player.id, 'level', e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value="">{t('selectLevel')}</option>
                  {availableLevels.map((level) => (
                    <option key={level} value={level}>
                      {getLevelLabel(level)}
                    </option>
                  ))}
                </select>
              </Box>
            </Grid>

            {/* Level description */}
            <Box>
              <Text
                fontSize="sm"
                mb={2}
                color="gray.600"
                fontWeight="medium"
              >
                {t('levelDescription')}
              </Text>
              <Textarea
                placeholder={t('levelDescriptionPlaceholder')}
                size="md"
                value={isEditing.levelDescription || ''}
                onChange={(e) =>
                  onUpdateEditing(
                    player.id,
                    'levelDescription',
                    e.target.value
                  )
                }
                rows={3}
              />
            </Box>

            {/* Confirmation checkboxes */}
            <Box>
              <Flex align="center" gap={3} mb={2}>
                <input
                  type="checkbox"
                  id={`requireConfirm-edit-${player.id}`}
                  checked={isEditing.requireConfirmInfo || false}
                  onChange={(e) =>
                    onUpdateEditing(
                      player.id,
                      'requireConfirmInfo',
                      e.target.checked
                    )
                  }
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#3182ce',
                  }}
                />
                <label
                  htmlFor={`requireConfirm-edit-${player.id}`}
                  style={{
                    fontSize: '14px',
                    color: '#4A5568',
                    lineHeight: '1.4',
                  }}
                >
                  {t('requirePlayerConfirmInfo')}
                </label>
              </Flex>
              <Flex align="center" gap={3}>
                <input
                  type="checkbox"
                  id={`confirmedByPlayer-edit-${player.id}`}
                  checked={isEditing.confirmedByPlayer || false}
                  onChange={(e) =>
                    onUpdateEditing(
                      player.id,
                      'confirmedByPlayer',
                      e.target.checked
                    )
                  }
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#38a169',
                  }}
                />
                <label
                  htmlFor={`confirmedByPlayer-edit-${player.id}`}
                  style={{
                    fontSize: '14px',
                    color: '#22543d',
                    lineHeight: '1.4',
                  }}
                >
                  {t('confirmedByPlayer')}
                </label>
              </Flex>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  // Display mode
  return (
    <Card
      width="100%"
      variant="outline"
      bg="white"
      boxShadow="md"
      mb={4}
    >
      <CardBody p={{ base: 4, md: 5 }}>
        <VStack spacing={3} align="stretch">
          {/* Main info row */}
          <Flex justify="space-between" align="center">
            <HStack spacing={4} flex="1" align="center">
              {/* Player info */}
              <HStack spacing={3} flex="1">
                <Badge
                  colorScheme="blue"
                  variant="outline"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="sm"
                  fontWeight="bold"
                >
                  #{player.playerNumber}
                </Badge>
                <Text
                  fontWeight="semibold"
                  fontSize="md"
                  color="gray.800"
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {player.name || `Player ${player.playerNumber}`}
                </Text>
              </HStack>

              {/* Status badges - desktop only */}
              <HStack
                spacing={2}
                display={{ base: 'none', md: 'flex' }}
              >
                {/* Gender badge */}
                <Badge
                  colorScheme={getGenderColor(player.gender)}
                  variant="subtle"
                  borderRadius="md"
                  px={2}
                  py={1}
                >
                  <HStack spacing={1}>
                    <Box
                      as={getGenderIcon(player.gender)}
                      boxSize="12px"
                    />
                    <Text fontSize="xs">
                      {getGenderLabel(player.gender)}
                    </Text>
                  </HStack>
                </Badge>

                {/* Level badge */}
                <Badge
                  colorScheme="purple"
                  variant="solid"
                  borderRadius="md"
                  px={2}
                  py={1}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  {getLevelLabel(player.level)}
                </Badge>

                {/* Status badge */}
                <Badge
                  colorScheme={
                    player.status === 'PLAYING'
                      ? 'green'
                      : player.status === 'WAITING'
                        ? 'orange'
                        : player.status === 'READY'
                          ? 'blue'
                          : 'gray'
                  }
                  variant="solid"
                  borderRadius="md"
                  px={2}
                  py={1}
                  fontSize="xs"
                  fontWeight="medium"
                >
                  {player.status}
                </Badge>
              </HStack>
            </HStack>

            {/* Action buttons */}
            <HStack spacing={1}>
              <IconButton
                aria-label="Show QR code"
                icon={<Box as={QrCode} boxSize={4} />}
                size="sm"
                colorScheme="green"
                variant="ghost"
                onClick={() => onShowQR(player)}
              />
              <IconButton
                aria-label="Edit player"
                icon={<Box as={Edit} boxSize={4} />}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={() => onEdit(player)}
              />
              <IconButton
                aria-label="Delete player"
                icon={<Box as={Trash2} boxSize={4} />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => onDelete(player.id)}
              />
            </HStack>
          </Flex>

          {/* Mobile badges row */}
          <HStack
            spacing={2}
            display={{ base: 'flex', md: 'none' }}
            flexWrap="wrap"
          >
            <Badge
              colorScheme={getGenderColor(player.gender)}
              variant="subtle"
              borderRadius="md"
              px={2}
              py={1}
            >
              <HStack spacing={1}>
                <Box
                  as={getGenderIcon(player.gender)}
                  boxSize="12px"
                />
                <Text fontSize="xs">
                  {player.gender || 'Unknown'}
                </Text>
              </HStack>
            </Badge>

            <Badge
              colorScheme="purple"
              variant="solid"
              borderRadius="md"
              px={2}
              py={1}
              fontSize="xs"
            >
              {getLevelLabel(player.level)}
            </Badge>

            <Badge
              colorScheme={
                player.status === 'PLAYING'
                  ? 'green'
                  : player.status === 'WAITING'
                    ? 'orange'
                    : player.status === 'READY'
                      ? 'blue'
                      : 'gray'
              }
              variant="solid"
              borderRadius="md"
              px={2}
              py={1}
              fontSize="xs"
            >
              {player.status}
            </Badge>
          </HStack>

          {/* Additional info section */}
          {(player.levelDescription ||
            player.requireConfirmInfo ||
            player.confirmedByPlayer) && (
            <Card
              variant="outline"
              bg="gray.50"
              borderColor="gray.200"
            >
              <CardBody p={3}>
                <VStack align="stretch" spacing={3}>
                  {player.levelDescription && (
                    <Box>
                      <Text
                        fontSize="sm"
                        color="gray.700"
                        lineHeight="1.5"
                        fontStyle="italic"
                      >
                        "{player.levelDescription}"
                      </Text>
                    </Box>
                  )}
                  {player.requireConfirmInfo && (
                    <HStack spacing={2} align="center">
                      <Box
                        as={AlertCircle}
                        boxSize={3}
                        color="orange.500"
                      />
                      <Text
                        fontSize="xs"
                        color="orange.600"
                        fontWeight="medium"
                      >
                        {t('awaitingPlayerConfirmation')}
                      </Text>
                    </HStack>
                  )}
                  {player.confirmedByPlayer && (
                    <HStack spacing={2} align="center">
                      <Box
                        as={UserCheck}
                        boxSize={3}
                        color="green.500"
                      />
                      <Text
                        fontSize="xs"
                        color="green.600"
                        fontWeight="medium"
                      >
                        {t('confirmedByPlayer')}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PlayerListItem;
