export const EASE_APPLE = [0.24, 0.9, 0.2, 1] as const;

export const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;

export const SPRING_BUTTON = {
  type: "spring" as const,
  stiffness: 420,
  damping: 28,
};

export const SPRING_BOUNCY = {
  type: "spring" as const,
  stiffness: 260,
  damping: 24,
};

export const SPRING_PANEL = {
  type: "spring" as const,
  stiffness: 220,
  damping: 22,
};

export const SPRING_GENTLE = {
  type: "spring" as const,
  stiffness: 170,
  damping: 20,
};

export const DURATION_PAGE = 0.28;

export const buttonTap = { scale: 0.98 };

export const cardLift = {
  y: -6,
  scale: 1.01,
};

export const iconLift = {
  y: -3,
  scale: 1.06,
  rotate: -6,
};
