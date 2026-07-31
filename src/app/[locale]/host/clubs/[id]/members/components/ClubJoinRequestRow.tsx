'use client';

import { Avatar, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/chakra-compat';
import { Link } from '@/i18n/config';
import { IClubJoinRequest } from '@/types/club';

interface IClubJoinRequestRowProps {
  request: IClubJoinRequest;
  submittedText: string;
  detailHref: string;
  viewDetailsLabel: string;
  approveLabel: string;
  rejectLabel: string;
  loadingAction: 'APPROVED' | 'REJECTED' | null;
  onApprove: (request: IClubJoinRequest) => void;
  onReject: (request: IClubJoinRequest) => void;
}

export default function ClubJoinRequestRow({
  request,
  submittedText,
  detailHref,
  viewDetailsLabel,
  approveLabel,
  rejectLabel,
  loadingAction,
  onApprove,
  onReject,
}: IClubJoinRequestRowProps) {
  return (
    <Flex
      p={{ base: 4, md: 3 }}
      bg="bg"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.muted"
      direction={{ base: 'column', md: 'row' }}
      align={{ base: 'stretch', md: 'center' }}
      gap={{ base: 4, md: 3 }}
      shadow="xs"
    >
      <HStack gap={3} flex={1} minW={0} align="flex-start">
        <Avatar.Root size="md" flexShrink={0}>
          <Avatar.Fallback>
            {request.user.name?.slice(0, 2).toUpperCase()}
          </Avatar.Fallback>
          <Avatar.Image src={request.user.image} />
        </Avatar.Root>
        <Box minW={0} flex={1}>
          <Text fontWeight="bold" lineClamp={1}>
            {request.user.name}
          </Text>
          <Text fontSize="sm" color="fg.muted" wordBreak="break-word">
            {request.user.email}
          </Text>
          {request.message && (
            <Text
              mt={2}
              fontSize="sm"
              color="fg.muted"
              lineClamp={2}
              whiteSpace="pre-wrap"
              wordBreak="break-word"
            >
              {request.message}
            </Text>
          )}
          <HStack mt={2} gap={3} flexWrap="wrap">
            <Text fontSize="xs" color="fg.subtle">
              {submittedText}
            </Text>
            <Link href={detailHref}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="green.600"
                _dark={{ color: 'green.300' }}
                _hover={{ textDecoration: 'underline' }}
              >
                {viewDetailsLabel}
              </Text>
            </Link>
          </HStack>
        </Box>
      </HStack>

      <Flex gap={2} w={{ base: 'full', md: 'auto' }} flexShrink={0}>
        <Button
          size="sm"
          minH="44px"
          flex={{ base: 1, md: 'initial' }}
          minW={{ md: '104px' }}
          px={4}
          colorPalette="green"
          loading={loadingAction === 'APPROVED'}
          disabled={loadingAction !== null}
          onClick={() => onApprove(request)}
        >
          <UserCheck size={16} aria-hidden="true" />
          {approveLabel}
        </Button>
        <Button
          size="sm"
          minH="44px"
          flex={{ base: 1, md: 'initial' }}
          minW={{ md: '104px' }}
          px={4}
          variant="outline"
          colorPalette="red"
          loading={loadingAction === 'REJECTED'}
          disabled={loadingAction !== null}
          onClick={() => onReject(request)}
        >
          <UserX size={16} aria-hidden="true" />
          {rejectLabel}
        </Button>
      </Flex>
    </Flex>
  );
}
