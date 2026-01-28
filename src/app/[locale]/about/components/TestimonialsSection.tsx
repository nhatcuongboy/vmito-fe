'use client';

import { Box, Container, Heading, SimpleGrid, Text, Flex } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Quote } from 'lucide-react';

export default function TestimonialsSection() {
    const t = useTranslations('pages.about.testimonials');

    const testimonials = [
        { text: t('review1.text'), author: t('review1.author') },
        { text: t('review2.text'), author: t('review2.author') },
    ];

    return (
        <Box py={20}>
            <Container maxW="container.xl">
                <Heading textAlign="center" mb={16} size="2xl">
                    {t('title')}
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
                    {testimonials.map((review, index) => (
                        <Box
                            key={index}
                            bg="white"
                            _dark={{ bg: 'gray.800' }}
                            p={8}
                            borderRadius="xl"
                            boxShadow="lg"
                            position="relative"
                        >
                            <Box position="absolute" top={6} right={8} color="gray.200" _dark={{ color: 'gray.700' }}>
                                <Quote size={48} />
                            </Box>
                            <Text fontSize="xl" fontStyle="italic" mb={6} position="relative" zIndex={1}>
                                "{review.text}"
                            </Text>
                            <Flex align="center" gap={4}>
                                <Box bg="blue.500" w={12} h={12} borderRadius="full" display="flex" alignItems="center" justifyContent="center" color="white" fontWeight="bold">
                                    {review.author.charAt(0)}
                                </Box>
                                <Text fontWeight="bold" fontSize="lg">
                                    {review.author}
                                </Text>
                            </Flex>
                        </Box>
                    ))}
                </SimpleGrid>
            </Container>
        </Box>
    );
}
