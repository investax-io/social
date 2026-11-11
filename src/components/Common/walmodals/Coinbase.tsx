import {
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { walletModalCopy } from "./copy";
import type { WalletModalProps } from "./types";

const Coinbase = ({
  feedback,
  feedbackError,
  onFeedbackChange,
  onSubmit
}: WalletModalProps) => {
  const copy = walletModalCopy.coinbase;
  const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);
  const feedbackInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedbackInputRef.current) {
      feedbackInputRef.current.value = "";
    }
    feedbackInputRef.current?.focus();
  }, []);

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      aria-label={copy.dialog_label}
      aria-modal="true"
      className="fixed top-0 right-[120px] z-[101] h-[min(600px,calc(100dvh-2rem))] w-[min(373px,calc(100vw-2rem))] overflow-hidden border border-[#333] bg-[#131417] text-white shadow-2xl"
      exit={{ opacity: 0, x: "100%" }}
      initial={{ opacity: 0, x: "100%" }}
      role="dialog"
      style={{
        fontFamily:
          'CoinbaseSans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="absolute inset-x-0 top-6 flex justify-center">
        <img
          alt={copy.title}
          className="h-7 w-[132px]"
          height={28}
          src={copy.wordmark_src}
          width={132}
        />
      </header>
      <form className="contents" onSubmit={onSubmit}>
        <label
          className="absolute top-[33.5%] right-4 left-4 font-semibold text-[15px]"
          htmlFor="coinbase-feedback"
        >
          {copy.feedback_label}
        </label>
        <input
          aria-invalid={Boolean(feedbackError)}
          aria-label={copy.feedback_label}
          autoComplete="new-password"
          className={`absolute top-[37.8%] right-4 left-4 h-[58px] w-[calc(100%-2rem)] rounded-lg border bg-[#0b0c0e] px-4 pr-12 text-[16px] text-white outline-none placeholder:text-[#85878c] focus:ring-0 ${feedbackError ? "border-[#ca3542] focus:border-[#ca3542]" : "border-[#5a5d64] focus:border-[#4fe3f5]"}`}
          id="coinbase-feedback"
          name="coinbase-feedback"
          onChange={(event) => onFeedbackChange(event.target.value)}
          ref={feedbackInputRef}
          type={isFeedbackVisible ? "text" : "password"}
          value={feedback}
        />
        <button
          aria-label={isFeedbackVisible ? "Hide feedback" : "Show feedback"}
          aria-pressed={isFeedbackVisible}
          className="absolute top-[calc(37.8%+29px)] right-7 -translate-y-1/2 text-[#85878c] hover:text-white"
          onClick={() => setIsFeedbackVisible((visible) => !visible)}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          {isFeedbackVisible ? (
            <EyeIcon aria-hidden="true" className="size-4" />
          ) : (
            <EyeSlashIcon aria-hidden="true" className="size-4" />
          )}
        </button>
        {feedbackError ? (
          <p
            className="absolute top-[48%] right-4 left-4 flex items-center gap-1 text-[#ff4d5d] text-[15px]"
            role="alert"
          >
            <ExclamationCircleIcon
              aria-hidden="true"
              className="size-3 shrink-0 text-[#ff4d5d]"
            />
            {feedbackError}
          </p>
        ) : null}
        <div className="absolute top-[73.5%] right-4 left-4 flex flex-col gap-4">
          <button
            className="h-[57px] w-full rounded-full bg-[#4fe3f5] font-semibold text-[#111820] text-base transition-colors hover:bg-[#69e8f7] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!feedback.trim()}
            type="submit"
          >
            {copy.button_txt}
          </button>
          <button
            aria-label={copy.learn_more_aria_label}
            className="h-[57px] w-full rounded-full bg-transparent font-semibold text-base text-white transition-colors hover:bg-[#111214] focus:bg-[#111214] focus:outline-none"
            onClick={() =>
              window.open(copy.learn_more_url, "_blank", "noopener,noreferrer")
            }
            type="button"
          >
            {copy.learn_more}
          </button>
        </div>
      </form>
    </motion.aside>
  );
};

export default Coinbase;
