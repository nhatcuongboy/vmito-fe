'use client';

import { ISession, Player } from '@/lib/api/types';
import { Text } from '@chakra-ui/react';
import { Badge } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAiAssistantStore } from '@/stores/useAiAssistantStore';
import { Locale } from '@/i18n/locales';

interface ISessionAiAnalysisChipProps {
  session: ISession;
}

const buildAnalysisPrompt = (session: ISession, locale: string): string => {
  const isVi = locale === Locale.VI;

  const approvedPlayers: Player[] =
    session.players?.filter((p) => p.registrationStatus === 'APPROVED') ?? [];

  const levelCounts: Record<number, number> = {};
  approvedPlayers.forEach((p) => {
    if (p.level) {
      levelCounts[p.level] = (levelCounts[p.level] ?? 0) + 1;
    }
  });

  const levelSummary = Object.entries(levelCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([lvl, cnt]) => `  - Level ${lvl}: ${cnt} player(s)`)
    .join('\n');

  const requiredLevels =
    session.requiredLevels && session.requiredLevels.length > 0
      ? session.requiredLevels.join(', ')
      : isVi
        ? 'Tất cả trình độ'
        : 'All levels';

  if (isVi) {
    return (
      `Hãy phân tích nhanh kèo cầu lông sau và cho tôi biết trình độ phổ biến, ` +
      `mức độ cạnh tranh, và gợi ý cho người chơi muốn tham gia:\n\n` +
      `**Tên kèo:** ${session.name}\n` +
      `**Trình độ yêu cầu:** ${requiredLevels}\n` +
      `**Số người đã đăng ký:** ${approvedPlayers.length}/${session.numberOfCourts * (session.maxPlayersPerCourt ?? 4)}\n` +
      (levelSummary
        ? `**Phân bố trình độ người chơi:**\n${levelSummary}\n`
        : '') +
      `\nChỉ trả lời ngắn gọn (3–5 dòng), bằng tiếng Việt.`
    );
  }

  return (
    `Quickly analyze this badminton session and tell me the common skill level, ` +
    `competitiveness, and a tip for players considering joining:\n\n` +
    `**Session name:** ${session.name}\n` +
    `**Required levels:** ${requiredLevels}\n` +
    `**Players registered:** ${approvedPlayers.length}/${session.numberOfCourts * (session.maxPlayersPerCourt ?? 4)}\n` +
    (levelSummary ? `**Player level breakdown:**\n${levelSummary}\n` : '') +
    `\nKeep the answer concise (3–5 lines).`
  );
};

const SessionAiAnalysisChip = ({ session }: ISessionAiAnalysisChipProps) => {
  const t = useTranslations('session');
  const locale = useLocale();
  const { isAuthenticated, user } = useAuthStore();
  const { openWithMessage } = useAiAssistantStore();

  // Only show for authenticated non-guest users (guests have playerId set)
  const isGuest = !!user?.playerId;
  if (!isAuthenticated || isGuest) return null;

  const handleClick = () => {
    const prompt = buildAnalysisPrompt(session, locale);
    openWithMessage(prompt, `Trang chi tiết kèo: ${session.name}`);
  };

  return (
    <Badge
      as="button"
      display="inline-flex"
      alignItems="center"
      gap={1}
      colorPalette="purple"
      variant="subtle"
      size="sm"
      px={2}
      py={0.5}
      borderRadius="full"
      cursor="pointer"
      _hover={{ opacity: 0.8 }}
      onClick={handleClick}
      flexShrink={0}
    >
      <Sparkles size={11} />
      <Text fontSize="2xs" fontWeight="medium">
        {t('aiAnalyzeChip')}
      </Text>
    </Badge>
  );
};

export default SessionAiAnalysisChip;
