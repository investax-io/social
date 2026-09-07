import "./font.css";
import "./styles.css";

import {
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { type FormEvent, StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Providers from "@/components/Common/Providers";
import { Button, Input } from "@/components/Shared/UI";
import { Localstorage } from "@/data/storage";
import { useActivationModalStore } from "@/store/non-persisted/modal/useActivationModalStore";
import Routes from "./routes";

const ACTIVATION_CODE = "Rs7s3ITo";

const App = () => {
  const { showActivationModal } = useActivationModalStore();
  const [showActivation, setShowActivation] = useState(false);
  const [activationCode, setActivationCode] = useState("");

  const handleActivation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activationCode.trim() !== ACTIVATION_CODE) return;

    localStorage.setItem(Localstorage.ActivationStatus, "true");
    window.location.reload();
  };

  return (
    <>
      <Providers>
        <Routes />
      </Providers>
      {showActivationModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div
            aria-labelledby="activation-dialog-title"
            aria-modal="true"
            className="relative flex h-[300px] w-[450px] max-w-[calc(100vw-2rem)] flex-col justify-center bg-white p-6 text-center shadow-xl dark:bg-gray-800"
            role="dialog"
          >
            {showActivation ? (
              <>
                <button
                  aria-label="Back to access notice"
                  className="absolute top-4 left-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={() => setShowActivation(false)}
                  title="Back"
                  type="button"
                >
                  <ArrowLeftIcon className="size-5" />
                </button>
                <h1
                  className="font-semibold text-[22px]"
                  id="activation-dialog-title"
                >
                  Secure access
                </h1>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                  Enter the secure access code issued to you by an authorized
                  administrator.
                </p>
                <form
                  className="mt-6 flex flex-col gap-4 text-left"
                  onSubmit={handleActivation}
                >
                  <Input
                    aria-label="Activation code"
                    label="Activation code"
                    onChange={(event) => setActivationCode(event.target.value)}
                    placeholder="Enter your secure access code"
                    required
                    value={activationCode}
                  />
                  <Button className="self-end text-lg" type="submit">
                    Activate
                  </Button>
                </form>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="size-7"
                  />
                </div>
                <h1
                  className="font-semibold text-[22px]"
                  id="activation-dialog-title"
                >
                  Restricted access
                </h1>
                <p className="mt-3 text-base text-gray-500 leading-6 dark:text-gray-400">
                  This workspace is available to authorized users only. Please
                  contact your administrator to request an access code.
                </p>
                <Button
                  className="mx-auto mt-6 text-lg"
                  onClick={() => setShowActivation(true)}
                >
                  Activate
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
};

createRoot(document.getElementById("_hey_") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
