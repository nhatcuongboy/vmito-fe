import { Box, Heading, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import React from 'react';
import { Card, CardBody } from '@/components/ui/chakra-compat';

export const COURT_COLORS = [
  { name: 'Green', value: '#179a3b' },
  { name: 'Grey', value: '#808080' },
  { name: 'Royal', value: '#364D63' },
  { name: 'Red', value: '#B24233' },
];

interface CourtSettingsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdateSettings: (key: string, value: any) => Promise<void>;
}

const CourtSettings: React.FC<CourtSettingsProps> = ({
  session,
  onUpdateSettings,
}) => {
  // Use passed session color or default green
  const currentColor = session.courtColor || '#179a3b';

  return (
    <Box maxW="6xl" mx="auto" px={4} py={8}>
      <VStack gap={8} align="stretch">
        <Box>
          <Heading size="md" mb={4}>
            Court Appearance
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={6}>
            Customize the look of your courts. This change applies to all courts
            in this session.
          </Text>

          <Card>
            <CardBody p={6}>
              <Text fontWeight="semibold" mb={4}>
                Court Color
              </Text>
              <Wrap gap={4}>
                {COURT_COLORS.map((color) => {
                  const isSelected = currentColor === color.value;
                  return (
                    <WrapItem key={color.value}>
                      <VStack>
                        <Box
                          w="80px"
                          h="80px"
                          borderRadius="md"
                          bg={color.value}
                          cursor="pointer"
                          position="relative"
                          onClick={() =>
                            onUpdateSettings('courtColor', color.value)
                          }
                          border="4px solid"
                          borderColor={isSelected ? 'blue.500' : 'transparent'}
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
                          {/* White lines representation */}
                          <Box
                            w="60px"
                            h="40px"
                            border="1px solid white"
                            position="absolute"
                          />
                          <Box
                            w="0px"
                            h="40px"
                            borderLeft="1px solid white"
                            position="absolute"
                          />
                          <Box
                            w="60px"
                            h="0px"
                            borderTop="1px dashed white"
                            position="absolute"
                          />
                        </Box>
                        <Text
                          fontSize="sm"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                        >
                          {color.name}
                        </Text>
                      </VStack>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </CardBody>
          </Card>
        </Box>
      </VStack>
    </Box>
  );
};

export default CourtSettings;
