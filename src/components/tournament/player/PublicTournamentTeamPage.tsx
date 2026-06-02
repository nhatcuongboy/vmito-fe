'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Flex, Heading, Spinner, Text } from '@chakra-ui/react';
import { Button, HStack, VStack } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import { Link, useRouter } from '@/i18n/config';
import { useParams } from 'next/navigation';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  QrCode,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';
import QRCode from 'qrcode';
import { toaster } from '@/components/ui/toaster';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  CategoryMatch,
  CategoryRegistration,
  Tournament,
  TournamentPlayer,
} from '@/lib/api/types';
import {
  getTournamentPlayerCode,
  getUniqueTournamentPlayerCode,
} from './PublicTournamentPlayerPage';

export default function PublicTournamentTeamPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.tournamentId as string;
  const registrationCode = (params.registrationCode as string).toLowerCase();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [registration, setRegistration] = useState<CategoryRegistration | null>(
    null
  );
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);

  const load = useCallback(async () => {
    try {
      const tournamentData =
        await TournamentService.getTournament(tournamentId);
      const [categories, tournamentPlayers] = await Promise.all([
        CategoryService.getCategories(tournamentData.id),
        TournamentPlayerService.getPlayers(tournamentData.id),
      ]);
      const registrationsByCategory = await Promise.all(
        categories.map(async (item) => ({
          category: item,
          registrations: await CategoryService.getRegistrations(item.id),
        }))
      );
      const matches = registrationsByCategory.flatMap(
        ({ category, registrations }) =>
          registrations
            .filter((item) =>
              item.id.toLowerCase().startsWith(registrationCode)
            )
            .map((item) => ({ category, registration: item }))
      );
      if (matches.length !== 1) return;
      const resolved = matches[0];
      setTournament(tournamentData);
      setCategory(resolved.category);
      setRegistration(resolved.registration);
      setPlayers(tournamentPlayers);
      setMatches(
        await CategoryService.getRegistrationMatches(
          resolved.category.id,
          resolved.registration.id
        )
      );
    } finally {
      setLoading(false);
    }
  }, [registrationCode, tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const sharePath = useMemo(
    () => `/t/${tournamentId}/team/${registrationCode}`,
    [tournamentId, registrationCode]
  );

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return sharePath;
    return `${window.location.origin}${window.location.pathname}`;
  }, [sharePath]);

  useEffect(() => {
    if (!registration) return;
    QRCode.toDataURL(shareUrl, {
      width: 184,
      margin: 2,
      color: { dark: '#111827', light: '#FFFFFF' },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((error) => console.error('QR code generation error:', error));
  }, [registration, shareUrl]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toaster.success({ title: 'Đã sao chép link' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toaster.error({ title: 'Không thể sao chép link' });
    }
  };

  const playerCodeById = useMemo(() => {
    const ids = players.map((player) => player.id);
    return new Map(
      players.map((player) => [
        player.id,
        getUniqueTournamentPlayerCode(player.id, ids),
      ])
    );
  }, [players]);

  if (loading) {
    return (
      <PageLayout title="Chi tiết đội">
        <Flex justify="center" py={12}>
          <Spinner />
        </Flex>
      </PageLayout>
    );
  }

  if (!tournament || !category || !registration) {
    return (
      <PageLayout title="Chi tiết đội">
        <Text>Không tìm thấy đội trong giải đấu này.</Text>
      </PageLayout>
    );
  }

  const members = registration.pair?.members ?? [];
  const teamName =
    registration.pair?.name || registration.player?.name || 'Đội chưa có tên';

  return (
    <PageLayout title="Chi tiết đội" maxW="container.lg" bg="gray.50">
      <VStack align="stretch" gap={5}>
        <Button
          alignSelf="flex-start"
          variant="ghost"
          leftIcon={<ChevronLeft size={16} />}
          onClick={() => router.push(`/tournament/${tournamentId}/teams`)}
        >
          Danh sách đội
        </Button>
        <Box borderWidth="1px" borderRadius="xl" bg="white" overflow="hidden">
          <Box bg="green.600" color="white" p={6}>
            <HStack gap={3}>
              <Users size={30} />
              <Box>
                <Text opacity={0.85}>Đội thi đấu</Text>
                <Heading size="xl">{teamName}</Heading>
              </Box>
            </HStack>
            <HStack gap={2} mt={4}>
              <Trophy size={16} />
              <Text>{tournament.name}</Text>
            </HStack>
          </Box>
          <Flex
            align="flex-start"
            gap={6}
            p={6}
            direction={{ base: 'column', md: 'row' }}
          >
            <VStack align="stretch" gap={6} flex={1}>
              <Box>
                <Heading size="md" mb={3}>
                  Thành viên
                </Heading>
                {members.length === 0 ? (
                  <Text color="orange.600">
                    Đội chưa cập nhật danh sách VĐV.
                  </Text>
                ) : (
                  <VStack align="stretch" gap={2}>
                    {members.map((member) => (
                      <Link
                        key={member.id}
                        href={`/t/${tournamentId}/p/${
                          playerCodeById.get(member.playerId) ??
                          getTournamentPlayerCode(member.playerId)
                        }`}
                      >
                        <Flex
                          align="center"
                          gap={3}
                          borderWidth="1px"
                          borderRadius="md"
                          p={3}
                        >
                          <UserRound size={18} />
                          <Text>{member.player?.name || 'VĐV'}</Text>
                        </Flex>
                      </Link>
                    ))}
                  </VStack>
                )}
              </Box>
              <Box>
                <HStack gap={2} mb={3}>
                  <CalendarDays size={18} />
                  <Heading size="md">Lịch và kết quả</Heading>
                </HStack>
                {matches.length === 0 ? (
                  <Text color="gray.500">Chưa có trận đấu.</Text>
                ) : (
                  <VStack align="stretch" gap={2}>
                    {matches.map((match) => (
                      <Box
                        key={match.id}
                        borderWidth="1px"
                        borderRadius="md"
                        p={3}
                      >
                        <Text fontWeight="semibold">
                          {match.round} · Trận {match.matchNumber}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {match.score || 'Chưa có kết quả'}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>

            <Box
              w={{ base: 'full', md: '260px' }}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="xl"
              p={4}
              bg="gray.50"
              flexShrink={0}
            >
              <VStack gap={3}>
                <HStack gap={2}>
                  <QrCode size={18} />
                  <Text fontWeight="semibold">QR trang này</Text>
                </HStack>
                <Box bg="white" borderRadius="lg" p={3}>
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="QR code"
                      width={184}
                      height={184}
                      style={{ display: 'block' }}
                    />
                  ) : (
                    <Box w="184px" h="184px" />
                  )}
                </Box>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  textAlign="center"
                  wordBreak="break-all"
                >
                  {shareUrl}
                </Text>
                <Button
                  w="full"
                  variant="outline"
                  colorPalette={copied ? 'green' : 'gray'}
                  leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                  onClick={copyLink}
                >
                  {copied ? 'Đã sao chép' : 'Sao chép link'}
                </Button>
                <Button
                  as={Link}
                  href={sharePath}
                  w="full"
                  variant="ghost"
                  colorPalette="gray"
                  leftIcon={<ExternalLink size={16} />}
                >
                  Mở link
                </Button>
              </VStack>
            </Box>
          </Flex>
        </Box>
      </VStack>
    </PageLayout>
  );
}
