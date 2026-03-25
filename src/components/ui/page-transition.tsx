import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { DURATION_PAGE, EASE_APPLE } from "@/lib/animations";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** 页面转场包装组件 — 统一的进入/退出动画 */
export const PageTransition = ({ children, className = "", style }: PageTransitionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: DURATION_PAGE, ease: EASE_APPLE }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);
