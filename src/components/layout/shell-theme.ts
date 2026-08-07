export type ResponsiveStyleValue =
  | string
  | number
  | {
      base?: string | number;
      md?: string | number;
      _dark?: string | number;
    };

export interface ResponsiveStyleParts {
  base?: string | number;
  md?: string | number;
  dark?: string | number;
}

const colorTokens: Record<string, string> = {
  bg: 'hsl(var(--background))',
  background: 'hsl(var(--background))',
  'green.50': 'hsl(var(--shell-brand-subtle))',
  'gray.50': 'hsl(var(--shell-neutral-subtle))',
  'gray.900': 'hsl(var(--shell-neutral-strong))',
  'gray.950': 'hsl(var(--shell-neutral-stronger))',
  transparent: 'transparent',
  white: 'hsl(var(--shell-white))',
};

const maxWidthTokens: Record<string, string> = {
  'container.md': '48rem',
  'container.lg': '64rem',
  'container.xl': '80rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '6xl': '72rem',
  '7xl': '80rem',
  full: '100%',
};

export function resolveCssColor(value: string | number | undefined) {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return String(value);
  return colorTokens[value] ?? value;
}

export function resolveCssSize(value: string | number | undefined) {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value * 0.25}rem` : value;
}

export function resolveCssMaxWidth(value: string | number | undefined) {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value * 0.25}rem`;
  return maxWidthTokens[value] ?? value;
}

export function getResponsiveStyleParts(
  value: ResponsiveStyleValue | undefined
): ResponsiveStyleParts {
  if (value === undefined) return {};
  if (typeof value !== 'object') {
    return { base: value, md: value };
  }

  const base = value.base ?? value.md;
  return {
    base,
    md: value.md ?? base,
    dark: value._dark,
  };
}
