import { z } from 'zod';
import { SportType } from '@/lib/api/types';

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => !value || /^https?:\/\//.test(value),
    'Liên kết phải bắt đầu bằng http:// hoặc https://'
  )
  .optional();

export const classFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên lớp').max(150),
    description: z.string().max(5000, 'Mô tả tối đa 5000 ký tự').optional(),
    sportType: z.nativeEnum(SportType),
    contactName: z.string().trim().max(100).optional(),
    contactPhone: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập số điện thoại')
      .max(30),
    zaloUrl: optionalUrl,
    socialLinks: z
      .object({
        facebook: optionalUrl,
        zalo: optionalUrl,
        tiktok: optionalUrl,
        youtube: optionalUrl,
        website: optionalUrl,
        other: optionalUrl,
      })
      .default({}),
    locationType: z.enum(['VENUE', 'CUSTOM']),
    selectedVenueId: z.string(),
    customLocationName: z.string().trim().max(200).optional(),
    customLocationAddress: z.string().trim().max(500).optional(),
    customLocationPlaceId: z.string().trim().max(255).optional(),
    customLocationLat: z.number().min(-90).max(90).optional(),
    customLocationLng: z.number().min(-180).max(180).optional(),
    customLocationDistrict: z.string().trim().max(100).optional(),
    customLocationCity: z.string().trim().max(100).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    capacity: z.number().int().min(1).optional(),
    tuitionPeriod: z.enum(['PER_SESSION', 'MONTHLY', 'COURSE', 'CONTACT']),
    tuitionAmount: z.number().int().min(0).optional(),
    tuitionNotes: z.string().trim().max(500).optional(),
    requiredLevels: z.array(z.number()).default([]),
    allLevelsSelected: z.boolean().default(true),
    schedules: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          isActive: z.boolean().default(true),
        })
      )
      .min(1, 'Thêm ít nhất một buổi học'),
  })
  .superRefine((data, ctx) => {
    if (data.locationType === 'VENUE' && !data.selectedVenueId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selectedVenueId'],
        message: 'Vui lòng chọn sân',
      });
    }
    if (data.locationType === 'CUSTOM' && !data.customLocationName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customLocationName'],
        message: 'Vui lòng nhập tên địa điểm',
      });
    }
    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Ngày kết thúc phải sau ngày khai giảng',
      });
    }
    if (data.tuitionPeriod !== 'CONTACT' && data.tuitionAmount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tuitionAmount'],
        message: 'Vui lòng nhập học phí',
      });
    }
    data.schedules.forEach((schedule, index) => {
      if (schedule.startTime >= schedule.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['schedules', index, 'endTime'],
          message: 'Giờ kết thúc phải sau giờ bắt đầu',
        });
      }
    });
  });

export type ClassFormData = z.infer<typeof classFormSchema>;
