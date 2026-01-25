import { Box, Container, Stack, Text, Link } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('common');
  
  return (
    <Box
      bg="gray.50"
      color="gray.700"
      borderTopWidth={1}
      borderStyle={'solid'}
      borderColor="gray.200"
      _dark={{
        bg: 'gray.900',
        color: 'gray.200',
        borderColor: 'gray.700',
      }}
      mt={'auto'}
    >
      <Container maxW={'6xl'} py={4}>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          gap={4}
          justify={{ base: 'center', md: 'space-between' }}
          align={{ base: 'center', md: 'center' }}
        >
          <Text>© {new Date().getFullYear()} {t('appName')}. All rights reserved</Text>
          <Stack direction={'row'} gap={6}>
            <Link href={'#'}>Home</Link>
            <Link href={'#'}>About</Link>
            <Link href={'#'}>Contact</Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
