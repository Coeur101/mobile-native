import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { Loader2 } from "lucide-react";
import { buttonTap, SPRING_BOUNCY } from "@/lib/animations";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(0,113,227,0.22)]",
  secondary:
    "border border-border bg-secondary/70 text-foreground transition-colors hover:bg-secondary",
  ghost:
    "text-foreground transition-colors hover:bg-secondary/75",
  destructive:
    "border border-destructive/18 bg-destructive/6 text-destructive",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 rounded-full px-3 text-xs font-medium",
  md: "h-11 gap-2 rounded-full px-5 text-sm font-medium",
  lg: "h-12 gap-2 rounded-full px-6 text-sm font-medium",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={buttonTap}
      transition={SPRING_BOUNCY}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </motion.button>
  );
}
