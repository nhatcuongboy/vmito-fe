import { useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { FeeType, Venue } from '@/lib/api/types';
import { VenueService } from '@/lib/api/venue.service';
import { ExtractedSessionData } from '@/lib/api/ai.service';

import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';
import {
  buildCourtsFromAiData,
  formatDateOnly,
  formatDateTimeLocal,
  formatTimeOnly,
} from '@/components/session/session-form/sessionFormUtils';
import { findBestVenueMatch } from '@/components/session/session-form/venueMatching';

interface UseAISuccessHandlerParams {
  setValue: UseFormSetValue<SessionFormData>;
  venues: Venue[];
  isMultiDay: boolean;
  setSessionDate: (value: string) => void;
  setStartHour: (value: string) => void;
  setEndHour: (value: string) => void;
  setSelectedVenueObj: (venue: Venue | null) => void;
  setFeeEnabled: (value: boolean) => void;
  setFeeType: (value: FeeType) => void;
  setMaleFee: (value: number | undefined) => void;
  setFemaleFee: (value: number | undefined) => void;
  setFeeNotes: (value: string) => void;
}

export function useAISuccessHandler({
  setValue,
  venues,
  isMultiDay,
  setSessionDate,
  setStartHour,
  setEndHour,
  setSelectedVenueObj,
  setFeeEnabled,
  setFeeType,
  setMaleFee,
  setFemaleFee,
  setFeeNotes,
}: UseAISuccessHandlerParams) {
  return useCallback(
    async (
      inputData:
        | ExtractedSessionData
        | { success?: boolean; data?: ExtractedSessionData }
    ) => {
      const data: ExtractedSessionData =
        inputData &&
        'success' in inputData &&
        inputData.success &&
        inputData.data
          ? inputData.data
          : (inputData as ExtractedSessionData);

      console.log('Processed AI Data:', data);

      if (data.name) setValue('name', data.name);
      if (data.description) setValue('description', data.description);
      if (data.hostName) setValue('hostName', data.hostName);
      if (data.hostPhone) setValue('hostPhone', data.hostPhone);
      if (data.maxPlayersPerCourt)
        setValue('maxPlayersPerCourt', data.maxPlayersPerCourt);
      if (data.shuttlecock) setValue('shuttlecock', data.shuttlecock);

      if (data.startTime) {
        try {
          const startDate = new Date(data.startTime);
          if (!isNaN(startDate.getTime())) {
            setValue('startTime', formatDateTimeLocal(startDate));
            if (!isMultiDay) {
              setSessionDate(formatDateOnly(startDate));
              setStartHour(formatTimeOnly(startDate));
            }
          }
        } catch (e) {
          console.error('Invalid start time from AI:', e);
        }
      }

      if (data.endTime) {
        try {
          const endDate = new Date(data.endTime);
          if (!isNaN(endDate.getTime())) {
            setValue('endTime', formatDateTimeLocal(endDate));
            if (!isMultiDay) {
              setEndHour(formatTimeOnly(endDate));
            }
          }
        } catch (e) {
          console.error('Invalid end time from AI:', e);
        }
      }

      if (data.requiredLevels && data.requiredLevels.length > 0) {
        setValue('allLevelsSelected', false);
        setValue(
          'requiredLevels',
          Array.from(
            new Set((data.requiredLevels as (number | string)[]).map(Number))
          )
        );
      }

      if (data.numberOfCourts && data.numberOfCourts > 0) {
        setValue(
          'courts',
          buildCourtsFromAiData(data.numberOfCourts, data.courtNames)
        );
      }

      if (data.feeConfig) {
        setFeeEnabled(true);
        if (data.feeConfig.feeType)
          setFeeType(data.feeConfig.feeType as FeeType);
        if (data.feeConfig.maleFee !== undefined)
          setMaleFee(data.feeConfig.maleFee ?? undefined);
        if (data.feeConfig.femaleFee !== undefined)
          setFemaleFee(data.feeConfig.femaleFee ?? undefined);
        if (data.feeConfig.notes) setFeeNotes(data.feeConfig.notes);
      }

      // Venue handling - use venueId from backend if available
      if (data.venueId) {
        // Backend already matched the venue, use it directly
        console.log('Using venue ID from backend:', data.venueId);
        setValue('selectedVenueId', data.venueId);

        // Fetch venue details to set selectedVenueObj
        const matchedVenue = venues.find((v) => v.id === data.venueId);
        if (matchedVenue) {
          setSelectedVenueObj(matchedVenue);
        } else {
          // Venue not in current list, fetch it
          try {
            const venueDetails = await VenueService.getVenue(data.venueId);
            setSelectedVenueObj(venueDetails);
          } catch (error) {
            console.error('Failed to fetch venue details:', error);
          }
        }
      } else if (
        data.venue &&
        (data.venue.name || data.venue.address) &&
        venues.length > 0
      ) {
        // Fallback: try client-side matching if backend didn't find a match
        console.log(
          'Backend did not match venue, trying client-side matching for:',
          data.venue
        );

        const matchedVenue = findBestVenueMatch(venues, data.venue);

        if (matchedVenue) {
          console.log('Client-side matched venue:', matchedVenue.name);
          setValue('selectedVenueId', matchedVenue.id);
          setSelectedVenueObj(matchedVenue);
        } else {
          console.log('No matching venue found for:', data.venue);
        }
      }
    },
    [
      setValue,
      venues,
      isMultiDay,
      setFeeEnabled,
      setFeeType,
      setMaleFee,
      setFemaleFee,
      setFeeNotes,
      setSelectedVenueObj,
      setSessionDate,
      setStartHour,
      setEndHour,
    ]
  );
}
