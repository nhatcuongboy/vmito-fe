import { Box, Field, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { VSwitch } from '@/components/ui/VSwitch';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { useTranslations } from 'next-intl';

import { formatDateOnly } from '@/components/session/session-form/sessionFormUtils';
import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';

type Translator = ReturnType<typeof useTranslations>;

export function TimeSection({
  t,
  isMultiDay,
  setIsMultiDay,
  canEditTime,
  isEditMode,
  sessionDate,
  handleDateChange,
  startHour,
  handleStartHourChange,
  endHour,
  handleEndHourChange,
  register,
  errors,
  startTime,
  endTime,
  sessionDuration,
}: {
  t: Translator;
  isMultiDay: boolean;
  setIsMultiDay: (value: boolean) => void;
  canEditTime: boolean;
  isEditMode: boolean;
  sessionDate: string;
  handleDateChange: (date: string) => void;
  startHour: string;
  handleStartHourChange: (time: string) => void;
  endHour: string;
  handleEndHourChange: (time: string) => void;
  register: UseFormRegister<SessionFormData>;
  errors: FieldErrors<SessionFormData>;
  startTime: string;
  endTime: string;
  sessionDuration: number;
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
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="md">{t('time')}</Heading>
        <Flex align="center" gap={2}>
          <Text fontSize="sm" color="fg.muted">
            {t('multiDay')}
          </Text>
          <VSwitch
            checked={isMultiDay}
            onCheckedChange={(e) => setIsMultiDay(e.checked)}
            disabled={!canEditTime}
            size="sm"
            colorPalette="green"
          />
        </Flex>
      </Flex>

      {!isMultiDay ? (
        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          {/* Date picker */}
          <Box flex={1}>
            <Field.Root disabled={!canEditTime}>
              <Field.Label>
                {t('date')}{' '}
                <Text as="span" color="red.500">
                  *
                </Text>
              </Field.Label>
              <VDateTimeInput
                type="date"
                value={sessionDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={!canEditTime}
                min={!isEditMode ? formatDateOnly(new Date()) : undefined}
                color="fg"
                bg="bg"
                _dark={{ color: 'white', bg: 'gray.700' }}
                placeholder={t('date')}
              />
            </Field.Root>
          </Box>

          {/* Start / end time pickers */}
          <Stack direction="row" gap={4} flex={2}>
            <Box id="field-startTime" flex={1}>
              <Field.Root invalid={!!errors.startTime} disabled={!canEditTime}>
                <Field.Label>
                  {t('start')}{' '}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Field.Label>
                <VDateTimeInput
                  type="time"
                  value={startHour}
                  onChange={(e) => handleStartHourChange(e.target.value)}
                  disabled={!canEditTime}
                  color="fg"
                  bg="bg"
                  _dark={{ color: 'white', bg: 'gray.700' }}
                  placeholder={t('start')}
                />
                <Field.ErrorText color="fg.error">
                  {errors.startTime?.message}
                </Field.ErrorText>
              </Field.Root>
            </Box>
            <Box id="field-endTime" flex={1}>
              <Field.Root invalid={!!errors.endTime} disabled={!canEditTime}>
                <Field.Label>
                  {t('end')}{' '}
                  <Text as="span" color="red.500">
                    *
                  </Text>
                </Field.Label>
                <VDateTimeInput
                  type="time"
                  value={endHour}
                  onChange={(e) => handleEndHourChange(e.target.value)}
                  disabled={!canEditTime}
                  color="fg"
                  bg="bg"
                  _dark={{ color: 'white', bg: 'gray.700' }}
                  placeholder={t('end')}
                />
                <Field.ErrorText color="fg.error">
                  {errors.endTime?.message}
                </Field.ErrorText>
              </Field.Root>
            </Box>
          </Stack>
        </Stack>
      ) : (
        /* Multi-day: original datetime-local pickers */
        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <Box id="field-startTime" flex={1}>
            <Field.Root invalid={!!errors.startTime} disabled={!canEditTime}>
              <Field.Label>
                {t('start')}{' '}
                <Text as="span" color="red.500">
                  *
                </Text>
              </Field.Label>
              <VDateTimeInput
                type="datetime-local"
                {...register('startTime')}
                disabled={!canEditTime}
                color="fg"
                bg="bg"
                _dark={{ color: 'white', bg: 'gray.700' }}
                onInvalid={(e) => e.preventDefault()}
                placeholder={t('start')}
              />
              <Field.ErrorText color="fg.error">
                {errors.startTime?.message}
              </Field.ErrorText>
            </Field.Root>
          </Box>
          <Box id="field-endTime" flex={1}>
            <Field.Root invalid={!!errors.endTime} disabled={!canEditTime}>
              <Field.Label>
                {t('end')}{' '}
                <Text as="span" color="red.500">
                  *
                </Text>
              </Field.Label>
              <VDateTimeInput
                type="datetime-local"
                {...register('endTime')}
                disabled={!canEditTime}
                color="fg"
                bg="bg"
                _dark={{ color: 'white', bg: 'gray.700' }}
                onInvalid={(e) => e.preventDefault()}
                placeholder={t('end')}
              />
              <Field.ErrorText color="fg.error">
                {errors.endTime?.message}
              </Field.ErrorText>
            </Field.Root>
          </Box>
        </Stack>
      )}

      {startTime && endTime && (
        <Text fontSize="sm" color="fg.muted" mt={2}>
          {t('duration')}: {Math.floor(sessionDuration / 60)}h{' '}
          {sessionDuration % 60}m
        </Text>
      )}
    </Box>
  );
}
