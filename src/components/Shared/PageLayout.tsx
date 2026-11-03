import type { ReactNode } from "react";
import { memo } from "react";
import MetaTags from "@/components/Common/MetaTags";
import SignupButton from "@/components/Shared/Navbar/SignupButton";
import cn from "@/helpers/cn";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import LoginButton from "./LoginButton";
import Search from "./Search";
import Sidebar from "./Sidebar";

interface AuthButtonsProps {
  className?: string;
}

const AuthButtons = ({ className }: AuthButtonsProps) => {
  const { currentAccount } = useAccountStore();

  if (currentAccount) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-x-2", className)}>
      <SignupButton className="w-full" />
      <LoginButton className="w-full" />
    </div>
  );
};

interface PageLayoutProps {
  title?: string;
  description?: string;
  children: ReactNode;
  sidebar?: ReactNode;
  hideSearch?: boolean;
  zeroTopMargin?: boolean;
}

const PageLayout = ({
  title,
  children,
  description,
  sidebar = <Sidebar />,
  hideSearch = false,
  zeroTopMargin = false
}: PageLayoutProps) => {
  return (
    <>
      <MetaTags description={description} title={title} />
      <div
        className={cn("mt-5 mb-16 min-w-0 flex-1 space-y-5 md:mb-5", {
          "mt-0 md:mt-5": zeroTopMargin
        })}
      >
        <AuthButtons
          className={cn(
            { "mt-5": zeroTopMargin },
            "w-full lg:w-auto",
            "ml-auto px-5 md:px-0 lg:hidden"
          )}
        />
        {children}
      </div>
      <aside className="sticky top-5 right-menu-typography mt-5 hidden h-[calc(100vh-2.5rem)] min-h-0 w-[317px] shrink-0 flex-col overflow-hidden lg:flex">
        {!hideSearch && (
          <div className="right-rail-search h-16 shrink-0 rounded-2xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-black">
            <Search />
          </div>
        )}
        <div
          className={cn(
            "no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain",
            !hideSearch && "pt-5"
          )}
        >
          <AuthButtons />
          {sidebar}
        </div>
      </aside>
    </>
  );
};

export default memo(PageLayout);
