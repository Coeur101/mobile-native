/** 动画常量 — 全局统一的动画参数 */

// Apple 风格缓动曲线
export const EASE_APPLE = [0.32, 0.72, 0, 1] as const;

// 平滑入场曲线
export const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;

// 按钮按压弹簧
export const SPRING_BUTTON = { type: "spring" as const, stiffness: 400, damping: 17 };

// 弹性弹簧（FAB、浮动元素）
export const SPRING_BOUNCY = { type: "spring" as const, stiffness: 260, damping: 20 };

// 页面转场时长
export const DURATION_PAGE = 0.35;

// 元素入场时长
export const DURATION_ELEMENT = 0.4;

// Stagger 间隔
export const STAGGER_DELAY = 0.07;

// 页面入场变体
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Stagger 容器变体
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: STAGGER_DELAY,
    },
  },
};

// Stagger 子元素变体
export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_ELEMENT, ease: EASE_SMOOTH },
  },
};

// 卡片 hover 效果
export const cardHover = {
  y: -2,
  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  transition: { duration: 0.2 },
};

// 按钮 tap 效果
export const buttonTap = { scale: 0.97 };

// 浮动入场（FAB 等）
export const floatIn = {
  initial: { y: 60, opacity: 0, scale: 0.8 },
  animate: { y: 0, opacity: 1, scale: 1 },
};
