import { INotification } from '@/lib/api/types';

type NotificationTranslationParams = Record<string, string>;

type NotificationTranslationKeyConfig = {
  titleKey: string;
  messageKey: string;
};

type NotificationTranslator = (
  key: string,
  values?: NotificationTranslationParams
) => string;

export const NOTIFICATION_ACTION_TO_KEYS: Record<
  string,
  NotificationTranslationKeyConfig
> = {
  start_reminder: {
    titleKey: 'messages.startReminderTitle',
    messageKey: 'messages.startReminderMessage',
  },
  player_start_reminder: {
    titleKey: 'messages.playerStartReminderTitle',
    messageKey: 'messages.playerStartReminderMessage',
  },
  players_selected: {
    titleKey: 'messages.yourTurnTitle',
    messageKey: 'messages.yourTurnMessage',
  },
  auto_started: {
    titleKey: 'messages.autoStartedTitle',
    messageKey: 'messages.autoStartedMessage',
  },
  session_auto_started: {
    titleKey: 'messages.sessionAutoStartedTitle',
    messageKey: 'messages.sessionAutoStartedMessage',
  },
  auto_cancelled: {
    titleKey: 'messages.autoCancelledTitle',
    messageKey: 'messages.autoCancelledMessage',
  },
  session_cancelled: {
    titleKey: 'messages.sessionCancelledTitle',
    messageKey: 'messages.sessionCancelledMessage',
  },
  end_warning: {
    titleKey: 'messages.endWarningTitle',
    messageKey: 'messages.endWarningMessage',
  },
  auto_finalized: {
    titleKey: 'messages.autoFinalizedTitle',
    messageKey: 'messages.autoFinalizedMessage',
  },
  club_creation_pending: {
    titleKey: 'messages.clubCreationPendingTitle',
    messageKey: 'messages.clubCreationPendingMessage',
  },
  admin_new_pending_club: {
    titleKey: 'messages.adminNewPendingClubTitle',
    messageKey: 'messages.adminNewPendingClubMessage',
  },
  club_creation_approved: {
    titleKey: 'messages.clubCreationApprovedTitle',
    messageKey: 'messages.clubCreationApprovedMessage',
  },
  club_approved: {
    titleKey: 'messages.clubApprovedTitle',
    messageKey: 'messages.clubApprovedMessage',
  },
  club_rejected: {
    titleKey: 'messages.clubRejectedTitle',
    messageKey: 'messages.clubRejectedMessage',
  },
  player_added: {
    titleKey: 'messages.playerAddedTitle',
    messageKey: 'messages.playerAddedMessage',
  },
  player_removed: {
    titleKey: 'messages.playerRemovedTitle',
    messageKey: 'messages.playerRemovedMessage',
  },
};

export const getNotificationTranslationParams = (
  notification: INotification
): NotificationTranslationParams => {
  const sessionName = notification.data?.sessionName;
  const clubName = notification.data?.clubName;
  const rejectionReason = notification.data?.rejectionReason;
  const courtName =
    notification.data?.courtName ??
    notification.data?.courtDisplayName ??
    notification.data?.court;

  return {
    ...(typeof sessionName === 'string' ? { sessionName } : {}),
    ...(typeof clubName === 'string' ? { clubName } : {}),
    ...(typeof rejectionReason === 'string' ? { rejectionReason } : {}),
    ...(typeof courtName === 'string' ? { courtName, court: courtName } : {}),
  };
};

export const getNotificationDisplayText = (
  notification: INotification,
  translate: NotificationTranslator
) => {
  const action = notification.data?.action as string | undefined;
  const keys = action ? NOTIFICATION_ACTION_TO_KEYS[action] : undefined;

  if (!keys) {
    return {
      displayTitle: notification.title,
      displayMessage: notification.message,
    };
  }

  const translationParams = getNotificationTranslationParams(notification);

  try {
    return {
      displayTitle: translate(keys.titleKey, translationParams),
      displayMessage: translate(keys.messageKey, translationParams),
    };
  } catch {
    return {
      displayTitle: notification.title,
      displayMessage: notification.message,
    };
  }
};

export const getYourTurnNotificationContent = (
  translate: NotificationTranslator,
  courtName: string
) => ({
  title: translate('messages.yourTurnTitle'),
  message: translate('messages.yourTurnMessage', { courtName }),
});
