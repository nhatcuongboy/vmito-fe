'use client';

import { useEffect, useState } from 'react';
import { Box, Grid, HStack, Input, Stack, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import PageLayout from '@/components/layout/PageLayout';
import { ClassesService } from '@/lib/api/classes.service';
import { FavoriteService } from '@/lib/api/favorite.service';
import { IClass } from '@/types/class';
import { ClassCard } from '@/components/classes/ClassCard';
import { Link } from '@/i18n/config';

export default function BrowseClassesContent() {
  const [items, setItems] = useState<IClass[]>([]),
    [loading, setLoading] = useState(true),
    [search, setSearch] = useState(''),
    [sportType, setSportType] = useState(''),
    [city, setCity] = useState(''),
    [sortBy, setSortBy] = useState<'newest' | 'distance'>('newest'),
    [favoriteOnly, setFavoriteOnly] = useState(false);
  const load = async () => {
    setLoading(true);
    try {
      const page = await ClassesService.browse({
        search: search || undefined,
        sportType: (sportType as never) || undefined,
        city: city || undefined,
        sortBy,
        favoriteOnly,
        limit: 24,
      });
      setItems(page.items);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const page = await ClassesService.browse({
          search: search || undefined,
          sportType: (sportType as never) || undefined,
          city: city || undefined,
          sortBy,
          favoriteOnly,
          limit: 24,
        });
        setItems(page.items);
      } finally {
        setLoading(false);
      }
    })();
  }, [sortBy, favoriteOnly]);
  const favorite = async (item: IClass) => {
    try {
      if (item.isFavorite) {
        await FavoriteService.removeFavorite('CLASS', item.id);
      } else {
        await FavoriteService.addFavorite('CLASS', item.id);
      }
      setItems((current) =>
        current.map((value) =>
          value.id === item.id
            ? { ...value, isFavorite: !value.isFavorite }
            : value
        )
      );
    } catch {
      /* authentication errors are handled by the shared API client */
    }
  };
  return (
    <PageLayout>
      <Stack gap="6">
        <HStack justify="space-between" flexWrap="wrap">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">
              Tìm lớp học
            </Text>
            <Text color="fg.muted">
              Khám phá lớp cầu lông và pickleball gần bạn
            </Text>
          </Box>
          <Link href="/classes/create">
            <Button colorPalette="green">Tạo lớp học</Button>
          </Link>
        </HStack>
        <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr 1fr' }} gap="3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên lớp, địa điểm..."
          />
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
          >
            <option value="">Tất cả môn</option>
            <option value="BADMINTON">Cầu lông</option>
            <option value="PICKLEBALL">Pickleball</option>
          </select>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Tỉnh/Thành"
          />
          <Button onClick={() => void load()} loading={loading}>
            Tìm kiếm
          </Button>
        </Grid>
        <HStack>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'distance')}
          >
            <option value="newest">Mới nhất</option>
            <option value="distance">Gần nhất</option>
          </select>
          <Button
            variant={favoriteOnly ? 'solid' : 'outline'}
            onClick={() => setFavoriteOnly(!favoriteOnly)}
          >
            Lớp đã lưu
          </Button>
        </HStack>
        {!loading && items.length === 0 ? (
          <Text color="fg.muted">Chưa có lớp học phù hợp.</Text>
        ) : (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap="5"
          >
            {items.map((item) => (
              <ClassCard key={item.id} item={item} onFavorite={favorite} />
            ))}
          </Grid>
        )}
      </Stack>
    </PageLayout>
  );
}
