'use client';

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import {
  Card,
  CardBody,
  SimpleGrid,
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  VSelect,
  useDisclosure,
  IconButton,
} from '@/components/ui/chakra-compat';
import { VModal, useModal } from '@/components/ui/VModal';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import { TournamentPairService } from '@/lib/api/tournament-pair.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import {
  TournamentPair,
  TournamentPlayer,
  CategoryType,
  UserRole,
} from '@/lib/api/types';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';

export default function TournamentPairsPage() {
  const t = useTranslations('pages.tournaments.pairs');
  const tCommon = useTranslations('common');
  const params = useParams();
  const tournamentId = params.id as string;
  const [pairs, setPairs] = useState<TournamentPair[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingPair, setEditingPair] = useState<TournamentPair | null>(null);
  const [pairToDelete, setPairToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    player1Id: '',
    player2Id: '',
    type: '' as CategoryType | '',
    notes: '',
  });

  useEffect(() => {
    if (tournamentId) {
      loadPairs();
      loadPlayers();
    }
  }, [tournamentId]);

  const loadPairs = async () => {
    try {
      setLoading(true);
      const data = await TournamentPairService.getPairs(tournamentId);
      setPairs(data);
    } catch (error) {
      console.error('Error loading pairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      const data = await TournamentPlayerService.getPlayers(tournamentId);
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const handleCreate = () => {
    setEditingPair(null);
    setFormData({
      name: '',
      player1Id: '',
      player2Id: '',
      type: '',
      notes: '',
    });
    onOpen();
  };

  const handleEdit = (pair: TournamentPair) => {
    setEditingPair(pair);
    const member1 = pair.members?.find((m) => m.position === 1);
    const member2 = pair.members?.find((m) => m.position === 2);
    setFormData({
      name: pair.name || '',
      player1Id: member1?.playerId || '',
      player2Id: member2?.playerId || '',
      type: pair.type || '',
      notes: pair.notes || '',
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editingPair) {
        await TournamentPairService.updatePair(editingPair.id, {
          name: formData.name || undefined,
          type: formData.type || undefined,
          notes: formData.notes || undefined,
        });
      } else {
        if (!formData.player1Id || !formData.player2Id) {
          alert(t('selectBothPlayers'));
          return;
        }
        await TournamentPairService.createPair(tournamentId, {
          name: formData.name || undefined,
          playerIds: [formData.player1Id, formData.player2Id],
          type: formData.type || undefined,
          notes: formData.notes || undefined,
        });
      }
      onClose();
      loadPairs();
    } catch (error) {
      console.error('Error saving pair:', error);
    }
  };

  const handleDelete = (pairId: string) => {
    setPairToDelete(pairId);
  };

  const confirmDelete = async () => {
    if (!pairToDelete) return;
    try {
      setIsDeleting(true);
      await TournamentPairService.deletePair(pairToDelete);
      loadPairs();
      setPairToDelete(null);
    } catch (error) {
      console.error('Error deleting pair:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPairTypeLabel = (type?: CategoryType) => {
    if (!type) return '';
    switch (type) {
      case CategoryType.MENS_DOUBLE:
        return t('mensDoubles');
      case CategoryType.WOMENS_DOUBLE:
        return t('womensDoubles');
      case CategoryType.MIXED_DOUBLE:
        return t('mixedDoubles');
      default:
        return '';
    }
  };

  const filteredPairs = pairs.filter((pair) => {
    const searchLower = searchTerm.toLowerCase();
    const pairName = pair.name?.toLowerCase() || '';
    const memberNames =
      pair.members?.map((m) => m.player?.name?.toLowerCase() || '').join(' ') ||
      '';
    return pairName.includes(searchLower) || memberNames.includes(searchLower);
  });

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Box minH="100vh" pb="80px">
        <TopBar
          showBackButton={true}
          backHref={`/tournaments/${tournamentId}/manage`}
          title={t('title')}
        />

        <Container maxW="7xl" p={4} pt={24}>
          <VStack gap={6} alignItems="stretch">
            <Flex
              justify="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={4}
            >
              <Heading size="lg">{t('tournamentPairs')}</Heading>
              <Button
                leftIcon={<Plus size={16} />}
                onClick={handleCreate}
                colorPalette="green"
              >
                {t('addPair')}
              </Button>
            </Flex>

            <HStack>
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                leftElement={<Search size={16} />}
                maxW="300px"
              />
            </HStack>

            {loading ? (
              <Flex justify="center" py={10}>
                <Spinner size="lg" />
              </Flex>
            ) : (
              <>
                {filteredPairs.length === 0 ? (
                  <Box textAlign="center" py={10}>
                    <Text color="gray.500" fontSize="lg">
                      {t('noPairsFound')}
                    </Text>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {filteredPairs.map((pair) => (
                      <Card key={pair.id} variant="outline">
                        <CardBody>
                          <VStack align="stretch" gap={3}>
                            <Flex justify="space-between" alignItems="start">
                              <VStack align="start" gap={1}>
                                <Heading size="sm">
                                  {pair.name || `Pair ${pair.id.slice(0, 8)}`}
                                </Heading>
                                {pair.type && (
                                  <Text
                                    fontSize="xs"
                                    color="green.600"
                                    fontWeight="medium"
                                  >
                                    {getPairTypeLabel(pair.type)}
                                  </Text>
                                )}
                                {pair.members && (
                                  <Text fontSize="sm" color="gray.600">
                                    {pair.members
                                      .map((m) => m.player?.name || 'Unknown')
                                      .join(' & ')}
                                  </Text>
                                )}
                              </VStack>
                              <HStack>
                                <IconButton
                                  aria-label={t('editPair')}
                                  icon={<Edit size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(pair)}
                                />
                                <IconButton
                                  aria-label={t('deletePair')}
                                  icon={<Trash2 size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  colorPalette="red"
                                  onClick={() => handleDelete(pair.id)}
                                />
                              </HStack>
                            </Flex>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </>
            )}
          </VStack>
        </Container>

        {/* Create/Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {editingPair ? t('editPairTitle') : t('addNewPairTitle')}
            </ModalHeader>
            <ModalCloseButton onClose={onClose} />
            <ModalBody>
              <VStack gap={4}>
                <FormControl>
                  <FormLabel>{t('pairNameOptional')}</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t('pairName')}
                  />
                </FormControl>

                <FormControl isRequired={!editingPair}>
                  <FormLabel>{t('type')}</FormLabel>
                  <VSelect
                    value={formData.type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as CategoryType | '',
                      })
                    }
                  >
                    <option value="">{t('selectType')}</option>
                    <option value={CategoryType.MENS_DOUBLE}>
                      {t('mensDoubles')}
                    </option>
                    <option value={CategoryType.WOMENS_DOUBLE}>
                      {t('womensDoubles')}
                    </option>
                    <option value={CategoryType.MIXED_DOUBLE}>
                      {t('mixedDoubles')}
                    </option>
                  </VSelect>
                </FormControl>

                <FormControl isRequired={!editingPair}>
                  <FormLabel>{t('player1')}</FormLabel>
                  <VSelect
                    value={formData.player1Id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, player1Id: e.target.value })
                    }
                    isDisabled={!!editingPair}
                  >
                    <option value="">{t('selectPlayer1')}</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </VSelect>
                </FormControl>

                <FormControl isRequired={!editingPair}>
                  <FormLabel>{t('player2')}</FormLabel>
                  <VSelect
                    value={formData.player2Id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({ ...formData, player2Id: e.target.value })
                    }
                    isDisabled={!!editingPair}
                  >
                    <option value="">{t('selectPlayer2')}</option>
                    {players
                      .filter((p) => p.id !== formData.player1Id)
                      .map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                  </VSelect>
                </FormControl>

                <FormControl>
                  <FormLabel>{t('notes')}</FormLabel>
                  <Input
                    value={formData.notes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder={t('notesPlaceholder')}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button colorPalette="green" onClick={handleSave}>
                {editingPair ? t('update') : t('create')}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <VModal
          isOpen={!!pairToDelete}
          onClose={() => setPairToDelete(null)}
          title={t('deletePair')}
          primaryActionText={tCommon('delete')}
          secondaryActionText={tCommon('cancel')}
          onPrimaryAction={confirmDelete}
          isPrimaryLoading={isDeleting}
          primaryColorScheme="red"
        >
          <Text>{t('deleteConfirmation')}</Text>
        </VModal>
      </Box>
    </ProtectedRouteGuard>
  );
}
