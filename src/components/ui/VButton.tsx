'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import {
  Button,
  ButtonProps,
  IconButton as ChakraIconButton,
  IconButtonProps as ChakraIconButtonProps,
  Box,
} from '@chakra-ui/react';

// Create enhanced Button with leftIcon support
export interface VButtonProps extends Omit<ButtonProps, 'as'> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: React.ElementType;
  href?: string; // Add href prop for Link compatibility
  isWithinLink?: boolean; // Flag to indicate button is inside a Link
}

export const VButton = ({
  leftIcon,
  rightIcon,
  children,
  as,
  href,
  isWithinLink,
  colorPalette = 'green', // Default colorPalette to match theme defaultVariants
  ...props
}: VButtonProps) => {
  // Special case: if this button is inside a Link component, don't set as="a"
  // to avoid nested <a> tags
  if (isWithinLink) {
    return (
      <Button colorPalette={colorPalette} {...props}>
        {leftIcon && (
          <Box mr="1" display="inline-block">
            {leftIcon}
          </Box>
        )}
        {children}
        {rightIcon && (
          <Box ml="1" display="inline-block">
            {rightIcon}
          </Box>
        )}
      </Button>
    );
  }

  // Handle Next.js Link specifically
  if (as && typeof as !== 'string' && href) {
    const LinkComponent = as;
    return (
      <LinkComponent href={href} style={{ textDecoration: 'none' }}>
        <Button colorPalette={colorPalette} {...props}>
          {leftIcon && (
            <Box mr="1" display="inline-block">
              {leftIcon}
            </Box>
          )}
          {children}
          {rightIcon && (
            <Box ml="1" display="inline-block">
              {rightIcon}
            </Box>
          )}
        </Button>
      </LinkComponent>
    );
  }

  // Regular button or other element
  const ComponentType = as || 'button';
  // Only include href if ComponentType is a string that accepts href (like 'a')
  const extraProps = href && typeof ComponentType === 'string' ? { href } : {};

  return (
    <Button
      as={ComponentType}
      colorPalette={colorPalette}
      {...extraProps}
      {...props}
    >
      {leftIcon && (
        <Box mr="1" display="inline-block">
          {leftIcon}
        </Box>
      )}
      {children}
      {rightIcon && (
        <Box ml="1" display="inline-block">
          {rightIcon}
        </Box>
      )}
    </Button>
  );
};

// Create enhanced IconButton with icon support
interface IconButtonProps extends ChakraIconButtonProps {
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const IconButton = ({
  icon,
  isLoading,
  children,
  colorPalette = 'green', // Default colorPalette to match theme defaultVariants
  ...props
}: IconButtonProps & { children?: React.ReactNode }) => (
  <ChakraIconButton loading={isLoading} colorPalette={colorPalette} {...props}>
    {icon}
    {children}
  </ChakraIconButton>
);
