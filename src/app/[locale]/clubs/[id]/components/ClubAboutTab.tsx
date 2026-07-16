import { Box, Heading, Tabs, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { RichTextDisplay } from '@/components/ui/RichTextDisplay';
import { IClub } from '@/types/club';

interface IClubAboutTabProps {
  description: IClub['description'];
}

export const ClubAboutTab = ({ description }: IClubAboutTabProps) => {
  const t = useTranslations();

  return (
    <Tabs.Content value="about" pt={0}>
      <VStack gap={6} align="stretch">
        <Box
          p={6}
          pb={8}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="gray.100"
          shadow="sm"
        >
          <Box>
            <Heading
              size="md"
              mb={4}
              fontFamily="var(--font-geist-sans)"
              fontWeight="bold"
            >
              Giới thiệu về nhóm
            </Heading>
            {description ? (
              <RichTextDisplay content={description} />
            ) : (
              <Text fontSize="sm" color="gray.400" fontStyle="italic">
                {t('clubs.noDescription')}
              </Text>
            )}
          </Box>
        </Box>
      </VStack>
    </Tabs.Content>
  );
};
