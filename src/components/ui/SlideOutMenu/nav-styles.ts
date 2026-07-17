export const ACTIVE_ICON_COLOR = 'var(--chakra-colors-green-500)';

export const TOOLTIP_POSITIONING = {
  placement: 'right',
  offset: { mainAxis: 12 },
} as const;

export const TOOLTIP_OPEN_DELAY = 200;

export function getActiveProps(isActive: boolean, isCollapsed: boolean) {
  if (!isActive) {
    return {
      color: 'fg',
    };
  }

  return {
    bg: 'green.50',
    _dark: { bg: 'green.950/20' },
    color: 'green.600',
    fontWeight: 'semibold',
    borderLeft: !isCollapsed ? '4px solid' : 'none',
    borderLeftColor: 'green.500',
    borderRadius: isCollapsed ? 'lg' : '0',
    ps: isCollapsed ? 0 : '12px', // Adjust padding for border
    _hover: {
      bg: 'green.100',
      _dark: { bg: 'green.900/40' },
    },
  };
}

export function getSubmenuProps(
  isActive: boolean,
  variant: 'inline' | 'flyout' = 'inline'
) {
  if (!isActive) {
    return {
      position: 'relative',
      bg: 'transparent',
      borderColor: 'transparent',
      color: 'fg.muted',
      _hover: {
        bg: 'green.50/70',
        color: 'green.700',
      },
      _dark: {
        color: 'gray.400',
        _hover: {
          bg: 'green.950/20',
          color: 'green.200',
        },
      },
    };
  }

  return {
    position: 'relative',
    bg: 'green.50/80',
    borderColor: 'transparent',
    color: 'green.700',
    fontWeight: 'semibold',
    ...(variant === 'inline'
      ? {
          _before: {
            content: '""',
            position: 'absolute',
            left: '-21px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: 'full',
            bg: 'green.500',
            boxShadow: '0 0 0 3px var(--chakra-colors-green-100)',
          },
        }
      : {}),
    _hover: {
      bg: 'green.50',
    },
    _dark: {
      bg: 'green.950/30',
      color: 'green.200',
      ...(variant === 'inline'
        ? {
            _before: {
              bg: 'green.300',
              boxShadow: '0 0 0 3px var(--chakra-colors-green-900)',
            },
          }
        : {}),
      _hover: {
        bg: 'green.900/40',
      },
    },
  };
}
