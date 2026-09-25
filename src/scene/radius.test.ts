import { describe, expect, it } from "vitest";

import { KM_PER_AU } from "../constants/astronomy";
import { RADIUS_SCALE } from "../constants/scale";
import { appearance } from "./appearance";
import { radius } from "./radius";

describe("radius", () => {
  it("converts kilometres to scaled scene units", () => {
    expect(radius(KM_PER_AU)).toBeCloseTo(RADIUS_SCALE, 10);
  });

  it("is linear in the body radius", () => {
    expect(radius(2000)).toBeCloseTo(2 * radius(1000), 12);
  });

  it("gives earth a radius under a tenth of a scene unit", () => {
    const earth = appearance["earth"];
    if (!earth) throw new Error("no earth appearance");
    expect(radius(earth.radiusKm)).toBeLessThan(0.1);
    expect(radius(earth.radiusKm)).toBeGreaterThan(0);
  });

  it("orders the planets by true size", () => {
    const of = (id: string) => {
      const look = appearance[id];
      if (!look) throw new Error(`no appearance for ${id}`);
      return radius(look.radiusKm);
    };
    expect(of("jupiter")).toBeGreaterThan(of("neptune"));
    expect(of("neptune")).toBeGreaterThan(of("earth"));
    expect(of("earth")).toBeGreaterThan(of("mercury"));
  });
});
