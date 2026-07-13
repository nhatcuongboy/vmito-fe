import { useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { ISession } from '@/lib/api/types';
import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';
import {
  buildSingleDayDateTime,
  buildSingleDayEndDateTime,
  formatDateOnly,
  formatTimeOnly,
  isEndOfSelectedDay,
} from '@/components/session/session-form/sessionFormUtils';

interface UseSessionTimeFieldsParams {
  isEditMode: boolean;
  initialData?: ISession;
  setValue: UseFormSetValue<SessionFormData>;
}

export function useSessionTimeFields({
  isEditMode,
  initialData,
  setValue,
}: UseSessionTimeFieldsParams) {
  // Single-day time picker state
  const [isMultiDay, setIsMultiDay] = useState(() => {
    if (isEditMode && initialData?.startTime && initialData?.endTime) {
      const startDate = new Date(initialData.startTime);
      const endDate = new Date(initialData.endTime);
      if (isEndOfSelectedDay(startDate, endDate)) return false;

      const startDay = startDate.toDateString();
      const endDay = endDate.toDateString();
      return startDay !== endDay;
    }
    return false;
  });
  const [sessionDate, setSessionDate] = useState(() => {
    if (isEditMode && initialData?.startTime)
      return formatDateOnly(new Date(initialData.startTime));
    return formatDateOnly(new Date());
  });
  const [startHour, setStartHour] = useState(() => {
    if (isEditMode && initialData?.startTime)
      return formatTimeOnly(new Date(initialData.startTime));
    return '';
  });
  const [endHour, setEndHour] = useState(() => {
    if (isEditMode && initialData?.endTime) {
      return formatTimeOnly(new Date(initialData.endTime));
    }
    return '';
  });

  const handleDateChange = (date: string) => {
    setSessionDate(date);
    if (startHour)
      setValue('startTime', buildSingleDayDateTime(date, startHour));
    if (endHour) setValue('endTime', buildSingleDayEndDateTime(date, endHour));
  };
  const handleStartHourChange = (time: string) => {
    setStartHour(time);
    setValue('startTime', buildSingleDayDateTime(sessionDate, time));
  };
  const handleEndHourChange = (time: string) => {
    setEndHour(time);
    setValue('endTime', buildSingleDayEndDateTime(sessionDate, time));
  };

  return {
    isMultiDay,
    setIsMultiDay,
    sessionDate,
    setSessionDate,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    handleDateChange,
    handleStartHourChange,
    handleEndHourChange,
  };
}
