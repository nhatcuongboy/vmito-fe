'use client';

import { IconButton } from '@/components/ui/chakra-compat';
import { ROUTES } from '@/constants';
import { useRouter } from '@/i18n/config';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { IClubSchedule, IMyClub } from '@/types/club';
import {
  Badge,
  Box,
  Flex,
  HStack,
  Image,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  MoreVertical,
  Settings,
  Trash2,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface IManagedClubCardProps {
  club: IMyClub;
  onDelete?: (club: IMyClub) => void;
}

const getClubHostName = (club: IMyClub) => club.host?.name ?? '';

const formatSchedule = (
  schedule: IClubSchedule,
  t: ReturnType<typeof useTranslations>
) =>
  `${t(`clubs.dayNames.${schedule.dayOfWeek}` as Parameters<typeof t>[0])} · ${schedule.startTime}-${schedule.endTime}`;

const ManagedClubCard = ({ club, onDelete }: IManagedClubCardProps) => {
  const router = useRouter();
  const t = useTranslations();
  const isPending = club.status === 'PENDING';
  const thumbnailUrl = normalizeImageUrl(club.image, {
    cloudinaryWidth: 128,
    cloudinaryHeight: 128,
  });
  const venueName = club.defaultVenue?.name;
  const firstSchedule = club.schedules?.[0];
  const contextText = venueName
    ? venueName
    : firstSchedule
      ? formatSchedule(firstSchedule, t)
      : null;

  const handleOpenClub = () => {
    if (!isPending) {
      router.push(`/clubs/${club.slug ?? club.id}`);
    }
  };

  return (
    <Box
      bg="bg"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius={{ base: 'xl', md: '2xl' }}
      borderWidth="1px"
      borderColor="border"
      overflow="hidden"
      cursor={isPending ? 'default' : 'pointer'}
      onClick={handleOpenClub}
      transition="border-color 0.2s, box-shadow 0.2s"
      _hover={isPending ? {} : { borderColor: 'green.300', shadow: 'md' }}
    >
      <Box p={{ base: 4, md: 5 }}>
        <Flex align="flex-start" gap={{ base: 3, md: 4 }}>
          <Flex
            boxSize={{ base: '52px', md: '58px' }}
            borderRadius="xl"
            overflow="hidden"
            align="center"
            justify="center"
            flexShrink={0}
            bg={club.color || 'green.500'}
            color="white"
          >
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt=""
                w="full"
                h="full"
                objectFit="cover"
              />
            ) : (
              <Text fontSize="xl" fontWeight="bold">
                {club.name.trim().charAt(0).toUpperCase()}
              </Text>
            )}
          </Flex>

          <VStack align="stretch" gap={2} flex={1} minW={0}>
            <HStack justify="space-between" gap={2} align="flex-start">
              <Box minW={0}>
                <Text
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="semibold"
                  lineClamp={1}
                >
                  {club.name}
                </Text>
                <HStack gap={2} mt={1} flexWrap="wrap">
                  <Badge colorPalette="green" variant="subtle" size="sm">
                    {t(
                      `clubs.memberRole.${club.role.toLowerCase()}` as Parameters<
                        typeof t
                      >[0]
                    )}
                  </Badge>
                  <HStack gap={1} color="fg.muted">
                    <Users size={14} />
                    <Text fontSize="xs">
                      {club.memberCount} {t('clubs.members')}
                    </Text>
                  </HStack>
                </HStack>
              </Box>

              {onDelete && (
                <MenuRoot positioning={{ placement: 'bottom-end' }}>
                  <MenuTrigger asChild>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      colorPalette="gray"
                      aria-label={t('common.moreActions')}
                      icon={<MoreVertical size={18} />}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </MenuTrigger>
                  <Portal>
                    <MenuPositioner zIndex={2000}>
                      <MenuContent
                        minW="180px"
                        bg="bg"
                        borderWidth="1px"
                        borderColor="border"
                        boxShadow="lg"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MenuItem
                          value="fees"
                          cursor="pointer"
                          _hover={{ bg: 'bg.muted' }}
                          onClick={() =>
                            router.push(ROUTES.HOST.CLUBS.FEES(club.id))
                          }
                        >
                          <DollarSign size={16} />
                          {t('clubs.feeConfiguration')}
                        </MenuItem>
                        <MenuItem
                          value="edit"
                          cursor="pointer"
                          _hover={{ bg: 'bg.muted' }}
                          onClick={() =>
                            router.push(ROUTES.HOST.CLUBS.EDIT(club.id))
                          }
                        >
                          <Settings size={16} />
                          {t('common.edit')}
                        </MenuItem>
                        <MenuItem
                          value="delete"
                          color="red.600"
                          cursor="pointer"
                          _hover={{ bg: 'red.50' }}
                          onClick={() => onDelete(club)}
                        >
                          <Trash2 size={16} />
                          {t('clubs.deleteClub')}
                        </MenuItem>
                      </MenuContent>
                    </MenuPositioner>
                  </Portal>
                </MenuRoot>
              )}
            </HStack>

            <HStack gap={1.5} color="fg.muted" minW={0} minH="18px">
              {contextText && (
                <>
                  {venueName ? <MapPin size={14} /> : <Clock size={14} />}
                  <Text fontSize="xs" lineClamp={1}>
                    {contextText}
                  </Text>
                </>
              )}
            </HStack>
          </VStack>
        </Flex>
      </Box>

      <Separator />

      <HStack
        px={{ base: 4, md: 5 }}
        py={3}
        justify="space-between"
        gap={3}
        bg="bg.muted"
        _dark={{ bg: 'whiteAlpha.50' }}
      >
        <HStack gap={2} minW={0}>
          <Text fontSize="xs" color="fg.muted" flexShrink={0}>
            {t('clubs.hostedBy')}
          </Text>
          <Text fontSize="xs" fontWeight="semibold" lineClamp={1}>
            {getClubHostName(club) || t('common.notSpecified')}
          </Text>
        </HStack>
        {isPending ? (
          <Badge colorPalette="yellow" size="sm" flexShrink={0}>
            {t('clubs.clubStatus.pending')}
          </Badge>
        ) : (
          <HStack gap={1} color="green.600" _dark={{ color: 'green.400' }}>
            <Text fontSize="xs" fontWeight="semibold">
              {t('clubs.viewDetails')}
            </Text>
            <ChevronRight size={16} />
          </HStack>
        )}
      </HStack>
    </Box>
  );
};

export default ManagedClubCard;
