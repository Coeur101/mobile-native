import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { DURATION_PAGE, EASE_APPLE } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** 页面转场 — 仅 opacity，GPU 友好 */
export const PageTransition = ({ children, className = "", style }: PageTransitionProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: DURATION_PAGE, ease: EASE_APPLE }}
    className={className}
    style={{ willChange: "opacity", ...style }}
  >
    {children}
  </motion.div>
);
