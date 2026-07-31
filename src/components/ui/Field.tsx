import { Badge, Field as ChakraField } from '@chakra-ui/react';
import * as React from 'react';

export interface FieldProps extends Omit<ChakraField.RootProps, 'label'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  errorText?: React.ReactNode;
  optionalText?: React.ReactNode;
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  function Field(props, ref) {
    const { label, children, helperText, errorText, optionalText, ...rest } =
      props;

    return (
      <ChakraField.Root ref={ref} {...rest}>
        {label && (
          <ChakraField.Label fontWeight="semibold">
            {label}
            <ChakraField.RequiredIndicator
              fallback={
                optionalText ? (
                  <Badge
                    as="span"
                    ms={2}
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    colorPalette="gray"
                    variant="subtle"
                    fontSize="2xs"
                    fontWeight="medium"
                    textTransform="none"
                    whiteSpace="nowrap"
                  >
                    {optionalText}
                  </Badge>
                ) : undefined
              }
            />
          </ChakraField.Label>
        )}
        {children}
        {helperText && (
          <ChakraField.HelperText
            fontSize="sm"
            lineHeight="1.55"
            color={{ base: 'gray.600', _dark: 'gray.400' }}
          >
            {helperText}
          </ChakraField.HelperText>
        )}
        {errorText && (
          <ChakraField.ErrorText fontSize="sm" role="alert" aria-live="polite">
            {errorText}
          </ChakraField.ErrorText>
        )}
      </ChakraField.Root>
    );
  }
);
