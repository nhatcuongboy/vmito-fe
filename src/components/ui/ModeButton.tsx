'use client';

import { Button } from '@/components/ui/chakra-compat';

export function ModeButton({
  active,
  onClick,
  icon,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  ariaLabel?: string;
  children?: React.ReactNode;
}) {
  const isIconOnly = children == null;

  return (
    <Button
      size="sm"
      variant={active ? 'solid' : 'ghost'}
      colorPalette={active ? 'green' : 'gray'}
      onClick={onClick}
      aria-label={ariaLabel}
      leftIcon={isIconOnly ? undefined : icon}
      flex={isIconOnly ? '0 0 auto' : 1}
      h={8}
      minW={isIconOnly ? 8 : { base: 0, sm: 24 }}
      w={isIconOnly ? 8 : undefined}
      px={isIconOnly ? 0 : 3}
      borderRadius="md"
      fontSize="sm"
      fontWeight="semibold"
    >
      {isIconOnly ? icon : children}
    </Button>
  );
}
