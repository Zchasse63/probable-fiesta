/**
 * Framer Motion Spring Animation Presets
 * B2B Frozen Protein Distribution Platform
 */

export const springs = {
  /**
   * Snappy spring - for instant UI feedback
   * Use for: buttons, tooltips, small UI interactions
   */
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },

  /**
   * Smooth spring - for modal and page transitions
   * Use for: modals, page transitions, larger UI elements
   */
  smooth: {
    type: "spring" as const,
    stiffness: 260,
    damping: 20,
  },

  /**
   * Gentle spring - for animated numbers and subtle transitions
   * Use for: number counters, data visualizations, smooth value changes
   */
  gentle: {
    type: "spring" as const,
    stiffness: 100,
    damping: 15,
    mass: 0.8,
  },

  /**
   * Drawer spring - for side panels and drawers
   * Use for: sidebars, slide-out panels, drawer components
   */
  drawer: {
    type: "spring" as const,
    stiffness: 380,
    damping: 32,
  },
} as const;

export type SpringPreset = keyof typeof springs;
