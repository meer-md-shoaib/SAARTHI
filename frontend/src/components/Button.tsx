import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type ButtonVariant = "teal" | "navy" | "yellow" | "coral" | "outline" | "ghost";

const VARIANTS: Record<ButtonVariant, string> = {
  teal: "bg-teal text-white border-teal-dark hover:bg-teal-dark",
  navy: "bg-navy text-white border-navy hover:bg-navy-soft",
  yellow: "bg-sun text-navy border-navy/30 hover:brightness-105",
  coral: "bg-coral text-white border-coral-dark hover:bg-coral-dark",
  outline: "bg-paper text-navy border-navy/25 hover:border-navy/50",
  ghost: "bg-transparent text-navy border-transparent hover:bg-navy/8",
};

interface BigButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  icon?: ReactNode;
  full?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

/** Oversized rounded button - the primary interaction style of the app. */
export function BigButton({
  children,
  variant = "teal",
  onClick,
  icon,
  full = false,
  disabled = false,
  ariaLabel,
}: BigButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        "inline-flex min-h-[60px] items-center justify-center gap-3 rounded-2xl border-2 px-6 py-3 text-lg font-bold",
        "shadow-soft transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        full ? "w-full" : "",
        VARIANTS[variant],
      ].join(" ")}
    >
      {icon}
      <span className="text-balance text-center">{children}</span>
    </motion.button>
  );
}
