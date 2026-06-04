'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Flex, Heading, useBreakpointValue } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  Tournament,
  Category,
  CategoryFormat,
  MatchFormat,
  UpdateCategoryRequest,
} from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VDrawer, useDrawer } from '@/components/ui/VDrawer';
import { useModal } from '@/components/ui/VModal';
import { FormatWizardModal } from '@/components/tournament/format-wizard';
import {
  TournamentFormatType,
  FormatConfig,
  SingleEliminationConfig,
  RoundRobinToSEConfig,
} from '@/components/tournament/format-wizard/types';
import OrganizeTab from './OrganizeTab';
import SettingsTab from './SettingsTab';
import TeamsPanel from './panels/TeamsPanel';
import PlayersPanel from './panels/PlayersPanel';
import CategoriesPanel from './panels/CategoriesPanel';
import FormatPanel from './panels/FormatPanel';
import StandingsPanel from './panels/StandingsPanel';
import RoundsPanel from './panels/RoundsPanel';
import VenuePanel from './panels/VenuePanel';
import SchedulePanel from './panels/SchedulePanel';
import UmpiresPanel from './panels/UmpiresPanel';
import ManagersPanel from './panels/ManagersPanel';
import ResultsPanel from './panels/ResultsPanel';
import SponsorsPanel from './panels/SponsorsPanel';
import NamePanel from './panels/NamePanel';
import DatesPanel from './panels/DatesPanel';
import LocationPanel from './panels/LocationPanel';
import BannerPanel from './panels/BannerPanel';
import ContactPanel from './panels/ContactPanel';
import { TournamentManageSkeleton } from '@/components/tournament/skeletons';
import DuplicateTournamentModal from './DuplicateTournamentModal';

interface TournamentManageProps {
  tournament: Tournament;
  onTournamentUpdate?: (updated: Tournament) => void;
}

const buildFormatUpdatePayload = (
  format: TournamentFormatType,
  config: FormatConfig,
  currentCategory: Category
): UpdateCategoryRequest => {
  const basePayload: UpdateCategoryRequest = {
    format: format as unknown as CategoryFormat,
    formatConfig: config as unknown as Record<string, unknown>,
    hasGroupStage: format !== TournamentFormatType.SINGLE_ELIMINATION,
  };

  if (format === TournamentFormatType.SINGLE_ELIMINATION) {
    const seConfig = config as SingleEliminationConfig;

    return {
      ...basePayload,
      matchFormat: seConfig.matchFormat as MatchFormat,
      eliminationMatchFormat: seConfig.matchFormat as MatchFormat,
      thirdPlaceMatch: seConfig.thirdPlaceMatch,
    };
  }

  if (format === TournamentFormatType.ROUND_ROBIN_TO_SE) {
    const rrToSeConfig = config as RoundRobinToSEConfig;

    return {
      ...basePayload,
      matchFormat: currentCategory.matchFormat ?? MatchFormat.BEST_OF_3,
      eliminationMatchFormat:
        rrToSeConfig.eliminationMatchFormat as MatchFormat,
      winnersPerGroup: rrToSeConfig.qualifiersPerGroup,
    };
  }

  return {
    ...basePayload,
    matchFormat: currentCategory.matchFormat ?? MatchFormat.BEST_OF_3,
  };
};

