'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  AccordionRoot,
  AccordionItem,
  AccordionItemTrigger,
  AccordionItemContent,
  AccordionItemIndicator,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const t = useTranslations('pages.about.faq');

  const faqs = [
    { value: 'q1', question: t('q1.question'), answer: t('q1.answer') },
    { value: 'q2', question: t('q2.question'), answer: t('q2.answer') },
    { value: 'q3', question: t('q3.question'), answer: t('q3.answer') },
  ];

  return (
    <Box pt={20} pb={10}>
      <Container maxW="container.md">
        <Heading textAlign="center" mb={12} size="2xl">
          {t('title')}
        </Heading>

        <AccordionRoot collapsible variant="enclosed">
          {faqs.map((faq) => (
            <AccordionItem key={faq.value} value={faq.value}>
              <AccordionItemTrigger px={6} py={4} cursor="pointer">
                <Text
                  flex="1"
                  textAlign="left"
                  fontWeight="semibold"
                  fontSize="lg"
                >
                  {faq.question}
                </Text>
                <AccordionItemIndicator>
                  <ChevronDown size={20} />
                </AccordionItemIndicator>
              </AccordionItemTrigger>
              <AccordionItemContent px={6} pb={4}>
                <Text
                  color="gray.600"
                  _dark={{ color: 'gray.400' }}
                  fontSize="md"
                  lineHeight="tall"
                >
                  {faq.answer}
                </Text>
              </AccordionItemContent>
            </AccordionItem>
          ))}
        </AccordionRoot>
      </Container>
    </Box>
  );
}
