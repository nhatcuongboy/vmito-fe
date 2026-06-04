'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Textarea,
  Input,
  Spinner,
  Table,
  Badge,
  Stack,
  Tabs,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations, useLocale } from 'next-intl';
import { Upload, Wand2, RefreshCcw } from 'lucide-react';
import VDrawer from '@/components/ui/VDrawer';
import { toaster } from '@/components/ui/toaster';
import { AIService, IExtractedScheduleEntry } from '@/lib/api/ai.service';
import { CategoryService } from '@/lib/api/category.service';
import type {
  Category,
  CategoryMatch,
  IBulkScheduleItem,
  TournamentCourt,
} from '@/lib/api/types';
import { Locale } from '@/i18n/locales';
import {
  parseScheduleFile,
  UnsupportedFileError,
} from '@/utils/parse-schedule-file';

type RowStatus = 'ok' | 'noMatch' | 'noCourt' | 'invalidTime' | 'conflict';

interface PreviewRow {
  key: string;
  entry: IExtractedScheduleEntry;
  matchId?: string;
  courtId?: string;
  startTime?: string; // ISO
  endTime?: string; // ISO
  status: RowStatus;
  include: boolean;
}

interface AIImportScheduleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  categories: Category[];
  courts: TournamentCourt[];
  matches: CategoryMatch[];
  onImported?: () => void;
}

type Step = 'input' | 'preview';

const normalize = (s: string | undefined | null): string =>
  (s ?? '').trim().toLowerCase();

const normalizeCode = (s: string | undefined | null): string =>
  normalize(s).replace(/[^a-z0-9]/g, '');

const REGISTRATION_CODE_LENGTH = 8;

const getUniqueRegistrationCode = (
  registrationId: string,
  registrationIds: string[]
) => {
  const normalizedIds = registrationIds.map((id) => id.toLowerCase());
  const normalizedId = registrationId.toLowerCase();
  let codeLength = Math.min(REGISTRATION_CODE_LENGTH, registrationId.length);

  while (codeLength < registrationId.length) {
    const candidate = normalizedId.slice(0, codeLength);
    const matches = normalizedIds.filter((id) => id.startsWith(candidate));

    if (matches.length <= 1) return candidate;
    codeLength += 1;
  }

  return normalizedId;
};

const findCategory = (
  name: string | undefined,
  categories: Category[]
): Category | undefined => {
  if (!name) return undefined;
  const target = normalize(name);
  return categories.find((c) => normalize(c.name) === target);
};

const findCourt = (
  name: string | undefined,
  courts: TournamentCourt[]
): TournamentCourt | undefined => {
  if (!name) return undefined;
  const target = normalize(name);
  // Exact match on courtName
  const byName = courts.find((c) => normalize(c.courtName) === target);
  if (byName) return byName;
  // Match by court number embedded in string (e.g. "Sân 1", "Court 1", "1")
  const numMatch = target.match(/(\d+)/);
  if (numMatch) {
    const n = Number.parseInt(numMatch[1], 10);
    const byNumber = courts.find((c) => c.courtNumber === n);
    if (byNumber) return byNumber;
  }
  return undefined;
};

const buildDateTimeISO = (
  date: string | undefined,
  time: string | undefined
): string | undefined => {
  if (!date || !time) return undefined;
  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) return undefined;
  // Interpret as Vietnam local time → convert to UTC ISO (Vietnam = UTC+7)
  const [, y, mo, d] = dateMatch;
  const [, hh, mm] = timeMatch;
  const localUtcMs = Date.UTC(
    Number.parseInt(y, 10),
    Number.parseInt(mo, 10) - 1,
    Number.parseInt(d, 10),
    Number.parseInt(hh, 10),
    Number.parseInt(mm, 10)
  );
  return new Date(localUtcMs - 7 * 60 * 60 * 1000).toISOString();
};

const addMinutesISO = (iso: string, minutes: number): string =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

