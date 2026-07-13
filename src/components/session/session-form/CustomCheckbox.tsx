import { Box } from '@chakra-ui/react';
import { Check } from 'lucide-react';

export const CustomCheckbox = ({
  isChecked,
  onChange,
  size = 'md',
}: {
  isChecked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  size?: 'sm' | 'md';
}) => {
  const boxSize = size === 'sm' ? '18px' : '24px';
  const iconSize = size === 'sm' ? 11 : 16;

  return (
    <Box
      as="label"
      cursor="pointer"
      display="inline-flex"
      alignItems="center"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      <Box
        w={boxSize}
        h={boxSize}
        border="2px solid"
        borderColor={isChecked ? 'brand.500' : 'gray.300'}
        bg={isChecked ? 'brand.500' : 'white'}
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition="all 0.2s"
        _hover={{ borderColor: 'brand.600' }}
      >
        {isChecked && <Check size={iconSize} color="white" strokeWidth={3} />}
      </Box>
    </Box>
  );
};
