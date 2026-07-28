'use client';

import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { Box, Flex, Grid, Text } from '@chakra-ui/react';
import { Button } from './chakra-compat';
import { VModal } from './VModal';
import { MapPin } from 'lucide-react';

export default function CityOnboardingModal() {
  const preferredCity = usePreferenceStore((s) => s.preferredCity);
  const hasHydrated = usePreferenceStore((s) => s._hasHydrated);
  const onboardingCompleted = usePreferenceStore((s) => s.onboardingCompleted);
  const setPreferredCity = usePreferenceStore((s) => s.setPreferredCity);
  const setOnboardingCompleted = usePreferenceStore(
    (s) => s.setOnboardingCompleted
  );

  // Only show for genuinely new users: the store has rehydrated, onboarding
  // was never completed, and no city has been chosen yet. Gating on
  // `onboardingCompleted` (not just `preferredCity === null`) is what lets the
  // CitySelector offer an "All" option — picking "All" sets preferredCity to
  // null intentionally, and this flag keeps the modal from re-appearing.
  const isOpen = hasHydrated && !onboardingCompleted && preferredCity === null;

  const handleSelect = (code: string) => {
    setPreferredCity(code);
    setOnboardingCompleted(true);
  };

  const handleSkip = () => {
    setPreferredCity('HCM');
    setOnboardingCompleted(true);
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleSkip}
      title="Bạn đang ở đâu?"
      titleAlign="center"
      size="sm"
      closeOnOverlayClick={false}
      showCloseButton={false}
      footer={
        <Button
          variant="ghost"
          size="sm"
          color="fg.muted"
          onClick={handleSkip}
          w="full"
        >
          Bỏ qua, dùng TP. Hồ Chí Minh
        </Button>
      }
    >
      <Box pb={2}>
        <Text fontSize="sm" color="fg.muted" textAlign="center" mb={4}>
          Chọn thành phố để xem các kèo và sân gần bạn nhất.
        </Text>
        <Grid templateColumns="1fr 1fr" gap={2}>
          {VIETNAM_CITIES.map((city) => (
            <Flex
              key={city.code}
              align="center"
              gap={2}
              px={3}
              py={3}
              borderRadius="lg"
              border="1.5px solid"
              borderColor="border"
              cursor="pointer"
              _hover={{
                borderColor: 'green.400',
                bg: 'green.50',
                _dark: { bg: 'green.950', borderColor: 'green.500' },
              }}
              onClick={() => handleSelect(city.code)}
              transition="all 0.15s"
            >
              <Box flexShrink={0}>
                <MapPin size={14} color="var(--chakra-colors-green-500)" />
              </Box>
              <Text fontSize="sm" fontWeight="500" lineHeight="tight">
                {city.name}
              </Text>
            </Flex>
          ))}
        </Grid>
      </Box>
    </VModal>
  );
}
