import { describe, expect, it } from "vitest";

import { KM_PER_AU } from "../constants/astronomy";
import { RADIUS_SCALE } from "../constants/scale";
import { appearance } from "./appearance";
import { radius } from "./radius";
import { ringRadius } from "./ringRadius";

describe("ringRadius", () => {
  it("scales both edges into scene units", () => {
    const edges = ringRadius({ color: 0, innerRadiusKm: KM_PER_AU, outerRadiusKm: 2 * KM_PER_AU });
    expect(edges.inner).toBeCloseTo(RADIUS_SCALE, 10);
    expect(edges.outer).toBeCloseTo(2 * RADIUS_SCALE, 10);
  });

  it("puts saturn's ring outside saturn", () => {
    const saturn = appearance["saturn"];
    if (!saturn?.ring) {
      throw new Error("no saturn ring appearance");
    }
    expect(ringRadius(saturn.ring).inner).toBeGreaterThan(radius(saturn.radiusKm));
  });
});
