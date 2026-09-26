import type { TFocus } from "../types/focus";

import { describe, expect, it } from "vitest";

import { DURATION_MS } from "../constants/focus";
import { isFocusComplete } from "./isFocusComplete";

const flight: TFocus = {
  targetId: "earth",
  startedAt: 1000,
  from: { x: 0, y: 150, z: 0 },
  fromTarget: { x: 0, y: 0, z: 0 },
};

describe("isFocusComplete", () => {
  it("is false just under the flight duration", () => {
    expect(isFocusComplete(flight, flight.startedAt + DURATION_MS - 1)).toBe(false);
  });

  it("is true exactly at the flight duration", () => {
    expect(isFocusComplete(flight, flight.startedAt + DURATION_MS)).toBe(true);
  });
});