const getRawLineParts = (entry: IExtractedScheduleEntry): string[] =>
  (entry.rawLine ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const getEntryMatchCode = (
  entry: IExtractedScheduleEntry
): string | undefined => {
  if (entry.matchCode?.trim()) return entry.matchCode.trim();

  const rawMatchCode = getRawLineParts(entry).find((part) =>
    /[a-z]{1,8}[-_]?[a-z0-9]*\d{1,4}$/i.test(part)
  );
  return rawMatchCode;
};

const getEntryTeamCodes = (entry: IExtractedScheduleEntry): string[] => {
  const explicitCodes = [
    entry.team1Code,
    entry.team2Code,
    ...(entry.teamCodes ?? []),
  ].filter((code): code is string => Boolean(code?.trim()));

  const rawTeamCodes =
    entry.rawLine
      ?.match(
        /\b([a-z]{1,8}[-_]?\d{1,4})\b\s*(?:vs|v|versus|đấu|gap|gặp|[-–—])\s*\b([a-z]{1,8}[-_]?\d{1,4})\b/i
      )
      ?.slice(1, 3) ?? [];

  return Array.from(
    new Set([...explicitCodes, ...rawTeamCodes].map(normalizeCode))
  ).filter(Boolean);
};

const getMatchParticipantCodes = (
  match: CategoryMatch,
  registrationCodeById: Map<string, string>
): string[] => {
  const codes: Array<string | undefined> = [];

  for (const participant of match.participants ?? []) {
    const registration = participant.categoryRegistration;
    const registrationId = participant.categoryRegistrationId;
    codes.push(registrationId, registrationCodeById.get(registrationId));

    if (registration) {
      codes.push(
        registration.id,
        registration.pair?.name,
        registration.player?.code,
        registration.player?.name,
        ...(registration.pair?.members ?? []).flatMap((member) => [
          member.player?.code,
          member.player?.name,
        ])
      );
    }
  }

  return Array.from(new Set(codes.map(normalizeCode))).filter(Boolean);
};

const findMatch = (
  entry: IExtractedScheduleEntry,
  category: Category | undefined,
  matches: CategoryMatch[],
  matchByCategoryAndNumber: Map<string, CategoryMatch>,
  registrationCodeById: Map<string, string>
): CategoryMatch | undefined => {
  const candidates = category
    ? matches.filter((match) => match.categoryId === category.id)
    : matches;

  const entryMatchCode = normalizeCode(getEntryMatchCode(entry));
  if (entryMatchCode) {
    const matchByCode = candidates.find(
      (match) => normalizeCode(match.matchCode) === entryMatchCode
    );
    if (matchByCode) return matchByCode;
  }

  const teamCodes = getEntryTeamCodes(entry);
  if (teamCodes.length >= 2) {
    const matchByTeams = candidates.find((match) => {
      const participantCodes = getMatchParticipantCodes(
        match,
        registrationCodeById
      );
      return teamCodes.every((code) => participantCodes.includes(code));
    });
    if (matchByTeams) return matchByTeams;
  }

  const matchKey =
    category && entry.matchNumber
      ? `${category.id}::${entry.matchNumber}`
      : undefined;
  return matchKey ? matchByCategoryAndNumber.get(matchKey) : undefined;
};

export default function AIImportScheduleDrawer({
  isOpen,
  onClose,
  tournamentId,
  categories,
  courts,
  matches,
  onImported,
}: AIImportScheduleDrawerProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.manager.aiImport'
  );
  const locale = useLocale() as Locale;

  const [step, setStep] = useState<Step>('input');
  const [inputTab, setInputTab] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState<PreviewRow[]>([]);

  const matchByCategoryAndNumber = useMemo(() => {
    const map = new Map<string, CategoryMatch>();
    for (const m of matches) {
      map.set(`${m.categoryId}::${m.matchNumber}`, m);
    }
    return map;
  }, [matches]);

  const registrationCodeById = useMemo(() => {
    const registrationIds = Array.from(
      new Set(
        matches.flatMap(
          (match) =>
            match.participants?.map(
              (participant) => participant.categoryRegistrationId
            ) ?? []
        )
      )
    );

    return new Map(
      registrationIds.map((id) => [
        id,
        getUniqueRegistrationCode(id, registrationIds),
      ])
    );
  }, [matches]);

  const resetState = useCallback(() => {
    setStep('input');
    setInputTab('text');
    setText('');
    setFileName(null);
    setRows([]);
  }, []);

  const handleClose = useCallback(() => {
    if (isExtracting || isSaving || isParsingFile) return;
    resetState();
    onClose();
  }, [isExtracting, isSaving, isParsingFile, resetState, onClose]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ''; // allow re-uploading same file
      if (!file) return;
      setIsParsingFile(true);
      try {
        const parsed = await parseScheduleFile(file);
        setText(parsed);
        setFileName(file.name);
      } catch (err) {
        if (err instanceof UnsupportedFileError) {
          toaster.error({ title: t('unsupportedFile') });
        } else {
          toaster.error({ title: t('fileParsing') });
        }
      } finally {
        setIsParsingFile(false);
      }
    },
    [t]
  );

  const buildPreviewRows = useCallback(
    (entries: IExtractedScheduleEntry[]): PreviewRow[] => {
      // Track scheduled time slots per court (existing + this batch) to detect conflicts
      const courtUsage = new Map<
        string,
        Array<{ start: number; end: number; matchId: string }>
      >();
      for (const m of matches) {
        if (!m.courtId || !m.startTime) continue;
        const start = new Date(m.startTime).getTime();
        const end = m.endTime
          ? new Date(m.endTime).getTime()
          : m.estimatedEndTime
            ? new Date(m.estimatedEndTime).getTime()
            : start + 60 * 60_000;
        const list = courtUsage.get(m.courtId) ?? [];
        list.push({ start, end, matchId: m.id });
        courtUsage.set(m.courtId, list);
      }

      return entries.map((entry, idx) => {
        const category = findCategory(entry.categoryName, categories);
        const match = findMatch(
          entry,
          category,
          matches,
          matchByCategoryAndNumber,
          registrationCodeById
        );
        const court = findCourt(entry.courtName, courts);
        const startTime = buildDateTimeISO(entry.date, entry.startTime);
        const duration = entry.durationMinutes ?? 60;
        const endTime = startTime
          ? addMinutesISO(startTime, duration)
          : undefined;

        let status: RowStatus = 'ok';
        if (!match) status = 'noMatch';
        else if (!court) status = 'noCourt';
        else if (!startTime || !endTime) status = 'invalidTime';
        else {
          // Conflict check: skip slot belonging to this same match
          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          const usage = courtUsage.get(court.id) ?? [];
          const overlaps = usage.some(
            (slot) =>
              slot.matchId !== match.id && start < slot.end && end > slot.start
          );
          if (overlaps) status = 'conflict';
        }

        return {
          key: `${idx}-${entry.categoryName ?? ''}-${entry.matchNumber ?? ''}`,
          entry,
          matchId: match?.id,
          courtId: court?.id,
          startTime,
          endTime,
          status,
          include: status === 'ok',
        };
      });
    },
    [
      categories,
      courts,
      matches,
      matchByCategoryAndNumber,
      registrationCodeById,
    ]
  );

  const handleExtract = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toaster.error({ title: t('textRequired') });
      return;
    }
    setIsExtracting(true);
    try {
      const result = await AIService.extractSchedule({
        tournamentId,
        text: trimmed,
        language: locale,
      });
      const previewRows = buildPreviewRows(result.entries ?? []);
      setRows(previewRows);
      setStep('preview');
    } catch (error) {
      console.error('[AI Import Schedule] extract failed:', error);
      toaster.error({ title: t('aiFailed') });
    } finally {
      setIsExtracting(false);
    }
  }, [text, tournamentId, locale, buildPreviewRows, t]);

  const handleSave = useCallback(async () => {
    const includedRows = rows.filter(
      (r) => r.include && r.matchId && r.courtId && r.startTime && r.endTime
    );
    const updates: IBulkScheduleItem[] = includedRows.map((r) => ({
      matchId: r.matchId!,
      courtId: r.courtId!,
      startTime: r.startTime!,
      endTime: r.endTime!,
    }));
    const matchCodeUpdates = includedRows
      .filter((r): r is PreviewRow & { matchId: string } =>
        Boolean(r.entry.matchCode?.trim() && r.matchId)
      )
      .map((r) => ({
        matchId: r.matchId,
        matchCode: r.entry.matchCode!.trim(),
      }));

    if (updates.length === 0) {
      toaster.error({ title: t('nothingToSave') });
      return;
    }

    setIsSaving(true);
    try {
      await Promise.all([
        CategoryService.bulkUpdateSchedule(updates),
        ...matchCodeUpdates.map((item) =>
          CategoryService.updateMatch(
            item.matchId,
            { matchCode: item.matchCode },
            { showToast: false }
          )
        ),
      ]);
      toaster.success({
        title: t('importSuccess', { count: updates.length }),
      });
      onImported?.();
      resetState();
      onClose();
    } catch (error) {
      console.error('[AI Import Schedule] save failed:', error);
      toaster.error({ title: t('importFailed') });
    } finally {
      setIsSaving(false);
    }
  }, [rows, t, onImported, resetState, onClose]);

  const includedCount = rows.filter((r) => r.include).length;
  const conflictCount = rows.filter(
    (r) =>
      r.status === 'conflict' ||
      r.status === 'noMatch' ||
      r.status === 'noCourt' ||
      r.status === 'invalidTime'
  ).length;

  const statusColor: Record<RowStatus, string> = {
    ok: 'green',
    noMatch: 'red',
    noCourt: 'orange',
    invalidTime: 'orange',
    conflict: 'yellow',
  };

  return (
    <VDrawer
      isOpen={isOpen}
      onClose={handleClose}
      title={t('drawerTitle')}
      size="xl"
      placement="right"
      hideSecondaryAction
      footer={
        <Flex justify="flex-end" align="center" gap={3} w="full">
          {step === 'preview' && (
            <Button
              variant="ghost"
              onClick={() => setStep('input')}
              disabled={isSaving}
            >
              <RefreshCcw size={14} />
              {t('backToInput')}
            </Button>
          )}
          <Button variant="ghost" onClick={handleClose} disabled={isSaving}>
            {t('cancel')}
          </Button>
          {step === 'input' ? (
            <Button
              colorPalette="purple"
              onClick={handleExtract}
              loading={isExtracting}
              disabled={isParsingFile || !text.trim()}
            >
              <Wand2 size={14} />
              {isExtracting ? t('extracting') : t('extractBtn')}
            </Button>
          ) : (
            <Button
              colorPalette="green"
              onClick={handleSave}
              loading={isSaving}
              disabled={includedCount === 0}
            >
              {isSaving ? t('saving') : t('saveBtn', { count: includedCount })}
            </Button>
          )}
        </Flex>
      }
    >
      {step === 'input' ? (
        <Stack gap={4}>
          <Tabs.Root
            value={inputTab}
            onValueChange={(e) => setInputTab(e.value as 'text' | 'file')}
          >
            <Tabs.List>
              <Tabs.Trigger value="text">{t('tabText')}</Tabs.Trigger>
              <Tabs.Trigger value="file">{t('tabFile')}</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="text" pt={4}>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('textareaPlaceholder')}
                rows={14}
                resize="vertical"
                fontFamily="mono"
                fontSize="sm"
              />
            </Tabs.Content>

            <Tabs.Content value="file" pt={4}>
              <Stack gap={3}>
                <Box
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor="gray.300"
                  borderRadius="md"
                  p={6}
                  textAlign="center"
                  _dark={{ borderColor: 'gray.600' }}
                >
                  <Flex direction="column" align="center" gap={3}>
                    <Upload size={24} />
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: 'gray.300' }}
                    >
                      {t('dropzoneLabel')}
                    </Text>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      maxW="320px"
                      disabled={isParsingFile}
                    />
                    {isParsingFile && (
                      <Flex align="center" gap={2}>
                        <Spinner size="sm" />
                        <Text fontSize="sm">{t('fileParsing')}</Text>
                      </Flex>
                    )}
                    {fileName && !isParsingFile && (
                      <Text fontSize="sm" color="green.600">
                        {fileName}
                      </Text>
                    )}
                  </Flex>
                </Box>
                {text && (
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {t('parsedPreview')}
                    </Text>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={8}
                      resize="vertical"
                      fontFamily="mono"
                      fontSize="xs"
                    />
                  </Box>
                )}
              </Stack>
            </Tabs.Content>
          </Tabs.Root>

          <Box
            bg="purple.50"
            borderRadius="md"
            p={3}
            _dark={{ bg: 'purple.900' }}
          >
            <Text
              fontSize="xs"
              color="purple.800"
              _dark={{ color: 'purple.100' }}
            >
              {t('aiHint')}
            </Text>
          </Box>
        </Stack>
      ) : (
        <Stack gap={3}>
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {t('previewSummary', {
                total: rows.length,
                included: includedCount,
                issues: conflictCount,
              })}
            </Text>
          </Flex>

          {rows.length === 0 ? (
            <Box
              p={6}
              textAlign="center"
              bg="gray.50"
              borderRadius="md"
              _dark={{ bg: 'gray.700' }}
            >
              <Text color="gray.500">{t('previewEmpty')}</Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader />
                    <Table.ColumnHeader>{t('colCategory')}</Table.ColumnHeader>
                    <Table.ColumnHeader>{t('colMatch')}</Table.ColumnHeader>
                    <Table.ColumnHeader>{t('colCourt')}</Table.ColumnHeader>
                    <Table.ColumnHeader>{t('colTime')}</Table.ColumnHeader>
                    <Table.ColumnHeader>{t('colStatus')}</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {rows.map((row) => {
                    const canInclude =
                      row.status === 'ok' || row.status === 'conflict';
                    const startLabel = row.startTime
                      ? new Date(row.startTime).toLocaleString(locale, {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })
                      : '—';
                    const matchLabel = (() => {
                      if (row.entry.matchCode?.trim())
                        return row.entry.matchCode.trim();
                      if (row.entry.team1Code && row.entry.team2Code)
                        return `${row.entry.team1Code} vs ${row.entry.team2Code}`;
                      if (row.entry.matchNumber != null)
                        return `#${row.entry.matchNumber}`;
                      return '—';
                    })();
                    const courtLabel = (() => {
                      if (row.courtId) {
                        const c = courts.find((co) => co.id === row.courtId);
                        return c?.courtName ?? `Sân ${c?.courtNumber ?? '?'}`;
                      }
                      return row.entry.courtName ?? '—';
                    })();
                    return (
                      <Table.Row key={row.key}>
                        <Table.Cell>
                          <input
                            type="checkbox"
                            checked={row.include}
                            disabled={!canInclude}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.key === row.key
                                    ? { ...r, include: checked }
                                    : r
                                )
                              );
                            }}
                          />
                        </Table.Cell>
                        <Table.Cell>{row.entry.categoryName ?? '—'}</Table.Cell>
                        <Table.Cell>{matchLabel}</Table.Cell>
                        <Table.Cell>{courtLabel}</Table.Cell>
                        <Table.Cell>{startLabel}</Table.Cell>
                        <Table.Cell>
                          <Badge
                            colorPalette={statusColor[row.status]}
                            size="sm"
                          >
                            {t(`status_${row.status}`)}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Stack>
      )}
    </VDrawer>
  );
}
