import { newtonRaphson } from "../utils/newtonRaphson";

// https://en.wikipedia.org/wiki/Kepler's_laws_of_planetary_motion
export function kepler(meanAnomaly: number, eccentricity: number): number {
  const m = Math.atan2(Math.sin(meanAnomaly), Math.cos(meanAnomaly));
  const e0 = m + eccentricity * Math.sin(m);

  const f = (e: number) => e - eccentricity * Math.sin(e) - m;
  const fprime = (e: number) => 1 - eccentricity * Math.cos(e);
  return newtonRaphson(f, fprime, e0);
}
