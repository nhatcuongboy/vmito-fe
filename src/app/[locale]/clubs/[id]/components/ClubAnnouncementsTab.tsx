import {
  Avatar,
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { IClub } from '@/types/club';

interface IClubAnnouncementsTabProps {
  announcements: IClub['announcements'];
}

export const ClubAnnouncementsTab = ({
  announcements,
}: IClubAnnouncementsTabProps) => {
  const t = useTranslations();

  return (
    <Tabs.Content value="announcements" pt={0}>
      <Box
        p={6}
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.100"
        shadow="sm"
      >
        <Heading size="md" mb={5}>
          {t('clubs.recentAnnouncements')}
        </Heading>

        {announcements && announcements.length > 0 ? (
          <VStack gap={4} align="stretch">
            {announcements.map((announcement) => (
              <Box
                key={announcement.id}
                p={5}
                bg="gray.50"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="gray.100"
                _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
              >
                <Flex justify="space-between" align="start" mb={3}>
                  <Heading size="sm">{announcement.title}</Heading>
                  {announcement.pinnedUntil &&
                    new Date(announcement.pinnedUntil) > new Date() && (
                      <Badge colorPalette="orange" size="sm">
                        Pinned
                      </Badge>
                    )}
                </Flex>
                <Text
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                  lineHeight="tall"
                  mb={4}
                >
                  {announcement.content}
                </Text>
                <Flex justify="space-between" align="center">
                  <HStack gap={2}>
                    <Avatar.Root size="sm">
                      <Avatar.Image
                        src={announcement.author.image}
                        objectFit="cover"
                      />
                      <Avatar.Fallback>
                        {announcement.author.name[0]}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <Text fontSize="sm" fontWeight="medium">
                      {announcement.author.name}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </Text>
                </Flex>
              </Box>
            ))}
          </VStack>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={10}
            color="gray.400"
            gap={2}
          >
            <MessageSquare size={40} strokeWidth={1.2} />
            <Text fontSize="sm" fontStyle="italic">
              {t('clubs.noAnnouncements')}
            </Text>
          </Flex>
        )}
      </Box>
    </Tabs.Content>
  );
};
