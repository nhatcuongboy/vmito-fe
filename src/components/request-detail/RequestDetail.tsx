'use client';

import { ReactNode } from 'react';
import {
  Box,
  Center,
  EmptyState,
  Flex,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Button, Card, CardBody } from '@/components/ui/chakra-compat';
import { LuArrowLeft, LuCheck } from 'react-icons/lu';

export type TRequestAccent = 'orange' | 'blue' | 'purple';

const ACCENT_STYLES: Record<
  TRequestAccent,
  { bg: string; darkBg: string; color: string }
> = {
  orange: {
    bg: 'orange.100',
    darkBg: 'rgba(251,146,60,0.2)',
    color: 'orange.600',
  },
  blue: {
    bg: 'blue.100',
    darkBg: 'rgba(59,130,246,0.2)',
    color: 'blue.600',
  },
  purple: {
    bg: 'purple.100',
    darkBg: 'rgba(168,85,247,0.2)',
    color: 'purple.600',
  },
};

interface RequestDetailCardProps {
  accent: TRequestAccent;
  icon: ReactNode;
  title: string;
  badges?: ReactNode;
  children: ReactNode;
}

export const RequestDetailCard = ({
  accent,
  icon,
  title,
  badges,
  children,
}: RequestDetailCardProps) => {
  const style = ACCENT_STYLES[accent];

  return (
    <Card mb={4}>
      <CardBody>
        <VStack gap={4} align="stretch">
          <HStack gap={4} align="center">
            <Box
              w="56px"
              h="56px"
              borderRadius="full"
              bg={style.bg}
              _dark={{ bg: style.darkBg }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              color={style.color}
              flexShrink={0}
            >
              {icon}
            </Box>
            <VStack align="start" gap={0.5} minW={0}>
              <Text fontSize="xl" fontWeight="bold" lineClamp={2}>
                {title}
              </Text>
              {badges && <HStack gap={1.5}>{badges}</HStack>}
            </VStack>
          </HStack>

          {children}
        </VStack>
      </CardBody>
    </Card>
  );
};

export const RequestInfoList = ({ children }: { children: ReactNode }) => (
  <VStack
    gap={3}
    align="stretch"
    bg="gray.50"
    _dark={{ bg: 'whiteAlpha.50' }}
    borderRadius="lg"
    p={4}
  >
    {children}
  </VStack>
);

interface RequestInfoRowProps {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}

export const RequestInfoRow = ({
  icon,
  label,
  value,
  children,
}: RequestInfoRowProps) => (
  <HStack gap={3} align="start">
    <Box mt={0.5} color="gray.500" flexShrink={0}>
      {icon}
    </Box>
    <VStack align="start" gap={0} minW={0}>
      <Text fontSize="xs" color="gray.500">
        {label}
      </Text>
      {children ?? (
        <Text fontSize="sm" fontWeight="medium">
          {value}
        </Text>
      )}
    </VStack>
  </HStack>
);

interface RequestActionBarProps {
  rejectLabel: string;
  approveLabel: string;
  onReject: () => void;
  onApprove: () => void;
  loadingAction: 'APPROVED' | 'REJECTED' | null;
}

export const RequestActionBar = ({
  rejectLabel,
  approveLabel,
  onReject,
  onApprove,
  loadingAction,
}: RequestActionBarProps) => (
  <Flex gap={3}>
    <Button
      flex={1}
      size="lg"
      colorPalette="red"
      variant="outline"
      onClick={onReject}
      loading={loadingAction === 'REJECTED'}
      disabled={loadingAction !== null}
    >
      {rejectLabel}
    </Button>
    <Button
      flex={1}
      size="lg"
      colorPalette="green"
      onClick={onApprove}
      loading={loadingAction === 'APPROVED'}
      disabled={loadingAction !== null}
    >
      {approveLabel}
    </Button>
  </Flex>
);

export const RequestLoadingState = () => (
  <Center py={20}>
    <Spinner size="lg" />
  </Center>
);

interface RequestNotFoundStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const RequestNotFoundState = ({
  icon,
  title,
  description,
}: RequestNotFoundStateProps) => (
  <Center py={20}>
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>{icon}</EmptyState.Indicator>
        <EmptyState.Title>{title}</EmptyState.Title>
        <EmptyState.Description>{description}</EmptyState.Description>
      </EmptyState.Content>
    </EmptyState.Root>
  </Center>
);

interface RequestCompletedStateProps {
  title: string;
  backLabel: string;
  onBack: () => void;
}

export const RequestCompletedState = ({
  title,
  backLabel,
  onBack,
}: RequestCompletedStateProps) => (
  <Center py={20}>
    <VStack gap={4}>
      <Box
        w="64px"
        h="64px"
        borderRadius="full"
        bg="green.100"
        _dark={{ bg: 'rgba(34,197,94,0.2)' }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="green.600"
      >
        <LuCheck size={32} />
      </Box>
      <Text fontSize="lg" fontWeight="semibold" textAlign="center">
        {title}
      </Text>
      <Button variant="outline" onClick={onBack}>
        <LuArrowLeft size={16} style={{ marginRight: '6px' }} />
        {backLabel}
      </Button>
    </VStack>
  </Center>
);
