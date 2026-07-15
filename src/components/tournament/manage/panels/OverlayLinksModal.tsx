'use client';

import { useMemo, useState } from 'react';
import { Box, Flex, Text, Input } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/ChakraModal';
import { useLocale, useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';

import { TournamentCourt } from '@/lib/api/types';
import { formatCourtLabel } from '@/lib/tournament/court';
import { toaster } from '@/components/ui/toaster';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  courts: TournamentCourt[];
}

/**
 * Lists copyable livestream-overlay URLs for a tournament: one stable link per
 * court (auto-switches to whatever match is live on that court) for pasting into
 * an OBS browser source. Links are public and transparent-background by default.
 */
export default function OverlayLinksModal({
  isOpen,
  onClose,
  tournamentId,
  courts,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreboard.overlay');
  const locale = useLocale();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const courtLinks = useMemo(() => {
    const sorted = [...courts].sort((a, b) => a.courtNumber - b.courtNumber);
    return sorted.map((court) => ({
      key: court.id,
      label: formatCourtLabel(court, t('court')),
      url: `${origin}/${locale}/tournament/${tournamentId}/overlay/court/${court.courtNumber}`,
    }));
  }, [courts, origin, locale, tournamentId, t]);

  const handleCopy = async (key: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toaster.success({ title: t('linkCopied') });
      setTimeout(
        () => setCopiedKey((prev) => (prev === key ? null : prev)),
        2000
      );
    } catch {
      // ignore
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>{t('title')}</ModalHeader>
      <ModalCloseButton onClose={onClose} />
      <ModalBody>
        <Text
          fontSize="sm"
          color="gray.500"
          mb={4}
          _dark={{ color: 'gray.400' }}
        >
          {t('description')}
        </Text>

        {courtLinks.length === 0 ? (
          <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
            {t('noCourts')}
          </Text>
        ) : (
          <Flex direction="column" gap={3}>
            {courtLinks.map((link) => (
              <Box key={link.key}>
                <Text fontSize="sm" fontWeight="semibold" mb={1}>
                  {link.label}
                </Text>
                <Flex gap={2}>
                  <Input
                    value={link.url}
                    readOnly
                    size="sm"
                    fontSize="xs"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    flexShrink={0}
                    onClick={() => void handleCopy(link.key, link.url)}
                  >
                    {copiedKey === link.key ? (
                      <Check size={15} />
                    ) : (
                      <Copy size={15} />
                    )}
                  </Button>
                </Flex>
              </Box>
            ))}
          </Flex>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          {t('close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