export default function TournamentManage({
  tournament,
  onTournamentUpdate,
}: TournamentManageProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(() =>
    searchParams.get('option') === 'registration'
      ? null
      : searchParams.get('option')
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const drawer = useDrawer();
  const formatModal = useModal();
  const duplicateModal = useModal();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const data = await CategoryService.getCategories(tournament.id);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Resolve the selected category from URL or fall back to the first one.
  // Re-runs when categories load or when the URL categoryId changes
  // (e.g. browser back/forward navigation).
  useEffect(() => {
    if (categories.length === 0) return;
    const urlCategoryId = searchParams.get('categoryId');
    setSelectedCategory((previousCategory) => {
      if (urlCategoryId) {
        const fromUrl = categories.find((c) => c.id === urlCategoryId);
        if (fromUrl) return fromUrl;
      }
      if (previousCategory) {
        return (
          categories.find((c) => c.id === previousCategory.id) ?? categories[0]
        );
      }
      return categories[0];
    });
  }, [categories, searchParams]);

  // Sync selectedItem when URL option param changes (e.g. back/forward navigation)
  useEffect(() => {
    const option = searchParams.get('option');
    if (option === 'registration') {
      setSelectedItem(null);
      return;
    }
    setSelectedItem(option);
  }, [searchParams]);

  const handleItemClick = useCallback(
    (item: string) => {
      if (item === 'duplicate') {
        duplicateModal.onOpen();
        return;
      }

      setSelectedItem(item);
      // Update URL with option param (excludes publish action)
      if (item !== 'publish') {
        const params = new URLSearchParams(searchParams.toString());
        params.set('option', item);
        router.replace(`?${params.toString()}`, { scroll: false });
      }
      // Only open drawer on mobile devices
      if (isMobile) {
        drawer.onOpen();
      }
    },
    [drawer, duplicateModal, isMobile, router, searchParams]
  );

  const handleClosePanel = useCallback(() => {
    drawer.onClose();
    // Don't clear selectedItem on desktop so panel stays visible
  }, [drawer]);

  const handleSelectCategory = useCallback(
    (category: Category) => {
      setSelectedCategory(category);
      const params = new URLSearchParams(searchParams.toString());
      params.set('categoryId', category.id);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleOpenRoundsPanel = useCallback(
    (categoryId: string) => {
      const category = categories.find((item) => item.id === categoryId);
      if (category) {
        setSelectedCategory(category);
      }

      setSelectedItem('rounds');
      const params = new URLSearchParams(searchParams.toString());
      params.set('option', 'rounds');
      params.set('categoryId', categoryId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [categories, router, searchParams]
  );

  const renderPanel = () => {
    if (!selectedItem) return null;

    switch (selectedItem) {
      case 'teams':
        return (
          <TeamsPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        );
      case 'players':
        return <PlayersPanel tournament={tournament} />;
      case 'categories':
        return (
          <CategoriesPanel
            tournamentId={tournament.id}
            categories={categories}
            onCategoriesChange={loadCategories}
          />
        );
      case 'format':
        return (
          <FormatPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onSwitchFormat={formatModal.onOpen}
            onCategoryUpdated={() => {
              void loadCategories();
            }}
          />
        );
      case 'standings':
        return (
          <StandingsPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onCategoryUpdated={loadCategories}
          />
        );
      case 'rounds':
        return (
          <RoundsPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        );
      case 'venues':
        return <VenuePanel tournament={tournament} />;
      case 'schedule':
        return (
          <SchedulePanel categories={categories} tournament={tournament} />
        );
      case 'umpires':
        return <UmpiresPanel tournament={tournament} />;
      case 'managers':
        return <ManagersPanel tournament={tournament} />;
      case 'results':
        return (
          <ResultsPanel
            tournament={tournament}
            categories={categories}
            onOpenRoundsPanel={handleOpenRoundsPanel}
          />
        );
      case 'sponsors':
        return <SponsorsPanel />;
      case 'name':
        return (
          <NamePanel
            tournament={tournament}
            onTournamentUpdate={onTournamentUpdate}
          />
        );
      case 'dates':
        return (
          <DatesPanel
            tournament={tournament}
            onTournamentUpdate={onTournamentUpdate}
          />
        );
      case 'location':
        return (
          <LocationPanel
            tournament={tournament}
            onTournamentUpdate={onTournamentUpdate}
          />
        );
      case 'banner':
        return (
          <BannerPanel
            tournament={tournament}
            onTournamentUpdate={onTournamentUpdate}
          />
        );
      case 'contact':
        return (
          <ContactPanel
            tournament={tournament}
            onTournamentUpdate={onTournamentUpdate}
          />
        );
      default:
        return null;
    }
  };

  if (loadingCategories) {
    return <TournamentManageSkeleton />;
  }

  return (
    <>
      {/* Page heading */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="xl">{t('title')}</Heading>
      </Flex>

      {/* Sub-tabs: Organize / Settings */}
      <Tabs defaultValue="organize">
        <TabsList
          bg="gray.100"
          borderRadius="full"
          p={1}
          mb={4}
          w="fit-content"
          borderWidth="1px"
          borderColor="transparent"
          _dark={{
            bg: 'var(--tournament-surface-muted, var(--chakra-colors-gray-800))',
            borderColor:
              'var(--tournament-border, var(--chakra-colors-gray-700))',
            boxShadow: 'var(--tournament-shadow-soft, none)',
          }}
        >
          <TabsTrigger
            value="organize"
            borderRadius="full"
            px={5}
            py={1.5}
            fontSize="sm"
          >
            {t('tabs.organize')}
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            borderRadius="full"
            px={5}
            py={1.5}
            fontSize="sm"
          >
            {t('tabs.settings')}
          </TabsTrigger>
        </TabsList>

        {/* 2-column layout */}
        <Flex gap={6} align="flex-start">
          {/* Left column: menu items */}
          <Box flex={{ md: '0 1 42%', xl: '0 1 38%' }} minW={0}>
            <TabsContent value="organize">
              <OrganizeTab
                tournament={tournament}
                categories={categories}
                selectedItem={selectedItem}
                onItemClick={handleItemClick}
                onTournamentUpdate={(updated) => onTournamentUpdate?.(updated)}
              />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsTab
                tournament={tournament}
                selectedItem={selectedItem}
                onItemClick={handleItemClick}
              />
            </TabsContent>
          </Box>

          {/* Right column: detail panel (desktop only) */}
          <Box
            display={{ base: 'none', md: 'block' }}
            flex={{ md: '0 0 58%', xl: '0 0 62%' }}
            minW={0}
            position="sticky"
            top="80px"
            maxH="calc(100vh - 120px)"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(148, 163, 184, 0.45)',
                borderRadius: '2px',
              },
            }}
          >
            {selectedItem && selectedItem !== 'publish' && (
              <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="xl"
                p={5}
                bg="white"
                boxShadow="sm"
                _dark={{
                  bg: 'var(--tournament-surface-raised, var(--chakra-colors-gray-800))',
                  borderColor:
                    'var(--tournament-border, var(--chakra-colors-gray-700))',
                  boxShadow: 'var(--tournament-shadow)',
                }}
              >
                {renderPanel()}
              </Box>
            )}
          </Box>
        </Flex>
      </Tabs>

      {/* Mobile drawer */}
      <Box display={{ base: 'block', md: 'none' }}>
        <VDrawer
          isOpen={drawer.isOpen}
          onClose={handleClosePanel}
          title={
            selectedItem && selectedItem !== 'publish'
              ? t(`panelTitles.${selectedItem}`)
              : ''
          }
          size="lg"
          hideSecondaryAction
        >
          {renderPanel()}
        </VDrawer>
      </Box>

      {/* Format Wizard Modal */}
      <FormatWizardModal
        isOpen={formatModal.isOpen}
        onClose={formatModal.onClose}
        initialFormat={
          selectedCategory?.format as unknown as TournamentFormatType
        }
        initialConfig={
          selectedCategory?.formatConfig as unknown as FormatConfig | null
        }
        onConfirm={async (format, config) => {
          if (!selectedCategory) return;
          try {
            const data = buildFormatUpdatePayload(
              format,
              config,
              selectedCategory
            );
            const updated = await CategoryService.updateCategory(
              selectedCategory.id,
              data
            );
            const updatedCategories = categories.map((cat) =>
              cat.id === updated.id ? updated : cat
            );
            setCategories(updatedCategories);
            setSelectedCategory(updated);
          } catch (error) {
            console.error('Error updating category format:', error);
          }
        }}
      />

      <DuplicateTournamentModal
        isOpen={duplicateModal.isOpen}
        onClose={duplicateModal.onClose}
        tournament={tournament}
      />
    </>
  );
}
