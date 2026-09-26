import { describe, expect, it } from "vitest";

import { ELEVATION, MIN_APPROACH, PHASE_ANGLE, ZOOM_FACTOR } from "../constants/focus";
import { vantage } from "./vantage";

const SUN = { x: 0, y: 0, z: 0 };
const PLANET = { x: 3, y: 0, z: 0 };
const RADIUS = 0.5;

describe("vantage", () => {
  it("stands off by the body radius times the zoom factor", () => {
    const camera = vantage({ planet: PLANET, sun: SUN, radius: RADIUS });
    const distance = Math.hypot(
      camera.x - PLANET.x,
      camera.y - PLANET.y,
      camera.z - PLANET.z,
    );
    expect(distance).toBeCloseTo(RADIUS * ZOOM_FACTOR, 12);
  });

  it("never approaches nearer than the minimum for a tiny body", () => {
    const camera = vantage({ planet: PLANET, sun: SUN, radius: 1e-6 });
    const distance = Math.hypot(camera.x - PLANET.x, camera.y - PLANET.y, camera.z - PLANET.z);
    expect(distance).toBeCloseTo(MIN_APPROACH, 12);
  });

  it("sits on the sunward side of the body", () => {
    const camera = vantage({ planet: PLANET, sun: SUN, radius: RADIUS });
    expect(camera.x).toBeLessThan(PLANET.x);
  });

  it("is offset from the planet-sun line by exactly the phase angle", () => {
    const camera = vantage({ planet: PLANET, sun: SUN, radius: RADIUS });
    const toCamera = { x: camera.x - PLANET.x, y: camera.y - PLANET.y, z: 0 };
    const planar = Math.hypot(toCamera.x, toCamera.y);
    const cosine = -toCamera.x / planar;
    expect(Math.acos(cosine)).toBeCloseTo(PHASE_ANGLE, 12);
  });

  it("lifts the camera above the ecliptic", () => {
    expect(vantage({ planet: PLANET, sun: SUN, radius: RADIUS }).z).toBeGreaterThan(0);
  });

  it("places the camera exactly on the planet-sun line at zero elevation and phase", () => {
    const camera = vantage({ planet: PLANET, sun: SUN, radius: RADIUS, phase: 0, elevation: 0 });
    expect(camera.y).toBeCloseTo(0, 12);
    expect(camera.z).toBeCloseTo(0, 12);
    expect(camera.x).toBeCloseTo(PLANET.x - RADIUS * ZOOM_FACTOR, 12);
  });

  it("follows the sun direction rather than a fixed axis", () => {
    const planet = { x: 0, y: 4, z: 0 };
    const camera = vantage({ planet, sun: SUN, radius: RADIUS, phase: 0, elevation: 0 });
    expect(camera.y).toBeCloseTo(planet.y - RADIUS * ZOOM_FACTOR, 12);
    expect(camera.x).toBeCloseTo(0, 12);
  });

  it("rotates about ecliptic up, so elevation alone keeps the planar bearing sunward", () => {
    const camera = vantage({
      planet: PLANET,
      sun: SUN,
      radius: RADIUS,
      phase: 0,
      elevation: ELEVATION,
    });
    expect(camera.y).toBeCloseTo(0, 12);
    expect(camera.z).toBeGreaterThan(0);
  });

  it("falls back to a sunward default when the body sits at the sun", () => {
    const camera = vantage({ planet: SUN, sun: SUN, radius: RADIUS });
    expect(Number.isFinite(camera.x)).toBe(true);
    expect(Math.hypot(camera.x, camera.y, camera.z)).toBeCloseTo(RADIUS * ZOOM_FACTOR, 12);
  });

  it("leaves its inputs unmutated", () => {
    const planet = { x: 3, y: 0, z: 0 };
    const sun = { x: 0, y: 0, z: 0 };
    vantage({ planet, sun, radius: RADIUS });
    expect(planet).toEqual({ x: 3, y: 0, z: 0 });
    expect(sun).toEqual({ x: 0, y: 0, z: 0 });
  });
});
