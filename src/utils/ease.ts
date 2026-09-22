const HALF = 0.5;
const CUBE = 3;
const STEEPNESS = 4;

export function ease(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped < HALF
    ? STEEPNESS * clamped ** CUBE
    : 1 - (-2 * clamped + 2) ** CUBE / 2;
}
