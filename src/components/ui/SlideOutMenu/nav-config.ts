import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarCheck,
  CreditCard,
  Info,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Newspaper,
  Receipt,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Trophy,
  Users,
  UserSearch,
  type LucideIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { ROUTES } from '@/constants';
import { UserRole } from '@/lib/api/types';
import type { User } from '@/types/auth';
import SessionsMenu from './SessionsMenu';

/** Everything a visibility/href/active predicate may depend on. */
export interface NavContext {
  user: User | null;
  isAuthenticated: boolean;
  canAccessHostFeatures: boolean;
  hasManagedVenues: boolean;
}

type Translator = (key: string) => string;

export interface NavTranslators {
  nav: Translator;
  common: Translator;
}

export interface NavItemComponentProps {
  isCollapsed: boolean;
  onClose: () => void;
}

interface NavItemBase {
  key: string;
  /** Defaults to always visible. */
  isVisible?: (ctx: NavContext) => boolean;
}

/** A standard link item rendered by SidebarNavItem. */
export interface NavLinkConfig extends NavItemBase {
  icon: LucideIcon;
  label: (t: NavTranslators) => string;
  getHref: (ctx: NavContext) => string;
  /** Defaults to exact match for '/', startsWith for other hrefs. */
  isActive?: (pathname: string, ctx: NavContext) => boolean;
  showFlame?: boolean;
}

/** An item with its own rendering (e.g. a submenu). */
export interface NavComponentConfig extends NavItemBase {
  component: ComponentType<NavItemComponentProps>;
}

export type NavItemConfig = NavLinkConfig | NavComponentConfig;

export interface NavSectionConfig {
  key: string;
  title: (t: NavTranslators) => string;
  isVisible?: (ctx: NavContext) => boolean;
  items: NavItemConfig[];
}

