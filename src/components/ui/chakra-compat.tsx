'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  useDisclosure as useChakraDisclosure,
} from '@chakra-ui/react';

// Create Card components
export const Card = ({ children, ...props }: React.PropsWithChildren<any>) => (
  <Box
    border="1px"
    borderColor="gray.200"
    borderRadius="md"
    overflow="hidden"
    bg="white"
    _dark={{ bg: 'gray.800' }}
    boxShadow="sm"
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

export const TableContainer = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box overflowX="auto" {...props}>
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

export const TabList = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    display="flex"
    borderBottom="1px solid"
    borderColor="gray.200"
    {...props}
  >
    {children}
  </Box>
);

// Create Tabs component that works with TabList and TabPanels
interface TabsComponentProps {
  children: React.ReactNode;
  variant?: string;
  colorPalette?: string;
  index?: number;
  onChange?: (index: number) => void;
}

export const Tabs: React.FC<TabsComponentProps> = ({
  children,
  index = 0,
  onChange,
  ...props
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

  // Extract TabList and TabPanels from children
  const childrenArray = React.Children.toArray(children);
  const tabList = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === TabList
  );
  const tabPanels = childrenArray.find(
    (child) => React.isValidElement(child) && child.type === TabPanels
  );

  // Clone TabList with click handlers on Tab children
  const enhancedTabList = React.isValidElement(tabList)
    ? React.cloneElement(
        tabList as React.ReactElement<React.PropsWithChildren<any>>,
        {},
        React.Children.map(
          (tabList as React.ReactElement<React.PropsWithChildren<any>>).props
            .children,
          (tab: React.ReactNode, idx: number) => {
            if (React.isValidElement(tab) && tab.type === Tab) {
              return React.cloneElement(tab as React.ReactElement<TabProps>, {
                key: idx,
                onClick: () => handleTabClick(idx),
                'data-selected': selectedIndex === idx,
                'aria-selected': selectedIndex === idx,
              });
            }
            return tab;
          }
        )
      )
    : tabList;

  // Clone TabPanels with selected index
  const enhancedTabPanels = React.isValidElement(tabPanels)
    ? React.cloneElement(tabPanels as React.ReactElement<TabPanelsProps>, {
        index: selectedIndex,
      })
    : tabPanels;

  return (
    <Box {...props}>
      {enhancedTabList}
      {enhancedTabPanels}
    </Box>
  );
};

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
export const useColorModeValue = (lightValue: any) => {
  // For now, we'll always return the light value, but this can be enhanced
  return lightValue;
};

// Create Modal components
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, size, children }: ModalProps) => {
  if (!isOpen) return null;

  const maxWidth = size === 'lg' ? '600px' : size === 'md' ? '500px' : '400px';

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="xl"
        maxW={maxWidth}
        w="full"
        maxH="90vh"
        overflow="auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Box>
    </Box>
  );
};

export const ModalOverlay = () => null; // Handled by Modal

export const ModalContent = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box position="relative" {...props}>
    {children}
  </Box>
);

export const ModalHeader = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    p={4}
    pr={12}
    borderBottomWidth="1px"
    borderColor="gray.200"
    fontWeight="bold"
    fontSize="lg"
    {...props}
  >
    {children}
  </Box>
);

export const ModalBody = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box p={4} {...props}>
    {children}
  </Box>
);

export const ModalFooter = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box
    p={4}
    borderTopWidth="1px"
    borderColor="gray.200"
    display="flex"
    justifyContent="flex-end"
    gap={3}
    {...props}
  >
    {children}
  </Box>
);

export const ModalCloseButton = ({
  onClose,
  ...props
}: { onClose?: () => void } & any) => (
  <Box
    as="button"
    position="absolute"
    top={2}
    right={2}
    p={1}
    borderRadius="md"
    _hover={{ bg: 'gray.100' }}
    onClick={onClose}
    {...props}
  >
    <Box as="span" fontSize="xl" lineHeight={1}>
      ×
    </Box>
  </Box>
);

// Create Form components
interface FormControlProps {
  children: React.ReactNode;
  isRequired?: boolean;
}

export const FormControl = ({
  children,
  isRequired,
  ...props
}: FormControlProps & any) => (
  <Box mb={4} {...props}>
    {React.Children.map(children, (child) => {
      if (
        React.isValidElement(child) &&
        child.type === FormLabel &&
        isRequired
      ) {
        const childElement = child as React.ReactElement<FormLabelProps>;
        return React.cloneElement(childElement, {
          children: (
            <>
              {childElement.props.children}
              <Box as="span" color="red.500" ml={1}>
                *
              </Box>
            </>
          ),
        });
      }
      return child;
    })}
  </Box>
);

interface FormLabelProps {
  children: React.ReactNode;
}

export const FormLabel = ({ children, ...props }: FormLabelProps & any) => (
  <Box
    as="label"
    display="block"
    mb={2}
    fontWeight="medium"
    fontSize="sm"
    {...props}
  >
    {children}
  </Box>
);

// Export Select component from dedicated file
export { Select, LegacySelect } from './Select';
export type { SelectProps, LegacySelectProps, SelectOption } from './Select';





// Create enhanced Input with leftElement support
interface InputProps extends ChakraInputProps {
  leftElement?: React.ReactNode;
}

export const Input = ({ leftElement, ...props }: InputProps) => {
  if (leftElement) {
    return (
      <Box position="relative" width="100%">
        <Box
          position="absolute"
          left={3}
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
          pointerEvents="none"
        >
          {leftElement}
        </Box>
        <ChakraInput pl={10} {...props} />
      </Box>
    );
  }
  return <ChakraInput {...props} />;
};

// Create useDisclosure wrapper that returns isOpen instead of open
export const useDisclosure = (defaultIsOpen = false) => {
  const { open, onOpen, onClose, onToggle, setOpen } = useChakraDisclosure({
    defaultOpen: defaultIsOpen,
  });
  return {
    isOpen: open,
    onOpen,
    onClose,
    onToggle,
    setOpen,
  };
};
