import * as React from 'react';
import { Box, Button, BoxProps, ButtonProps } from '@chakra-ui/react';
import { cn } from '@/lib/utils';

// Create a simple tabs implementation using Chakra UI components
// since Chakra UI v3 may not export tabs components directly

interface TabsProps extends BoxProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    { className, defaultValue = '0', value, onValueChange, children, ...props },
    ref
  ) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);

    const currentTab = value !== undefined ? value : activeTab;

    const handleTabChange = (tab: string) => {
      if (value === undefined) {
        setActiveTab(tab);
      }
      onValueChange?.(tab);
    };

    return (
      <TabsContext.Provider
        value={{ activeTab: currentTab, setActiveTab: handleTabChange }}
      >
        <Box ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </Box>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, children, ...props }, ref) => (
    <Box
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      display="flex"
      {...props}
    >
      {children}
    </Box>
  )
);
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends ButtonProps {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error('TabsTrigger must be used within Tabs');
    }

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
      <Button
        ref={ref}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isActive && 'bg-background text-foreground shadow-sm',
          className
        )}
        variant={isActive ? 'solid' : 'ghost'}
        size="sm"
        onClick={() => setActiveTab(value)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends BoxProps {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error('TabsContent must be used within Tabs');
    }

    const { activeTab } = context;

    if (activeTab !== value) {
      return null;
    }

    return (
      <Box
        ref={ref}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </Box>
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
