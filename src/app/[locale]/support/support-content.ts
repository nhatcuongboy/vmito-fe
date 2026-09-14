import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  CircleUserRound,
  CreditCard,
  RotateCw,
  Trophy,
  Warehouse,
} from 'lucide-react';

export type TSupportCategoryId =
  | 'sessions'
  | 'rotation'
  | 'booking'
  | 'payments'
  | 'tournaments'
  | 'account';

export interface ISupportCategory {
  id: TSupportCategoryId;
  icon: LucideIcon;
  faqIds: readonly string[];
}

export const SUPPORT_CATEGORIES: readonly ISupportCategory[] = [
  {
    id: 'sessions',
    icon: CalendarDays,
    faqIds: ['createSession', 'managePlayers', 'joinSession'],
  },
  {
    id: 'rotation',
    icon: RotateCw,
    faqIds: ['setUpCourts', 'autoAssign', 'recordResults'],
  },
  {
    id: 'booking',
    icon: Warehouse,
    faqIds: ['findVenue', 'bookCourt', 'bookingStatus'],
  },
  {
    id: 'payments',
    icon: CreditCard,
    faqIds: ['paymentMethods', 'submitProof', 'managePayments'],
  },
  {
    id: 'tournaments',
    icon: Trophy,
    faqIds: ['createTournament', 'registerTournament', 'viewStandings'],
  },
  {
    id: 'account',
    icon: CircleUserRound,
    faqIds: ['updateProfile', 'changeLanguage', 'reportIssue'],
  },
] as const;
