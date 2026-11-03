import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import cn from "@/helpers/cn";
import errorToast from "@/helpers/errorToast";
import reloadAllTabs from "@/helpers/reloadAllTabs";
import { signOut } from "@/store/persisted/useAuthStore";

interface LogoutProps {
  className?: string;
  onClick?: () => void;
}

const Logout = ({ className = "", onClick }: LogoutProps) => {
  const handleLogout = async () => {
    try {
      umami.track("logout");
      signOut();
      reloadAllTabs();
    } catch (error) {
      errorToast(error);
    }
  };

  return (
    <button
      className={cn(
        "flex w-full items-center space-x-2 px-2 py-1.5 text-left font-normal text-base text-brand-600",
        className
      )}
      onClick={async () => {
        await handleLogout();
        onClick?.();
      }}
      type="button"
    >
      <ArrowRightStartOnRectangleIcon className="size-5" />
      <div>Log Out</div>
    </button>
  );
};

export default Logout;
