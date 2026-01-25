'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Box } from '@chakra-ui/react';

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
