import { describe, expect, it } from "vitest";

import { START_POSITION } from "../constants/camera";
import { DURATION_MS } from "../constants/focus";
import { INITIAL_RATE } from "../constants/time";
import { initial } from "./initial";

describe("initial", () => {
  it("maps the unix epoch to its julian date", () => {
    expect(initial(new Date("1970-01-01T00:00:00Z")).date).toBe(2440587.5);
  });

  it("maps midnight utc on 18 september 2026 to JD 2461301.5", () => {
    expect(initial(new Date("2026-09-18T00:00:00Z")).date).toBeCloseTo(2461301.5, 9);
  });

  it("maps the J2000.0 epoch to JD 2451545.0", () => {
    expect(initial(new Date("2000-01-01T12:00:00Z")).date).toBeCloseTo(2451545, 9);
  });

  it("starts at the configured rate", () => {
    expect(initial(new Date()).rate).toBe(INITIAL_RATE);
  });

  it("starts at the overview, focused on no body", () => {
    expect(initial(new Date()).focus.targetId).toBeNull();
  });

  it("starts with focus already complete at every performance.now() at or after zero", () => {
    const { focus } = initial(new Date());
    expect(0 - focus.startedAt).toBeGreaterThanOrEqual(DURATION_MS);
  });

  it("survives HMR's JSON round-trip unchanged", () => {
    const { focus } = initial(new Date());
    expect(JSON.parse(JSON.stringify(focus))).toEqual(focus);
  });

  it("starts the flight from the opening overview", () => {
    expect(initial(new Date()).focus.from).toEqual(START_POSITION);
  });

  it("starts the flight target at the origin", () => {
    expect(initial(new Date()).focus.fromTarget).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("starts with the pointer up", () => {
    expect(initial(new Date()).pointer).toBeNull();
  });
});
