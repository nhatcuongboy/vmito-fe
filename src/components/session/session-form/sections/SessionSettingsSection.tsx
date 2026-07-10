import { Box, Flex, Heading, HStack, Stack, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type { useTranslations } from 'next-intl';
import { User, UserPlus, Users } from 'lucide-react';

import { CustomCheckbox } from '@/components/session/session-form/CustomCheckbox';
import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';

type Translator = ReturnType<typeof useTranslations>;

export function SessionSettingsSection({
  t,
  control,
}: {
  t: Translator;
  control: Control<SessionFormData>;
}) {
  return (
    <Box bg="bg" p={6} borderRadius="lg" boxShadow="sm">
      <Heading size="md" mb={4}>
        {t('generalSettings.sessionSettings')}
      </Heading>

      <Stack gap={4}>
        {/* Require Player Info */}
        <Controller
          control={control}
          name="requirePlayerInfo"
          render={({ field }) => (
            <Box p={4} bg="bg.muted" borderRadius="md">
              <Flex align="center" justify="space-between">
                <Box>
                  <HStack mb={1}>
                    <User size={18} />
                    <Text fontWeight="medium">
                      {t('generalSettings.requirePlayerInfo')}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted">
                    {t('generalSettings.requirePlayerInfoDesc')}
                  </Text>
                </Box>
                <CustomCheckbox
                  isChecked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </Flex>
            </Box>
          )}
        />

        {/* Allow Guest Join */}
        <Controller
          control={control}
          name="allowGuestJoin"
          render={({ field }) => (
            <Box p={4} bg="bg.muted" borderRadius="md">
              <Flex align="center" justify="space-between">
                <Box>
                  <HStack mb={1}>
                    <Users size={18} />
                    <Text fontWeight="medium">
                      {t('generalSettings.allowGuestJoin')}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted">
                    {t('generalSettings.allowGuestJoinDesc')}
                  </Text>
                </Box>
                <CustomCheckbox
                  isChecked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </Flex>
            </Box>
          )}
        />

        {/* Allow New Players */}
        <Controller
          control={control}
          name="allowNewPlayers"
          render={({ field }) => (
            <Box p={4} bg="bg.muted" borderRadius="md">
              <Flex align="center" justify="space-between">
                <Box>
                  <HStack mb={1}>
                    <UserPlus size={18} />
                    <Text fontWeight="medium">
                      {t('generalSettings.allowNewPlayers')}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted">
                    {t('generalSettings.allowNewPlayersDesc')}
                  </Text>
                </Box>
                <CustomCheckbox
                  isChecked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              </Flex>
            </Box>
          )}
        />
      </Stack>
    </Box>
  );
}
