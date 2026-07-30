import { Box, Flex, Text, type ConditionalValue } from '@chakra-ui/react';
import { Card, CardBody, VStack } from '@/components/ui/chakra-compat';
import type { ReactNode } from 'react';

interface AppEmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  minH?: ConditionalValue<string | number>;
  maxW?: ConditionalValue<string | number>;
  /** Override the default grey wash — e.g. on a tinted page background. */
  bg?: ConditionalValue<string>;
  /** Override the default grey dashed border to match the surrounding page. */
  borderColor?: ConditionalValue<string>;
}

export default function AppEmptyState({
  title,
  description,
  icon,
  actions,
  minH,
  maxW = '100%',
  bg = 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
  borderColor = 'gray.200',
}: AppEmptyStateProps) {
  const resolvedDescription =
    description === undefined
      ? 'Thử điều chỉnh lại bộ lọc của bạn'
      : description;

  return (
    <Card
      variant="outline"
      bg={bg}
      _dark={{
        bg: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        borderColor: 'gray.800',
      }}
      borderStyle="dashed"
      borderWidth="2px"
      borderColor={borderColor}
      borderRadius="2xl"
      width="100%"
      maxW={maxW}
      mx="auto"
    >
      <CardBody
        p={{ base: 8, md: 12 }}
        minH={minH}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={6} align="center" width="100%">
          {icon && (
            <Flex
              width="80px"
              height="80px"
              borderRadius="2xl"
              bg="white"
              _dark={{
                bg: 'gray.800',
                borderColor: 'gray.700',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
              align="center"
              justify="center"
              boxShadow="0 4px 20px rgba(0,0,0,0.08)"
              border="1px solid"
              borderColor="gray.100"
            >
              {icon}
            </Flex>
          )}

          <VStack spacing={2} align="center" width="100%">
            <Text
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="bold"
              color="gray.800"
              _dark={{ color: 'white' }}
              letterSpacing="-0.01em"
              textAlign="center"
            >
              {title}
            </Text>
            {resolvedDescription && (
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                color="gray.500"
                _dark={{ color: 'gray.300' }}
                textAlign="center"
                maxW="520px"
                lineHeight="1.6"
              >
                {resolvedDescription}
              </Text>
            )}
          </VStack>

          {actions && (
            <Box width="100%" display="flex" justifyContent="center">
              {actions}
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
