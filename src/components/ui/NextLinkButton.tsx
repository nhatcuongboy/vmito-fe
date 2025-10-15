'use client';

import React from 'react';
import { Link } from '../../i18n/config';
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
  ...props
}) => {
  // We don't use as={Link} directly to avoid nested <a> tags
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Button isWithinLink {...props}>
        {children}
      </Button>
    </Link>
  );
};

export default NextLinkButton;
