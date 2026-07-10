import { Box, Field, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { Controller } from 'react-hook-form';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { useTranslations } from 'next-intl';

import { CustomCheckbox } from '@/components/session/session-form/CustomCheckbox';
import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';

type Translator = ReturnType<typeof useTranslations>;

export function HostInfoSection({
  t,
  register,
  errors,
  control,
}: {
  t: Translator;
  register: UseFormRegister<SessionFormData>;
  errors: FieldErrors<SessionFormData>;
  control: Control<SessionFormData>;
}) {
  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
    >
      <Heading size="md" mb={4}>
        {t('hostInfo')}
      </Heading>
      <Flex gap={4}>
        <Box flex={1}>
          <Field.Root id="field-hostName" invalid={!!errors.hostName}>
            <Field.Label>
              {t('hostName')}{' '}
              <Text as="span" color="red.500">
                *
              </Text>
            </Field.Label>
            <Input
              {...register('hostName')}
              placeholder={t('hostNamePlaceholder')}
            />
            <Field.ErrorText color="fg.error">
              {errors.hostName?.message}
            </Field.ErrorText>
          </Field.Root>
        </Box>
        <Box flex={1}>
          <Field.Root id="field-hostPhone" invalid={!!errors.hostPhone}>
            <Field.Label>{t('hostPhone')}</Field.Label>
            <Input
              {...register('hostPhone')}
              placeholder={t('hostPhonePlaceholder')}
              type="tel"
            />
            <Field.ErrorText color="fg.error">
              {errors.hostPhone?.message}
            </Field.ErrorText>
          </Field.Root>
          {/* Allow Zalo Contact */}
          <Controller
            control={control}
            name="allowZaloContact"
            render={({ field }) => (
              <Box
                mt={2}
                cursor="pointer"
                onClick={() => field.onChange(!field.value)}
                userSelect="none"
                position="relative"
                zIndex={1}
              >
                <HStack gap={2}>
                  <CustomCheckbox
                    size="sm"
                    isChecked={field.value}
                    onChange={(e) => {
                      e.stopPropagation();
                      field.onChange(e.target.checked);
                    }}
                  />
                  <Text fontSize="sm" fontWeight="medium" userSelect="none">
                    {t('allowZaloContact')}
                  </Text>
                </HStack>
              </Box>
            )}
          />
        </Box>
      </Flex>
    </Box>
  );
}
