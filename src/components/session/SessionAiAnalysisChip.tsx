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

const buildAnalysisPrompt = (
  session: ISession,
  locale: string,
  getLevelShortLabel: (level: number) => string
): string => {
  const isVi = locale === Locale.VI;
  const isCn = locale === Locale.CN;

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
    .map(([lvl, cnt]) => {
      const numericLevel = Number(lvl);
      const levelLabel = `${getLevelShortLabel(numericLevel)} (${numericLevel})`;
      if (isVi) return `  - ${levelLabel}: ${cnt} người chơi`;
      if (isCn) return `  - ${levelLabel}: ${cnt} 名球员`;
      return `  - ${levelLabel}: ${cnt} player(s)`;
    })
    .join('\n');

  const requiredLevels =
    session.requiredLevels && session.requiredLevels.length > 0
      ? Array.from(new Set(session.requiredLevels))
          .sort((a, b) => a - b)
          .map((level) => `${getLevelShortLabel(level)} (${level})`)
          .join(', ')
      : isVi
        ? 'Tất cả trình độ'
        : isCn
          ? '所有水平'
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
      `\nLưu ý: dùng đúng nhãn trình độ đã cung cấp, không tự suy diễn tên khác.\n` +
      `\nChỉ trả lời ngắn gọn (3–5 dòng), bằng tiếng Việt.`
    );
  }

  if (isCn) {
    return (
      `请快速分析下面的羽毛球场次，并告诉我常见水平、竞争强度，以及给想参加球员的建议：\n\n` +
      `**场次名称：** ${session.name}\n` +
      `**要求水平：** ${requiredLevels}\n` +
      `**已报名人数：** ${approvedPlayers.length}/${session.numberOfCourts * (session.maxPlayersPerCourt ?? 4)}\n` +
      (levelSummary ? `**球员水平分布：**\n${levelSummary}\n` : '') +
      `\n注意：请使用上面提供的水平标签，不要自行推断其他名称。\n` +
      `\n请用中文简短回答（3-5 行）。`
    );
  }

  return (
    `Quickly analyze this badminton session and tell me the common skill level, ` +
    `competitiveness, and a tip for players considering joining:\n\n` +
    `**Session name:** ${session.name}\n` +
    `**Required levels:** ${requiredLevels}\n` +
    `**Players registered:** ${approvedPlayers.length}/${session.numberOfCourts * (session.maxPlayersPerCourt ?? 4)}\n` +
    (levelSummary ? `**Player level breakdown:**\n${levelSummary}\n` : '') +
    `\nUse the provided skill labels exactly; do not infer alternate level names.\n` +
    `\nKeep the answer concise (3–5 lines).`
  );
};

const SessionAiAnalysisChip = ({ session }: ISessionAiAnalysisChipProps) => {
  const t = useTranslations('session');
  const tAi = useTranslations('aiAssistant');
  const tLevelShorts = useTranslations('common.levelShorts');
  const locale = useLocale();
  const { isAuthenticated, user } = useAuthStore();
  const { openWithMessage } = useAiAssistantStore();

  // Only show for authenticated non-guest users (guests have playerId set)
  const isGuest = !!user?.playerId;
  if (!isAuthenticated || isGuest) return null;

  const handleClick = () => {
    const prompt = buildAnalysisPrompt(session, locale, (level) =>
      tLevelShorts(`${level}` as Parameters<typeof tLevelShorts>[0])
    );
    openWithMessage(
      prompt,
      tAi('pageContexts.sessionDetail', { name: session.name })
    );
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
      py={1.5}
      borderRadius="full"
      cursor="pointer"
      _hover={{ opacity: 0.8 }}
      onClick={handleClick}
      flexShrink={0}
    >
      <Sparkles size={12} />
      <Text fontSize="xs" fontWeight="medium">
        {t('aiAnalyzeChip')}
      </Text>
    </Badge>
  );
};

export default SessionAiAnalysisChip;
