'use client';

import { CommonModal } from '@/components/ui/CommonModal';
import { ISession, Player } from '@/lib/api/types';
import { Box, Text, VStack, Badge, Flex, Icon } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PlayerService } from '@/lib/api/player.service';
import { Phone, Award } from 'lucide-react';
import { useLevelLabel } from '@/hooks/useLevelLabel';

interface MyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
  onWithdraw?: () => void; // Callback for withdraw action
}

export default function MyRegistrationModal({
  isOpen,
  onClose,
  session,
  onWithdraw,
}: MyRegistrationModalProps) {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const { getLevelLabel } = useLevelLabel();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (isOpen && session.id) {
      fetchPlayers();
    }
  }, [isOpen, session.id]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await PlayerService.getMyPlayersForSession(session.id);
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    try {
      setIsWithdrawing(true);
      const pendingPlayers = players.filter(
        (p) => p.registrationStatus === 'PENDING'
      );

      // Delete all pending players
      await Promise.all(
        pendingPlayers.map((p) => PlayerService.deletePlayer(p.id))
      );

      setIsConfirmOpen(false);
      // Trigger parent update
      if (onWithdraw) {
        onWithdraw();
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Check if any player has pending status
  const hasPendingPlayers = players.some(
    (p) => p.registrationStatus === 'PENDING'
  );

  return (
    <>
      <CommonModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('myRegistration')}
        secondaryActionText={tCommon('close')}
        onSecondaryAction={onClose}
        primaryActionText={hasPendingPlayers ? t('withdrawRequest') : undefined}
        onPrimaryAction={hasPendingPlayers ? handleWithdrawClick : undefined}
        primaryColorScheme={hasPendingPlayers ? 'red' : undefined}
        size="md"
      >
        <VStack align="stretch" gap={4}>
          <Text fontWeight="semibold" color="gray.600">
            {t('registeredPlayers')}
          </Text>

          {loading ? (
            <Text color="gray.500">{tCommon('loading')}</Text>
          ) : players.length === 0 ? (
            <Text color="gray.500">{t('noPlayersFound')}</Text>
          ) : (
            <VStack align="stretch" gap={3}>
              {players.map((player, index) => (
                <Box
                  key={player.id}
                  p={4}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  _dark={{ borderColor: 'gray.700', bg: 'gray.800' }}
                >
                  <Flex justify="space-between" align="start" mb={2}>
                    <Text fontWeight="semibold" fontSize="lg">
                      {player.name || `Player ${index + 1}`}
                    </Text>
                    {player.registrationStatus && (
                      <Badge
                        colorPalette={
                          player.registrationStatus === 'APPROVED'
                            ? 'green'
                            : player.registrationStatus === 'PENDING'
                              ? 'yellow'
                              : 'red'
                        }
                      >
                        {player.registrationStatus === 'APPROVED'
                          ? t('registrationApproved')
                          : player.registrationStatus === 'PENDING'
                            ? t('registrationPending')
                            : t('registrationRejected')}
                      </Badge>
                    )}
                  </Flex>

                  <VStack align="stretch" gap={2} fontSize="sm">
                    {player.phone && (
                      <Flex align="center" gap={2} color="gray.600">
                        <Icon as={Phone} boxSize={4} />
                        <Text>{player.phone}</Text>
                      </Flex>
                    )}
                    {player.level && (
                      <Flex align="center" gap={2} color="gray.600">
                        <Icon as={Award} boxSize={4} />
                        <Text>{getLevelLabel(player.level)}</Text>
                      </Flex>
                    )}
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}

          <Text fontSize="sm" color="gray.500" mt={2}>
            {t('playerCount', { count: players.length })}
          </Text>
        </VStack>
      </CommonModal>

      <CommonModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={t('withdrawRequest')}
        description={t('withdrawConfirmation')}
        primaryActionText={tCommon('yes')}
        secondaryActionText={tCommon('no')}
        onPrimaryAction={handleConfirmWithdraw}
        isPrimaryLoading={isWithdrawing}
        primaryColorScheme="red"
        size="sm"
        zIndex={1100}
      >
        <Text>{t('withdrawConfirmation')}</Text>
      </CommonModal>
    </>
  );
}
