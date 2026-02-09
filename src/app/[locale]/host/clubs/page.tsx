'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Flex,
  Text,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuPositioner,
  Portal,
  Badge,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Search,
  RefreshCw,
  Users,
  MoreVertical,
} from 'lucide-react';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub, IClubListItem, EClubStatus } from '@/types/club';
import { useRouter } from '@/i18n/config';
import { toaster } from '@/components/ui/toaster';
import LoadingSpinner from '@/components/ui/loading-spinner';
import PageLayout from '@/components/layout/PageLayout';
import { Button, IconButton, SimpleGrid } from '@/components/ui/chakra-compat';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@/components/ui/ChakraTabs';
import { Input } from '@/components/ui/Input';
import ClubCard from '@/components/clubs/ClubCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/lib/api/types';
import { ROUTES } from '@/constants/routes';

const ClubsPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState(0);

  // My Clubs State
  const [myGroups, setMyGroups] = useState<IClub[]>([]);
  const [isMyGroupsLoading, setIsMyGroupsLoading] = useState(true);

  // Browse Clubs State
  const [browseClubs, setBrowseClubs] = useState<IClubListItem[]>([]);
  const [isBrowseLoading, setIsBrowseLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [browsePage, setBrowsePage] = useState(1);
  const [totalBrowsePages, setTotalBrowsePages] = useState(1);
  const [hasMoreBrowse, setHasMoreBrowse] = useState(false);

  const fetchMyGroups = async () => {
    try {
      setIsMyGroupsLoading(true);
      const data = await ClubsService.getClubsToManage();
      setMyGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toaster.error({ title: t('clubs.failedToFetchClubs') });
    } finally {
      setIsMyGroupsLoading(false);
    }
  };

  const fetchBrowseClubs = useCallback(
    async (pageNum: number, searchQuery?: string, append = false) => {
      try {
        setIsBrowseLoading(true);
        const response = await ClubsService.browseClubs({
          page: pageNum,
          limit: 12,
          search: searchQuery || undefined,
        });

        if (append) {
          setBrowseClubs((prev) => [...prev, ...(response.items || [])]);
        } else {
          setBrowseClubs(response.items || []);
        }
        setTotalBrowsePages(response.totalPages || 1);
        setHasMoreBrowse(pageNum < (response.totalPages || 0));
      } catch (error) {
        console.error('Failed to fetch clubs:', error);
        setBrowseClubs([]);
      } finally {
        setIsBrowseLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchMyGroups();
    fetchBrowseClubs(1);
  }, [fetchBrowseClubs]);

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(t('clubs.confirmApprove'))) return; // Reusing confirmApprove for now or adding specific one

    try {
      await ClubsService.deleteClub(groupId);
      toaster.success({ title: t('clubs.clubDeletedSuccess') });
      fetchMyGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
      toaster.error({ title: t('clubs.failedToDeleteClub') });
    }
  };

  const handleSearch = () => {
    setBrowsePage(1);
    fetchBrowseClubs(1, search);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLoadMoreBrowse = () => {
    const nextPage = browsePage + 1;
    setBrowsePage(nextPage);
    fetchBrowseClubs(nextPage, search, true);
  };

  return (
    <PageLayout title={t('navigation.clubs')}>
      <Tabs
        index={activeTab}
        onChange={(idx) => setActiveTab(idx)}
        colorPalette="green"
      >
        <TabList mb={6}>
          <Tab>{t('clubs.browseClubs')}</Tab>
          {(user?.role === UserRole.HOST || user?.role === UserRole.ADMIN) && (
            <Tab>{t('clubs.myClubs')}</Tab>
          )}
        </TabList>

        <TabPanels>
          {/* Tab 0: Browse Clubs */}
          <TabPanel>
            {/* Search Bar */}
            <Box mb={6}>
              <Flex gap={2}>
                <Input
                  placeholder={t('clubs.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  size="lg"
                />
                <Button
                  onClick={handleSearch}
                  colorPalette="green"
                  size="lg"
                  px={6}
                >
                  <Search size={20} />
                  {t('common.search')}
                </Button>
              </Flex>
            </Box>

            {/* Content */}
            {isBrowseLoading && browseClubs.length === 0 ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" colorPalette="green" />
              </Flex>
            ) : browseClubs.length === 0 ? (
              <Box
                textAlign="center"
                py={16}
                px={6}
                bg="gray.50"
                _dark={{ bg: 'gray.800' }}
                borderRadius="2xl"
              >
                <Text
                  fontSize="xl"
                  fontWeight="medium"
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                >
                  {t('clubs.noClubsFound')}
                </Text>
                <Text mt={2} color="gray.500" _dark={{ color: 'gray.500' }}>
                  {t('clubs.noClubsFoundDescription')}
                </Text>
              </Box>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                  {browseClubs.map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))}
                </SimpleGrid>

                {/* Load More Button */}
                {hasMoreBrowse && (
                  <Flex justify="center" mt={8}>
                    <Button
                      onClick={handleLoadMoreBrowse}
                      loading={isBrowseLoading}
                      colorPalette="green"
                      variant="outline"
                      size="lg"
                    >
                      <RefreshCw size={16} />
                      {t('common.loadMore')}
                    </Button>
                  </Flex>
                )}
              </>
            )}
          </TabPanel>

          {/* Tab 1: My Clubs (Conditional) */}
          {(user?.role === UserRole.HOST || user?.role === UserRole.ADMIN) && (
            <TabPanel>
              {/* Add Create Button here */}
              <Flex justify="flex-end" mb={6}>
                <Button
                  colorPalette="green"
                  onClick={() => router.push(ROUTES.HOST.CLUBS.CREATE)}
                  size="md"
                  leftIcon={<Plus size={18} />}
                >
                  {t('navigation.createClub') || 'Tạo CLB mới'}
                </Button>
              </Flex>

              {isMyGroupsLoading ? (
                <LoadingSpinner />
              ) : myGroups.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  p={12}
                  bg="gray.50"
                  _dark={{ bg: 'gray.800' }}
                  borderRadius="lg"
                  borderStyle="dashed"
                  borderWidth="2px"
                >
                  <Users
                    size={48}
                    color="#A0AEC0"
                    style={{ marginBottom: '16px' }}
                  />
                  <Text fontSize="lg" color="gray.500" mb={4}>
                    {t('clubs.noGroupsFound')}
                  </Text>
                  <Button
                    colorPalette="green"
                    variant="outline"
                    onClick={() => router.push(ROUTES.HOST.CLUBS.CREATE)}
                  >
                    {t('clubs.createNewGroup')}
                  </Button>
                </Flex>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                  {myGroups.map((group) => (
                    <Box
                      key={group.id}
                      p={6}
                      bg="white"
                      _dark={{ bg: 'gray.900' }}
                      shadow="sm"
                      borderWidth="1px"
                      borderRadius="lg"
                      position="relative"
                      _hover={{ shadow: 'md' }}
                    >
                      <Flex justify="space-between" align="start" mb={4}>
                        <Box>
                          <Badge
                            colorPalette={group.color || 'gray'}
                            fontSize="0.8em"
                            mb={2}
                            mr={2}
                          >
                            {group.memberCount || 0} {t('clubs.members')}
                          </Badge>
                          {group.status !== EClubStatus.APPROVED && (
                            <Badge
                              colorPalette={
                                group.status === EClubStatus.PENDING
                                  ? 'yellow'
                                  : 'red'
                              }
                              fontSize="0.8em"
                              mb={2}
                            >
                              {t(`clubs.clubStatus.${group.status.toLowerCase()}`)}
                            </Badge>
                          )}
                          <Text fontWeight="bold" fontSize="lg" mb={1}>
                            {group.name}
                          </Text>
                        </Box>
                        <MenuRoot positioning={{ placement: 'bottom-end' }}>
                          <MenuTrigger asChild>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              aria-label="Options"
                            >
                              <MoreVertical size={18} />
                            </IconButton>
                          </MenuTrigger>
                          <Portal>
                            <MenuPositioner>
                              <MenuContent>
                                <MenuItem
                                  value="edit"
                                  onClick={() =>
                                    router.push(ROUTES.HOST.CLUBS.EDIT(group.id))
                                  }
                                >
                                  <Icon as={Edit} mr={2} />
                                  {t('common.edit')}
                                </MenuItem>
                                <MenuItem
                                  value="fees"
                                  onClick={() =>
                                    router.push(ROUTES.HOST.CLUBS.FEES(group.id))
                                  }
                                >
                                  <Icon as={Settings} mr={2} />
                                  {t('clubs.manageFeesTitle')}
                                </MenuItem>
                                <MenuItem
                                  value="delete"
                                  color="red.500"
                                  onClick={() => handleDeleteGroup(group.id)}
                                >
                                  <Icon as={Trash2} mr={2} />
                                  {t('common.delete')}
                                </MenuItem>
                              </MenuContent>
                            </MenuPositioner>
                          </Portal>
                        </MenuRoot>
                      </Flex>

                      <Text
                        color="gray.600"
                        _dark={{ color: 'gray.400' }}
                        mb={2}
                        fontSize="sm"
                        lineClamp={2}
                      >
                        {group.description || t('clubs.noDescription')}
                      </Text>

                      {group.status === EClubStatus.REJECTED &&
                        group.rejectionReason && (
                          <Box
                            p={2}
                            bg="red.50"
                            _dark={{ bg: 'red.900/20' }}
                            borderRadius="md"
                            mb={4}
                          >
                            <Text fontSize="xs" color="red.600" fontWeight="medium">
                              {t('clubs.rejectionReason', {
                                reason: group.rejectionReason,
                              })}
                            </Text>
                          </Box>
                        )}

                      <Button
                        width="full"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(ROUTES.HOST.CLUBS.MEMBERS(group.id))
                        }
                      >
                        {t('clubs.manageMembers')}
                      </Button>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </PageLayout>
  );
};

export default ClubsPage;
