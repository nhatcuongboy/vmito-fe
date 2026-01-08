'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import {
  Button,
  Card,
  CardBody,
  IconButton,
  SimpleGrid,
} from '@/components/ui/chakra-compat';
import TopBar from '@/components/ui/TopBar';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { Level, TournamentPlayer, UserRole } from '@/lib/api/types';
import {
  Badge,
  Box,
  Container,
  DialogCloseTrigger,
  DialogContent,
  DialogRoot,
  DialogTitle,
  Field,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { Edit, Plus, Search, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function TournamentPlayersPage() {
  const t = useTranslations('pages.tournaments.players');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tournamentId = params.id as string;
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { open: isOpen, onOpen, onClose } = useDisclosure();
  const [editingPlayer, setEditingPlayer] = useState<TournamentPlayer | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '' as 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | '',
    level: '' as Level | '',
    levelDescription: '',
  });

  useEffect(() => {
    if (tournamentId) {
      loadPlayers();
    }
  }, [tournamentId]);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await TournamentPlayerService.getPlayers(tournamentId);
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: '',
      level: '',
      levelDescription: '',
    });
    onOpen();
  };

  const handleEdit = (player: TournamentPlayer) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name || '',
      email: player.email || '',
      phone: player.phone || '',
      gender: player.gender || '',
      level: player.level || '',
      levelDescription: player.levelDescription || '',
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      const submitData = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        level: formData.level || undefined,
        levelDescription: formData.levelDescription || undefined,
      };

      if (editingPlayer) {
        await TournamentPlayerService.updatePlayer(
          editingPlayer.id,
          submitData
        );
      } else {
        await TournamentPlayerService.createPlayer(tournamentId, submitData);
      }
      onClose();
      loadPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleDelete = async (playerId: string) => {
    if (!confirm(t('deleteConfirmation'))) return;
    try {
      await TournamentPlayerService.deletePlayer(playerId);
      loadPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const filteredPlayers = players.filter((player) =>
    player.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const levelOptions = Object.values(Level);

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST]}>
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
              <Heading size="lg">{t('tournamentPlayers')}</Heading>
              <Button
                leftIcon={<Plus size={16} />}
                onClick={handleCreate}
                colorScheme="blue"
              >
                {t('addPlayer')}
              </Button>
            </Flex>

            <HStack>
              <Box position="relative" maxW="300px">
                <Box
                  position="absolute"
                  left="8px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <Search size={16} />
                </Box>
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  pl="32px"
                />
              </Box>
            </HStack>

            {loading ? (
              <Flex justify="center" py={10}>
                <Spinner size="lg" />
              </Flex>
            ) : (
              <>
                {filteredPlayers.length === 0 ? (
                  <Box textAlign="center" py={10}>
                    <Text color="gray.500" fontSize="lg">
                      {t('noPlayersFound')}
                    </Text>
                  </Box>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {filteredPlayers.map((player) => (
                      <Card key={player.id} variant="outline">
                        <CardBody>
                          <VStack align="stretch" gap={3}>
                            <Flex justify="space-between" alignItems="start">
                              <VStack align="start" gap={1}>
                                <Heading size="sm">{player.name}</Heading>
                                {player.level && (
                                  <Badge colorScheme="blue">
                                    {player.level}
                                  </Badge>
                                )}
                              </VStack>
                              <HStack>
                                <IconButton
                                  aria-label={t('editPlayer')}
                                  icon={<Edit size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(player)}
                                />
                                <IconButton
                                  aria-label={t('deletePlayer')}
                                  icon={<Trash2 size={16} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDelete(player.id)}
                                />
                              </HStack>
                            </Flex>

                            {player.email && (
                              <Text fontSize="sm" color="gray.600">
                                {player.email}
                              </Text>
                            )}
                            {player.phone && (
                              <Text fontSize="sm" color="gray.600">
                                {player.phone}
                              </Text>
                            )}
                            {player.gender && (
                              <Text fontSize="sm" color="gray.600">
                                {t('gender')}: {player.gender}
                              </Text>
                            )}
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
        <DialogRoot
          open={isOpen}
          onOpenChange={(details) => {
            if (!details.open) onClose();
          }}
        >
          <DialogContent maxW="600px">
            <DialogTitle>
              {editingPlayer ? t('editPlayerTitle') : t('addNewPlayerTitle')}
            </DialogTitle>
            <DialogCloseTrigger />
            <Box p={4}>
              <VStack gap={4}>
                <Field.Root required>
                  <Field.Label>{t('playerName')}</Field.Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={t('playerName')}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t('email')}</Field.Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder={t('emailOptional')}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t('phone')}</Field.Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder={t('phoneOptional')}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t('gender')}</Field.Label>
                  <select
                    value={formData.gender}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as
                          | 'MALE'
                          | 'FEMALE'
                          | 'OTHER'
                          | 'PREFER_NOT_TO_SAY'
                          | '',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderWidth: '1px',
                      borderColor: '#CBD5E0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      fontSize: '14px',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3182CE';
                      e.target.style.boxShadow = '0 0 0 1px #3182CE';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#CBD5E0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">{t('selectGender')}</option>
                    <option value="MALE">{t('male')}</option>
                    <option value="FEMALE">{t('female')}</option>
                    <option value="OTHER">{t('other')}</option>
                    <option value="PREFER_NOT_TO_SAY">
                      {t('preferNotToSay')}
                    </option>
                  </select>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t('level')}</Field.Label>
                  <select
                    value={formData.level}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as Level | '',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderWidth: '1px',
                      borderColor: '#CBD5E0',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      fontSize: '14px',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3182CE';
                      e.target.style.boxShadow = '0 0 0 1px #3182CE';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#CBD5E0';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="">{t('selectLevel')}</option>
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t('levelDescription')}</Field.Label>
                  <Input
                    value={formData.levelDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        levelDescription: e.target.value,
                      })
                    }
                    placeholder={t('levelDescriptionPlaceholder')}
                  />
                </Field.Root>
              </VStack>
            </Box>
            <Flex
              justify="flex-end"
              gap={3}
              p={4}
              borderTopWidth="1px"
              borderColor="gray.200"
            >
              <Button variant="ghost" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button colorScheme="blue" onClick={handleSave}>
                {editingPlayer ? t('update') : t('create')}
              </Button>
            </Flex>
          </DialogContent>
        </DialogRoot>
      </Box>
    </ProtectedRouteGuard>
  );
}
