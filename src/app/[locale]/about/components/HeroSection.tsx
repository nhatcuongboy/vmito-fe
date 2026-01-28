'use client';

import { Box, Container, Flex, Heading, Text, VStack, SimpleGrid, Image } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ArrowRight, Info } from 'lucide-react';
import { NextLinkButton } from '@/components/ui/NextLinkButton';

export default function HeroSection() {
    const t = useTranslations('pages.about.hero');

    return (
        <Box
            bgGradient="linear(to-br, teal.50, blue.50)"
            _dark={{ bgGradient: 'linear(to-br, gray.900, blue.900)' }}
            pt={{ base: '120px', md: '160px' }}
            pb={{ base: 20, md: 32 }}
            px={4}
            overflow="hidden"
        >
            <Container maxW="container.xl">
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={12} alignItems="center">
                    <VStack gap={8} alignItems={{ base: 'center', lg: 'flex-start' }} textAlign={{ base: 'center', lg: 'left' }}>
                        <Heading
                            as="h1"
                            size="4xl"
                            fontWeight="extrabold"
                            letterSpacing="tight"
                            lineHeight="shorter"
                            bgGradient="linear(to-r, teal.500, blue.600)"
                            bgClip="text"
                            color="transparent"
                            css={{
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                // Fallback for when gradient text is not supported or if it fails
                                '@supports not (background-clip: text)': {
                                    color: 'teal.500'
                                }
                            }}
                        >
                            {t('title')}
                        </Heading>
                        <Text
                            fontSize={{ base: 'xl', md: '2xl' }}
                            maxW="2xl"
                            color="gray.600"
                            _dark={{ color: 'gray.300' }}
                        >
                            {t('subtitle')}
                        </Text>
                        <Flex gap={4} wrap="wrap" justify={{ base: 'center', lg: 'flex-start' }}>
                            <NextLinkButton
                                href="/auth/signin"
                                size="lg"
                                colorPalette="teal"
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

                    <Box position="relative" display={{ base: 'none', lg: 'block' }}>
                        {/* Decorative background blob */}
                        <Box
                            position="absolute"
                            top="50%" left="50%"
                            transform="translate(-50%, -50%)"
                            w="120%" h="120%"
                            bgGradient="radial(blue.200, transparent)"
                            filter="blur(60px)"
                            opacity={0.6}
                            zIndex={0}
                        />
                        <Image
                            src="/hero-illustration.png"
                            alt="Badminton Illustration"
                            position="relative"
                            zIndex={1}
                            className="animate-float"
                            css={{
                                animation: 'float 6s ease-in-out infinite'
                            }}
                        />
                        <style jsx global>{`
                @keyframes float {
                  0% { transform: translateY(0px); }
                  50% { transform: translateY(-20px); }
                  100% { transform: translateY(0px); }
                }
              `}</style>
                    </Box>
                </SimpleGrid>
            </Container>
        </Box>
    );
}
