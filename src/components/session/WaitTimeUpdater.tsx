'use client';

import { useEffect, useState } from 'react';
import { SessionService } from '@/lib/api/session.service';

// Component to update wait times for active sessions in the background
export default function WaitTimeUpdater({
  sessionId,
  sessionStatus,
}: {
  sessionId: string;
  sessionStatus: string;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Function to update wait times
  const updateWaitTimes = async () => {
    if (isUpdating) return;
    
    // Only update wait times if session is IN_PROGRESS
    if (sessionStatus !== 'IN_PROGRESS') {
      return;
    }

    try {
      setIsUpdating(true);

      await SessionService.updateWaitTimes(sessionId, {
        minutesToAdd: 1,
      });
    } catch (error) {
      console.error('Error updating wait times:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Set up interval to update wait times every minute
  useEffect(() => {
    // Only set up interval if session is IN_PROGRESS
    if (sessionStatus !== 'IN_PROGRESS') {
      return;
    }

    // Update immediately on mount
    updateWaitTimes();

    // Then update every minute
    const intervalId = setInterval(updateWaitTimes, 60 * 1000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]); // Re-run when sessionStatus changes

  // This component doesn't render anything visible
  return null;
}
