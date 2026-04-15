'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Link, useRouter } from '../../i18n/config';
import { Button, ButtonProps } from './chakra-compat';
import { Spinner } from '@chakra-ui/react';

interface NextLinkButtonProps extends Omit<ButtonProps, 'href'> {
  href: string;
  children: React.ReactNode;
  loading?: boolean;
}

/**
 * NextLinkButton - Component kết hợp Next.js Link với Chakra Button
 *
 * Cách sử dụng:
 * ```tsx
 * <NextLinkButton href="/route" colorPalette="green">Go to route</NextLinkButton>
 * ```
 *
 * Giải quyết vấn đề hydration error với việc sử dụng đúng cách Next.js Link
 */
export const NextLinkButton: React.FC<NextLinkButtonProps> = ({
  href,
  children,
  onClick,
  ...props
}) => {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (onClick) {
      onClick(e);
    }

    if (
      e.isDefaultPrevented() ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    startTransition(() => {
      router.push(href);
    });
  };

  const isLoading = isPending || (props as any).loading;

  // We don't use as={Link} directly to avoid nested <a> tags
  return (
    <Link
      href={href}
      style={{ textDecoration: 'none' }}
      tabIndex={-1}
      prefetch={false}
    >
      <Button
        isWithinLink
        onClick={handleClick}
        {...props}
        // Keep content visible while loading — just dim & show wait cursor
        // so users can still see which item they clicked
        opacity={isLoading ? 0.6 : ((props as any).opacity ?? 1)}
        cursor={isLoading ? 'wait' : (props as any).cursor}
        pointerEvents={isLoading ? 'none' : (props as any).pointerEvents}
        position="relative"
      >
        {children}
        {isLoading && (
          <Spinner
            size="xs"
            color="green.500"
            position="absolute"
            right="6px"
            top="50%"
            transform="translateY(-50%)"
          />
        )}
      </Button>
    </Link>
  );
};

export default NextLinkButton;
