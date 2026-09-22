import { describe, expect, it } from "vitest";

import { DAYS_PER_SECOND } from "../constants/time";
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
    expect(initial(new Date()).rate).toBe(DAYS_PER_SECOND);
  });
});
