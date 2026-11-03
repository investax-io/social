import { useApolloClient } from "@apollo/client";
import {
  BanknotesIcon,
  BellIcon as BellOutline,
  BookmarkIcon as BookmarkOutline,
  ChartBarIcon,
  Cog6ToothIcon,
  GlobeAltIcon as GlobeOutline,
  HomeIcon as HomeOutline,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon as UserGroupOutline
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellSolid,
  BookmarkIcon as BookmarkSolid,
  GlobeAltIcon as GlobeSolid,
  HomeIcon as HomeSolid,
  UserGroupIcon as UserGroupSolid
} from "@heroicons/react/24/solid";
import {
  type MouseEvent,
  memo,
  type ReactNode,
  useCallback,
  useState
} from "react";
import { Link, useLocation } from "react-router";
import { useAddressBackupReminder } from "@/components/Common/AddressBackupReminder";
import AccountLink from "@/components/Shared/Account/AccountLink";
import { Image, Spinner } from "@/components/Shared/UI";
import { STATIC_IMAGES_URL } from "@/data/constants";
import getAvatar from "@/helpers/getAvatar";
import useHasNewNotifications from "@/hooks/useHasNewNotifications";
import {
  GroupsDocument,
  NotificationIndicatorDocument,
  NotificationsDocument,
  PostBookmarksDocument,
  PostsExploreDocument,
  PostsForYouDocument,
  TimelineDocument,
  TimelineHighlightsDocument
} from "@/indexer/generated";
import { useNewPostModalStore } from "@/store/non-persisted/modal/useNewPostModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useNotificationStore } from "@/store/persisted/useNotificationStore";

const navigationItems = {
  "/": {
    outline: <HomeOutline className="size-6" />,
    refreshDocs: [
      TimelineDocument,
      TimelineHighlightsDocument,
      PostsForYouDocument
    ],
    solid: <HomeSolid className="size-6" />,
    title: "Home"
  },
  "/bookmarks": {
    outline: <BookmarkOutline className="size-6" />,
    refreshDocs: [PostBookmarksDocument],
    solid: <BookmarkSolid className="size-6" />,
    title: "Bookmarks"
  },
  "/explore": {
    outline: <GlobeOutline className="size-6" />,
    refreshDocs: [PostsExploreDocument],
    solid: <GlobeSolid className="size-6" />,
    title: "Explore"
  },
  "/groups": {
    outline: <UserGroupOutline className="size-6" />,
    refreshDocs: [GroupsDocument],
    solid: <UserGroupSolid className="size-6" />,
    title: "Groups"
  },
  "/leaderboard": {
    outline: <TrophyIcon className="size-6" />,
    title: "Leaderboard"
  },
  "/notifications": {
    outline: <BellOutline className="size-6" />,
    refreshDocs: [NotificationsDocument, NotificationIndicatorDocument],
    solid: <BellSolid className="size-6" />,
    title: "Notifications"
  },
  "/premium": {
    outline: <SparklesIcon className="size-6" />,
    title: "Premium"
  },
  "/search": {
    outline: <MagnifyingGlassIcon className="size-6" />,
    title: "Search"
  },
  "/stocks": {
    outline: <ChartBarIcon className="size-6" />,
    title: "Stocks"
  },
  "/wallet": {
    outline: <BanknotesIcon className="size-6" />,
    title: "Wallet"
  }
};

interface NavItemProps {
  url: string;
  icon: ReactNode;
  title: string;
  isActive: boolean;
  showIndicator?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

const NavItem = memo(
  ({ icon, isActive, onClick, showIndicator, title, url }: NavItemProps) => (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`flex h-12 w-full items-center gap-4 rounded-2xl px-3 text-base transition-colors ${
        isActive
          ? "bg-gray-200 font-semibold text-gray-950 dark:bg-gray-800 dark:text-white"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
      }`}
      onClick={onClick}
      to={url}
    >
      <span className="relative shrink-0">
        {icon}
        {showIndicator && (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500" />
        )}
      </span>
      <span>{title}</span>
    </Link>
  )
);

