import { describe, expect, it } from "vitest";

import { add } from "./add";

describe("add", () => {
  it("sums each component", () => {
    expect(add({ x: 1, y: 2, z: 3 }, { x: 10, y: 20, z: 30 })).toEqual({ x: 11, y: 22, z: 33 });
  });

  it("leaves a vector unchanged when adding the origin", () => {
    expect(add({ x: -4, y: 0.5, z: 7 }, { x: 0, y: 0, z: 0 })).toEqual({ x: -4, y: 0.5, z: 7 });
  });

  it("cancels a vector with its negation", () => {
    expect(add({ x: 3, y: -2, z: 1 }, { x: -3, y: 2, z: -1 })).toEqual({ x: 0, y: 0, z: 0 });
  });
});
