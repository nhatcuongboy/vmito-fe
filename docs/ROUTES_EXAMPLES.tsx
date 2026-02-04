/**
 * Routes Usage Examples
 * Minh họa các cách sử dụng ROUTES constants trong ứng dụng
 */

import {
  ROUTES,
  routeHelpers,
  ROUTE_GROUPS,
  BREADCRUMB_LABELS,
  withLocale,
  removeLocale,
} from '@/constants';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

// ==================== EXAMPLE 1: Navigation Links ====================

function NavigationExample() {
  return (
    <nav>
      {/* Home */}
      <Link href={ROUTES.HOME}>Home</Link>

      {/* Browse Tournaments */}
      <Link href={ROUTES.BROWSE.TOURNAMENTS.LIST}>Browse Tournaments</Link>

      {/* Settings */}
      <Link href={ROUTES.SETTINGS}>Settings</Link>

      {/* Admin (if user is admin) */}
      <Link href={ROUTES.ADMIN.USERS}>Manage Users</Link>
    </nav>
  );
}

// ==================== EXAMPLE 2: Dynamic Navigation ====================

function DynamicNavigationExample({ userId }: { userId: string }) {
  const role = 'host' as 'host' | 'player'; // Determine from user context

  return (
    <nav>
      {role === 'host' && (
        <>
          <Link href={ROUTES.HOST.DASHBOARD}>Host Dashboard</Link>
          <Link href={ROUTES.HOST.SESSIONS.LIST}>My Sessions</Link>
          <Link href={ROUTES.HOST.TOURNAMENTS.NEW}>Create Tournament</Link>
        </>
      )}

      {role === 'player' && (
        <>
          <Link href={ROUTES.PLAYER.DASHBOARD}>Player Dashboard</Link>
          <Link href={ROUTES.PLAYER.SESSIONS.LIST}>My Sessions</Link>
          <Link href={ROUTES.PLAYER.PROFILE(userId)}>My Profile</Link>
        </>
      )}
    </nav>
  );
}

// ==================== EXAMPLE 3: Session Card Navigation ====================

interface SessionCardProps {
  id: string;
  title: string;
  userRole: 'host' | 'player' | 'guest';
}

export function SessionCardExample({ id, title, userRole }: SessionCardProps) {
  const router = useRouter();

  const handleViewSession = () => {
    const routeMap = {
      host: ROUTES.HOST.SESSIONS.DETAIL(id),
      player: ROUTES.PLAYER.SESSIONS.DETAIL(id),
      guest: ROUTES.BROWSE.SESSIONS.DETAIL(id),
    };

    router.push(routeMap[userRole]);
  };

  return (
    <div>
      <h3>{title}</h3>
      <button onClick={handleViewSession}>View Session</button>
    </div>
  );
}

// ==================== EXAMPLE 4: Tournament Navigation ====================

interface TournamentCardProps {
  id: string;
  name: string;
  canManage: boolean;
}

export function TournamentCardExample({
  id,
  name,
  canManage,
}: TournamentCardProps) {
  return (
    <div>
      <h3>{name}</h3>

      {/* Always available */}
      <Link href={ROUTES.BROWSE.TOURNAMENTS.DETAIL(id)}>View Details</Link>
      <Link href={ROUTES.BROWSE.TOURNAMENTS.MATCHES(id)}>Matches</Link>
      <Link href={ROUTES.BROWSE.TOURNAMENTS.PLAYERS(id)}>Players</Link>
      <Link href={ROUTES.BROWSE.TOURNAMENTS.WINNERS(id)}>Winners</Link>

      {/* Management links (if user can manage) */}
      {canManage && (
        <>
          <Link href={ROUTES.BROWSE.TOURNAMENTS.MANAGE.HUB(id)}>Manage</Link>
          <Link href={ROUTES.BROWSE.TOURNAMENTS.MANAGE.PLAYERS(id)}>
            Manage Players
          </Link>
          <Link href={ROUTES.BROWSE.TOURNAMENTS.MANAGE.PAIRS(id)}>
            Manage Pairs
          </Link>
        </>
      )}
    </div>
  );
}

// ==================== EXAMPLE 5: Route Guards ====================

function ProtectedRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtected = routeHelpers.isProtected(pathname);

  // In real app, check authentication too
  if (!isProtected) {
    return <PublicRoute>{children}</PublicRoute>;
  }

  return <AuthenticatedRoute>{children}</AuthenticatedRoute>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  // No auth check needed
  return <>{children}</>;
}

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  // Check if user is authenticated
  // If not, redirect to signin
  return <>{children}</>;
}

// ==================== EXAMPLE 6: Role-Based Access Control ====================

interface RoleBasedComponentProps {
  children: React.ReactNode;
  allowedRoles: ('host' | 'player' | 'admin')[];
}

