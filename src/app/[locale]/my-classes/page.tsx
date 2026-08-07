'use client';
import { useEffect, useState } from 'react';
import { Box, HStack, Stack, Text } from '@chakra-ui/react';
import PageLayout from '@/components/layout/PageLayout';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { ClassesService } from '@/lib/api/classes.service';
import { IClass, ClassStatus } from '@/types/class';
import { Button } from '@/components/ui/chakra-compat';
import { Link, useRouter } from '@/i18n/config';

const labels: Record<ClassStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đang công khai',
  PAUSED: 'Tạm ẩn',
  CLOSED: 'Đã đóng tuyển sinh',
};
export default function MyClassesPage() {
  const [items, setItems] = useState<IClass[]>([]);
  const router = useRouter();
  const load = async () => setItems(await ClassesService.mine());
  useEffect(() => {
    void load();
  }, []);
  const status = async (id: string, value: ClassStatus) => {
    await ClassesService.setStatus(id, value);
    await load();
  };
  const remove = async (id: string) => {
    if (!confirm('Xóa lớp học này?')) return;
    await ClassesService.remove(id);
    await load();
  };
  return (
    <ProtectedRouteGuard>
      <PageLayout>
        <Stack gap="5">
          <HStack justify="space-between">
            <Box>
              <Text fontSize="2xl" fontWeight="bold">
                Quản lý lớp học
              </Text>
              <Text color="fg.muted">
                Tạo, cập nhật và kiểm soát hiển thị lớp của bạn.
              </Text>
            </Box>
            <Link href="/classes/create">
              <Button colorPalette="green">Tạo lớp học</Button>
            </Link>
          </HStack>
          {items.length === 0 ? (
            <Text color="fg.muted">Bạn chưa tạo lớp học nào.</Text>
          ) : (
            items.map((item) => (
              <Box key={item.id} borderWidth="1px" borderRadius="lg" p="4">
                <HStack justify="space-between" align="start" flexWrap="wrap">
                  <Box>
                    <Text fontWeight="bold">{item.name}</Text>
                    <Text fontSize="sm" color="fg.muted">
                      {labels[item.status]} · Cập nhật{' '}
                      {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </Box>
                  <HStack>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/my-classes/${item.id}/edit`)}
                    >
                      Chỉnh sửa
                    </Button>
                    {item.status !== 'PUBLISHED' && (
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={() => void status(item.id, 'PUBLISHED')}
                      >
                        Công khai
                      </Button>
                    )}
                    {item.status === 'PUBLISHED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void status(item.id, 'PAUSED')}
                      >
                        Tạm ẩn
                      </Button>
                    )}
                    {item.status !== 'CLOSED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void status(item.id, 'CLOSED')}
                      >
                        Đóng tuyển sinh
                      </Button>
                    )}
                    <Button
                      size="sm"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => void remove(item.id)}
                    >
                      Xóa
                    </Button>
                  </HStack>
                </HStack>
              </Box>
            ))
          )}
        </Stack>
      </PageLayout>
    </ProtectedRouteGuard>
  );
}
