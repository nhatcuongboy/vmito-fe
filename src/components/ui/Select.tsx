'use client';

import React, { useMemo } from 'react';
import {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValueText,
  createListCollection,
  Portal,
  SelectPositioner,
  Box,
} from '@chakra-ui/react';

/**
 * Select Option Interface
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Props for LegacySelect component
 */
export interface LegacySelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  isDisabled?: boolean;
  children?: React.ReactNode;
  /**
   * Size of the select component
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /**
   * Variant of the select component
   */
  variant?: 'outline' | 'subtle' | 'plain';
}

/**
 * LegacySelect - Native HTML select with Chakra UI styling
 *
 * This is the old implementation using native HTML select element.
 * Use this only if you need the native select behavior for specific cases.
 *
 * @example
 * ```tsx
 * <LegacySelect value={selectedValue} onChange={handleChange}>
 *   <option value="">Select an option</option>
 *   <option value="1">Option 1</option>
 * </LegacySelect>
 * ```
 */
export const LegacySelect = React.forwardRef<
  HTMLSelectElement,
  LegacySelectProps
>(
  (
    {
      isDisabled,
      disabled,
      children,
      size = 'md',
      variant = 'outline',
      className,
      style,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const isSelectDisabled = isDisabled || disabled;

    return (
      <select
        ref={ref}
        disabled={isSelectDisabled}
        className={className}
        value={value}
        onChange={onChange}
        data-size={size}
        data-variant={variant}
        style={{
          width: '100%',
          padding:
            size === 'lg'
              ? '0.75rem 1rem'
              : size === 'sm'
                ? '0.375rem 0.625rem'
                : size === 'xs'
                  ? '0.25rem 0.5rem'
                  : '0.5rem 0.75rem',
          fontSize:
            size === 'lg'
              ? '1rem'
              : size === 'sm'
                ? '0.875rem'
                : size === 'xs'
                  ? '0.75rem'
                  : '0.875rem',
          lineHeight: '1.5',
          borderRadius: 'var(--chakra-radii-md)',
          borderWidth: variant === 'plain' ? '0' : '1px',
          borderColor:
            variant === 'subtle'
              ? 'var(--chakra-colors-border-subtle)'
              : 'var(--chakra-colors-border)',
          backgroundColor:
            variant === 'subtle'
              ? 'var(--chakra-colors-bg-subtle)'
              : variant === 'plain'
                ? 'transparent'
                : 'var(--chakra-colors-bg)',
          color: 'var(--chakra-colors-fg)',
          opacity: isSelectDisabled ? 0.5 : 1,
          cursor: isSelectDisabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          appearance: 'auto',
          ...style,
        }}
        onFocus={(e) => {
          if (!isSelectDisabled && variant !== 'plain') {
            e.currentTarget.style.borderColor =
              'var(--chakra-colors-color-palette-500)';
            e.currentTarget.style.boxShadow =
              '0 0 0 1px var(--chakra-colors-color-palette-500)';
          }
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          if (variant !== 'plain') {
            e.currentTarget.style.borderColor =
              variant === 'subtle'
                ? 'var(--chakra-colors-border-subtle)'
                : 'var(--chakra-colors-border)';
          }
          e.currentTarget.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      >
        {children}
      </select>
    );
  }
);

LegacySelect.displayName = 'LegacySelect';

/**
 * Props for the new Select component using Chakra UI
 */
export interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    'size' | 'onChange'
  > {
  isDisabled?: boolean;
  children?: React.ReactNode;
  /**
   * Size of the select component
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /**
   * Variant of the select component
   */
  variant?: 'outline' | 'subtle';
  /**
   * Placeholder text when no option is selected
   */
  placeholder?: string;
  /**
   * Current value (can be string or number)
   */
  value?: string | number;
  /**
   * leftElement support matching Input
   */
  leftElement?: React.ReactNode;
  /**
   * rightElement support (default is usually Chevron but can be custom)
   */
  rightElement?: React.ReactNode;
  /**
   * onChange handler - compatible with native select onChange
   */
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Helper function to extract options from React children
 */
function extractOptionsFromChildren(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const props = child.props as {
        value?: string | number;
        children?: React.ReactNode;
        disabled?: boolean;
      };
      const value = String(props.value ?? '');
      const label = props.children as string;
      const disabled = props.disabled;

      // Skip empty placeholder options
      if (value !== '' || label) {
        options.push({ value, label, disabled });
      }
    }
  });

  return options;
}

/**
 * Select - Chakra UI native Select component with backward compatibility
 *
 * This component uses Chakra UI's SelectRoot, SelectTrigger, and SelectContent
 * while maintaining backward compatibility with the option children pattern.
 * It automatically parses <option> children and converts them to Chakra UI format.
 *
 * @example
 * ```tsx
 * <Select value={selectedValue} onChange={handleChange}>
 *   <option value="">Select an option</option>
 *   <option value="1">Option 1</option>
 *   <option value="2">Option 2</option>
 * </Select>
 * ```
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      isDisabled,
      disabled,
      children,
      size = 'md',
      variant = 'outline',
      placeholder,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const isSelectDisabled = isDisabled || disabled;

    // Extract options from children
    const items = useMemo(
      () => extractOptionsFromChildren(children),
      [children]
    );

    // Find placeholder from children if not explicitly provided
    const derivedPlaceholder = useMemo(() => {
      if (placeholder) return placeholder;

      let foundPlaceholder = 'Select...';
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          const props = child.props as {
            value?: string | number;
            children?: React.ReactNode;
          };
          if (props.value === '' || props.value === undefined) {
            foundPlaceholder = props.children as string;
          }
        }
      });
      return foundPlaceholder;
    }, [children, placeholder]);

    const collection = createListCollection({
      items,
    });

    // Convert value to string array format for Chakra UI
    const selectedValues =
      value !== undefined && value !== '' ? [String(value)] : [];

    // Handle value change and convert to native onChange format
    const handleValueChange = (details: { value: string[] }) => {
      if (onChange) {
        // Create a synthetic event matching native select onChange
        const syntheticEvent = {
          target: {
            value: details.value[0] || '',
            name: props.name,
          },
          currentTarget: {
            value: details.value[0] || '',
            name: props.name,
          },
        } as React.ChangeEvent<HTMLSelectElement>;

        onChange(syntheticEvent);
      }
    };

    const triggerProps = {
      _focusVisible: {
        borderColor: 'blue.500',
        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
      },
      paddingStart: props.leftElement ? '10' : undefined,
      paddingEnd: props.rightElement ? '10' : undefined,
      width: '100%',
    };

    return (
      <SelectRoot
        collection={collection}
        size={size}
        variant={variant}
        disabled={isSelectDisabled}
        value={selectedValues}
        onValueChange={handleValueChange}
        name={props.name}
        positioning={{ strategy: 'fixed' }}
      >
        <Box position="relative" width="100%">
          {props.leftElement && (
            <Box
              position="absolute"
              left="3"
              top="50%"
              transform="translateY(-50%)"
              zIndex="1"
              pointerEvents="none"
              display="flex"
              alignItems="center"
              color="fg.muted"
            >
              {props.leftElement}
            </Box>
          )}

          <SelectTrigger {...triggerProps}>
            <SelectValueText placeholder={derivedPlaceholder} />
          </SelectTrigger>

          {props.rightElement && (
            <Box
              position="absolute"
              right="3"
              top="50%"
              transform="translateY(-50%)"
              zIndex="1"
              pointerEvents="none"
              display="flex"
              alignItems="center"
              color="fg.muted"
            >
              {props.rightElement}
            </Box>
          )}
        </Box>
        <Portal>
          <SelectPositioner zIndex="popover">
            <SelectContent
              bg={{ base: 'white', _dark: 'gray.800' }}
              boxShadow="lg"
              borderRadius="md"
              borderWidth="1px"
              borderColor="border"
              p="1"
              minW="var(--reference-width)"
              maxH="300px"
              overflowY="auto"
              zIndex="popover"
            >
              {items.map((item) => (
                <SelectItem
                  key={item.value}
                  item={item.value}
                  _hover={{ bg: { base: 'gray.50', _dark: 'whiteAlpha.50' } }}
                  _selected={{
                    bg: { base: 'blue.50', _dark: 'blue.900/40' },
                    color: { base: 'blue.600', _dark: 'blue.300' },
                  }}
                  p="2"
                  borderRadius="sm"
                  cursor="pointer"
                  display="flex"
                  alignItems="center"
                  fontSize="sm"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectPositioner>
        </Portal>
      </SelectRoot>
    );
  }
);

Select.displayName = 'Select';

export default Select;
