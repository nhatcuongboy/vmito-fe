# PageWrapper Component

## Overview

The `PageWrapper` component provides a consistent layout wrapper for all pages in the application. It automatically handles the sidebar offset to ensure content is not covered by the slide-out menu on desktop devices.

## Purpose

- **Consistent Spacing**: Ensures all pages have proper margin-left offset when the sidebar is visible
- **Responsive Design**: Automatically adjusts based on screen size and sidebar state
- **Simplified Development**: Eliminates the need to manually calculate sidebar offsets in each page

## Usage

### Basic Usage

```tsx
import PageLayout from '@/components/layout/PageLayout';

export default function MyPage() {
  return (
    <PageLayout>
      <TopBar title="My Page" />
      <Container>{/* Your page content */}</Container>
    </PageLayout>
  );
}
```

### With Custom Background

```tsx
<PageLayout bg={{ base: 'gray.50', _dark: 'gray.950' }}>
  {/* Content */}
</PageLayout>
```

### Without Sidebar Offset

For pages that should not have sidebar offset (e.g., full-width modals):

```tsx
<PageLayout withSidebarOffset={false}>{/* Content */}</PageLayout>
```

## Props

| Prop                | Type                                        | Default     | Description                             |
| ------------------- | ------------------------------------------- | ----------- | --------------------------------------- |
| `children`          | `ReactNode`                                 | Required    | The content to render inside the layout |
| `minH`              | `string`                                    | `'100vh'`   | Minimum height of the page              |
| `bg`                | `string \| { base: string; _dark: string }` | `undefined` | Background color                        |
| `withSidebarOffset` | `boolean`                                   | `true`      | Whether to apply sidebar margin offset  |

## Examples

### Standard Page with TopBar

```tsx
'use client';
import PageLayout from '@/components/layout/PageLayout';
import TopBar from '@/components/ui/TopBar';
import { Container } from '@chakra-ui/react';

export default function StandardPage() {
  return (
    <PageLayout minH="100vh">
      <TopBar title="Page Title" />
      <Container maxW="7xl" pt="80px" pb="24px">
        {/* Page content */}
      </Container>
    </PageLayout>
  );
}
```

### Form Page

```tsx
'use client';
import PageLayout from '@/components/layout/PageLayout';
import SessionForm from '@/components/session/SessionForm';

export default function NewSessionPage() {
  return (
    <PageLayout minH="100vh" bg={{ base: 'gray.50', _dark: 'gray.950' }}>
      <SessionForm mode="create" />
    </PageLayout>
  );
}
```

## Migration Guide

### Before (Manual Offset)

```tsx
import { Box } from '@chakra-ui/react';
import { useSidebar } from '@/contexts/SidebarContext';
import { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '@/constants';

function MyPage() {
  const { isCollapsed } = useSidebar();

  return (
    <Box
      minH="100vh"
      ml={{
        base: 0,
        md: isCollapsed
          ? `${SIDEBAR_WIDTH_COLLAPSED}px`
          : `${SIDEBAR_WIDTH_EXPANDED}px`,
      }}
      transition="margin-left 0.3s ease"
    >
      {/* Content */}
    </Box>
  );
}
```

### After (Using PageLayout)

```tsx
import PageLayout from '@/components/layout/PageLayout';

function MyPage() {
  return <PageLayout minH="100vh">{/* Content */}</PageLayout>;
}
```

## Implementation Details

The component:

- Uses the `useSidebar` hook to track sidebar state
- Applies responsive margin-left based on `SIDEBAR_WIDTH_EXPANDED` and `SIDEBAR_WIDTH_COLLAPSED` constants
- Includes smooth transitions when sidebar state changes
- Only applies offset on desktop (`md` breakpoint and above)

## Best Practices

1. **Always use PageLayout** for top-level page components
2. **Don't nest PageLayout** components - use only once per page
3. **Keep content inside Container** for proper max-width and padding
4. **Use with TopBar** for consistent header spacing
5. **Set appropriate minH** based on page content needs

## Related Components

- `TopBar` - Application header with navigation
- `SlideOutMenu` - Sidebar navigation menu
- `Container` - Content width wrapper
