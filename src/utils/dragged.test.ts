import { describe, expect, it } from "vitest";

import { DRAG_SLOP } from "../constants/controls";
import { dragged } from "./dragged";

const origin = { x: 100, y: 100 };

describe("dragged", () => {
  it("is not a drag when the pointer has not moved", () => {
    expect(dragged(origin, origin)).toBe(false);
  });

  it("is not a drag one pixel inside the slop", () => {
    expect(dragged(origin, { x: 100 + DRAG_SLOP - 1, y: 100 })).toBe(false);
  });

  it("is not a drag exactly at the slop", () => {
    expect(dragged(origin, { x: 100 + DRAG_SLOP, y: 100 })).toBe(false);
  });

  it("is a drag one pixel past the slop", () => {
    expect(dragged(origin, { x: 100 + DRAG_SLOP + 1, y: 100 })).toBe(true);
  });

  it("measures the hypotenuse, not either axis, on a 3-4-5 diagonal", () => {
    expect(dragged({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(true);
  });

  it("is not a drag on a diagonal whose hypotenuse falls inside the slop", () => {
    expect(dragged({ x: 0, y: 0 }, { x: 2, y: 2 })).toBe(false);
  });

  it("is a drag on a diagonal whose hypotenuse clears the slop", () => {
    expect(dragged({ x: 0, y: 0 }, { x: 4, y: 4 })).toBe(true);
  });

  it("is symmetric in its arguments", () => {
    const a = { x: 10, y: 20 };
    const b = { x: 40, y: 60 };
    expect(dragged(a, b)).toBe(dragged(b, a));
  });

  it("is a drag in the negative direction too", () => {
    expect(dragged(origin, { x: 100 - DRAG_SLOP - 1, y: 100 })).toBe(true);
  });
});
