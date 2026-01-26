import { Box, Flex, Text } from '@chakra-ui/react';
import { Button, Card, CardBody, VStack } from '@/components/ui/chakra-compat';
import { Users, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

interface PlayerEmptyStateProps {
  isFiltered?: boolean;
  filterName?: string;
  onAddPlayer?: () => void;
}

const PlayerEmptyState: React.FC<PlayerEmptyStateProps> = ({
  isFiltered = false,
  filterName,
}) => {
  const t = useTranslations('pages.playerManagement');

  return (
    <Card
      variant="outline"
      bg="linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)"
      borderStyle="dashed"
      borderWidth="2px"
      borderColor="gray.200"
      borderRadius="2xl"
      width="100%"
    >
      <CardBody p={{ base: 8, md: 12 }}>
        <VStack spacing={6} align="center">
          {/* Empty state icon */}
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
            <Box as={Users} boxSize={10} color="gray.400" />
          </Flex>

          <VStack spacing={2} align="center" width="100%">
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="gray.700"
              letterSpacing="-0.01em"
              textAlign="center"
            >
              {isFiltered ? t('noPlayersWithFilter') : t('noPlayersYet')}
            </Text>
            <Text
              fontSize="sm"
              color="gray.500"
              textAlign="center"
              maxW="400px"
              lineHeight="1.6"
            >
              {isFiltered
                ? t('noPlayersWithFilterDescription', {
                    status: filterName || '',
                  })
                : t('noPlayersYetDescription')}
            </Text>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PlayerEmptyState;
