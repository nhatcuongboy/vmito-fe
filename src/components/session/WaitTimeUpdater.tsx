'use client';

import { useEffect, useState } from 'react';

// Component to update wait times for active sessions in the background
export default function WaitTimeUpdater() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Function to update wait times
  const updateWaitTimes = async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);

      const response = await fetch('/api/update-wait-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setLastUpdate(new Date());
        setUpdateCount((prev) => prev + 1);
      } else {
        console.error('Failed to update wait times:', result.message);
      }
    } catch (error) {
      console.error('Error updating wait times:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Set up interval to update wait times every minute
  useEffect(() => {
    // Update immediately on mount
    updateWaitTimes();

    // Then update every minute
    const intervalId = setInterval(updateWaitTimes, 60 * 1000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // This component doesn't render anything visible
  return null;
}
