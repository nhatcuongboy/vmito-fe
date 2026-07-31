'use client';

import { Avatar, Badge, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { Trash2, UserCheck } from 'lucide-react';
import { IconButton, VSelect } from '@/components/ui/chakra-compat';
import { VTooltip } from '@/components/ui/VTooltip';
import { EMemberRole, IClubMember } from '@/types/club';

interface IClubMemberRowProps {
  member: IClubMember;
  roleLabels: Record<EMemberRole, string>;
  attendanceLabel: string;
  roleSelectLabel: string;
  removeLabel: string;
  isUpdatingRole: boolean;
  isRemoving: boolean;
  onUpdateRole: (userId: string, role: EMemberRole) => void;
  onRemove: (member: IClubMember) => void;
}

const ROLE_PALETTES: Record<EMemberRole, string> = {
  [EMemberRole.ADMIN]: 'orange',
  [EMemberRole.MODERATOR]: 'blue',
  [EMemberRole.MEMBER]: 'gray',
};

export default function ClubMemberRow({
  member,
  roleLabels,
  attendanceLabel,
  roleSelectLabel,
  removeLabel,
  isUpdatingRole,
  isRemoving,
  onUpdateRole,
  onRemove,
}: IClubMemberRowProps) {
  return (
    <Flex
      p={{ base: 4, md: 3 }}
      bg="bg"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.muted"
      align={{ base: 'stretch', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
      gap={{ base: 4, md: 3 }}
      shadow="xs"
    >
      <HStack gap={3} flex={1} minW={0} align="flex-start">
        <Avatar.Root size="md" flexShrink={0}>
          <Avatar.Fallback>
            {member.user.name?.slice(0, 2).toUpperCase()}
          </Avatar.Fallback>
          <Avatar.Image src={member.user.image} />
        </Avatar.Root>
        <Box minW={0} flex={1}>
          <HStack gap={2} align="center" flexWrap="wrap">
            <Text fontWeight="bold" lineClamp={1} minW={0}>
              {member.user.name}
            </Text>
            <Badge
              size="xs"
              colorPalette={ROLE_PALETTES[member.role]}
              variant="subtle"
            >
              {roleLabels[member.role]}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="fg.muted" wordBreak="break-word">
            {member.user.email}
          </Text>
          <HStack mt={1.5} gap={3} flexWrap="wrap">
            <HStack gap={1} color="green.600" _dark={{ color: 'green.300' }}>
              <UserCheck size={14} aria-hidden="true" />
              <Text fontSize="xs">
                {attendanceLabel}: {member.attendanceCount}
              </Text>
            </HStack>
            {member.user.level != null && (
              <Text fontSize="xs" color="fg.muted">
                Lv.{member.user.level}
              </Text>
            )}
          </HStack>
        </Box>
      </HStack>

      <HStack gap={2} w={{ base: 'full', md: 'auto' }}>
        <Box flex={{ base: 1, md: 'initial' }} w={{ md: '150px' }}>
          <VSelect
            size="sm"
            value={member.role}
            aria-label={`${roleSelectLabel}: ${member.user.name}`}
            disabled={isUpdatingRole || isRemoving}
            onChange={(event) =>
              onUpdateRole(member.userId, event.target.value as EMemberRole)
            }
          >
            {Object.values(EMemberRole).map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </VSelect>
        </Box>
        <VTooltip content={removeLabel} showArrow>
          <IconButton
            icon={<Trash2 size={18} aria-hidden="true" />}
            aria-label={`${removeLabel}: ${member.user.name}`}
            colorPalette="red"
            variant="ghost"
            minW="44px"
            minH="44px"
            loading={isRemoving}
            disabled={isUpdatingRole}
            onClick={() => onRemove(member)}
          />
        </VTooltip>
      </HStack>
    </Flex>
  );
}
