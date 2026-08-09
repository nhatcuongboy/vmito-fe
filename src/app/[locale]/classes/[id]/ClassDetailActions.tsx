'use client';
import { HStack, Link as ChakraLink, Text } from '@chakra-ui/react';
import { Phone, Heart } from 'lucide-react';
import { Button } from '@/components/ui/chakra-compat';
import { FavoriteService } from '@/lib/api/favorite.service';
import { IClass } from '@/types/class';
import { useState } from 'react';

export default function ClassDetailActions({ item }: { item: IClass }) {
  const [favorite, setFavorite] = useState(Boolean(item.isFavorite));
  const toggle = async () => {
    if (favorite) {
      await FavoriteService.removeFavorite('CLASS', item.id);
    } else {
      await FavoriteService.addFavorite('CLASS', item.id);
    }
    setFavorite(!favorite);
  };
  return (
    <HStack flexWrap="wrap">
      {item.status !== 'CLOSED' && (
        <>
          <ChakraLink href={`tel:${item.contactPhone}`}>
            <Button colorPalette="green">
              <Phone size={18} /> Gọi {item.contactName}
            </Button>
          </ChakraLink>
          {item.zaloUrl && (
            <ChakraLink href={item.zaloUrl} target="_blank">
              <Button variant="outline">Liên hệ Zalo</Button>
            </ChakraLink>
          )}
        </>
      )}
      <Button variant="ghost" onClick={() => void toggle()}>
        <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />{' '}
        {favorite ? 'Đã lưu' : 'Lưu lớp'}
      </Button>
      {item.capacity && (
        <Text color="fg.muted">Sĩ số tối đa: {item.capacity}</Text>
      )}
    </HStack>
  );
}
