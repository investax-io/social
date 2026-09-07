import { useSignupStore } from "@/components/Shared/Auth/Signup";
import { Button } from "@/components/Shared/UI";
import isSiteActive from "@/helpers/isSiteActive";
import { useActivationModalStore } from "@/store/non-persisted/modal/useActivationModalStore";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";

interface SignupButtonProps {
  className?: string;
}

const SignupButton = ({ className }: SignupButtonProps) => {
  const { setShowAuthModal } = useAuthModalStore();
  const { setShowActivationModal } = useActivationModalStore();
  const { setScreen } = useSignupStore();

  return (
    <Button
      className={className}
      onClick={() => {
        if (!isSiteActive()) {
          setShowActivationModal(true);
          return;
        }
        umami.track("open_signup");
        setScreen("choose");
        setShowAuthModal(true, "signup");
      }}
      outline
      size="md"
    >
      Signup
    </Button>
  );
};

export default SignupButton;
