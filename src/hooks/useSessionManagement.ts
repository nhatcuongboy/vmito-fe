import { useState } from 'react';
import { SessionService } from '@/lib/api/session.service';
import { SessionData } from './useSessionData';
import { SessionStatus } from '@/lib/api/types';

interface UseSessionManagementProps {
  session: SessionData;
  onSessionUpdate: (updates: Partial<SessionData>) => void;
  onRefreshData: () => Promise<void>;
  t: (key: string) => string;
  toaster: {
    create: (options: {
      title: string;
      type: 'success' | 'error';
      duration: number;
    }) => void;
  };
}

interface UseSessionManagementReturn {
  isToggleStatusLoading: boolean;
  showConfirmDialog: boolean;
  pendingAction: string;
  toggleSessionStatus: () => Promise<void>;
  handleConfirmAction: () => Promise<void>;
  handleCancelAction: () => void;
}

/**
 * Custom hook for managing session status transitions
 * Handles start/end session logic with confirmation dialogs
 * 
 * @param props - Configuration including session, callbacks, and utilities
 * @returns Object containing status management functions and state
 */
export function useSessionManagement({
  session,
  onSessionUpdate,
  onRefreshData,
  t,
  toaster,
}: UseSessionManagementProps): UseSessionManagementReturn {
  const [isToggleStatusLoading, setIsToggleStatusLoading] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<string>('');

  // Execute the actual status change
  const executeStatusChange = async (nextStatus: string) => {
    try {
      setIsToggleStatusLoading(true);

      if (nextStatus === SessionStatus.FINISHED) {
        // Use endSession API for comprehensive cleanup
        const result = await SessionService.endSession(session.id);

        // Update state with session data from endSession result
        onSessionUpdate({
          status: result.session.status,
          startTime: result.session.startTime
            ? new Date(result.session.startTime)
            : undefined,
          endTime: result.session.endTime
            ? new Date(result.session.endTime)
            : undefined,
        });

        // Refresh session data to get updated players, courts, matches
        await onRefreshData();
      } else {
        // For starting session, use updateSessionStatus
        const updatedSession = await SessionService.updateSessionStatus(
          session.id,
          nextStatus
        );

        // Update state with new data from server
        onSessionUpdate({
          status: updatedSession.status,
          startTime: updatedSession.startTime
            ? new Date(updatedSession.startTime)
            : undefined,
          endTime: updatedSession.endTime
            ? new Date(updatedSession.endTime)
            : undefined,
        });
      }

      // toaster.create({
      //   title:
      //     nextStatus === SessionStatus.IN_PROGRESS
      //       ? t('sessionStarted')
      //       : t('sessionEnded'),
      //   type: 'success',
      //   duration: 3000,
      // });
    } catch (error) {
      console.error('Error updating session status:', error);
      toaster.create({
        title: t('errorUpdatingSessionStatus'),
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsToggleStatusLoading(false);
    }
  };

  // Toggle session status (Start/End session)
  const toggleSessionStatus = async () => {
    // Determine the next status
    let nextStatus = session.status;
    if (session.status === SessionStatus.PREPARING) {
      nextStatus = SessionStatus.IN_PROGRESS;
    } else if (session.status === SessionStatus.IN_PROGRESS) {
      nextStatus = SessionStatus.FINISHED;
    } else {
      return; // No change if already FINISHED
    }

    // Show confirmation dialog for ending session
    if (nextStatus === SessionStatus.FINISHED) {
      setPendingAction('end');
      setShowConfirmDialog(true);
      return;
    }

    // Execute the status change directly for starting session
    await executeStatusChange(nextStatus);
  };

  // Handle confirmation dialog
  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);
    if (pendingAction === 'end') {
      await executeStatusChange(SessionStatus.FINISHED);
    }
    setPendingAction('');
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction('');
  };

  return {
    isToggleStatusLoading,
    showConfirmDialog,
    pendingAction,
    toggleSessionStatus,
    handleConfirmAction,
    handleCancelAction,
  };
}
