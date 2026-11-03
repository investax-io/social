import type { ReactNode } from "react";
import { Outlet } from "react-router";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface RequireLoginProps {
  children?: ReactNode;
}

const RequireLogin = ({ children }: RequireLoginProps) => {
  const { currentAccount } = useAccountStore();

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  return children ?? <Outlet />;
};

export default RequireLogin;
