/** Marks an element as a fluid hover item (highlightable by pointer and focus). */
export const ITEM_ATTR = 'data-fluid-hover-item'

/** Set on the highlighted item, for CSS to style. */
export const ACTIVE_ATTR = 'data-fluid-hover-active'

/**
 * Set on the container by `useFluidHover`; scopes item discovery so a nested fluid hover list's
 * items never join the outer list's pick.
 */
export const CONTAINER_ATTR = 'data-fluid-hover'

export const ITEM_SELECTOR = `[${ITEM_ATTR}]`
export const CONTAINER_SELECTOR = `[${CONTAINER_ATTR}]`

export const DISABLED_SELECTOR = ':disabled, [aria-disabled="true"], [data-disabled]'

/** Independent controls a gap click must never hijack. */
export const OWN_CLICK_SELECTOR
  = 'input, textarea, select, button, a, summary, [contenteditable], [role="button"]'

/** How far (px) the pointer must travel to take the highlight back from the keyboard. */
export const RESUME_DISTANCE = 6

/** Critically damped spring duration (seconds) per motion tier. */
export const MOTION_TIERS = {
  fast: 0.08,
  moderate: 0.16,
  slow: 0.24,
} as const

export type MotionTier = keyof typeof MOTION_TIERS

/** Opacity fade durations (seconds); reduced motion drops the travel but keeps the fade. */
export const FADE_IN = 0.08
export const FADE_OUT = 0.06

/** Frames the coalesced measurement retries while registered items still have no layout box. */
export const MEASUREMENT_ATTEMPTS = 3
