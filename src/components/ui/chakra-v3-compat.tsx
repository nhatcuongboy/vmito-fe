'use client';

import React from 'react';
import {
  Box,
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  Stack,
  StackProps,
  SimpleGrid as ChakraSimpleGrid,
  SimpleGridProps as ChakraSimpleGridProps,
  IconButton as ChakraIconButton,
  IconButtonProps as ChakraIconButtonProps,
  Heading as ChakraHeading,
} from '@chakra-ui/react';

// Create Card components
export const Card = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box
    border="1px"
    borderColor="gray.200"
    borderRadius="md"
    overflow="hidden"
    {...props}
  >
    {children}
  </Box>
);

export const CardHeader = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    p="4"
    fontWeight="bold"
    borderBottomWidth="1px"
    borderColor="gray.200"
    {...props}
  >
    {children}
  </Box>
);

export const CardBody = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p="4" {...props}>
    {children}
  </Box>
);

// Create Table components
export const Table = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="table" width="100%" {...props}>
    {children}
  </Box>
);

export const Thead = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="thead" {...props}>
    {children}
  </Box>
);

export const Tbody = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="tbody" {...props}>
    {children}
  </Box>
);

export const Tr = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="tr" display="flex" {...props}>
    {children}
  </Box>
);

export const Th = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="th" padding="2" fontWeight="bold" flex="1" {...props}>
    {children}
  </Box>
);

export const Td = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="td" padding="2" flex="1" {...props}>
    {children}
  </Box>
);

// Create Tab components
export const TabsComp = ({
  children,
  index,
  onChange,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box {...props}>
    {React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          index,
          onChange,
        });
      }
      return child;
    })}
  </Box>
);

export const Tab = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box as="button" px="4" py="2" fontWeight="medium" {...props}>
    {children}
  </Box>
);

export const TabPanel = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box pt="4" {...props}>
    {children}
  </Box>
);

export const TabPanels = ({
  children,
  index,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box {...props}>
    {React.Children.map(children, (child, i) => {
      if (React.isValidElement(child) && i === index) {
        return child;
      }
      return null;
    })}
  </Box>
);

// Create enhanced Button with leftIcon support
interface ButtonProps extends ChakraButtonProps {
  leftIcon?: React.ReactNode;
}

export const Button = ({ leftIcon, children, ...props }: ButtonProps) => (
  <ChakraButton {...props}>
    {leftIcon && (
      <Box mr="2" display="inline-block">
        {leftIcon}
      </Box>
    )}
    {children}
  </ChakraButton>
);

// Create enhanced IconButton with icon support
interface IconButtonProps extends ChakraIconButtonProps {
  icon?: React.ReactNode;
}

export const IconButton = ({ icon, ...props }: IconButtonProps) => (
  <ChakraIconButton {...props}>{icon}</ChakraIconButton>
);

// Create enhanced Stack components with spacing support
interface EnhancedStackProps extends StackProps {
  spacing?: number | string;
}

export const HStack = ({ spacing, children, ...props }: EnhancedStackProps) => (
  <Stack direction="row" gap={spacing} {...props}>
    {children}
  </Stack>
);

export const VStack = ({
  spacing,
  children,
  align,
  ...props
}: EnhancedStackProps & { align?: string }) => (
  <Stack
    direction="column"
    gap={spacing}
    alignItems={
      align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align
    }
    {...props}
  >
    {children}
  </Stack>
);

// Create enhanced SimpleGrid with spacing support
interface EnhancedSimpleGridProps extends ChakraSimpleGridProps {
  spacing?: number | string;
}

export const SimpleGrid = ({
  spacing,
  children,
  ...props
}: EnhancedSimpleGridProps) => (
  <ChakraSimpleGrid gap={spacing} {...props}>
    {children}
  </ChakraSimpleGrid>
);

// Create Divider component
export const Divider = () => <Box height="1px" bg="gray.200" my="3" />;

// Create drawer components
export const Drawer = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    position="fixed"
    top="0"
    right="0"
    bottom="0"
    width="100%"
    maxWidth="500px"
    bg="white"
    boxShadow="lg"
    zIndex="modal"
    {...props}
  >
    {children}
  </Box>
);

export const DrawerContent = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box height="100%" display="flex" flexDirection="column" {...props}>
    {children}
  </Box>
);

export const DrawerHeader = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p="4" borderBottomWidth="1px" borderColor="gray.200" {...props}>
    <ChakraHeading size="md">{children}</ChakraHeading>
  </Box>
);

export const DrawerBody = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p="4" flex="1" overflowY="auto" {...props}>
    {children}
  </Box>
);

export const DrawerFooter = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p="4" borderTopWidth="1px" borderColor="gray.200" {...props}>
    {children}
  </Box>
);

