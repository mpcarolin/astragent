import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";

import { anchor } from "./anchor";

describe("anchor", () => {
  it("points along +x under the identity rotation", () => {
    const center = new Vector3(0, 0, 0);
    const result = anchor(center, new Quaternion(), 2);
    expect(result.equals(new Vector3(2, 0, 0))).toBe(true);
  });

  it("points along -z after a +90 degree rotation about y", () => {
    const center = new Vector3(0, 0, 0);
    const orientation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    const result = anchor(center, orientation, 3);
    expect(result.x).toBeCloseTo(0, 10);
    expect(result.y).toBeCloseTo(0, 10);
    expect(result.z).toBeCloseTo(-3, 10);
  });

  it("adds the offset to a non-zero center without mutating it", () => {
    const center = new Vector3(5, 1, -2);
    const before = center.clone();
    const result = anchor(center, new Quaternion(), 4);
    expect(result.equals(new Vector3(9, 1, -2))).toBe(true);
    expect(center.equals(before)).toBe(true);
  });
});
