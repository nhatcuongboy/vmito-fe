'use client';

// Export Card components
export { Card, CardHeader, CardBody } from './ChakraCard';

// Export Table components
export { Table, Thead, Tbody, Tr, Th, Td, TableContainer } from './VTable';

// Export Tab components
export {
  Tabs,
  TabsComp,
  Tab,
  TabPanel,
  TabPanels,
  TabList,
} from './ChakraTabs';

// Export Button components
export { VButton as Button, IconButton } from './VButton';
export type { VButtonProps as ButtonProps } from './VButton';

// Export Stack components
export { HStack, VStack, SimpleGrid } from './ChakraStack';

// Export Divider component
export { Divider } from './ChakraDivider';

// Export Drawer components
export {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from './ChakraDrawer';

// Export Modal components
export {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from './ChakraModal';

// Export Form components
export { FormControl, FormLabel } from './ChakraForm';

// Export Input component
export { Input } from './Input';

// Export Hooks
export { useColorModeValue, useDisclosure } from './ChakraHooks';

// Export Select component from dedicated file
export { VSelect, LegacySelect } from './VSelect';
export type {
  VSelectProps,
  VLegacySelectProps as LegacySelectProps,
  VSelectOption as SelectOption,
} from './VSelect';
