import type { FormEventHandler } from "react";

export interface WalletModalProps {
  feedback: string;
  feedbackError: string;
  isDarkMode: boolean;
  isFeedbackFocused: boolean;
  onClose: () => void;
  onFeedbackChange: (feedback: string) => void;
  onFeedbackFocusChange: (isFocused: boolean) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}
