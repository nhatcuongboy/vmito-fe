'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuPositioner,
  Portal,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { FixedMemberGroupsService } from '@/lib/api/fixed-member-groups.service';
import { IFixedMemberGroup } from '@/types/fixed-member';
import { useRouter } from '@/i18n/config';
import { toaster } from '@/components/ui/toaster';
import LoadingSpinner from '@/components/ui/loading-spinner';
import PageLayout from '@/components/layout/PageLayout';
import { Button, IconButton, SimpleGrid } from '@/components/ui/chakra-compat';

const FixedMemberGroupsPage = () => {
  const t = useTranslations('fixedMembers');
  const router = useRouter();
  const [groups, setGroups] = useState<IFixedMemberGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const data = await FixedMemberGroupsService.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toaster.error({ title: t('failedToFetchGroups') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(t('confirmDeleteGroup'))) return;

    try {
      await FixedMemberGroupsService.deleteGroup(groupId);
      toaster.success({ title: t('groupDeletedSuccess') });
      fetchGroups();
    } catch (error) {
      console.error('Failed to delete group:', error);
      toaster.error({ title: t('failedToDeleteGroup') });
    }
  };

  if (isLoading) {
    return (
      <PageLayout
        title={t('fixedMemberGroups')}
        isLoading={true}
        loadingComponent={<LoadingSpinner />}
      >
        {/* Content will be replaced by loading component */}
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t('fixedMemberGroups')}>
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg" mb={2}>
            {t('fixedMemberGroups')}
          </Heading>
          <Text color="gray.500">{t('manageYourGroups')}</Text>
        </Box>
        <Button
          leftIcon={<Plus />}
          colorPalette="blue"
          onClick={() => router.push('/host/fixed-members/create')}
        >
          {t('createGroup')}
        </Button>
      </Flex>

      {groups.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          p={12}
          bg="gray.50"
          borderRadius="lg"
          borderStyle="dashed"
          borderWidth="2px"
        >
          <Text fontSize="lg" color="gray.500" mb={4}>
            {t('noGroupsFound')}
          </Text>
          <Button
            colorPalette="blue"
            variant="outline"
            onClick={() => router.push('/host/fixed-members/create')}
          >
            {t('createNewGroup')}
          </Button>
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {Array.isArray(groups) &&
            groups.map((group) => (
              <Box
                key={group.id}
                p={6}
                bg="white"
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
                    >
                      {group.memberCount || 0} {t('members')}
                    </Badge>
                    <Heading size="md" mb={1}>
                      {group.name}
                    </Heading>
                  </Box>
                  <MenuRoot positioning={{ placement: 'bottom-end' }}>
                    <MenuTrigger asChild>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label="Options"
                        icon={<Settings />}
                      />
                    </MenuTrigger>
                    <Portal>
                      <MenuPositioner>
                        <MenuContent>
                          <MenuItem
                            value="edit"
                            onClick={() =>
                              router.push(
                                `/host/fixed-members/${group.id}/edit`
                              )
                            }
                          >
                            <Icon as={Edit} mr={2} />
                            {t('edit')}
                          </MenuItem>
                          <MenuItem
                            value="fees"
                            onClick={() =>
                              router.push(
                                `/host/fixed-members/${group.id}/fees`
                              )
                            }
                          >
                            <Icon as={Settings} mr={2} />
                            {t('manageFees')}
                          </MenuItem>
                          <MenuItem
                            value="delete"
                            color="red.500"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Icon as={Trash2} mr={2} />
                            {t('delete')}
                          </MenuItem>
                        </MenuContent>
                      </MenuPositioner>
                    </Portal>
                  </MenuRoot>
                </Flex>

                <Text
                  color="gray.600"
                  mb={4}
                  overflow="hidden"
                  display="-webkit-box"
                  style={{
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {group.description || t('noDescription')}
                </Text>

                <Button
                  width="full"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(`/host/fixed-members/${group.id}/members`)
                  }
                >
                  {t('manageMembers')}
                </Button>
              </Box>
            ))}
        </SimpleGrid>
      )}
    </PageLayout>
  );
};

export default FixedMemberGroupsPage;
