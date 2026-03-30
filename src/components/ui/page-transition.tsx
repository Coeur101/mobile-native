import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DURATION_PAGE, EASE_APPLE } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** 页面转场：轻量淡入叠加微小上浮，增强原生感而不破坏性能。 */
export const PageTransition = ({ children, className = "", style }: PageTransitionProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.992 }}
      animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: DURATION_PAGE, ease: EASE_APPLE }}
      className={className}
      style={{ willChange: "transform, opacity", ...style }}
    >
      {children}
    </motion.div>
  );
};
