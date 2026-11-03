import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion } from "motion/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef, memo } from "react";
import { Spinner } from "@/components/Shared/UI";
import cn from "@/helpers/cn";

const buttonVariants = cva(
  "rounded-full font-bold inline-flex items-center justify-center relative overflow-hidden",
  {
    compoundVariants: [
      // Non-outline Primary
      {
        class: cn(
          "text-white hover:text-white active:text-gray-100",
          "bg-gray-950 hover:bg-gray-800 active:bg-gray-700",
          "border border-gray-950 hover:border-gray-800 active:border-gray-700",
          "dark:text-gray-950 dark:hover:text-gray-900 dark:active:text-gray-600",
          "dark:bg-white dark:hover:bg-gray-200 dark:active:bg-gray-200",
          "dark:border-white dark:hover:border-gray-100 dark:active:border-gray-200"
        ),
        outline: false,
        variant: "primary"
      },
      // Outline Primary
      {
        class: cn(
          "text-gray-950 active:text-gray-500",
          "border border-gray-300 hover:border-gray-400",
          "dark:text-white dark:active:text-gray-700",
          "dark:border-gray-700 dark:hover:border-gray-600"
        ),
        outline: true,
        variant: "primary"
      }
    ],
    defaultVariants: {
      outline: false,
      size: "md",
      variant: "primary"
    },
    variants: {
      outline: { false: "", true: "" },
      size: { lg: "px-5 py-1.5", md: "px-4 py-1", sm: "px-3 py-0.5 text-sm" },
      variant: { primary: "" }
    }
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      icon,
      outline,
      size,
      variant,
      loading,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        className={buttonVariants({ className, outline, size, variant })}
        disabled={disabled}
        ref={ref}
        type={rest.type}
        {...rest}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute flex items-center justify-center"
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
              key="button-loading"
              transition={{ bounce: 0, duration: 0.2, type: "spring" }}
            >
              <Spinner size="xs" />
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-x-1.5"
              exit={{ opacity: 0, y: -20 }}
              initial={{ opacity: 0, y: 0 }}
              key="button-content"
              transition={{ bounce: 0, duration: 0.2, type: "spring" }}
            >
              {icon}
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }
);

export default memo(Button);
