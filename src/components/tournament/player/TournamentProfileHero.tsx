'use client';

import type { ReactNode } from 'react';
import { Box, Flex, Heading, Image, Text } from '@chakra-ui/react';
import { HStack, VStack } from '@/components/ui/chakra-compat';
import { Tournament } from '@/lib/api/types';

export const getTournamentCoverImage = (tournament: Tournament) =>
  tournament.coverPhoto ||
  tournament.venue?.coverPhoto ||
  tournament.venue?.images?.[0] ||
  '';

interface TournamentProfileHeroProps {
  coverImage?: string;
  label: string;
  title: string;
  meta: ReactNode;
  visual: ReactNode;
}

export default function TournamentProfileHero({
  coverImage,
  label,
  title,
  meta,
  visual,
}: TournamentProfileHeroProps) {
  const hasCover = !!coverImage;

  return (
    <Box
      position="relative"
      w="full"
      aspectRatio={{ base: 21 / 9, md: 'auto' }}
      h={{ md: '300px' }}
      minH={{ base: '180px', md: '240px' }}
      maxH={{ base: '250px', md: '300px' }}
      overflow="hidden"
      color="white"
      bg="green.700"
    >
      {hasCover ? (
        <>
          <Image
            src={coverImage}
            alt={title}
            position="absolute"
            inset={0}
            w="full"
            h="full"
            objectFit="cover"
          />
          <Image
            src={coverImage}
            alt=""
            aria-hidden="true"
            position="absolute"
            inset="-18px"
            w="calc(100% + 36px)"
            h="calc(100% + 36px)"
            objectFit="cover"
            filter="blur(18px)"
            opacity={0.42}
          />
        </>
      ) : (
        <Box
          position="absolute"
          inset={0}
          bg="linear-gradient(135deg, #0f7a38 0%, #0b5d31 48%, #123c69 100%)"
        />
      )}

      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(90deg, rgba(3, 18, 12, 0.78) 0%, rgba(3, 18, 12, 0.52) 50%, rgba(3, 18, 12, 0.18) 100%)"
      />
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(0deg, rgba(3, 18, 12, 0.78) 0%, rgba(3, 18, 12, 0) 56%)"
      />

      <Flex
        position="relative"
        h="full"
        minH={{ base: '180px', md: '240px' }}
        align="flex-end"
        px={{ base: 5, md: 7 }}
        py={{ base: 6, md: 7 }}
      >
        <VStack align="stretch" gap={5} w="full">
          <HStack gap={4} align="center">
            {visual}
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="medium" color="whiteAlpha.800">
                {label}
              </Text>
              <Heading
                size={{ base: 'lg', md: '2xl' }}
                lineHeight="short"
                mt={1}
                textShadow="0 2px 18px rgba(0, 0, 0, 0.35)"
              >
                {title}
              </Heading>
            </Box>
          </HStack>

          <VStack align="stretch" gap={2} maxW="760px" color="whiteAlpha.900">
            {meta}
          </VStack>
        </VStack>
      </Flex>
    </Box>
  );
}
