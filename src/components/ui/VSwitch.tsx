'use client';

import { Switch as ChakraSwitch } from '@chakra-ui/react';
import * as React from 'react';

export interface VSwitchProps extends Omit<ChakraSwitch.RootProps, 'label'> {
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  rootRef?: React.Ref<HTMLLabelElement>;
  trackLabel?: { on: React.ReactNode; off: React.ReactNode };
  label?: React.ReactNode;
}

export const VSwitch = React.forwardRef<HTMLInputElement, VSwitchProps>(
  function VSwitch(props, ref) {
    const { inputProps, children, rootRef, trackLabel, label, ...rest } = props;
    return (
      <ChakraSwitch.Root ref={rootRef} {...rest}>
        <ChakraSwitch.HiddenInput ref={ref} {...inputProps} />
        <ChakraSwitch.Control
          outline="1.5px solid"
          outlineColor={{ base: 'gray.300', _dark: 'gray.600' }}
          _checked={{ outlineColor: 'transparent' }}
        >
          <ChakraSwitch.Thumb boxShadow="0 1px 3px rgba(0,0,0,0.25)" />
          {trackLabel && (
            <ChakraSwitch.Indicator fallback={trackLabel.off}>
              {trackLabel.on}
            </ChakraSwitch.Indicator>
          )}
        </ChakraSwitch.Control>
        {label && <ChakraSwitch.Label>{label}</ChakraSwitch.Label>}
        {children && <ChakraSwitch.Label>{children}</ChakraSwitch.Label>}
      </ChakraSwitch.Root>
    );
  }
);
