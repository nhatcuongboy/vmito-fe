'use client';

import { useCallback, useEffect, useState } from 'react';
import { PaymentService } from '@/lib/api/payment.service';
import type { IHostFinanceReport } from '@/lib/api/types';
import type { IFinanceQueryParams } from '../_utils/financeFilters';

export const useHostFinanceReport = (query: IFinanceQueryParams | null) => {
  const [report, setReport] = useState<IHostFinanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(query !== null);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setHasError(false);

    const load = async () => {
      try {
        const data = await PaymentService.getHostFinanceReport(
          query,
          controller.signal
        );
        setReport(data);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load host finance report:', error);
        setHasError(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [query, reloadKey]);

  return { report, isLoading, hasError, reload };
};
