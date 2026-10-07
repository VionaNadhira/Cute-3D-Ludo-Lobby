/**
 * haptics.ts — lightweight vibration wrapper.
 * Always safe to call; silently skips when the API is unavailable.
 */

const supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function vibrate(pattern: number | number[]): void {
  if (!supported) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers expose the API but still throw; we ignore those.
  }
}

export const haptic = {
  /** Short tap — button press, token select */
  tap: () => vibrate(8),
  /** Snappy roll — dice thrown */
  roll: () => vibrate(12),
  /** Double pulse — capture */
  capture: () => vibrate([12, 40, 12]),
  /** Triple pulse — home arrival */
  home: () => vibrate([10, 30, 10, 30, 15]),
  /** Celebration ramp — victory */
  victory: () => vibrate([15, 60, 20, 40, 25]),
  /** Single short — extra turn */
  extraTurn: () => vibrate(10),
};
