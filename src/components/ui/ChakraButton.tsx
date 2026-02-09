'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  IconButton as ChakraIconButton,
  IconButtonProps as ChakraIconButtonProps,
  Box,
} from '@chakra-ui/react';

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

export const IconButton = ({
  icon,
  isLoading,
  children,
  ...props
}: IconButtonProps & { children?: React.ReactNode }) => (
  <ChakraIconButton loading={isLoading} {...props}>
    {icon}
    {children}
  </ChakraIconButton>
);
