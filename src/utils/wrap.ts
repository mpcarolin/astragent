export function wrap(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
