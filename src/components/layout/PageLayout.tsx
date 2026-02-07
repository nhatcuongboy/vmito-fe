'use client';

import { ReactNode } from 'react';
import { Container, ContainerProps } from '@chakra-ui/react';
import PageWrapper from './PageWrapper';
import TopBar from '../ui/TopBar';
import {
  CONTAINER_PX,
  CONTENT_PT_OFFSET,
  TOP_BAR_HEIGHT_DESKTOP,
  TOP_BAR_HEIGHT_MOBILE,
} from '@/constants';

interface PageLayoutProps extends Omit<ContainerProps, 'title'> {
  /**
   * Page title to display in the TopBar
   */
  title?: string;

  /**
   * Optional icon to display in the TopBar
   */
  icon?: ReactNode;

  /**
   * Optional content to display on the right side of the TopBar
   */
  rightContent?: ReactNode;

  /**
   * Maximum width of the container
   * @default "container.xl"
   */
  maxW?: string;

  /**
   * Page content
   */
  children?: ReactNode;

  /**
   * Whether to show a loading spinner instead of content
   */
  isLoading?: boolean;

  /**
   * Custom loading component to show when isLoading is true
   */
  loadingComponent?: ReactNode;
}

/**
 * PageLayout component that combines PageWrapper, TopBar, and Container
 * with proper spacing and responsive design.
 *
 * Use this for standard pages with a top bar and centered content.
 * For more complex layouts, use PageWrapper directly.
 *
 * @example
 * ```tsx
 * <PageLayout title="My Page">
 *   <Heading>Content here</Heading>
 * </PageLayout>
 * ```
 *
 * @example With right content
 * ```tsx
 * <PageLayout
 *   title="Sessions"
 *   rightContent={<Button>Create</Button>}
 * >
 *   <SessionList />
 * </PageLayout>
 * ```
 */
export default function PageLayout({
  title,
  icon,
  rightContent,
  maxW = 'container.xl',
  children,
  isLoading = false,
  loadingComponent,
  ...containerProps
}: PageLayoutProps) {
  return (
    <PageWrapper>
      <TopBar title={title} icon={icon} rightContent={rightContent} />
      <Container
        maxW={maxW}
        px={CONTAINER_PX}
        pt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + ${CONTENT_PT_OFFSET})`,
        }}
        pb="calc(64px + env(safe-area-inset-bottom) + 24px)"
        {...containerProps}
      >
        {isLoading ? loadingComponent || null : children}
      </Container>
    </PageWrapper>
  );
}
