/** 动画常量 — 全局统一的动画参数 */

// Apple 风格缓动曲线
export const EASE_APPLE = [0.32, 0.72, 0, 1] as const;

// 平滑入场曲线
export const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;

// 按钮按压弹簧（轻量级）
export const SPRING_BUTTON = { type: "spring" as const, stiffness: 500, damping: 30 };

// 弹性弹簧（FAB、浮动元素）
export const SPRING_BOUNCY = { type: "spring" as const, stiffness: 300, damping: 22 };

// 页面转场时长
export const DURATION_PAGE = 0.3;

// 按钮 tap 效果
export const buttonTap = { scale: 0.95 };
