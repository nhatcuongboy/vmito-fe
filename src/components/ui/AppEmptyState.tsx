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
}

export default function AppEmptyState({
  title,
  description,
  icon,
  actions,
  minH,
  maxW = '100%',
}: AppEmptyStateProps) {
  const resolvedDescription =
    description === undefined
      ? 'Thử điều chỉnh lại bộ lọc của bạn'
      : description;

  return (
    <Card
      variant="outline"
      bg="linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)"
      borderStyle="dashed"
      borderWidth="2px"
      borderColor="gray.200"
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
              color="gray.700"
              letterSpacing="-0.01em"
              textAlign="center"
            >
              {title}
            </Text>
            {resolvedDescription && (
              <Text
                fontSize={{ base: 'sm', md: 'md' }}
                color="gray.500"
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
