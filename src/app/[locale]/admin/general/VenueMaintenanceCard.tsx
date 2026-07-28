'use client';

import { Button } from '@/components/ui/chakra-compat';
import { toaster } from '@/components/ui/toaster';
import { BackfillResult, VenueService } from '@/lib/api/venue.service';
import {
  Box,
  Card,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Wrench } from 'lucide-react';
import { useState } from 'react';

type Job = 'searchTerms' | 'slugs';

const JOBS: {
  key: Job;
  label: string;
  hint: string;
  run: () => Promise<BackfillResult>;
}[] = [
  {
    key: 'searchTerms',
    label: 'Rebuild search terms',
    hint: 'Tính lại từ khoá tìm kiếm cho MỌI địa điểm. Chạy sau khi migrate địa chỉ hoặc đổi tên hàng loạt, nếu không kết quả tìm kiếm sẽ còn dùng địa chỉ cũ.',
    run: () => VenueService.backfillSearchTerms(),
  },
  {
    key: 'slugs',
    label: 'Backfill slugs',
    hint: 'Sinh slug cho những địa điểm được tạo mà chưa có slug (URL công khai sẽ hỏng nếu thiếu).',
    run: () => VenueService.backfillSlugs(),
  },
];

export function VenueMaintenanceCard() {
  const [running, setRunning] = useState<Job | null>(null);
  const [results, setResults] = useState<Partial<Record<Job, BackfillResult>>>(
    {}
  );

  const handleRun = async (job: (typeof JOBS)[number]) => {
    try {
      setRunning(job.key);
      const res = await job.run();
      setResults((prev) => ({ ...prev, [job.key]: res }));
      toaster.success({ title: res.message });
    } catch (error) {
      console.error(`${job.key} backfill failed:`, error);
      toaster.error({ title: 'Lỗi', description: `${job.label} thất bại` });
    } finally {
      setRunning(null);
    }
  };

  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="md"
            bg="purple.100"
            _dark={{ bg: 'purple.900/30' }}
            color="purple.600"
          >
            <Wrench size={18} />
          </Box>
          <Box>
            <Heading size="md">Bảo trì dữ liệu địa điểm</Heading>
            <Text fontSize="sm" color="gray.500">
              Các tác vụ backfill chạy trên toàn bộ địa điểm
            </Text>
          </Box>
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack gap={5} align="stretch">
          {JOBS.map((job) => (
            <Box key={job.key}>
              <HStack gap={3} align="center" wrap="wrap">
                <Button
                  variant="outline"
                  onClick={() => handleRun(job)}
                  disabled={running !== null}
                  minW="200px"
                >
                  {running === job.key ? (
                    <>
                      <Spinner size="sm" />
                      Đang chạy...
                    </>
                  ) : (
                    job.label
                  )}
                </Button>
                {results[job.key] && (
                  <Text fontSize="sm" color="green.600" fontWeight="medium">
                    ✓ {results[job.key]!.count} địa điểm
                  </Text>
                )}
              </HStack>
              <Text fontSize="xs" color="gray.500" mt={1}>
                {job.hint}
              </Text>
            </Box>
          ))}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