function RoleBasedAccess({ children, allowedRoles }: RoleBasedComponentProps) {
  const pathname = usePathname();

  const isHostRoute = routeHelpers.isHostOnly(pathname);
  const isPlayerRoute = routeHelpers.isPlayerOnly(pathname);
  const isAdminRoute = routeHelpers.isAdminOnly(pathname);

  const hasAccess =
    (isHostRoute && allowedRoles.includes('host')) ||
    (isPlayerRoute && allowedRoles.includes('player')) ||
    (isAdminRoute && allowedRoles.includes('admin'));

  if (!hasAccess) {
    return <div>Access Denied</div>;
  }

  return <>{children}</>;
}

// ==================== EXAMPLE 7: Breadcrumb Navigation ====================

function BreadcrumbExample() {
  const pathname = usePathname();
  const cleanPath = removeLocale(pathname);
  const label = BREADCRUMB_LABELS[cleanPath];

  return (
    <div>
      <Link href={ROUTES.HOME}>Home</Link>
      <span>/</span>
      <span>{label || 'Unknown'}</span>
    </div>
  );
}

// ==================== EXAMPLE 8: Conditional Navigation Menu ====================

interface ConditionalNavProps {
  userRole?: 'host' | 'player' | 'admin';
  isAuthenticated: boolean;
}

function ConditionalNavMenuExample({
  userRole,
  isAuthenticated,
}: ConditionalNavProps) {
  return (
    <nav>
      {/* Public routes - always visible */}
      <Link href={ROUTES.HOME}>Home</Link>
      <Link href={ROUTES.BROWSE.TOURNAMENTS.LIST}>Browse</Link>
      <Link href={ROUTES.ABOUT}>About</Link>

      {!isAuthenticated && (
        <>
          <Link href={ROUTES.AUTH.SIGNIN}>Sign In</Link>
          <Link href={ROUTES.AUTH.SIGNUP}>Sign Up</Link>
        </>
      )}

      {isAuthenticated && (
        <>
          <Link href={ROUTES.SETTINGS}>Settings</Link>

          {userRole === 'host' && (
            <>
              <Link href={ROUTES.HOST.DASHBOARD}>Host Dashboard</Link>
              <Link href={ROUTES.HOST.TOURNAMENTS.NEW}>Create Tournament</Link>
              <Link href={ROUTES.HOST.SESSIONS.LIST}>My Sessions</Link>
              <Link href={ROUTES.HOST.TRANSACTIONS}>Transactions</Link>
            </>
          )}

          {userRole === 'player' && (
            <>
              <Link href={ROUTES.PLAYER.DASHBOARD}>Player Dashboard</Link>
              <Link href={ROUTES.PLAYER.SESSIONS.LIST}>My Sessions</Link>
              <Link href={ROUTES.PLAYER.TRANSACTIONS}>Transactions</Link>
            </>
          )}

          {userRole === 'admin' && (
            <>
              <Link href={ROUTES.ADMIN.USERS}>Users</Link>
              <Link href={ROUTES.ADMIN.NOTIFICATIONS}>Notifications</Link>
            </>
          )}
        </>
      )}
    </nav>
  );
}

// ==================== EXAMPLE 9: Form Redirect ====================

interface CreateSessionFormProps {
  onSuccess?: (sessionId: string) => void;
}

function CreateSessionFormExample({ onSuccess }: CreateSessionFormProps) {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    // Create session...
    const sessionId = '123';

    // Redirect to appropriate page based on user role
    const userRole = 'host'; // Get from context

    if (userRole === 'host') {
      router.push(ROUTES.HOST.SESSIONS.DETAIL(sessionId));
    } else if (userRole === 'player') {
      router.push(ROUTES.PLAYER.SESSIONS.DETAIL(sessionId));
    }

    onSuccess?.(sessionId);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(new FormData(e.currentTarget));
      }}
    >
      <input type="text" name="title" placeholder="Session Title" />
      <button type="submit">Create Session</button>
    </form>
  );
}

// ==================== EXAMPLE 10: Locale-Aware Routing ====================

function LocaleAwareRoutingExample() {
  const locale = 'en'; // Get from next-intl or context

  return (
    <nav>
      {/* Route with locale prefix */}
      <Link href={withLocale(locale, ROUTES.HOME)}>Home</Link>
      <Link href={withLocale(locale, ROUTES.HOST.SESSIONS.LIST)}>
        My Sessions
      </Link>

      {/* Language switcher */}
      <Link href={withLocale('en', ROUTES.HOME)}>English</Link>
      <Link href={withLocale('vi', ROUTES.HOME)}>Tiếng Việt</Link>
      <Link href={withLocale('cn', ROUTES.HOME)}>中文</Link>
    </nav>
  );
}

// ==================== EXAMPLE 11: Route-Based Data Filtering ====================

function RouteBasedFilteringExample() {
  const pathname = usePathname();
  const baseRoute = routeHelpers.getBaseRoute(pathname);

  // Different data/UI based on route
  const config = {
    [ROUTES.HOST.SESSIONS.LIST]: {
      title: 'My Hosted Sessions',
      dataSource: 'hosted_sessions',
    },
    [ROUTES.PLAYER.SESSIONS.LIST]: {
      title: 'My Joined Sessions',
      dataSource: 'joined_sessions',
    },
    [ROUTES.BROWSE.TOURNAMENTS.LIST]: {
      title: 'Browse Tournaments',
      dataSource: 'all_tournaments',
    },
  };

  const currentConfig = config[baseRoute as keyof typeof config];

  return (
    <div>
      <h1>{currentConfig?.title || 'Unknown Page'}</h1>
      {/* Load data from currentConfig.dataSource */}
    </div>
  );
}

