'use client';

import { RadioGroup as ChakraRadioGroup } from '@chakra-ui/react';
import * as React from 'react';

export interface RadioRootProps extends ChakraRadioGroup.RootProps {
  children?: React.ReactNode;
}

export interface RadioItemProps extends ChakraRadioGroup.ItemProps {
  children?: React.ReactNode;
}

const RadioRoot = React.forwardRef<HTMLDivElement, RadioRootProps>(
  function RadioRoot(props, ref) {
    const { children, ...rest } = props;
    return (
      <ChakraRadioGroup.Root ref={ref} {...rest}>
        {children}
      </ChakraRadioGroup.Root>
    );
  }
);

const RadioItem = React.forwardRef<HTMLInputElement, RadioItemProps>(
  function RadioItem(props, ref) {
    const { children, ...rest } = props;
    return (
      <ChakraRadioGroup.Item ref={ref} {...rest}>
        <ChakraRadioGroup.ItemHiddenInput />
        <ChakraRadioGroup.ItemIndicator />
        {children && (
          <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>
        )}
      </ChakraRadioGroup.Item>
    );
  }
);

export const Radio = {
  Root: RadioRoot,
  Item: RadioItem,
};
