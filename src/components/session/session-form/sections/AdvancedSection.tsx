import {
  Box,
  Collapsible,
  Field,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/chakra-compat';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ChevronDown, ChevronUp, Settings, User, Users } from 'lucide-react';
import { Controller } from 'react-hook-form';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { useTranslations } from 'next-intl';

import { COURT_COLORS } from '@/components/session/CourtSettings';
import AppMultiImageUpload, {
  ISessionImage,
} from '@/components/session/AppMultiImageUpload';
import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';

type Translator = ReturnType<typeof useTranslations>;

interface ClubOption {
  value: string;
  label: string;
  sublabel?: string;
}

export function AdvancedSection({
  t,
  isAdvancedOpen,
  setIsAdvancedOpen,
  sessionImages,
  setSessionImages,
  bannerIndex,
  setBannerIndex,
  isUploadingImages,
  canAccessHostFeatures,
  control,
  register,
  errors,
  clubOptions,
  isClubsLoading,
}: {
  t: Translator;
  isAdvancedOpen: boolean;
  setIsAdvancedOpen: (value: boolean) => void;
  sessionImages: ISessionImage[];
  setSessionImages: React.Dispatch<React.SetStateAction<ISessionImage[]>>;
  bannerIndex: number;
  setBannerIndex: React.Dispatch<React.SetStateAction<number>>;
  isUploadingImages: boolean;
  canAccessHostFeatures: boolean;
  control: Control<SessionFormData>;
  register: UseFormRegister<SessionFormData>;
  errors: FieldErrors<SessionFormData>;
  clubOptions: ClubOption[];
  isClubsLoading: boolean;
}) {
  return (
    <Box
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderRadius="lg"
      boxShadow="sm"
      border="1px solid"
      borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
      overflow="hidden"
    >
      <Collapsible.Root
        open={isAdvancedOpen}
        onOpenChange={(e) => setIsAdvancedOpen(e.open)}
      >
        <Collapsible.Trigger asChild>
          <Box
            as="button"
            w="full"
            p={4}
            cursor="pointer"
            _hover={{ bg: { base: 'gray.50', _dark: 'gray.750' } }}
            transition="background 0.2s"
          >
            <Flex align="center" justify="space-between">
              <HStack gap={2}>
                <Icon asChild boxSize={5} color="brand.500">
                  <Settings />
                </Icon>
                <Heading size="md">{t('advancedSettings')}</Heading>
              </HStack>
              <Icon asChild boxSize={5} color="fg.muted">
                {isAdvancedOpen ? <ChevronUp /> : <ChevronDown />}
              </Icon>
            </Flex>
          </Box>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <Stack gap={6} p={6} pt={0}>
            {/* Session Images */}
            <Box>
              <AppMultiImageUpload
                images={sessionImages}
                bannerIndex={bannerIndex}
                onImagesChange={setSessionImages}
                onBannerChange={setBannerIndex}
                isUploading={isUploadingImages}
                maxImages={5}
              />
            </Box>

            {/* Court Appearance */}
            {canAccessHostFeatures && (
              <Box>
                <Heading size="sm" mb={3}>
                  {t('courtAppearance')}
                </Heading>
                <Text fontSize="sm" color="fg.muted" mb={4}>
                  {t('selectCourtColor')}
                </Text>

                <Controller
                  control={control}
                  name="courtColor"
                  render={({ field }) => (
                    <Wrap gap={4}>
                      {COURT_COLORS.map((color) => {
                        const isSelected = field.value === color.value;
                        return (
                          <WrapItem key={color.value}>
                            <VStack>
                              <Box
                                w="60px"
                                h="60px"
                                borderRadius="md"
                                bg={color.value}
                                cursor="pointer"
                                position="relative"
                                onClick={() => field.onChange(color.value)}
                                border="3px solid"
                                borderColor={
                                  isSelected ? 'brand.500' : 'transparent'
                                }
                                boxShadow={isSelected ? 'lg' : 'sm'}
                                transition="all 0.2s"
                                _hover={{
                                  transform: 'scale(1.05)',
                                  boxShadow: 'md',
                                }}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Box
                                  w="40px"
                                  h="30px"
                                  border="1px solid white"
                                  position="absolute"
                                  opacity={0.7}
                                />
                              </Box>
                              <Text
                                fontSize="xs"
                                fontWeight={isSelected ? 'bold' : 'normal'}
                              >
                                {t(color.labelKey)}
                              </Text>
                            </VStack>
                          </WrapItem>
                        );
                      })}
                    </Wrap>
                  )}
                />
              </Box>
            )}

            {/* Default Match Type */}
            <Box>
              <Controller
                control={control}
                name="defaultMatchType"
                render={({ field }) => (
                  <Field.Root>
                    <Field.Label>
                      <Heading size="sm">{t('defaultMatchType')}</Heading>
                    </Field.Label>
                    <HStack gap={3}>
                      <Button
                        type="button"
                        variant={
                          field.value === 'DOUBLES' ? 'solid' : 'outline'
                        }
                        colorPalette={
                          field.value === 'DOUBLES' ? 'green' : 'gray'
                        }
                        size="sm"
                        onClick={() => field.onChange('DOUBLES')}
                      >
                        <Box as={Users} boxSize={4} mr={1} />
                        {t('doubles')}
                      </Button>
                      <Button
                        type="button"
                        variant={
                          field.value === 'SINGLES' ? 'solid' : 'outline'
                        }
                        colorPalette={
                          field.value === 'SINGLES' ? 'green' : 'gray'
                        }
                        size="sm"
                        onClick={() => field.onChange('SINGLES')}
                      >
                        <Box as={User} boxSize={4} mr={1} />
                        {t('singles')}
                      </Button>
                    </HStack>
                  </Field.Root>
                )}
              />
            </Box>

            {/* Shuttlecock + Max Players Per Court - same row */}
            <Grid templateColumns="1fr 1fr" gap={4}>
              <Box>
                <Field.Root invalid={!!errors.shuttlecock}>
                  <Field.Label>
                    <Heading size="sm">{t('shuttlecock')}</Heading>
                  </Field.Label>
                  <Input
                    {...register('shuttlecock')}
                    placeholder={t('shuttlecock')}
                  />
                  <Field.ErrorText color="fg.error">
                    {errors.shuttlecock?.message}
                  </Field.ErrorText>
                </Field.Root>
              </Box>

              {/* Max Players Per Court */}
              <Box>
                <Field.Root invalid={!!errors.maxPlayersPerCourt}>
                  <Field.Label>
                    <Heading size="sm">{t('maxPlayersPerCourt')}</Heading>
                  </Field.Label>
                  <Controller
                    control={control}
                    name="maxPlayersPerCourt"
                    render={({ field }) => (
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="0"
                        min={2}
                        max={12}
                        value={field.value || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          if (value === '') {
                            field.onChange('');
                          } else {
                            const parsed = parseInt(value);
                            if (!isNaN(parsed)) {
                              field.onChange(parsed);
                            }
                          }
                        }}
                        rightElement={
                          <Text
                            fontSize="sm"
                            color="fg.muted"
                            whiteSpace="nowrap"
                          >
                            người/sân
                          </Text>
                        }
                      />
                    )}
                  />
                  <Field.ErrorText color="fg.error">
                    {errors.maxPlayersPerCourt?.message}
                  </Field.ErrorText>
                </Field.Root>
              </Box>
            </Grid>

            {/* Reference Video URL */}
            <Box>
              <Field.Root invalid={!!errors.referenceVideoUrl}>
                <Field.Label>
                  <Heading size="sm">{t('referenceVideoUrl')}</Heading>
                </Field.Label>
                <Input
                  {...register('referenceVideoUrl')}
                  placeholder={t('referenceVideoUrlPlaceholder')}
                  type="url"
                  inputMode="url"
                />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {t('referenceVideoUrlHelper')}
                </Text>
                <Field.ErrorText color="fg.error">
                  {errors.referenceVideoUrl?.message}
                </Field.ErrorText>
              </Field.Root>
            </Box>

            {/* Default Club */}
            {canAccessHostFeatures && (
              <Field.Root>
                <Field.Label>{t('defaultClub')}</Field.Label>
                <Controller
                  control={control}
                  name="clubId"
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value || ''}
                      onChange={(value) => field.onChange(value)}
                      options={clubOptions}
                      placeholder={t('selectDefaultClub')}
                      searchPlaceholder={t('searchDefaultClub')}
                      isLoading={isClubsLoading}
                    />
                  )}
                />
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  {t('defaultClubDescription')}
                </Text>
              </Field.Root>
            )}
          </Stack>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
}
