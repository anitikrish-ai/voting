// Motion spec — the one system every component draws from.
// Durations and easings only ever come from this file: no one-off values.

export const EASE_STANDARD = [0.22, 0.61, 0.36, 1] as const; // general moves
export const EASE_DECEL = [0.16, 1, 0.3, 1] as const; // entrances (decelerate in)
export const EASE_ACCEL = [0.55, 0, 1, 0.45] as const; // exits (accelerate out)

export const DUR = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.56,
};

// Staggered container for grids of cards / list rows.
export const staggerContainer = (staggerMs = 40, delayChildren = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: staggerMs / 1000,
      delayChildren: delayChildren / 1000,
    },
  },
});

// Signature entrance for cards: short rise + fade, never a full-screen slide.
export const cardEnter = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.base, ease: EASE_DECEL },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE_STANDARD } },
};

export const heroReveal = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, ease: EASE_DECEL },
  },
};
