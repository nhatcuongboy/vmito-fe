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
interface TabsProps {
  children: React.ReactNode;
  index?: number;
  onChange?: (index: number) => void;
}

interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  'data-selected'?: boolean;
  'aria-selected'?: boolean;
  flex?: string | number;
  textAlign?: string;
  style?: React.CSSProperties;
}

interface TabPanelsProps {
  children: React.ReactNode;
  index?: number;
}

export const TabsComp: React.FC<TabsProps> = ({
  children,
  index = 0,
  onChange,
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState(index);

  React.useEffect(() => {
    setSelectedIndex(index);
  }, [index]);

  const handleTabClick = (idx: number) => {
    setSelectedIndex(idx);
    if (onChange) {
      onChange(idx);
    }
  };

  // Extract children to manipulate them
  const childrenArray = React.Children.toArray(children);

  // Find TabPanels component
  const tabPanels = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === TabPanels
  );

  // Find all Tab components and wrap them in a flex container
  const tabs = childrenArray.filter(
    (child) => React.isValidElement(child) && child.type === Tab
  );

  return (
    <Box>
      <Box
        display="flex"
        mb={4}
        borderBottom="1px solid"
        borderColor="gray.200"
        overflowX="auto"
        overflowY="hidden"
        css={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        {React.Children.map(tabs, (child, idx) => {
          if (!React.isValidElement(child)) return null;
          return React.cloneElement(child as React.ReactElement<TabProps>, {
            key: idx,
            onClick: () => handleTabClick(idx),
            'data-selected': selectedIndex === idx,
            'aria-selected': selectedIndex === idx,
          });
        })}
      </Box>
      {React.isValidElement(tabPanels) &&
        React.cloneElement(tabPanels as React.ReactElement<TabPanelsProps>, {
          index: selectedIndex,
        })}
    </Box>
  );
};

export const Tab = ({ children, ...props }: TabProps) => {
  const isSelected = props['data-selected'];

  return (
    <Box
      as="button"
      px="4"
      py="2"
      minW="fit-content"
      whiteSpace="nowrap"
      fontWeight={isSelected ? 'bold' : 'medium'}
      color={isSelected ? 'blue.500' : 'gray.500'}
      borderBottom="2px solid"
      borderColor={isSelected ? 'blue.500' : 'transparent'}
      transition="all 0.2s"
      _hover={{ color: isSelected ? 'blue.600' : 'gray.700' }}
      fontSize="sm"
      {...props}
    >
      {children}
    </Box>
  );
};

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
  index = 0,
  ...props
}: TabPanelsProps) => (
  <Box {...props}>{React.Children.toArray(children)[index] || null}</Box>
);

// Create enhanced Button with leftIcon support
export interface ButtonProps extends Omit<ChakraButtonProps, 'as'> {
  leftIcon?: React.ReactNode;
  as?: React.ElementType;
  href?: string; // Add href prop for Link compatibility
  isWithinLink?: boolean; // Flag to indicate button is inside a Link
}

export const Button = ({
  leftIcon,
  children,
  as,
  href,
  isWithinLink,
  ...props
}: ButtonProps) => {
  // Special case: if this button is inside a Link component, don't set as="a"
  // to avoid nested <a> tags
  if (isWithinLink) {
    return (
      <ChakraButton {...props}>
        {leftIcon && (
          <Box mr="2" display="inline-block">
            {leftIcon}
          </Box>
        )}
        {children}
      </ChakraButton>
    );
  }

  // Handle Next.js Link specifically
  if (as && typeof as !== 'string' && href) {
    const LinkComponent = as;
    return (
      <LinkComponent href={href} style={{ textDecoration: 'none' }}>
        <ChakraButton {...props}>
          {leftIcon && (
            <Box mr="2" display="inline-block">
              {leftIcon}
            </Box>
          )}
          {children}
        </ChakraButton>
      </LinkComponent>
    );
  }

  // Regular button or other element
  const ComponentType = as || 'button';
  // Only include href if ComponentType is a string that accepts href (like 'a')
  const extraProps = href && typeof ComponentType === 'string' ? { href } : {};

  return (
    <ChakraButton as={ComponentType} {...extraProps} {...props}>
      {leftIcon && (
        <Box mr="2" display="inline-block">
          {leftIcon}
        </Box>
      )}
      {children}
    </ChakraButton>
  );
};

// Create enhanced IconButton with icon support
interface IconButtonProps extends ChakraIconButtonProps {
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const IconButton = ({ icon, isLoading, ...props }: IconButtonProps) => (
  <ChakraIconButton loading={isLoading} {...props}>
    {icon}
  </ChakraIconButton>
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

// Create a function to mimic useColorModeValue
export const useColorModeValue = (lightValue: any, darkValue: any) => {
  // For now, we'll always return the light value, but this can be enhanced
  return lightValue;
};

// Create our own toast implementation since useToast is not available in Chakra v3
export const useToast = () => {
  return {
    toast: (options: any) => {
      console.log('Toast:', options);
      // We'll implement proper toast in the next iteration
    },
  };
};
