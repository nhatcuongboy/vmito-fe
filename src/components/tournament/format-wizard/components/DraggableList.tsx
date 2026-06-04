'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical } from 'lucide-react';

interface DraggableListItem {
  id: string;
  label: string;
  description?: string;
}

interface DraggableListProps {
  items: DraggableListItem[];
  onReorder: (items: DraggableListItem[]) => void;
  renderLabel?: (item: DraggableListItem, index: number) => React.ReactNode;
}

export default function DraggableList({
  items,
  onReorder,
  renderLabel,
}: DraggableListProps) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      style={{ listStyle: 'none', padding: 0, margin: 0 }}
    >
      {items.map((item, index) => (
        <DraggableListRow
          key={item.id}
          item={item}
          index={index}
          renderLabel={renderLabel}
        />
      ))}
    </Reorder.Group>
  );
}

function DraggableListRow({
  item,
  index,
  renderLabel,
}: {
  item: DraggableListItem;
  index: number;
  renderLabel?: (item: DraggableListItem, index: number) => React.ReactNode;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      dragControls={dragControls}
      dragListener={false}
      style={{ touchAction: 'pan-y' }}
    >
      <Flex
        align="center"
        gap={3}
        py={2.5}
        px={1}
        borderBottomWidth="1px"
        borderColor="gray.100"
        _last={{ borderBottom: 'none' }}
        _hover={{ bg: 'gray.50' }}
        borderRadius="md"
      >
        {/* Number badge */}
        <Flex
          w="28px"
          h="28px"
          bg="gray.100"
          borderRadius="md"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Text fontSize="xs" fontWeight="bold" color="gray.600">
            {index + 1}
          </Text>
        </Flex>

        {/* Content */}
        <Box flex={1} minW={0}>
          {renderLabel ? (
            renderLabel(item, index)
          ) : (
            <>
              <Text fontSize="sm" fontWeight="semibold">
                {item.label}
              </Text>
              {item.description && (
                <Text fontSize="xs" color="gray.500">
                  {item.description}
                </Text>
              )}
            </>
          )}
        </Box>

        {/* Drag handle */}
        <Box
          color="gray.400"
          flexShrink={0}
          cursor="grab"
          touchAction="none"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <GripVertical size={18} />
        </Box>
      </Flex>
    </Reorder.Item>
  );
}
