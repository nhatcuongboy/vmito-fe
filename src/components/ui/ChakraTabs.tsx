'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Box, chakra } from '@chakra-ui/react';

const ChakraButton = chakra('button');

export const TabPanel = ({
  children,
  ...props
}: React.PropsWithChildren<any>) => (
  <Box pt="4" {...props}>
    {children}
  </Box>
);

interface TabPanelsProps {
  children: React.ReactNode;
  index?: number;
}

export const TabPanels = ({
  children,
  index = 0,
  ...props
}: TabPanelsProps) => (
  <Box {...props}>{React.Children.toArray(children)[index] || null}</Box>
);

interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  'data-selected'?: boolean;
  'aria-selected'?: boolean;
  flex?: string | number;
  textAlign?: string;
  style?: React.CSSProperties;
}

export const Tab = ({ children, ...props }: TabProps) => {
  const isSelected = props['data-selected'];

  return (
    <ChakraButton
      type="button"
      px="4"
      py="2"
      minW="fit-content"
      whiteSpace="nowrap"
      fontWeight={isSelected ? 'bold' : 'medium'}
      color={isSelected ? 'brand.500' : 'gray.500'}
      borderBottom="2px solid"
      borderColor={isSelected ? 'brand.500' : 'transparent'}
      transition="all 0.2s"
      _hover={{ color: isSelected ? 'brand.600' : 'gray.700' }}
      fontSize="sm"
      background="none"
      border="none"
      cursor="pointer"
      {...(props as any)}
    >
      {children}
    </ChakraButton>
  );
};

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

interface TabsProps {
  children: React.ReactNode;
  index?: number;
  onChange?: (index: number) => void;
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