const NavItems = memo(({ isLoggedIn }: { isLoggedIn: boolean }) => {
  const { pathname } = useLocation();
  const { requestNavigation } = useAddressBackupReminder();
  const hasNewNotifications = useHasNewNotifications();
  const { incrementNotificationRefreshSignal } = useNotificationStore();
  const client = useApolloClient();
  const [refreshingRoute, setRefreshingRoute] = useState<string | null>(null);
  const routes = [
    "/",
    "/search",
    ...(isLoggedIn ? ["/notifications"] : []),
    "/wallet",
    "/stocks",
    "/premium",
    "/leaderboard",
    "/explore",
    ...(isLoggedIn ? ["/groups", "/bookmarks"] : [])
  ];

  return (
    <>
      {routes.map((route) => {
        const item = navigationItems[route as keyof typeof navigationItems];
        const isActive = pathname === route;
        let icon = isActive && "solid" in item ? item.solid : item.outline;

        if (refreshingRoute === route) {
          icon = <Spinner className="my-0.5" size="sm" />;
        }

        const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
          if (!requestNavigation(route)) {
            e.preventDefault();
            return;
          }

          const isSameRoute = pathname === route;
          if (!isSameRoute || !("refreshDocs" in item) || !item.refreshDocs) {
            return;
          }
          e.preventDefault();
          window.scrollTo(0, 0);
          if (route === "/notifications") {
            incrementNotificationRefreshSignal();
          }
          setRefreshingRoute(route);
          try {
            await client.refetchQueries({ include: item.refreshDocs });
          } finally {
            setRefreshingRoute(null);
          }
        };

        return (
          <NavItem
            icon={icon}
            isActive={isActive}
            key={route}
            onClick={handleClick}
            showIndicator={route === "/notifications" && hasNewNotifications}
            title={item.title}
            url={route}
          />
        );
      })}
    </>
  );
});

const Navbar = () => {
  const { pathname } = useLocation();
  const { currentAccount } = useAccountStore();
  const { setShow: setShowNewPostModal } = useNewPostModalStore();

  const handleLogoClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (pathname === "/") {
        e.preventDefault();
        window.scrollTo(0, 0);
      }
    },
    [pathname]
  );

  return (
    <aside className="sticky top-5 left-menu-typography mt-5 hidden w-60 shrink-0 flex-col md:flex">
      <Link
        aria-label="Hey home"
        className="flex size-10 items-center justify-center"
        onClick={handleLogoClick}
        to="/"
      >
        <Image
          alt="Logo"
          className="size-9"
          height={36}
          src={`${STATIC_IMAGES_URL}/app-icon/0.png`}
          width={36}
        />
      </Link>
      <div className="mt-[10px]">
        <NavItems isLoggedIn={!!currentAccount} />
      </div>
      {currentAccount && (
        <AccountLink
          account={currentAccount}
          className={`flex h-12 w-full items-center gap-4 rounded-2xl px-3 text-base transition-colors ${
            pathname.startsWith("/u/") || pathname.startsWith("/account/")
              ? "bg-gray-200 font-semibold text-gray-950 dark:bg-gray-800 dark:text-white"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
          }`}
        >
          <Image
            alt=""
            className="size-6 rounded-full"
            src={getAvatar(currentAccount)}
          />
          <span>Profile</span>
        </AccountLink>
      )}
      <Link
        className={`flex h-12 w-full items-center gap-4 rounded-2xl px-3 text-base transition-colors ${
          pathname.startsWith("/settings")
            ? "bg-gray-200 font-semibold text-gray-950 dark:bg-gray-800 dark:text-white"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
        }`}
        to="/settings"
      >
        <Cog6ToothIcon className="size-6 shrink-0" />
        <span>Settings</span>
      </Link>
      {currentAccount && (
        <button
          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-brand-600 px-4 text-lg text-white shadow-sm transition-colors hover:bg-brand-500"
          onClick={() => setShowNewPostModal(true)}
          type="button"
        >
          <PencilSquareIcon className="size-5" />
          Create post
        </button>
      )}
    </aside>
  );
};

export default memo(Navbar);
