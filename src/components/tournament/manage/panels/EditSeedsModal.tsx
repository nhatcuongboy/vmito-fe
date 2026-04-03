'use client';

import { useEffect, useState, useCallback } from 'react';
import { Box, Flex, Text, Portal } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';
import { GripVertical, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext as SortableContextBase,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Workaround for @dnd-kit type incompatibility with React 19
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SortableContext = SortableContextBase as any;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ISeedTeam {
  id: string;
  name: string;
}

export interface IEditSeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: ISeedTeam[];
  onConfirm: (teams: ISeedTeam[]) => void;
}

// ─── Sortable Row ────────────────────────────────────────────────────────────

function SortableRow({ team, index }: { team: ISeedTeam; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <Flex
      ref={setNodeRef}
      style={style}
      align="center"
      gap={3}
      px={4}
      py={3}
      bg={index === 0 ? 'gray.50' : 'white'}
      borderBottomWidth="1px"
      borderColor="gray.100"
      _last={{ borderBottomWidth: '0' }}
    >
      <Text
        fontSize="sm"
        color="gray.500"
        fontWeight="medium"
        minW="24px"
        textAlign="center"
      >
        {index + 1}
      </Text>
      <Text fontSize="sm" flex={1}>
        {team.name}
      </Text>
      <Box
        color="gray.400"
        cursor="grab"
        _active={{ cursor: 'grabbing' }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </Box>
    </Flex>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EditSeedsModal({
  isOpen,
  onClose,
  teams: initialTeams,
  onConfirm,
}: IEditSeedsModalProps) {
  const t = useTranslations('pages.tournaments.detail.manage');
  const [items, setItems] = useState<ISeedTeam[]>([]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setItems(initialTeams.map((t) => ({ ...t })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const handleConfirm = () => {
    onConfirm(items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        inset="0"
        zIndex={1500}
        bg="blackAlpha.400"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box
          bg="white"
          borderRadius="xl"
          w="full"
          maxW="460px"
          maxH="80vh"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          boxShadow="xl"
          mx={4}
        >
          {/* Header */}
          <Flex
            align="center"
            justify="space-between"
            px={6}
            py={4}
            borderBottomWidth="1px"
            borderColor="gray.200"
          >
            <Text fontWeight="bold" fontSize="lg">
              {t('panels.rounds.editSeeds')}
            </Text>
            <Box
              as="button"
              color="gray.400"
              _hover={{ color: 'gray.600' }}
              onClick={onClose}
            >
              <X size={20} />
            </Box>
          </Flex>

          {/* Sortable List */}
          <Box flex={1} overflowY="auto" py={2}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <SortableContext
                items={items.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <VStack gap={0} align="stretch">
                  {items.map((team, idx) => (
                    <SortableRow key={team.id} team={team} index={idx} />
                  ))}
                </VStack>
              </SortableContext>
            </DndContext>
          </Box>

          {/* Footer */}
          <Flex
            align="center"
            justify="space-between"
            px={6}
            py={4}
            borderTopWidth="1px"
            borderColor="gray.200"
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
