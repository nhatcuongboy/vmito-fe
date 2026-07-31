'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { ListChecks } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { notifyTournamentGuideToggle } from '@/lib/tournamentGuideEvents';
import { VTooltip } from '@/components/ui/VTooltip';

interface TournamentGuideButtonProps {
  isCollapsed?: boolean;
}

export function TournamentGuideButton({
  isCollapsed = false,
}: TournamentGuideButtonProps) {
  const navigation = useTranslations('navigation');
  const label = navigation('tournamentGuide');

  const buttonContent = (
    <Button
      type="button"
      onClick={notifyTournamentGuideToggle}
      aria-label={label}
      w="full"
      display="flex"
      alignItems="center"
      justifyContent={isCollapsed ? 'center' : 'flex-start'}
      gap={3}
      px={isCollapsed ? 2 : 3}
      py={2.5}
      h="auto"
      minH="auto"
      variant="ghost"
      borderRadius="xl"
      borderWidth="1px"
      bg="green.50/80"
      borderColor="green.200/80"
      color="green.900"
      boxShadow="0 2px 6px rgba(34, 197, 94, 0.06)"
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      cursor="pointer"
      textAlign="left"
      _hover={{
        bg: 'green.100/90',
        borderColor: 'green.300',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.16)',
      }}
      _active={{
        transform: 'translateY(0)',
        boxShadow: '0 1px 4px rgba(34, 197, 94, 0.1)',
      }}
      _dark={{
        bg: 'rgba(34, 197, 94, 0.12)',
        borderColor: 'rgba(34, 197, 94, 0.28)',
        color: 'green.200',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        _hover: {
          bg: 'rgba(34, 197, 94, 0.22)',
          borderColor: 'rgba(34, 197, 94, 0.45)',
          color: 'green.100',
          boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
        },
      }}
    >
      <Flex
        w="30px"
        h="30px"
        borderRadius="lg"
        bg="green.600"
        color="white"
        align="center"
        justify="center"
        flexShrink={0}
        boxShadow="0 2px 6px rgba(22, 163, 74, 0.35)"
        _dark={{
          bg: 'green.500',
          boxShadow: '0 0 10px rgba(34, 197, 94, 0.45)',
        }}
      >
        <ListChecks size={17} strokeWidth={2.2} />
      </Flex>
      {!isCollapsed && (
        <Text
          fontSize="xs"
          fontWeight="semibold"
          lineHeight="tight"
          color="inherit"
          textAlign="left"
          flex="1"
        >
          {label}
        </Text>
      )}
    </Button>
  );

  if (isCollapsed) {
    return (
      <VTooltip content={label} positioning={{ placement: 'right' }} showArrow>
        {buttonContent}
      </VTooltip>
    );
  }

  return buttonContent;
}
