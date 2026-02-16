'use client';

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Image,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Info } from 'lucide-react';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { useAuthStore } from '@/stores/useAuthStore';

export default function HeroSection() {
  const t = useTranslations('pages.about.hero');
  const { isAuthenticated } = useAuthStore();

  return (
    <Box
      bgGradient="linear(to-br, green.50, green.100)"
      _dark={{ bgGradient: 'linear(to-br, gray.900, green.900)' }}
      pt={{ base: 6, md: 12 }}
      pb={{ base: 8, md: 16 }}
      px={4}
      overflow="hidden"
    >
      <Container maxW="container.xl">
        <SimpleGrid
          columns={{ base: 1, lg: 2 }}
          gap={{ base: 8, lg: 12 }}
          alignItems="center"
        >
          <VStack
            gap={6}
            alignItems={{ base: 'center', lg: 'flex-start' }}
            textAlign={{ base: 'center', lg: 'left' }}
          >
            <Heading
              as="h1"
              size={{ base: '3xl', md: '4xl' }}
              fontWeight="extrabold"
              letterSpacing="tight"
              lineHeight="shorter"
              color="green.600"
              _dark={{ color: 'green.400' }}
            >
              {t('title')}
            </Heading>
            <Text
              fontSize={{ base: 'lg', md: '2xl' }}
              maxW="2xl"
              color="gray.600"
              _dark={{ color: 'gray.300' }}
            >
              {t('subtitle')}
            </Text>
            <Flex
              gap={4}
              wrap="wrap"
              justify={{ base: 'center', lg: 'flex-start' }}
            >
              <NextLinkButton
                href={isAuthenticated ? '/' : '/auth/signin'}
                size="lg"
                colorPalette="green"
                px={8}
                py={7}
                fontSize="xl"
              >
                {t('cta')}
                <ArrowRight className="ml-2" size={20} />
              </NextLinkButton>
              <NextLinkButton
                href="#how-it-works"
                variant="outline"
                size="lg"
                px={8}
                py={7}
                fontSize="xl"
              >
                {t('secondaryCta')}
                <Info className="ml-2" size={20} />
              </NextLinkButton>
            </Flex>
          </VStack>

          <Flex justify="center" position="relative">
            {/* Decorative background blob - desktop only */}
            <Box
              display={{ base: 'none', lg: 'block' }}
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="120%"
              h="120%"
              bgGradient="radial(green.200, transparent)"
              filter="blur(60px)"
              opacity={0.6}
              zIndex={0}
            />
            <Image
              src="/hero-illustration.png"
              alt="Badminton Illustration"
              position="relative"
              zIndex={1}
              maxH={{ base: '240px', md: '360px', lg: 'none' }}
              objectFit="contain"
              css={{
                animation: 'float 6s ease-in-out infinite',
              }}
            />
            <style jsx global>{`
              @keyframes float {
                0% {
                  transform: translateY(0px);
                }
                50% {
                  transform: translateY(-20px);
                }
                100% {
                  transform: translateY(0px);
                }
              }
            `}</style>
          </Flex>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
