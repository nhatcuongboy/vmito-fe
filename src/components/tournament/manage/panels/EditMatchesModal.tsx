'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, Portal } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { GripVertical, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ITeamOption {
  id: string;
  name: string;
  poolName?: string;
}

interface IMatchRow {
  id: string;
  team1Id: string;
  team2Id: string;
}

export interface IEditMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: IMatchRow[];
  teams: ITeamOption[];
  onConfirm: (matches: IMatchRow[]) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface IPoolGroup {
  poolName: string;
  items: ITeamOption[];
}

const buildPoolGroups = (teams: ITeamOption[]): IPoolGroup[] => {
  const groupMap = new Map<string, ITeamOption[]>();
  const noPool: ITeamOption[] = [];

  teams.forEach((team) => {
    if (team.poolName) {
      if (!groupMap.has(team.poolName)) groupMap.set(team.poolName, []);
      groupMap.get(team.poolName)!.push(team);
    } else {
      noPool.push(team);
    }
  });

  const result: IPoolGroup[] = Array.from(groupMap.entries()).map(
    ([poolName, items]) => ({ poolName, items })
  );
  if (noPool.length > 0) result.push({ poolName: '', items: noPool });
  return result;
};

const generateId = () =>
  `match-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ─── TeamSelect ───────────────────────────────────────────────────────────────

interface ITeamSelectProps {
  value: string;
  poolGroups: IPoolGroup[];
  placeholder: string;
  onChange: (value: string) => void;
}

const TeamSelect = ({
  value,
  poolGroups,
  placeholder,
  onChange,
}: ITeamSelectProps) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%',
      padding: '0 12px',
      height: '40px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      background: 'white',
      cursor: 'pointer',
    }}
  >
    <option value="">{placeholder}</option>
    {poolGroups.map((group) =>
      group.poolName ? (
        <optgroup key={group.poolName} label={group.poolName}>
          {group.items.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </optgroup>
      ) : (
        group.items.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))
      )
    )}
  </select>
);

// ─── Component ───────────────────────────────────────────────────────────────

export default function EditMatchesModal({
  isOpen,
  onClose,
  matches: initialMatches,
  teams,
  onConfirm,
}: IEditMatchesModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [rows, setRows] = useState<IMatchRow[]>(() =>
    initialMatches.map((m) => ({ ...m }))
  );
  const [pendingTeam1, setPendingTeam1] = useState('');
  const [pendingTeam2, setPendingTeam2] = useState('');

  // Drag-and-drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const poolGroups = buildPoolGroups(teams);

  // Reset rows when modal opens
  useEffect(() => {
    if (isOpen) {
      setRows(initialMatches.map((m) => ({ ...m })));
      setPendingTeam1('');
      setPendingTeam2('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleTeamChange = (
    rowIndex: number,
    position: 'team1Id' | 'team2Id',
    value: string
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [position]: value };
      return updated;
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  // Commit pending row once both teams are selected
  const handlePendingChange = (
    position: 'team1Id' | 'team2Id',
    value: string
  ) => {
    const next1 = position === 'team1Id' ? value : pendingTeam1;
    const next2 = position === 'team2Id' ? value : pendingTeam2;
    if (next1 && next2) {
      setRows((prev) => [
        ...prev,
        { id: generateId(), team1Id: next1, team2Id: next2 },
      ]);
      setPendingTeam1('');
      setPendingTeam2('');
    } else {
      if (position === 'team1Id') setPendingTeam1(value);
      else setPendingTeam2(value);
    }
  };

  // ── Drag-and-drop handlers ──

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    setRows((prev) => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, dragged);
      return updated;
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleConfirm = () => {
    onConfirm(rows);
    onClose();
  };

  const selectTeamPlaceholder = t('panels.rounds.selectTeam');

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        inset="0"
        zIndex={1500}
        bg="blackAlpha.600"
        display="flex"
        alignItems="center"
        justifyContent="center"
        onClick={onClose}
      >
        <Box
          bg="white"
          borderRadius="xl"
          w={{ base: '95vw', md: '720px' }}
          maxH="85vh"
          display="flex"
          flexDirection="column"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <Flex
            px={6}
            py={4}
            borderBottomWidth="1px"
            borderColor="gray.200"
            align="center"
            justify="space-between"
          >
            <Text fontWeight="bold" fontSize="lg">
              {t('panels.rounds.editMatches')}
            </Text>
            <Box
              as="button"
              onClick={onClose}
              p={1}
              borderRadius="md"
              _hover={{ bg: 'gray.100' }}
            >
              <X size={20} />
            </Box>
          </Flex>

          {/* Match rows */}
          <Box flex={1} overflowY="auto" px={6} py={4}>
            <VStack gap={2} align="stretch">
              {rows.map((row, idx) => (
                <Flex
                  key={row.id}
                  align="center"
                  gap={2}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  borderWidth="1px"
                  borderColor={
                    dragOverIndex === idx ? 'blue.400' : 'transparent'
                  }
                  borderRadius="md"
                  bg={dragOverIndex === idx ? 'blue.50' : 'transparent'}
                  style={{ transition: 'background 0.1s, border-color 0.1s' }}
                  px={1}
                  py="2px"
                >
                  {/* Row number */}
                  <Flex
                    w="32px"
                    h="32px"
                    bg="gray.100"
                    borderRadius="md"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Text fontSize="sm" fontWeight="medium" color="gray.600">
                      {idx + 1}
                    </Text>
                  </Flex>

                  {/* Team 1 dropdown */}
                  <Box flex={1}>
                    <TeamSelect
                      value={row.team1Id}
                      poolGroups={poolGroups}
                      placeholder={selectTeamPlaceholder}
                      onChange={(value) =>
                        handleTeamChange(idx, 'team1Id', value)
                      }
                    />
                  </Box>

                  {/* VS label */}
                  <Text
                    fontSize="sm"
                    color="gray.400"
                    fontWeight="medium"
                    flexShrink={0}
                    px={1}
                  >
                    {t('panels.rounds.vs')}
                  </Text>

                  {/* Team 2 dropdown */}
                  <Box flex={1}>
                    <TeamSelect
                      value={row.team2Id}
                      poolGroups={poolGroups}
                      placeholder={selectTeamPlaceholder}
                      onChange={(value) =>
                        handleTeamChange(idx, 'team2Id', value)
                      }
                    />
                  </Box>

                  {/* Delete button */}
                  <Box
                    as="button"
                    onClick={() => handleDeleteRow(idx)}
                    p={2}
                    borderRadius="md"
                    _hover={{ bg: 'gray.100' }}
                    flexShrink={0}
                  >
                    <Trash2 size={16} color="#a0aec0" />
                  </Box>

                  {/* Drag handle */}
                  <Box
                    color="gray.400"
                    flexShrink={0}
                    cursor="grab"
                    _active={{ cursor: 'grabbing' }}
                  >
                    <GripVertical size={16} />
                  </Box>
                </Flex>
              ))}

              {/* Pending row — auto-commits when both teams are selected */}
              <Flex align="center" gap={2} px={1} py="2px">
                {/* Empty number placeholder */}
                <Box
                  w="32px"
                  h="32px"
                  bg="gray.50"
                  borderRadius="md"
                  flexShrink={0}
                />

                {/* Team 1 dropdown */}
                <Box flex={1}>
                  <TeamSelect
                    value={pendingTeam1}
                    poolGroups={poolGroups}
                    placeholder={selectTeamPlaceholder}
                    onChange={(value) => handlePendingChange('team1Id', value)}
                  />
                </Box>

                {/* VS label */}
                <Text
                  fontSize="sm"
                  color="gray.400"
                  fontWeight="medium"
                  flexShrink={0}
                  px={1}
                >
                  {t('panels.rounds.vs')}
                </Text>

                {/* Team 2 dropdown */}
                <Box flex={1}>
                  <TeamSelect
                    value={pendingTeam2}
                    poolGroups={poolGroups}
                    placeholder={selectTeamPlaceholder}
                    onChange={(value) => handlePendingChange('team2Id', value)}
                  />
                </Box>

                {/* Spacers to align with delete + drag columns */}
                <Box w="36px" flexShrink={0} />
                <Box w="24px" flexShrink={0} />
              </Flex>
            </VStack>
          </Box>

          {/* Footer */}
          <Flex
            px={6}
            py={4}
            borderTopWidth="1px"
            borderColor="gray.200"
            align="center"
            justify="space-between"
          >
            <Button variant="ghost" onClick={onClose}>
              {t('panels.rounds.cancel')}
            </Button>
            <Button
              style={{ background: '#1a202c', color: 'white' }}
              onClick={handleConfirm}
            >
              {t('panels.rounds.confirm')}
            </Button>
          </Flex>
        </Box>
      </Box>
    </Portal>
  );
}
