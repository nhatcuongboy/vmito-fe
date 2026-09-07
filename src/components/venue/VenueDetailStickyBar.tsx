'use client';

import { Box, Flex, Icon, Portal, Text } from '@chakra-ui/react';
import { Banknote, CalendarPlus, Phone, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import BookingBetaBadge from '@/components/venue-rental/BookingBetaBadge';
import { normalizePhoneForTel } from '@/utils/phone-utils';

interface VenueDetailStickyBarProps {
  phone?: string | null;
  /** Cheapest published rate per hour; omitted when the venue has no price book. */
  minPricePerHour?: number;
  rentalEnabled?: boolean;
  onRentCourt: () => void;
  onFindSessions: () => void;
}

const VenueDetailStickyBar = ({
  phone,
  minPricePerHour,
  rentalEnabled,
  onRentCourt,
  onFindSessions,
}: VenueDetailStickyBarProps) => {
  const t = useTranslations('venue');

  return (
    <Portal>
      <Box
        position="fixed"
        display={{ base: 'block', lg: 'none' }}
        left={0}
        right={0}
        bottom={0}
        zIndex={100}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderTopWidth="1px"
        borderTopColor={{ base: 'gray.200', _dark: 'gray.700' }}
        boxShadow="0 -2px 10px rgba(0, 0, 0, 0.08)"
        px={5}
        py={3}
        paddingBottom="calc(12px + env(safe-area-inset-bottom))"
      >
        <Flex align="center" gap={3} maxW="800px" mx="auto">
          {minPricePerHour ? (
            <Box flexShrink={0}>
              <Flex align="center" gap={1}>
                <Icon as={Banknote} boxSize={5} color="red.600" />
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="red.600"
                  whiteSpace="nowrap"
                >
                  {t('detail.priceFrom', {
                    price: new Intl.NumberFormat('vi-VN').format(
                      minPricePerHour
                    ),
                  })}
                </Text>
                <Text
                  fontSize="sm"
                  color="gray.500"
                  fontWeight="normal"
                  whiteSpace="nowrap"
                >
                  {t('detail.perHour')}
                </Text>
              </Flex>
            </Box>
          ) : null}

          <Flex align="center" gap={2} ml="auto" flexShrink={0}>
            {phone && (
              <IconButton
                aria-label={t('detail.callNow')}
                title={t('detail.callNow')}
                variant="outline"
                colorPalette="green"
                size="md"
                borderRadius="lg"
                onClick={() => {
                  window.location.href = `tel:${normalizePhoneForTel(phone)}`;
                }}
                icon={<Icon as={Phone} boxSize={4} aria-hidden="true" />}
              />
            )}
            <Button
              colorPalette="green"
              size="md"
              borderRadius="lg"
              onClick={rentalEnabled ? onRentCourt : onFindSessions}
            >
              {rentalEnabled ? (
                <CalendarPlus size={16} />
              ) : (
                <Search size={16} />
              )}
              {rentalEnabled ? t('detail.rentCourt') : t('findSessions')}
              {rentalEnabled ? <BookingBetaBadge /> : null}
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Portal>
  );
};

export default VenueDetailStickyBar;
