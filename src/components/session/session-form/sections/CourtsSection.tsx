import { Box, Field, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/chakra-compat';
import { Plus, Trash2 } from 'lucide-react';
import { Controller } from 'react-hook-form';
import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
} from 'react-hook-form';
import type { useTranslations } from 'next-intl';

import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';

type Translator = ReturnType<typeof useTranslations>;

export function CourtsSection({
  t,
  canEditCourts,
  fields,
  control,
  register,
  errors,
  handleRemoveCourt,
  handleAddCourt,
}: {
  t: Translator;
  canEditCourts: boolean;
  fields: FieldArrayWithId<SessionFormData, 'courts', 'id'>[];
  control: Control<SessionFormData>;
  register: UseFormRegister<SessionFormData>;
  errors: FieldErrors<SessionFormData>;
  handleRemoveCourt: (index: number) => void;
  handleAddCourt: () => void;
}) {
  return (
    <Box
      id="field-courts"
      bg={{ base: 'white', _dark: 'gray.800' }}
      p={6}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
    >
      <Flex align="center" justify="space-between" mb={4}>
        <Heading size="md">{t('courtsConfiguration')}</Heading>
      </Flex>

      <Stack gap={6}>
        {fields.map((field, index) => (
          <Box key={field.id}>
            {index > 0 && (
              <Box
                borderTop="1px"
                borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
                mb={6}
              />
            )}
            <Box opacity={!canEditCourts ? 0.7 : 1}>
              <Flex gap={3} direction="row" align="flex-start">
                {/* Court Number */}
                <Box flex={{ base: '0 0 100px', md: '0 0 140px' }}>
                  <Field.Root
                    invalid={!!errors.courts?.[index]?.courtNumber}
                    disabled={!canEditCourts}
                  >
                    <Field.Label fontSize="sm">
                      {t('courtNumber')}{' '}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Field.Label>
                    <Controller
                      control={control}
                      name={`courts.${index}.courtNumber`}
                      render={({ field }) => (
                        <Input
                          id={`court-number-input-${index}`}
                          type="number"
                          value={field.value === 0 ? '' : field.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                          disabled={!canEditCourts}
                        />
                      )}
                    />
                    <Field.ErrorText color="fg.error">
                      {errors.courts?.[index]?.courtNumber?.message}
                    </Field.ErrorText>
                  </Field.Root>
                </Box>

                {/* Court Name */}
                <Box flex="1">
                  <Field.Root
                    invalid={!!errors.courts?.[index]?.courtName}
                    disabled={!canEditCourts}
                  >
                    <Field.Label fontSize="sm">{t('courtName')}</Field.Label>
                    <Input
                      {...register(`courts.${index}.courtName`)}
                      placeholder={t('courtNamePlaceholder')}
                      disabled={!canEditCourts}
                    />
                  </Field.Root>
                </Box>

                {/* Delete Button */}
                {fields.length > 1 && canEditCourts && (
                  <Box pt={7}>
                    <Button
                      type="button"
                      onClick={() => handleRemoveCourt(index)}
                      size="md"
                      variant="solid"
                      colorPalette="red"
                      minW="auto"
                      px={3}
                      disabled={!canEditCourts}
                      bg="red.50"
                      color="red.600"
                      border="1px solid"
                      borderColor="red.200"
                      _hover={{ bg: 'red.100', borderColor: 'red.300' }}
                      _dark={{
                        bg: 'red.900',
                        color: 'red.200',
                        borderColor: 'red.700',
                        _hover: {
                          bg: 'red.800',
                          borderColor: 'red.600',
                        },
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </Box>
                )}
              </Flex>
            </Box>
          </Box>
        ))}

        {/* Array-level error for unique court numbers */}
        {errors.courts?.root && (
          <Text color="fg.error" fontSize="sm">
            {errors.courts.root.message}
          </Text>
        )}
      </Stack>

      {/* Add Court button - bottom of section */}
      <Button
        type="button"
        onClick={handleAddCourt}
        size="sm"
        variant="solid"
        colorPalette="green"
        disabled={!canEditCourts}
        mt={4}
        w="full"
        bg="green.50"
        color="green.700"
        border="1px solid"
        borderColor="green.200"
        _hover={{ bg: 'green.100', borderColor: 'green.300' }}
        _dark={{
          bg: 'green.900',
          color: 'green.200',
          borderColor: 'green.700',
          _hover: { bg: 'green.800', borderColor: 'green.600' },
        }}
      >
        <Plus size={16} style={{ marginRight: '8px' }} />
        {t('addCourt')}
      </Button>
    </Box>
  );
}
