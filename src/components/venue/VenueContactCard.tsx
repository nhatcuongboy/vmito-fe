'use client';

import { Box, Flex, Heading, Link, Text, VStack } from '@chakra-ui/react';
import { Globe, Phone } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  normalizePhoneForTel,
  normalizePhoneForZalo,
  trimPhone,
} from '@/utils/phone-utils';

/**
 * Groups a Vietnamese mobile number (10 digits, leading 0) into 4-3-3 for a
 * more legible display, e.g. "0364494979" -> "0364 494 979". Any other format
 * is returned trimmed but ungrouped.
 */
const formatPhoneDisplay = (phone?: string | null) => {
  const digits = trimPhone(phone);
  if (/^0\d{9}$/.test(digits)) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return digits;
};

interface VenueContactCardProps {
  phone?: string | null;
  website?: string | null;
  /** "inline" drops the card chrome so the block can sit inside another card. */
  variant?: 'card' | 'inline';
}

const VenueContactCard = ({
  phone,
  website,
  variant = 'card',
}: VenueContactCardProps) => {
  const t = useTranslations('venue');

  if (!phone && !website) return null;

  const isInline = variant === 'inline';

  return (
    <Box
      bg={isInline ? undefined : 'white'}
      _dark={isInline ? undefined : { bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius={isInline ? undefined : '2xl'}
      p={isInline ? 0 : 5}
      shadow={isInline ? undefined : 'sm'}
      borderWidth={isInline ? 0 : '1px'}
      borderColor={isInline ? undefined : 'gray.100'}
    >
      {!isInline && (
        <Heading size="sm" mb={4}>
          {t('detail.contact')}
        </Heading>
      )}
      <VStack gap={2.5} align="stretch">
        {phone && (
          <Flex
            align="stretch"
            w="full"
            minH="56px"
            borderRadius="xl"
            bg="white"
            _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
            borderWidth="1px"
            borderColor="gray.200"
            overflow="hidden"
          >
            <Link
              href={`tel:${normalizePhoneForTel(phone)}`}
              flex="1"
              minW={0}
              textDecoration="none"
              _focusVisible={{
                outline: '2px solid var(--chakra-colors-green-500)',
                outlineOffset: '-2px',
              }}
            >
              <Flex
                align="center"
                gap={3}
                px={3}
                py={2.5}
                h="full"
                _hover={{
                  bg: 'green.50',
                  _dark: { bg: 'green.900/20' },
                }}
                transition="background-color 0.2s"
                cursor="pointer"
              >
                <Flex
                  w="36px"
                  h="36px"
                  borderRadius="full"
                  bg="green.100"
                  _dark={{ bg: 'green.900/40' }}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Phone
                    size={17}
                    color="var(--chakra-colors-green-600)"
                    aria-hidden="true"
                  />
                </Flex>
                <Box flex="1" minW={0}>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                    lineHeight="short"
                  >
                    {t('detail.phone')}
                  </Text>
                  <Text
                    mt={0.5}
                    fontSize="md"
                    fontWeight="bold"
                    color="green.700"
                    _dark={{ color: 'green.200' }}
                    letterSpacing="wide"
                    fontVariantNumeric="tabular-nums"
                    lineClamp={1}
                  >
                    {formatPhoneDisplay(phone)}
                  </Text>
                </Box>
              </Flex>
            </Link>
            <Link
              href={`https://zalo.me/${normalizePhoneForZalo(phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Zalo"
              title="Zalo"
              display="grid"
              placeItems="center"
              flexShrink={0}
              w="52px"
              borderLeftWidth="1px"
              borderLeftColor="gray.200"
              _dark={{ borderLeftColor: 'gray.700' }}
              _hover={{ bg: 'blue.50', _dark: { bg: 'blue.900/20' } }}
              _focusVisible={{
                outline: '2px solid var(--chakra-colors-blue-500)',
                outlineOffset: '-2px',
              }}
              transition="background-color 0.2s"
              touchAction="manipulation"
            >
              <Image src="/icons/zalo.png" alt="" width={22} height={22} />
            </Link>
          </Flex>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer">
            <Flex
              align="center"
              gap={3}
              px={3}
              py={2}
              borderRadius="xl"
              bg="gray.50"
              _dark={{ bg: 'gray.700' }}
              _hover={{ bg: 'purple.50', _dark: { bg: 'purple.900/30' } }}
              transition="background-color 0.2s"
              cursor="pointer"
            >
              <Box
                p={1.5}
                borderRadius="lg"
                bg="purple.100"
                _dark={{ bg: 'purple.900/40' }}
              >
                <Globe size={15} color="#805AD5" aria-hidden="true" />
              </Box>
              <Text
                flex="1"
                minW={0}
                fontSize="sm"
                fontWeight="semibold"
                lineClamp={1}
              >
                {website}
              </Text>
            </Flex>
          </a>
        )}
      </VStack>
    </Box>
  );
};

export default VenueContactCard;
