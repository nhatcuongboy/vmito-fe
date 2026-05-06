import { api, ApiResponse } from './base';
import { Locale } from '@/i18n/locales';

export interface ExtractedVenue {
  name?: string;
  address?: string;
  district?: string;
  city?: string;
}

export interface ExtractedSessionData {
  name?: string;
  description?: string;
  hostName?: string;
  hostPhone?: string;
  startTime?: string;
  endTime?: string;
  maxPlayersPerCourt?: number;
  requiredLevels?: number[];
  venue?: ExtractedVenue;
  venueId?: string; // Matched venue ID from backend
  numberOfCourts?: number;
  courtNames?: string[];
  shuttlecock?: string;
  feeConfig?: {
    feeType: 'FIXED' | 'SPLIT_EVENLY';
    maleFee?: number;
    femaleFee?: number;
    notes?: string;
  };
}

export const AIService = {
  async extractSessionFromArticle(
    articleContent: string,
    language?: Locale
  ): Promise<ExtractedSessionData> {
    const response = await api.post<ApiResponse<ExtractedSessionData>>(
      '/ai/extract-session',
      {
        articleContent,
        language,
      },
      { skipGlobalError: true } as Record<string, unknown>
    );

    // Check if the response follows ApiResponse structure
    if (
      response.data &&
      'success' in response.data &&
      'data' in response.data
    ) {
      return response.data.data as ExtractedSessionData;
    }

    // Fallback if data is returned directly or differently
    return response.data as unknown as ExtractedSessionData;
  },
};
