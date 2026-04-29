'use client';

import { Box } from '@chakra-ui/react';

interface RichTextDisplayProps {
  content: string;
}

export const RichTextDisplay = ({ content }: RichTextDisplayProps) => {
  return (
    <Box
      css={{
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '0.375rem',
          marginTop: '1rem',
          marginBottom: '1rem',
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          marginTop: '1rem',
          marginBottom: '1rem',
        },
        '& table td, & table th': {
          border: '1px solid var(--chakra-colors-gray-300)',
          padding: '0.5rem',
        },
        '& table th': {
          backgroundColor: 'var(--chakra-colors-gray-100)',
          fontWeight: 'bold',
        },
        '& pre': {
          backgroundColor: 'var(--chakra-colors-gray-100)',
          borderRadius: '0.375rem',
          padding: '1rem',
          overflow: 'auto',
          marginTop: '1rem',
          marginBottom: '1rem',
        },
        '& code': {
          backgroundColor: 'var(--chakra-colors-gray-100)',
          borderRadius: '0.25rem',
          padding: '0.125rem 0.25rem',
          fontSize: '0.875em',
        },
        '& pre code': {
          backgroundColor: 'transparent',
          padding: 0,
        },
        '& h1': {
          fontSize: '2em',
          fontWeight: 'bold',
          marginTop: '1rem',
          marginBottom: '0.5rem',
        },
        '& h2': {
          fontSize: '1.5em',
          fontWeight: 'bold',
          marginTop: '1rem',
          marginBottom: '0.5rem',
        },
        '& h3': {
          fontSize: '1.25em',
          fontWeight: 'bold',
          marginTop: '1rem',
          marginBottom: '0.5rem',
        },
        '& ul, & ol': {
          marginLeft: '1.5rem',
          marginTop: '0.5rem',
          marginBottom: '0.5rem',
        },
        '& li': {
          marginBottom: '0.25rem',
        },
        '& p': {
          marginBottom: '0.5rem',
        },
        '& a': {
          color: 'var(--chakra-colors-blue-500)',
          textDecoration: 'underline',
        },
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
