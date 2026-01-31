import { Popover as ChakraPopover, Portal } from '@chakra-ui/react';
import * as React from 'react';

export const PopoverRoot = ChakraPopover.Root;
export const PopoverTrigger = ChakraPopover.Trigger;

export interface PopoverContentProps extends ChakraPopover.ContentProps {
    portalled?: boolean;
    portalRef?: React.RefObject<HTMLElement>;
}

export const PopoverContent = React.forwardRef<
    HTMLDivElement,
    PopoverContentProps
>(function PopoverContent(props, ref) {
    const { portalled = true, portalRef, ...rest } = props;
    return (
        <Portal disabled={!portalled} container={portalRef}>
            <ChakraPopover.Positioner zIndex="popover">
                <ChakraPopover.Content
                    ref={ref}
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    boxShadow="lg"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="gray.200"
                    outline="none"
                    {...rest}
                />
            </ChakraPopover.Positioner>
        </Portal>
    );
});

export const PopoverArrow = ChakraPopover.Arrow;
export const PopoverHeader = ChakraPopover.Header;
export const PopoverBody = ChakraPopover.Body;
export const PopoverFooter = ChakraPopover.Footer;
export const PopoverCloseTrigger = ChakraPopover.CloseTrigger;
export const PopoverTitle = ChakraPopover.Title;
export const PopoverDescription = ChakraPopover.Description;
