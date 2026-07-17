import { Box, Container, Flex, Heading, Image, Text } from '@chakra-ui/react';
import { IClub } from '@/types/club';

interface IClubDetailHeroProps {
  club: IClub;
  clubDisplayImage: string;
}

export const ClubDetailHero = ({
  club,
  clubDisplayImage,
}: IClubDetailHeroProps) => {
  const firstVenue = club.scheduleVenues?.[0] || club.defaultVenue;
  const locationParts = [firstVenue?.district, firstVenue?.city].filter(
    Boolean
  );

  return (
    <Container maxW="container.xl" px={0}>
      <Box
        position="relative"
        w="full"
        h={{ base: '180px', md: '300px' }}
        borderRadius="2xl"
        overflow="hidden"
        mb={4}
      >
        <Image
          src={clubDisplayImage}
          alt={club.name}
          w="full"
          h="full"
          objectFit="cover"
        />
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="100px"
          bgGradient="to-t"
          gradientFrom="blackAlpha.600"
          gradientTo="transparent"
          pointerEvents="none"
        />
      </Box>

      <Box
        w="full"
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        shadow="sm"
        px={{ base: 3, md: 5 }}
        py={{ base: 2, md: 3.5 }}
        borderWidth="1px"
        borderColor="gray.100"
        mb={4}
      >
        <Flex gap={{ base: 3, md: 4 }} align="center">
          <Box
            w="48px"
            h="48px"
            flexShrink={0}
            shadow="sm"
            borderRadius="lg"
            overflow="hidden"
            bg="gray.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderWidth="1px"
            borderColor="gray.100"
          >
            <Image
              src={clubDisplayImage}
              alt={club.name}
              objectFit="cover"
              w="full"
              h="full"
            />
          </Box>
          <Box flex="1" minW="0">
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={0}
              letterSpacing="tight"
              lineClamp={1}
            >
              {club.name}
            </Heading>
            {locationParts.length > 0 ? (
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                mt={1}
              >
                {locationParts.join(', ')}
              </Text>
            ) : null}
          </Box>
        </Flex>
      </Box>
    </Container>
  );
};
