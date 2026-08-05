'use client';

import { Button } from '@/components/ui/chakra-compat';
import { Link as LocaleLink } from '@/i18n/config';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { IClubJoinRequest } from '@/types/club';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Image,
  Link,
  Separator,
  Text,
} from '@chakra-ui/react';
import { ChevronRight, RotateCcw } from 'lucide-react';

interface IAppPendingClubRequestCardProps {
  request: IClubJoinRequest;
  submittedText: string;
  statusLabel: string;
  hostedByLabel: string;
  viewClubLabel: string;
  withdrawLabel: string;
  isWithdrawing: boolean;
  onWithdraw: (request: IClubJoinRequest) => void;
}

const AppPendingClubRequestCard = ({
  request,
  submittedText,
  statusLabel,
  hostedByLabel,
  viewClubLabel,
  withdrawLabel,
  isWithdrawing,
  onWithdraw,
}: IAppPendingClubRequestCardProps) => {
  const club = request.club;
  const thumbnailUrl = normalizeImageUrl(club?.image, {
    cloudinaryWidth: 128,
    cloudinaryHeight: 128,
  });
  const clubName = club?.name ?? '';
  const clubHref = `/clubs/${club?.slug ?? club?.id ?? request.clubId}`;

  return (
    <Box
      bg="bg"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius={{ base: 'xl', md: '2xl' }}
      borderWidth="1px"
      borderColor="border"
      overflow="hidden"
      shadow="xs"
    >
      <Box p={{ base: 4, md: 5 }}>
        <Flex align="flex-start" gap={{ base: 3, md: 4 }}>
          <Flex
            boxSize={{ base: '52px', md: '58px' }}
            borderRadius="xl"
            overflow="hidden"
            align="center"
            justify="center"
            flexShrink={0}
            bg="orange.500"
            color="white"
          >
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt=""
                w="full"
                h="full"
                objectFit="cover"
              />
            ) : (
              <Text fontSize="xl" fontWeight="bold">
                {clubName.trim().charAt(0).toUpperCase()}
              </Text>
            )}
          </Flex>

          <Box flex={1} minW={0}>
            <HStack justify="space-between" align="flex-start" gap={2}>
              <Box minW={0}>
                <Text
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="semibold"
                  lineClamp={1}
                >
                  {clubName}
                </Text>
                <Text mt={1} fontSize="xs" color="fg.muted" lineClamp={1}>
                  {hostedByLabel} {club?.host.name}
                </Text>
              </Box>
              <Badge colorPalette="yellow" variant="subtle" flexShrink={0}>
                {statusLabel}
              </Badge>
            </HStack>

            {request.message && (
              <Text
                mt={3}
                fontSize="sm"
                color="fg.muted"
                lineClamp={2}
                whiteSpace="pre-wrap"
                wordBreak="break-word"
              >
                “{request.message}”
              </Text>
            )}

            <Text mt={request.message ? 2 : 3} fontSize="xs" color="fg.subtle">
              {submittedText}
            </Text>
          </Box>
        </Flex>
      </Box>

      <Separator />

      <Flex
        px={{ base: 4, md: 5 }}
        py={3}
        gap={2}
        align="center"
        justify="space-between"
        bg="bg.muted"
        _dark={{ bg: 'whiteAlpha.50' }}
      >
        <Link
          asChild
          color="green.600"
          _dark={{ color: 'green.400' }}
          _hover={{ textDecoration: 'none', color: 'green.700' }}
          _focusVisible={{ outline: '2px solid', outlineColor: 'green.500' }}
        >
          <LocaleLink href={clubHref}>
            <HStack gap={1} minH="44px">
              <Text fontSize="sm" fontWeight="semibold">
                {viewClubLabel}
              </Text>
              <ChevronRight size={16} aria-hidden="true" />
            </HStack>
          </LocaleLink>
        </Link>

        <Button
          size="sm"
          minH="44px"
          px={3}
          variant="ghost"
          colorPalette="red"
          loading={isWithdrawing}
          disabled={isWithdrawing}
          onClick={() => onWithdraw(request)}
        >
          <RotateCcw size={16} aria-hidden="true" />
          {withdrawLabel}
        </Button>
      </Flex>
    </Box>
  );
};

export default AppPendingClubRequestCard;
