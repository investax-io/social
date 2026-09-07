import { type MouseEvent, useCallback } from "react";
import { Button } from "@/components/Shared/UI";
import { STATIC_IMAGES_URL } from "@/data/constants";
import isSiteActive from "@/helpers/isSiteActive";
import { useActivationModalStore } from "@/store/non-persisted/modal/useActivationModalStore";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";

interface LoginButtonProps {
  className?: string;
  isBig?: boolean;
  title?: string;
}

const LoginButton = ({
  className = "",
  isBig = false,
  title = "Login"
}: LoginButtonProps) => {
  const { setShowAuthModal } = useAuthModalStore();
  const { setShowActivationModal } = useActivationModalStore();

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (!isSiteActive()) {
        setShowActivationModal(true);
        return;
      }
      umami.track("open_login");
      return setShowAuthModal(true);
    },
    [setShowActivationModal, setShowAuthModal]
  );

  return (
    <Button
      className={className}
      icon={
        <img
          alt="Lens Logo"
          className="mr-0.5 h-3"
          height={12}
          src={`${STATIC_IMAGES_URL}/brands/lens.svg`}
          width={19}
        />
      }
      onClick={handleClick}
      size={isBig ? "lg" : "md"}
    >
      {title}
    </Button>
  );
};

export default LoginButton;
