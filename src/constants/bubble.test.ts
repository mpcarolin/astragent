import { describe, expect, it } from "vitest";

import { BUBBLE_GAP } from "./bubble";
import { ZOOM_FLOOR } from "./controls";

describe("BUBBLE_GAP", () => {
  it("clears the body's limb at the zoom floor", () => {
    expect(BUBBLE_GAP).toBeGreaterThanOrEqual(ZOOM_FLOOR / Math.sqrt(ZOOM_FLOOR ** 2 - 1));
  });
});