// ==================== EXAMPLE 12: Access Control List ====================

function AccessControlExample({
  userRole,
}: {
  userRole: 'host' | 'player' | 'admin' | 'guest';
}) {
  const allowedRoutes = {
    host: ROUTE_GROUPS.HOST_ONLY,
    player: ROUTE_GROUPS.PLAYER_ONLY,
    admin: ROUTE_GROUPS.ADMIN_ONLY,
    guest: ROUTE_GROUPS.PUBLIC,
  };

  const canAccess = (route: string): boolean => {
    return allowedRoutes[userRole].some(
      (r) => route === r || route.startsWith(r)
    );
  };

  return (
    <div>
      {canAccess(ROUTES.HOST.DASHBOARD) && (
        <div>✓ Can access host dashboard</div>
      )}
      {canAccess(ROUTES.PLAYER.DASHBOARD) && (
        <div>✓ Can access player dashboard</div>
      )}
      {canAccess(ROUTES.ADMIN.USERS) && <div>✓ Can access admin panel</div>}
    </div>
  );
}

// ==================== EXAMPLE 13: Sidebar Navigation ====================

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function SidebarItem({
  href,
  icon,
  label,
  isActive,
  onClick,
}: SidebarItemProps) {
  return (
    <Link href={href} className={isActive ? 'active' : ''} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function SidebarNavigationExample({
  userRole,
}: {
  userRole: 'host' | 'player' | 'admin';
}) {
  const pathname = usePathname();

  const hostMenu = [
    {
      href: ROUTES.HOST.DASHBOARD,
      label: 'Dashboard',
      isActive: pathname === ROUTES.HOST.DASHBOARD,
    },
    {
      href: ROUTES.HOST.SESSIONS.LIST,
      label: 'Sessions',
      isActive: pathname.startsWith(ROUTES.HOST.SESSIONS.LIST),
    },
    {
      href: ROUTES.HOST.TOURNAMENTS.NEW,
      label: 'Create Tournament',
      isActive: pathname === ROUTES.HOST.TOURNAMENTS.NEW,
    },
    {
      href: ROUTES.HOST.TRANSACTIONS,
      label: 'Transactions',
      isActive: pathname === ROUTES.HOST.TRANSACTIONS,
    },
  ];

  const playerMenu = [
    {
      href: ROUTES.PLAYER.DASHBOARD,
      label: 'Dashboard',
      isActive: pathname === ROUTES.PLAYER.DASHBOARD,
    },
    {
      href: ROUTES.PLAYER.SESSIONS.LIST,
      label: 'My Sessions',
      isActive: pathname.startsWith(ROUTES.PLAYER.SESSIONS.LIST),
    },
    {
      href: ROUTES.PLAYER.TRANSACTIONS,
      label: 'Transactions',
      isActive: pathname === ROUTES.PLAYER.TRANSACTIONS,
    },
  ];

  const menuItems = userRole === 'host' ? hostMenu : playerMenu;

  return (
    <aside>
      <nav>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.href}
            href={item.href}
            label={item.label}
            isActive={item.isActive}
            icon={<span>📌</span>}
          />
        ))}
      </nav>
    </aside>
  );
}

// ==================== EXAMPLE 14: Tab Navigation ====================

function TabNavigationExample({ tournamentId }: { tournamentId: string }) {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Overview',
      href: ROUTES.BROWSE.TOURNAMENTS.DETAIL(tournamentId),
      active: pathname === ROUTES.BROWSE.TOURNAMENTS.DETAIL(tournamentId),
    },
    {
      label: 'Matches',
      href: ROUTES.BROWSE.TOURNAMENTS.MATCHES(tournamentId),
      active: pathname === ROUTES.BROWSE.TOURNAMENTS.MATCHES(tournamentId),
    },
    {
      label: 'Players',
      href: ROUTES.BROWSE.TOURNAMENTS.PLAYERS(tournamentId),
      active: pathname === ROUTES.BROWSE.TOURNAMENTS.PLAYERS(tournamentId),
    },
    {
      label: 'Winners',
      href: ROUTES.BROWSE.TOURNAMENTS.WINNERS(tournamentId),
      active: pathname === ROUTES.BROWSE.TOURNAMENTS.WINNERS(tournamentId),
    },
  ];

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`tab ${tab.active ? 'active' : ''}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

// ==================== EXPORT ALL ====================

export {
  NavigationExample,
  DynamicNavigationExample,
  ProtectedRouteGuard,
  RoleBasedAccess,
  BreadcrumbExample,
  ConditionalNavMenuExample,
  CreateSessionFormExample,
  LocaleAwareRoutingExample,
  RouteBasedFilteringExample,
  AccessControlExample,
  SidebarNavigationExample,
  TabNavigationExample,
};
