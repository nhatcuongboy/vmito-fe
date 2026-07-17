import { Box, Flex, Heading, Tabs, Text, VStack } from '@chakra-ui/react';
import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { IClub } from '@/types/club';

interface IClubScheduleTabProps {
  schedules: IClub['schedules'];
}

export const ClubScheduleTab = ({ schedules }: IClubScheduleTabProps) => {
  const t = useTranslations();

  return (
    <Tabs.Content value="schedule" pt={0}>
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
          {t('clubs.schedule')}
        </Heading>

        {schedules && schedules.length > 0 ? (
          <VStack gap={3} align="stretch">
            {schedules
              .sort((first, second) => first.dayOfWeek - second.dayOfWeek)
              .map((schedule) => (
                <Flex
                  key={schedule.id}
                  p={4}
                  bg="gray.50"
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                  align="center"
                  gap={4}
                >
                  <Flex
                    w="50px"
                    h="50px"
                    borderRadius="lg"
                    bg="blue.100"
                    _dark={{ bg: 'blue.900' }}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Calendar size={24} color="var(--chakra-colors-blue-600)" />
                  </Flex>
                  <Box flex="1">
                    <Text fontWeight="bold" fontSize="sm">
                      {t(
                        `clubs.dayNames.${schedule.dayOfWeek}` as Parameters<
                          typeof t
                        >[0]
                      )}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: 'gray.400' }}
                    >
                      {schedule.startTime} - {schedule.endTime}
                    </Text>
                    {schedule.notes && (
                      <Box mt={1}>
                        {schedule.notes.includes('|') ? (
                          <>
                            <Text
                              fontWeight="medium"
                              fontSize="xs"
                              color="gray.700"
                              _dark={{ color: 'gray.300' }}
                            >
                              {schedule.notes.split('|')[0].trim()}
                            </Text>
                            <Text fontSize="2xs" color="gray.500">
                              {schedule.notes.split('|')[1].trim()}
                            </Text>
                          </>
                        ) : (
                          <Text fontSize="xs" color="gray.500">
                            {schedule.notes}
                          </Text>
                        )}
                      </Box>
                    )}
                  </Box>
                </Flex>
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
            <Calendar size={40} strokeWidth={1.2} />
            <Text fontSize="sm" fontStyle="italic">
              {t('clubs.noSchedule')}
            </Text>
          </Flex>
        )}
      </Box>
    </Tabs.Content>
  );
};
