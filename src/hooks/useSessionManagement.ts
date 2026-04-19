import { useState } from 'react';
import { SessionService } from '@/lib/api/session.service';
import { SessionData } from './useSessionData';
import { SessionStatus } from '@/lib/api/types';

interface UseSessionManagementProps {
  session: SessionData | null;
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
  isCancelLoading: boolean;
  showConfirmDialog: boolean;
  pendingAction: string;
  isOvertime: boolean;
  toggleSessionStatus: () => Promise<void>;
  cancelSession: () => Promise<void>;
  handleConfirmAction: () => Promise<void>;
  handleCancelAction: () => void;
}

/**
 * Custom hook for managing session status transitions
 * Handles start/end/cancel session logic with confirmation dialogs
 * Supports overtime detection based on scheduledEndTime
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
  const [isToggleStatusLoading, setIsToggleStatusLoading] =
    useState<boolean>(false);
  const [isCancelLoading, setIsCancelLoading] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<string>('');

  // Compute overtime: session is IN_PROGRESS and past scheduledEndTime
  const isOvertime =
    !!session &&
    session.status === SessionStatus.IN_PROGRESS &&
    !!session.scheduledEndTime &&
    new Date() > new Date(session.scheduledEndTime);

  // Execute the actual status change
  const executeStatusChange = async (nextStatus: string) => {
    if (!session) return;
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
    if (!session) return;
    // Determine the next status
    let nextStatus = session.status;
    if (session.status === SessionStatus.PREPARING) {
      nextStatus = SessionStatus.IN_PROGRESS;
    } else if (session.status === SessionStatus.IN_PROGRESS) {
      nextStatus = SessionStatus.FINISHED;
    } else {
      return; // No change if already FINISHED or CANCELLED
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

  // Cancel a PREPARING session
  const cancelSession = async () => {
    setPendingAction('cancel');
    setShowConfirmDialog(true);
  };

  // Handle confirmation dialog
  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);
    if (pendingAction === 'end') {
      await executeStatusChange(SessionStatus.FINISHED);
    } else if (pendingAction === 'cancel') {
      if (!session) return;
      try {
        setIsCancelLoading(true);
        const updatedSession = await SessionService.cancelSession(session.id);
        onSessionUpdate({
          status: updatedSession.status as SessionStatus,
        });
      } catch (error) {
        console.error('Error cancelling session:', error);
        toaster.create({
          title: t('errorCancellingSession'),
          type: 'error',
          duration: 3000,
        });
      } finally {
        setIsCancelLoading(false);
      }
    }
    setPendingAction('');
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction('');
  };

  return {
    isToggleStatusLoading,
    isCancelLoading,
    showConfirmDialog,
    pendingAction,
    isOvertime,
    toggleSessionStatus,
    cancelSession,
    handleConfirmAction,
    handleCancelAction,
  };
}
