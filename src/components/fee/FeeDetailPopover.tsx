'use client';

import {
  Box,
  Flex,
  HStack,
  Text,
  VStack,
  Icon,
  Stack,
  Separator,
} from '@chakra-ui/react';
import { VModal, useModal } from '@/components/ui/VModal';
import { SessionFeeConfig, FeeType } from '@/lib/api/types';
import {
  Info,
  Mars,
  Venus,
  CircleDollarSign,
  NotebookText,
  Calculator,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface IFeeDetailPopoverProps {
  feeConfig: SessionFeeConfig;
}

const FeeDetailPopover = ({ feeConfig }: IFeeDetailPopoverProps) => {
  const t = useTranslations('fee');
  const { isOpen, onOpen, onClose } = useModal();

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return '0 VND';
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  const isFixed = feeConfig.feeType === FeeType.FIXED;

  return (
    <>
      <Flex
        as="button"
        cursor="pointer"
        color="green.500"
        bg="green.50"
        _hover={{
          color: 'green.600',
          bg: 'green.100',
          transform: 'scale(1.1)',
        }}
        _active={{ transform: 'scale(0.95)' }}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        ml={1.5}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
        borderRadius="full"
        padding="2px"
        transition="all 0.2s"
      >
        <Icon as={Info} size="xs" />
      </Flex>

      <VModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('title')}
        size="sm"
        hideSecondaryAction
        showFooterDivider={false}
      >
        <VStack align="stretch" gap={6} py={2}>
          {/* Fee Type Pill */}
          <Flex direction="column" align="center" gap={3}>
            <Flex
              align="center"
              gap={2}
              bg={isFixed ? 'green.50' : 'blue.50'}
              px={4}
              py={1.5}
              borderRadius="full"
              borderWidth="1px"
              borderColor={isFixed ? 'green.200' : 'blue.200'}
            >
              <Icon
                as={isFixed ? CircleDollarSign : Calculator}
                color={isFixed ? 'green.600' : 'blue.600'}
                boxSize={4}
              />
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={isFixed ? 'green.700' : 'blue.700'}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {isFixed ? t('fixed') : t('splitEvenly')}
              </Text>
            </Flex>
          </Flex>

          <Separator />

          {/* Fee Amounts for Fixed Type */}
          {isFixed ? (
            <Stack direction={{ base: 'column', sm: 'row' }} gap={4} w="full">
              {/* Male Fee Card */}
              <VStack
                flex={1}
                bg="blue.50"
                p={5}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="blue.100"
                align="center"
                boxShadow="sm"
                transition="transform 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
              >
                <Flex
                  bg="blue.600"
                  color="white"
                  p={2}
                  borderRadius="lg"
                  mb={1}
                  boxShadow="0 4px 12px rgba(37, 99, 235, 0.2)"
                >
                  <Icon as={Mars} boxSize={5} />
                </Flex>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="blue.600"
                  textTransform="uppercase"
                >
                  {t('maleFee')}
                </Text>
                <Text
                  fontSize="lg"
                  fontWeight="extrabold"
                  color="blue.900"
                  mt={-1}
                >
                  {formatCurrency(feeConfig.maleFee)}
                </Text>
              </VStack>

              {/* Female Fee Card */}
              <VStack
                flex={1}
                bg="pink.50"
                p={5}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="pink.100"
                align="center"
                boxShadow="sm"
                transition="transform 0.2s"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
              >
                <Flex
                  bg="pink.500"
                  color="white"
                  p={2}
                  borderRadius="lg"
                  mb={1}
                  boxShadow="0 4px 12px rgba(236, 72, 153, 0.2)"
                >
                  <Icon as={Venus} boxSize={5} />
                </Flex>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="pink.600"
                  textTransform="uppercase"
                >
                  {t('femaleFee')}
                </Text>
                <Text
                  fontSize="lg"
                  fontWeight="extrabold"
                  color="pink.900"
                  mt={-1}
                >
                  {formatCurrency(feeConfig.femaleFee)}
                </Text>
              </VStack>
            </Stack>
          ) : (
            /* Split Evenly Description Card */
            <Box
              bg="gradient.overlay"
              p={6}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="green.200"
              bgGradient="linear(to-br, white, green.50)"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="-10px"
                right="-10px"
                opacity={0.1}
                transform="rotate(15deg)"
              >
                <Icon as={Calculator} boxSize={20} color="green.600" />
              </Box>
              <HStack gap={4} position="relative" zIndex={1}>
                <Flex
                  bg="green.500"
                  color="white"
                  boxSize="40px"
                  borderRadius="full"
                  align="center"
                  justify="center"
                  flexShrink={0}
                  boxShadow="0 4px 10px rgba(16, 185, 129, 0.3)"
                >
                  <Icon as={Calculator} boxSize={5} />
                </Flex>
                <Text
                  fontSize="sm"
                  color="green.800"
                  fontWeight="medium"
                  lineHeight="1.6"
                >
                  {t('splitDescription')}
                </Text>
              </HStack>
            </Box>
          )}

          {/* Notes Section Styling */}
          {feeConfig.notes && (
            <Box
              bg="gray.50"
              p={4}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              borderLeftWidth="4px"
              borderLeftColor="green.500"
            >
              <HStack mb={2} gap={2}>
                <Icon as={NotebookText} boxSize={4} color="gray.500" />
                <Text
                  fontSize="xs"
                  color="gray.600"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="tight"
                >
                  {t('notes')}
                </Text>
              </HStack>
              <Text
                fontSize="sm"
                color="gray.700"
                lineHeight="tall"
                fontWeight="medium"
              >
                {feeConfig.notes}
              </Text>
            </Box>
          )}
        </VStack>
      </VModal>
    </>
  );
};

export default FeeDetailPopover;