export function isNavLinkActive(
  item: NavLinkConfig,
  pathname: string,
  ctx: NavContext
): boolean {
  if (item.isActive) {
    return item.isActive(pathname, ctx);
  }
  const href = item.getHref(ctx);
  // Exact match for home, startsWith for others
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

const isAdmin = (ctx: NavContext) => ctx.user?.role === UserRole.ADMIN;
const isAdminOrHost = (ctx: NavContext) =>
  ctx.user?.role === UserRole.ADMIN || ctx.user?.role === UserRole.HOST;

export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    key: 'discovery',
    title: (t) => t.common('discovery'),
    items: [
      {
        key: 'home',
        icon: Search,
        label: (t) => t.nav('home'),
        getHref: () => ROUTES.HOME,
        showFlame: true,
      },
      {
        key: 'browseVenues',
        icon: MapPin,
        label: (t) => t.nav('browseVenues'),
        getHref: () => ROUTES.BROWSE.VENUES.LIST,
      },
      {
        key: 'browseClubs',
        icon: UserSearch,
        label: (t) => t.nav('browseClubs'),
        getHref: () => ROUTES.CLUBS.BROWSE,
      },
      {
        key: 'browseTournaments',
        icon: Trophy,
        label: (t) => t.nav('browseTournaments'),
        getHref: () => ROUTES.BROWSE.TOURNAMENTS.LIST,
      },
      {
        key: 'leaderboard',
        icon: Award,
        label: (t) => t.nav('leaderboard'),
        getHref: () => ROUTES.LEADERBOARD,
      },
      {
        key: 'newsfeed',
        icon: Newspaper,
        label: (t) => t.nav('newsfeed'),
        getHref: () => ROUTES.NEWSFEED,
        isVisible: (ctx) => ctx.isAuthenticated,
      },
    ],
  },
  {
    key: 'management',
    title: (t) => t.common('admin'),
    isVisible: (ctx) => ctx.isAuthenticated,
    items: [
      {
        key: 'sessions',
        component: SessionsMenu,
      },
      {
        key: 'myClubs',
        icon: Users,
        label: (t) => t.nav('myClubs'),
        getHref: () => ROUTES.CLUBS.MY_CLUBS,
      },
      {
        key: 'myRentals',
        icon: CalendarCheck,
        label: (t) => t.nav('myRentals'),
        getHref: () => '/my/rentals',
        isVisible: isAdminOrHost,
      },
      {
        key: 'managedVenueRentals',
        icon: CalendarDays,
        label: (t) => t.nav('managedVenueRentals'),
        getHref: () => '/manage/venues',
        isVisible: (ctx) => isAdminOrHost(ctx) && ctx.hasManagedVenues,
      },
      {
        key: 'tournaments',
        icon: Swords,
        label: (t) => t.nav('tournaments'),
        getHref: () => ROUTES.HOST.TOURNAMENTS.LIST,
        isVisible: (ctx) =>
          (ctx.canAccessHostFeatures || ctx.user?.role === UserRole.REFEREE) &&
          (ctx.user?.role === UserRole.ADMIN ||
            ctx.user?.role === UserRole.HOST ||
            ctx.user?.role === UserRole.REFEREE),
      },
    ],
  },
  {
    key: 'settings',
    title: (t) => t.common('settings'),
    isVisible: (ctx) => ctx.isAuthenticated,
    items: [
      {
        key: 'transactions',
        icon: Receipt,
        label: (t) => t.nav('transactions'),
        getHref: (ctx) =>
          ctx.canAccessHostFeatures
            ? ROUTES.HOST.TRANSACTIONS
            : ROUTES.PLAYER.TRANSACTIONS,
        isActive: (pathname) =>
          pathname.startsWith(ROUTES.HOST.TRANSACTIONS) ||
          pathname.startsWith(ROUTES.PLAYER.TRANSACTIONS),
      },
      {
        key: 'paymentSettings',
        icon: CreditCard,
        label: (t) => t.nav('paymentSettings'),
        getHref: () => ROUTES.HOST.PAYMENT_SETTINGS,
        isVisible: (ctx) => ctx.canAccessHostFeatures,
      },
    ],
  },
  {
    key: 'admin',
    title: (t) => t.common('adminSection'),
    isVisible: isAdmin,
    items: [
      {
        key: 'adminDashboard',
        icon: LayoutDashboard,
        label: (t) => t.nav('dashboard'),
        getHref: () => ROUTES.ADMIN.DASHBOARD,
        isActive: (pathname) => pathname === ROUTES.ADMIN.DASHBOARD,
      },
      {
        key: 'adminUsers',
        icon: Users,
        label: (t) => t.nav('users'),
        getHref: () => ROUTES.ADMIN.USERS,
      },
      {
        key: 'adminSessions',
        icon: CalendarDays,
        label: (t) => t.nav('sessionsManagement'),
        getHref: () => ROUTES.ADMIN.SESSIONS,
      },
      {
        key: 'adminNotifications',
        icon: Bell,
        label: (t) => t.nav('notifications'),
        getHref: () => ROUTES.ADMIN.NOTIFICATIONS,
      },
      {
        key: 'adminFeedback',
        icon: MessageCircle,
        label: (t) => t.nav('feedback'),
        getHref: () => ROUTES.ADMIN.FEEDBACK,
      },
      {
        key: 'adminGeneralSettings',
        icon: SlidersHorizontal,
        label: (t) => t.nav('generalSettings'),
        getHref: () => ROUTES.ADMIN.GENERAL,
      },
      {
        key: 'adminLevelDescriptions',
        icon: Award,
        label: (t) => t.nav('levelDescriptions'),
        getHref: () => ROUTES.ADMIN.LEVEL_DESCRIPTIONS,
      },
      {
        key: 'adminPoints',
        icon: Sparkles,
        label: (t) => t.nav('pointsAdmin'),
        getHref: () => ROUTES.ADMIN.POINTS,
      },
      {
        key: 'adminVenues',
        icon: MapPin,
        label: (t) => t.nav('venues'),
        getHref: () => ROUTES.ADMIN.VENUES,
      },
      {
        key: 'adminClubs',
        icon: ShieldCheck,
        label: (t) => t.nav('clubsAdmin'),
        getHref: () => ROUTES.ADMIN.CLUBS,
      },
    ],
  },
  {
    key: 'other',
    title: (t) => t.common('otherSection'),
    items: [
      {
        key: 'about',
        icon: Info,
        label: (t) => t.common('about'),
        getHref: () => ROUTES.ABOUT,
      },
      {
        key: 'guide',
        icon: BookOpen,
        label: (t) => t.common('guide'),
        getHref: () => ROUTES.GUIDE,
      },
    ],
  },
];
