'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  HStack,
  Badge,
  SimpleGrid,
  Spinner,
  VStack,
  Separator,
  Avatar,
  Image,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { MapPin, Users, Calendar, Crown, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub, EMemberRole } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import PageLayout from '@/components/layout/PageLayout';
import { ROUTES } from '@/constants';

interface ClubDetailClientProps {
  initialClub: IClub | null;
}

export default function ClubDetailClient({
  initialClub,
}: ClubDetailClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  const { user: currentUser } = useAuthStore();

  const [club, setClub] = useState<IClub | null>(initialClub);
  const [isLoading, setIsLoading] = useState(!initialClub);

  const loadClubDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ClubsService.getClubDetails(clubId);
      setClub(data);
    } catch (error) {
      console.error('Failed to load club details:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsLoading(false);
    }
  }, [clubId, t]);

  useEffect(() => {
    if (initialClub) return;

    if (clubId) {
      loadClubDetails();
    }
  }, [clubId, loadClubDetails, initialClub]);

  if (isLoading) {
    return (
      <PageLayout title={t('clubs.clubDetails')}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      </PageLayout>
    );
  }

  if (!club) {
    return (
      <PageLayout title={t('common.error')}>
        <Container maxW="container.md" py={16} textAlign="center">
          <Heading mb={4}>{t('common.error')}</Heading>
          <Button
            colorPalette="green"
            onClick={() => router.push(ROUTES.CLUBS.BROWSE)}
          >
            {t('common.back')}
          </Button>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={club.name}>
      <Container maxW="container.xl" py={6}>
        {/* Main card */}
        <Box
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          overflow="hidden"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.100"
        >
          {/* Cover photo */}
          {club.image ? (
            <Box h="200px" overflow="hidden" position="relative">
              <Image
                src={club.image}
                alt={club.name}
                w="full"
                h="full"
                objectFit="cover"
              />
              <Box
                position="absolute"
                inset={0}
                bgGradient="to-b"
                gradientFrom="transparent"
                gradientTo="blackAlpha.400"
              />
            </Box>
          ) : (
            <Box
              h="160px"
              bgGradient="to-r"
              gradientFrom={club.color ? `${club.color}.400` : 'green.400'}
              gradientVia="teal.400"
              gradientTo="blue.400"
            />
          )}

          {/* Club header row */}
          <Box px={{ base: 5, md: 8 }} pt={{ base: 6, md: 8 }} pb={4}>
            <Flex
              direction={{ base: 'column', sm: 'row' }}
              gap={5}
              align={{ base: 'flex-start', sm: 'center' }}
            >
              {/* Club avatar + name */}
              <HStack gap={4} align="center">
                {club.image ? (
                  <Box
                    w="64px"
                    h="64px"
                    borderRadius="xl"
                    overflow="hidden"
                    flexShrink={0}
                    borderWidth="2px"
                    borderColor="gray.100"
                  >
                    <Image
                      src={club.image}
                      alt={club.name}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />
                  </Box>
                ) : (
                  <Flex
                    w="64px"
                    h="64px"
                    borderRadius="xl"
                    bg={club.color ? `${club.color}.100` : 'green.100'}
                    _dark={{
                      bg: club.color ? `${club.color}.900` : 'green.900',
                    }}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color={club.color ? `${club.color}.600` : 'green.600'}
                    >
                      {club.name.charAt(0).toUpperCase()}
                    </Text>
                  </Flex>
                )}

                <VStack align="start" gap={1}>
                  <Heading
                    size="xl"
                    color="gray.900"
                    _dark={{ color: 'white' }}
                    lineHeight="tight"
                  >
                    {club.name}
                  </Heading>
                </VStack>
              </HStack>
            </Flex>

            {club.location && (
              <HStack
                mt={3}
                gap={1.5}
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                <MapPin size={15} />
                <Text fontSize="sm">{club.location}</Text>
              </HStack>
            )}
          </Box>

          <Separator />

          {/* Stats row */}
          <SimpleGrid
            columns={{ base: 2, sm: 3 }}
            px={{ base: 5, md: 8 }}
            py={5}
            gap={0}
            borderBottomWidth="1px"
            borderColor="gray.100"
            _dark={{ borderColor: 'gray.700' }}
          >
            <VStack
              align="start"
              gap={0.5}
              px={4}
              borderRightWidth={{ base: '1px', sm: '1px' }}
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
              _first={{ pl: 0 }}
            >
              <HStack color="orange.500" gap={1.5}>
                <Crown size={14} />
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {t('clubs.hostedBy')}
                </Text>
              </HStack>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'white' }}
              >
                {club.host.name}
              </Text>
            </VStack>

            <VStack align="start" gap={0.5} px={4}>
              <HStack color="green.500" gap={1.5}>
                <Users size={14} />
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {t('clubs.members')}
                </Text>
              </HStack>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'white' }}
              >
                {club.memberCount}
                {club.maxMembers ? (
                  <Text
                    as="span"
                    fontSize="sm"
                    color="gray.400"
                    fontWeight="normal"
                  >
                    {' '}
                    / {club.maxMembers}
                  </Text>
                ) : null}
              </Text>
            </VStack>

            <VStack
              align="start"
              gap={0.5}
              px={4}
              borderLeftWidth={{ base: 0, sm: '1px' }}
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
            >
              <HStack color="blue.500" gap={1.5}>
                <Calendar size={14} />
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Kèo đang mở
                </Text>
              </HStack>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'white' }}
              >
                {club.sessionCount || 0}
              </Text>
            </VStack>
          </SimpleGrid>

          {/* Body: description + announcements */}
          <Flex direction={{ base: 'column', lg: 'row' }} gap={0}>
            {/* Left: description */}
            <Box flex="1" px={{ base: 5, md: 8 }} py={6}>
              {club.description ? (
                <Box>
                  <Heading
                    size="sm"
                    mb={3}
                    color="gray.700"
                    _dark={{ color: 'gray.300' }}
                  >
                    {t('session.description')}
                  </Heading>
                  <Text
                    color="gray.600"
                    _dark={{ color: 'gray.400' }}
                    lineHeight="tall"
                    fontSize="sm"
                  >
                    {club.description}
                  </Text>
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.400" fontStyle="italic">
                  {t('clubs.noDescription')}
                </Text>
              )}
            </Box>

            {/* Right: announcements sidebar */}
            <Box
              w={{ base: 'full', lg: '320px' }}
              flexShrink={0}
              px={{ base: 5, md: 6 }}
              py={6}
              bg="gray.50"
              _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
              borderLeftWidth={{ base: 0, lg: '1px' }}
              borderTopWidth={{ base: '1px', lg: 0 }}
              borderColor="gray.100"
            >
              <HStack gap={2} mb={4}>
                <MessageSquare size={18} color="#3182CE" />
                <Heading
                  size="sm"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                >
                  {t('clubs.recentAnnouncements')}
                </Heading>
              </HStack>

              <VStack gap={3} align="stretch">
                {club.announcements && club.announcements.length > 0 ? (
                  club.announcements.map((announcement) => (
                    <Box
                      key={announcement.id}
                      p={4}
                      bg="white"
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      borderRadius="lg"
                      shadow="xs"
                      borderWidth="1px"
                      borderColor="gray.100"
                    >
                      <Text fontWeight="semibold" fontSize="sm" mb={1}>
                        {announcement.title}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="gray.600"
                        _dark={{ color: 'gray.400' }}
                        lineClamp={3}
                      >
                        {announcement.content}
                      </Text>
                      <Flex justify="space-between" align="center" mt={3}>
                        <HStack gap={1.5}>
                          <Avatar.Root size="xs">
                            <Avatar.Image src={announcement.author.image} />
                            <Avatar.Fallback>
                              {announcement.author.name[0]}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <Text fontSize="2xs" color="gray.500">
                            {announcement.author.name}
                          </Text>
                        </HStack>
                        <Text fontSize="2xs" color="gray.400">
                          {new Date(
                            announcement.createdAt
                          ).toLocaleDateString()}
                        </Text>
                      </Flex>
                    </Box>
                  ))
                ) : (
                  <Text fontSize="sm" color="gray.400" fontStyle="italic">
                    {t('clubs.noAnnouncements')}
                  </Text>
                )}
              </VStack>
            </Box>
          </Flex>
        </Box>

        {/* Member list card */}
        <Box
          mt={5}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          overflow="hidden"
          shadow="sm"
          borderWidth="1px"
          borderColor="gray.100"
        >
          <Box px={{ base: 5, md: 8 }} py={5}>
            <HStack gap={2} mb={5}>
              <Users size={20} />
              <Heading size="md">{t('clubs.clubMembers')}</Heading>
              <Badge colorPalette="gray" variant="subtle" ml={1}>
                {club.memberCount}
              </Badge>
            </HStack>

            {club.members && club.members.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
                {club.members.map((member) => (
                  <Flex
                    key={member.id}
                    p={4}
                    bg="gray.50"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor="gray.100"
                    _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                    align="center"
                    gap={3}
                    transition="background 0.15s"
                    _hover={{ bg: 'gray.100', _dark: { bg: 'gray.800' } }}
                  >
                    <Avatar.Root size="md">
                      <Avatar.Image src={member.user.image} />
                      <Avatar.Fallback>{member.user.name[0]}</Avatar.Fallback>
                    </Avatar.Root>
                    <Box flex="1" minW={0}>
                      <Text
                        fontWeight="semibold"
                        fontSize="sm"
                        lineClamp={1}
                        color="gray.800"
                        _dark={{ color: 'white' }}
                      >
                        {member.user.name}
                      </Text>
                      <HStack gap={2} mt={0.5}>
                        <Badge
                          size="xs"
                          colorPalette={
                            member.role === EMemberRole.ADMIN
                              ? 'orange'
                              : member.role === EMemberRole.MODERATOR
                                ? 'blue'
                                : 'gray'
                          }
                          variant="subtle"
                        >
                          {t(
                            `clubs.memberRole.${member.role.toLowerCase() as 'admin' | 'moderator' | 'member'}`
                          )}
                        </Badge>
                        {member.user.level && (
                          <Text fontSize="2xs" color="gray.500">
                            Lv.{member.user.level}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                  </Flex>
                ))}
              </SimpleGrid>
            ) : (
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={10}
                color="gray.400"
                gap={2}
              >
                <Users size={40} strokeWidth={1.2} />
                <Text fontSize="sm" fontStyle="italic">
                  {t('clubs.adminApproval.noMembersYet')}
                </Text>
              </Flex>
            )}
          </Box>
        </Box>
      </Container>
    </PageLayout>
  );
}
