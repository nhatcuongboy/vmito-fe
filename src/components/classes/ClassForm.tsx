'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  HStack,
  Input,
  Stack,
  Textarea,
  Text,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { IClass, IClassInput, IClassSchedule } from '@/types/class';

const emptySchedule: IClassSchedule = {
  dayOfWeek: 1,
  startTime: '18:00',
  endTime: '19:30',
  isActive: true,
};
const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function ClassForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: IClass;
  onSubmit: (data: IClassInput) => Promise<void>;
  submitting?: boolean;
}) {
  const [schedules, setSchedules] = useState<IClassSchedule[]>(
    initial?.schedules?.length ? initial.schedules : [emptySchedule]
  );
  const [usingVenue, setUsingVenue] = useState(Boolean(initial?.venueId));
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const tuitionPeriod = data.get(
      'tuitionPeriod'
    ) as IClassInput['tuitionPeriod'];
    const value = (name: string) => String(data.get(name) || '').trim();
    const number = (name: string) => {
      const raw = value(name);
      return raw ? Number(raw) : undefined;
    };
    const input: IClassInput = {
      name: value('name'),
      sportType: value('sportType') as IClassInput['sportType'],
      description: value('description') || undefined,
      contactName: value('contactName') || undefined,
      contactPhone: value('contactPhone'),
      zaloUrl: value('zaloUrl') || undefined,
      startDate: value('startDate') || undefined,
      endDate: value('endDate') || undefined,
      capacity: number('capacity'),
      tuitionPeriod,
      tuitionAmount:
        tuitionPeriod === 'CONTACT' ? undefined : number('tuitionAmount'),
      tuitionNotes: value('tuitionNotes') || undefined,
      coverPhoto: value('coverPhoto') || undefined,
      images: value('images')
        ? value('images')
            .split('\n')
            .map((image) => image.trim())
            .filter(Boolean)
        : undefined,
      schedules,
      ...(usingVenue
        ? { venueId: value('venueId') }
        : {
            customLocation: {
              name: value('locationName'),
              address: value('locationAddress') || undefined,
              city: value('city') || undefined,
              district: value('district') || undefined,
            },
          }),
    };
    await onSubmit(input);
  };
  return (
    <form onSubmit={submit}>
      <Stack gap="5">
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="4">
          <label>
            <Text mb="1">Tên lớp *</Text>
            <Input name="name" required defaultValue={initial?.name} />
          </label>
          <label>
            <Text mb="1">Môn học *</Text>
            <select
              name="sportType"
              defaultValue={initial?.sportType || 'BADMINTON'}
            >
              <option value="BADMINTON">Cầu lông</option>
              <option value="PICKLEBALL">Pickleball</option>
            </select>
          </label>
          <label>
            <Text mb="1">Tên người liên hệ</Text>
            <Input name="contactName" defaultValue={initial?.contactName} />
          </label>
          <label>
            <Text mb="1">Số điện thoại *</Text>
            <Input
              name="contactPhone"
              required
              defaultValue={initial?.contactPhone}
            />
          </label>
          <label>
            <Text mb="1">Link Zalo</Text>
            <Input
              name="zaloUrl"
              type="url"
              defaultValue={initial?.zaloUrl || ''}
            />
          </label>
          <label>
            <Text mb="1">Sĩ số tối đa</Text>
            <Input
              name="capacity"
              type="number"
              min="1"
              defaultValue={initial?.capacity || ''}
            />
          </label>
          <label>
            <Text mb="1">Khai giảng</Text>
            <Input
              name="startDate"
              type="date"
              defaultValue={initial?.startDate?.slice(0, 10) || ''}
            />
          </label>
          <label>
            <Text mb="1">Kết thúc</Text>
            <Input
              name="endDate"
              type="date"
              defaultValue={initial?.endDate?.slice(0, 10) || ''}
            />
          </label>
        </Grid>
        <label>
          <Text mb="1">Mô tả</Text>
          <Textarea
            name="description"
            minH="140px"
            defaultValue={initial?.description || ''}
          />
        </label>
        <HStack>
          <label>
            <input
              type="checkbox"
              checked={usingVenue}
              onChange={(event) => setUsingVenue(event.target.checked)}
            />{' '}
            Chọn sân có sẵn
          </label>
        </HStack>
        {usingVenue ? (
          <label>
            <Text mb="1">ID sân *</Text>
            <Input
              name="venueId"
              required
              defaultValue={initial?.venueId || ''}
              placeholder="Chọn sân từ danh sách Vmito"
            />
          </label>
        ) : (
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="4">
            <label>
              <Text mb="1">Tên địa điểm *</Text>
              <Input
                name="locationName"
                required
                defaultValue={initial?.customLocationName || ''}
              />
            </label>
            <label>
              <Text mb="1">Địa chỉ</Text>
              <Input
                name="locationAddress"
                defaultValue={initial?.customLocationAddress || ''}
              />
            </label>
            <label>
              <Text mb="1">Tỉnh/Thành</Text>
              <Input
                name="city"
                defaultValue={initial?.customLocationCity || ''}
              />
            </label>
            <label>
              <Text mb="1">Quận/Huyện</Text>
              <Input
                name="district"
                defaultValue={initial?.customLocationDistrict || ''}
              />
            </label>
          </Grid>
        )}
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="4">
          <label>
            <Text mb="1">Chu kỳ học phí *</Text>
            <select
              name="tuitionPeriod"
              defaultValue={initial?.tuitionPeriod || 'CONTACT'}
            >
              <option value="CONTACT">Liên hệ</option>
              <option value="PER_SESSION">Theo buổi</option>
              <option value="MONTHLY">Theo tháng</option>
              <option value="COURSE">Theo khóa</option>
            </select>
          </label>
          <label>
            <Text mb="1">Học phí (VND)</Text>
            <Input
              name="tuitionAmount"
              type="number"
              min="0"
              defaultValue={initial?.tuitionAmount || ''}
            />
          </label>
        </Grid>
        <label>
          <Text mb="1">Ghi chú học phí</Text>
          <Input
            name="tuitionNotes"
            defaultValue={initial?.tuitionNotes || ''}
          />
        </label>
        <Box>
          <Text fontWeight="semibold" mb="2">
            Lịch học *
          </Text>
          <Stack gap="2">
            {schedules.map((schedule, index) => (
              <HStack key={index}>
                <select
                  value={schedule.dayOfWeek}
                  onChange={(e) =>
                    setSchedules((list) =>
                      list.map((item, i) =>
                        i === index
                          ? { ...item, dayOfWeek: Number(e.target.value) }
                          : item
                      )
                    )
                  }
                >
                  {days.map((day, dayIndex) => (
                    <option key={day} value={dayIndex}>
                      {day}
                    </option>
                  ))}
                </select>
                <Input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) =>
                    setSchedules((list) =>
                      list.map((item, i) =>
                        i === index
                          ? { ...item, startTime: e.target.value }
                          : item
                      )
                    )
                  }
                />
                <Input
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) =>
                    setSchedules((list) =>
                      list.map((item, i) =>
                        i === index
                          ? { ...item, endTime: e.target.value }
                          : item
                      )
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setSchedules((list) =>
                      list.length > 1
                        ? list.filter((_, i) => i !== index)
                        : list
                    )
                  }
                >
                  Xóa
                </Button>
              </HStack>
            ))}
          </Stack>
          <Button
            mt="2"
            type="button"
            variant="outline"
            onClick={() =>
              setSchedules((list) => [...list, { ...emptySchedule }])
            }
          >
            Thêm buổi học
          </Button>
        </Box>
        <label>
          <Text mb="1">Ảnh bìa (URL)</Text>
          <Input
            name="coverPhoto"
            type="url"
            defaultValue={initial?.coverPhoto || ''}
          />
        </label>
        <label>
          <Text mb="1">Ảnh khác (mỗi URL một dòng)</Text>
          <Textarea
            name="images"
            defaultValue={initial?.images?.join('\n') || ''}
          />
        </label>
        <Button type="submit" colorPalette="green" loading={submitting}>
          {initial ? 'Lưu thay đổi' : 'Tạo lớp học'}
        </Button>
      </Stack>
    </form>
  );
}
