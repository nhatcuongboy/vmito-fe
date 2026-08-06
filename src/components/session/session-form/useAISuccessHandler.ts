import { useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';

import { FeeType, SessionLocationType, Venue } from '@/lib/api/types';
import { VenueService } from '@/lib/api/venue.service';
import { ExtractedSessionData } from '@/lib/api/ai.service';

import { SessionFormData } from '@/components/session/session-form/sessionFormSchema';
import {
  buildCourtsFromAiData,
  formatDateOnly,
  formatDateTimeLocal,
  formatTimeOnly,
} from '@/components/session/session-form/sessionFormUtils';
import { resolveAiLocation } from '@/components/session/session-form/aiLocationResolver';

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
  /**
   * Called with true when the AI data fell back to a custom location, so the
   * form can tell the user to check the name/address before submitting.
   */
  setCustomLocationFromAI: (value: boolean) => void;
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
  setCustomLocationFromAI,
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
      if (data.sportType) setValue('sportType', data.sportType);
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

      // Location: the backend already decided whether this venue exists in
      // Vmito, so the two branches below are exhaustive — no client-side
      // fuzzy re-match, which used to silently pick a similarly named venue.
      const location = resolveAiLocation(data);

      if (location.kind === 'venue') {
        setValue('locationType', SessionLocationType.VENUE);
        setValue('selectedVenueId', location.venueId, {
          shouldValidate: true,
        });
        // Wipe any custom-location leftovers so the two shapes never coexist.
        setValue('customLocation', '');
        setValue('customLocationAddress', '');
        setValue('customLocationDistrict', '');
        setValue('customLocationCity', '');
        setValue('customLocationPlaceId', '');
        setValue('customLocationLat', undefined);
        setValue('customLocationLng', undefined);
        setCustomLocationFromAI(false);

        const matchedVenue = venues.find((v) => v.id === location.venueId);
        if (matchedVenue) {
          setSelectedVenueObj(matchedVenue);
        } else {
          // Not in the currently loaded page of venues — fetch it so the
          // select shows a proper label instead of a bare id.
          try {
            const venueDetails = await VenueService.getVenue(location.venueId);
            setSelectedVenueObj(venueDetails);
          } catch (error) {
            console.error('Failed to fetch venue details:', error);
          }
        }
      } else if (location.kind === 'custom') {
        setValue('locationType', SessionLocationType.CUSTOM);
        setValue('selectedVenueId', '');
        setSelectedVenueObj(null);
        setValue('customLocation', location.name, { shouldValidate: true });
        setValue('customLocationAddress', location.address ?? '');
        setValue('customLocationDistrict', location.district ?? '');
        setValue('customLocationCity', location.city ?? '');
        // No placeId/coordinates: nothing here has been geocoded, and a stale
        // pin is worse than none.
        setValue('customLocationPlaceId', '');
        setValue('customLocationLat', undefined);
        setValue('customLocationLng', undefined);
        setCustomLocationFromAI(true);
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
      setCustomLocationFromAI,
    ]
  );
}
