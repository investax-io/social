import { Button, Card, Image } from "@/components/Shared/UI";
import { STATIC_IMAGES_URL } from "@/data/constants";
import isSiteActive from "@/helpers/isSiteActive";
import { useActivationModalStore } from "@/store/non-persisted/modal/useActivationModalStore";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { useSignupStore } from "./Signup";

const SignupCard = () => {
  const { setShowAuthModal } = useAuthModalStore();
  const { setShowActivationModal } = useActivationModalStore();
  const { setScreen } = useSignupStore();

  const handleSignupClick = () => {
    if (!isSiteActive()) {
      setShowActivationModal(true);
      return;
    }
    setScreen("choose");
    setShowAuthModal(true, "signup");
  };

  return (
    <Card className="space-y-4 p-5">
      <Image
        alt="Dizzy emoji"
        className="mx-auto size-14"
        height={56}
        src={`${STATIC_IMAGES_URL}/emojis/dizzy.png`}
        width={56}
      />
      <div className="space-y-3 text-center">
        <div className="font-bold">Get your InvestaX account now!</div>
        <div>
          <Button onClick={handleSignupClick}>Signup now</Button>
        </div>
      </div>
    </Card>
  );
};

export default SignupCard;
