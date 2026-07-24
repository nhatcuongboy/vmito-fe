'use client';

import { ReactNode, useState } from 'react';
import { Box, Collapsible, Icon, Text, VStack } from '@chakra-ui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface IVenueCollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Collapsible wrapper for a venue form section. Header shows the section
 * title with a chevron; the body slides open/closed. Used to hide advanced
 * / rarely-edited groups (coordinates, amenities, policies, media) so the
 * long venue form stays scannable.
 */
const VenueCollapsibleSection = ({
  title,
  defaultOpen = false,
  children,
}: IVenueCollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
      <Collapsible.Trigger
        width="full"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        cursor="pointer"
        py={1}
      >
        <Text fontWeight="semibold" fontSize="sm" color="gray.500">
          {title}
        </Text>
        <Icon asChild boxSize={4} color="gray.400">
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </Icon>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <Box pt={4}>
          <VStack gap={4} align="stretch">
            {children}
          </VStack>
        </Box>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

export default VenueCollapsibleSection;
