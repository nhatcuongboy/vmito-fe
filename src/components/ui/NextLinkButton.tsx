'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { Link, useRouter } from '../../i18n/config';
import { Button, ButtonProps } from './chakra-compat';

interface NextLinkButtonProps extends Omit<ButtonProps, 'href'> {
  href: string;
  children: React.ReactNode;
}

/**
 * NextLinkButton - Component kết hợp Next.js Link với Chakra Button
 *
 * Cách sử dụng:
 * ```tsx
 * <NextLinkButton href="/route" colorScheme="blue">Go to route</NextLinkButton>
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

  // We don't use as={Link} directly to avoid nested <a> tags
  return (
    <Link href={href} style={{ textDecoration: 'none' }} tabIndex={-1}>
      <Button
        isWithinLink
        loading={isPending || (props as any).loading}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    </Link>
  );
};

export default NextLinkButton;
