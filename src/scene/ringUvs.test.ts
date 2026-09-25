import { describe, expect, it } from "vitest";

import { Float32BufferAttribute } from "three";

import { ringUvs } from "./ringUvs";

const edges = { inner: 1, outer: 2 };
const position = new Float32BufferAttribute([1, 0, 0, 0.9, 1.2, 0, -2, 0, 0], 3);

describe("ringUvs", () => {
  it("gives every vertex one two-component uv", () => {
    const uv = ringUvs(position, edges);
    expect(uv.count).toBe(position.count);
    expect(uv.itemSize).toBe(2);
  });

  it("runs u from 0 on the inner edge to 1 on the outer edge", () => {
    const uv = ringUvs(position, edges);
    expect(uv.getX(0)).toBeCloseTo(0, 6);
    expect(uv.getX(1)).toBeCloseTo(0.5, 6);
    expect(uv.getX(2)).toBeCloseTo(1, 6);
  });
});
