'use client';

import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from '@/i18n/config';

export interface SidebarNavItem {
  id: number | string;
  label: string;
  icon: LucideIcon;
  /** Optional badge content (e.g. a count number) */
  badge?: ReactNode;
  /** Optional href for direct navigation. If provided, onItemClick is called but navigation is handled by Link. */
  href?: string;
}

export interface SidebarNavSection {
  /** Optional section heading shown above nav items */
  title?: string;
  items: SidebarNavItem[];
}

interface SidebarNavProps {
  /** Header slot: any content rendered above nav items (image, entity info, etc.) */
  header?: ReactNode;
  /** Flat list of nav items OR grouped sections */
  items?: SidebarNavItem[];
  sections?: SidebarNavSection[];
  activeId: number | string;
  onItemClick: (id: number | string) => void;
  /** Width of the sidebar. Defaults to "250px". */
  width?: string;
  /** Top offset for sticky positioning. Defaults to "80px". */
  topOffset?: string;
  /** Custom class or style. Passed to the outermost Box. */
  className?: string;
}

/**
 * A reusable desktop sidebar navigation card, modelled after the
 * TournamentSidebar design (white card, rounded corners, soft shadow).
 *
 * Usage:
 *   <SidebarNav
 *     header={<SomeHeaderContent />}
 *     items={navItems}
 *     activeId={activeId}
 *     onItemClick={handleNavClick}
 *   />
 */
export default function SidebarNav({
  header,
  items,
  sections,
  activeId,
  onItemClick,
  width = '250px',
  topOffset = '80px',
}: SidebarNavProps) {
  // Normalise to sections so the renderer is uniform
  const resolvedSections: SidebarNavSection[] =
    sections ?? (items ? [{ items }] : []);

  const renderItem = (item: SidebarNavItem) => {
    const Icon = item.icon;
    const isActive = activeId === item.id;

    const Content = (
      <Flex
        align="center"
        gap={3}
        px={3}
        py={2.5}
        borderRadius="lg"
        cursor="pointer"
        fontWeight={isActive ? 'semibold' : 'medium'}
        color={isActive ? 'gray.900' : 'gray.600'}
        _dark={{
          color: isActive ? 'white' : 'gray.400',
          bg: isActive ? 'green.950/20' : 'transparent',
          _hover: { bg: isActive ? 'green.950/20' : 'gray.700' },
        }}
        bg={isActive ? 'gray.100' : 'transparent'}
        _hover={{ bg: isActive ? 'gray.100' : 'gray.50' }}
        transition="all 0.15s"
        w="full"
        textAlign="left"
      >
        <Icon
          size={18}
          color={isActive ? 'var(--chakra-colors-green-500)' : 'currentColor'}
        />
        <Text fontSize="sm" flex={1}>
          {item.label}
        </Text>
        {item.badge != null && (
          <Box
            as="span"
            fontSize="xs"
            fontWeight="bold"
            lineHeight={1}
            px={1.5}
            py={0.5}
            borderRadius="full"
            bg="red.500"
            color="white"
            minW="18px"
            textAlign="center"
          >
            {item.badge}
          </Box>
        )}
      </Flex>
    );

    if (item.href) {
      return (
        <Link
          key={item.id}
          href={item.href}
          style={{ width: '100%', display: 'block' }}
          onClick={() => onItemClick(item.id)}
        >
          {Content}
        </Link>
      );
    }

    return (
      <Box
        key={item.id}
        as="button"
        w="full"
        onClick={() => onItemClick(item.id)}
      >
        {Content}
      </Box>
    );
  };

  return (
    <Box
      w={width}
      flexShrink={0}
      position="sticky"
      top={topOffset}
      alignSelf="flex-start"
      height={`calc(100vh - ${topOffset})`}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Optional header slot (image, entity meta, etc.) */}
      {header && <Box flexShrink={0}>{header}</Box>}

      {/* Navigation sections */}
      <Box
        px={2}
        pb={4}
        pt={header ? 4 : 3}
        display="flex"
        flexDirection="column"
        gap={0}
        flex={1}
        overflowY="auto"
      >
        {resolvedSections.map((section, sIdx) => (
          <Box key={sIdx} mb={sIdx < resolvedSections.length - 1 ? 4 : 0}>
            {section.title && (
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
                px={3}
              >
                {section.title}
              </Text>
            )}
            <VStack gap={0.5} align="stretch">
              {section.items.map(renderItem)}
            </VStack>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
