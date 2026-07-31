'use client';

import { Button } from '@/components/ui/chakra-compat';
import { VSwitch } from '@/components/ui/VSwitch';
import { toaster } from '@/components/ui/toaster';
import { MigrateAddressesResult, VenueService } from '@/lib/api/venue.service';
import {
  Box,
  Card,
  Code,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type RunMode = 'dryRun' | 'apply';

/** One counter in the result grid. */
function Stat({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: number;
  color: string;
  hint: string;
}) {
  return (
    <Box>
      <Text fontSize="xs" color="gray.500">
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color={color} lineHeight="1.2">
        {value}
      </Text>
      <Text fontSize="xs" color="gray.500">
        {hint}
      </Text>
    </Box>
  );
}

export function AddressMigrationCard() {
  const t = useTranslations('common');
  const [rescan, setRescan] = useState(false);
  const [running, setRunning] = useState<RunMode | null>(null);
  const [result, setResult] = useState<MigrateAddressesResult | null>(null);

  const run = async (mode: RunMode) => {
    // A rescan rewrites rows that already carry a newAddress, so make the
    // admin acknowledge it — a dry run needs no confirmation, it writes nothing.
    if (mode === 'apply' && rescan) {
      const ok = window.confirm(
        'Chạy lại toàn bộ sẽ ghi đè địa chỉ mới của những địa điểm đã migrate trước đó. Bạn nên chạy thử (dry run) trước. Tiếp tục?'
      );
      if (!ok) return;
    }

    try {
      setRunning(mode);
      setResult(null);
      const res = await VenueService.migrateAddresses({
        rescan,
        dryRun: mode === 'dryRun',
      });
      setResult(res);
      toaster.success({
        title:
          mode === 'dryRun'
            ? 'Chạy thử xong — chưa ghi gì vào DB'
            : 'Migration hoàn tất',
      });
    } catch (error) {
      console.error('Migration failed:', error);
      toaster.error({
        title: t('error'),
        description: 'Chạy migration thất bại',
      });
    } finally {
      setRunning(null);
    }
  };

  const busy = running !== null;

  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={3}>
          <Box
            p={2}
            borderRadius="md"
            bg="blue.100"
            _dark={{ bg: 'blue.900/30' }}
            color="blue.600"
          >
            <MapPin size={18} />
          </Box>
          <Box>
            <Heading size="md">Chuyển đổi địa chỉ mới</Heading>
            <Text fontSize="sm" color="gray.500">
              Tự động cập nhật địa chỉ mới (Nghị quyết 60) cho địa điểm, dựa
              trên bảng ánh xạ phường/xã cũ → mới
            </Text>
          </Box>
        </HStack>
      </Card.Header>
      <Card.Body>
        <VStack gap={4} align="stretch">
          <Box>
            <HStack gap={3}>
              <VSwitch
                checked={rescan}
                onCheckedChange={(e) => setRescan(e.checked)}
                colorPalette="orange"
                disabled={busy}
              />
              <Text fontSize="sm">Chạy lại toàn bộ (rescan)</Text>
            </HStack>
            <Text fontSize="xs" color="gray.500" mt={1}>
              {rescan
                ? 'Tính lại cho MỌI địa điểm, kể cả đã có địa chỉ mới — dùng sau khi sửa logic ánh xạ hoặc cập nhật file CSV.'
                : 'Chỉ xử lý địa điểm chưa có địa chỉ mới. Các địa điểm đã migrate (kể cả sai) sẽ bị bỏ qua.'}
            </Text>
          </Box>

          <HStack gap={3}>
            <Button
              variant="outline"
              onClick={() => run('dryRun')}
              disabled={busy}
            >
              {running === 'dryRun' ? (
                <>
                  <Spinner size="sm" />
                  Đang chạy thử...
                </>
              ) : (
                'Chạy thử (dry run)'
              )}
            </Button>
            <Button
              colorPalette="green"
              onClick={() => run('apply')}
              disabled={busy}
            >
              {running === 'apply' ? (
                <>
                  <Spinner size="sm" />
                  Đang chạy...
                </>
              ) : (
                'Migrate địa chỉ'
              )}
            </Button>
          </HStack>

          {result && (
            <Box
              p={4}
              borderRadius="md"
              bg={result.dryRun ? 'blue.50' : 'green.50'}
              _dark={{
                bg: result.dryRun ? 'blue.900/20' : 'green.900/20',
                borderColor: result.dryRun ? 'blue.700' : 'green.700',
              }}
              borderWidth="1px"
              borderColor={result.dryRun ? 'blue.200' : 'green.200'}
            >
              <Text
                fontWeight="semibold"
                mb={3}
                color={result.dryRun ? 'blue.700' : 'green.700'}
                _dark={{ color: result.dryRun ? 'blue.200' : 'green.200' }}
              >
                {result.dryRun
                  ? 'Kết quả chạy thử (chưa ghi)'
                  : 'Kết quả migration'}
                {result.rescan ? ' — rescan toàn bộ' : ''}
              </Text>

              <SimpleGrid columns={{ base: 2, md: 5 }} gap={4}>
                <Stat
                  label="Đã quét"
                  value={result.total}
                  color="gray.700"
                  hint="địa điểm"
                />
                <Stat
                  label="Khớp đầy đủ"
                  value={result.matched}
                  color="green.600"
                  hint="có phường + tỉnh mới"
                />
                <Stat
                  label="Chỉ khớp tỉnh"
                  value={result.cityOnly}
                  color="blue.600"
                  hint="thiếu phường"
                />
                <Stat
                  label="Chỉ tách địa chỉ"
                  value={result.streetOnly}
                  color="purple.600"
                  hint="tỉnh không đổi"
                />
                <Stat
                  label="Cần xem lại"
                  value={result.needsReview}
                  color="red.600"
                  hint="không đổi gì"
                />
              </SimpleGrid>

              {result.needsReviewSamples.length > 0 && (
                <Box mt={4}>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    Cần xem lại thủ công ({result.needsReviewSamples.length}
                    {result.needsReview > result.needsReviewSamples.length
                      ? ` / ${result.needsReview}`
                      : ''}
                    )
                  </Text>
                  <VStack align="stretch" gap={1} maxH="260px" overflowY="auto">
                    {result.needsReviewSamples.map((v) => (
                      <Box key={v.id} fontSize="xs">
                        <Text fontWeight="medium">{v.name}</Text>
                        <Code fontSize="xs" colorPalette="gray">
                          {[v.address, v.district, v.city]
                            .filter(Boolean)
                            .join(' | ') || '(trống)'}
                        </Code>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
