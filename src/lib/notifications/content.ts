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
  post_liked: {
    titleKey: 'messages.postLikedTitle',
    messageKey: 'messages.postLikedMessage',
  },
  post_commented: {
    titleKey: 'messages.postCommentedTitle',
    messageKey: 'messages.postCommentedMessage',
  },
  venue_request_approved: {
    titleKey: 'messages.venueRequestApprovedTitle',
    messageKey: 'messages.venueRequestApprovedMessage',
  },
  venue_request_rejected: {
    titleKey: 'messages.venueRequestRejectedTitle',
    messageKey: 'messages.venueRequestRejectedMessage',
  },
};

export const getNotificationTranslationParams = (
  notification: INotification
): NotificationTranslationParams => {
  const sessionName = notification.data?.sessionName;
  const clubName = notification.data?.clubName;
  const venueName = notification.data?.venueName ?? notification.data?.name;
  const actorName = notification.data?.actorName;
  const rejectionReason =
    notification.data?.rejectionReason ?? notification.data?.adminNote;
  const courtName =
    notification.data?.courtName ??
    notification.data?.courtDisplayName ??
    notification.data?.court;

  return {
    ...(typeof sessionName === 'string'
      ? { sessionName }
      : { sessionName: '' }),
    ...(typeof clubName === 'string' ? { clubName } : {}),
    ...(typeof venueName === 'string' ? { venueName, venue: venueName } : {}),
    ...(typeof actorName === 'string' ? { actorName } : {}),
    ...(typeof rejectionReason === 'string'
      ? { rejectionReason, adminNote: rejectionReason }
      : {}),
    ...(typeof courtName === 'string' ? { courtName, court: courtName } : {}),
  };
};

const USER_RELATED_ACTIONS = new Set(['post_liked', 'post_commented']);

export const getNotificationRelatedUser = (
  notification: INotification
): { name: string; image: string | null } | null => {
  const action = notification.data?.action as string | undefined;
  if (!action || !USER_RELATED_ACTIONS.has(action)) return null;

  const actorName = notification.data?.actorName;
  if (typeof actorName !== 'string' || !actorName) return null;

  const actorAvatar = notification.data?.actorAvatar;
  return {
    name: actorName,
    image: typeof actorAvatar === 'string' ? actorAvatar : null,
  };
};

export const getNotificationDisplayText = (
  notification: INotification,
  translate: NotificationTranslator
) => {
  const action = notification.data?.action as string | undefined;
  const keys = action ? NOTIFICATION_ACTION_TO_KEYS[action] : undefined;

  // If no translation keys found, use backend-provided title/message
  if (!keys) {
    return {
      displayTitle: notification.title,
      displayMessage: notification.message,
    };
  }

  const translationParams = getNotificationTranslationParams(notification);

  try {
    const displayTitle = translate(keys.titleKey, translationParams);
    const displayMessage = translate(keys.messageKey, translationParams);

    // If translation returns the key itself (failed), fallback to backend message
    if (displayTitle === keys.titleKey || displayMessage === keys.messageKey) {
      return {
        displayTitle: notification.title,
        displayMessage: notification.message,
      };
    }

    return {
      displayTitle,
      displayMessage,
    };
  } catch {
    // On any error, fallback to backend-provided title/message
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
