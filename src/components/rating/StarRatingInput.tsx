'use client';

import { Box, HStack } from '@chakra-ui/react';
import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const sizeMap = {
  sm: 20,
  md: 28,
  lg: 36,
};

export const StarRatingInput = ({
  value,
  onChange,
  size = 'md',
  disabled = false,
}: StarRatingInputProps) => {
  const [hoverValue, setHoverValue] = useState(0);
  const starSize = sizeMap[size];

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  const displayValue = hoverValue || value;

  return (
    <HStack gap={1} onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          opacity={disabled ? 0.5 : 1}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          transition="transform 0.15s ease-in-out"
          _hover={!disabled ? { transform: 'scale(1.15)' } : {}}
        >
          <Star
            size={starSize}
            fill={star <= displayValue ? '#F6AD55' : 'transparent'}
            color={star <= displayValue ? '#F6AD55' : '#CBD5E0'}
            strokeWidth={1.5}
          />
        </Box>
      ))}
    </HStack>
  );
};
