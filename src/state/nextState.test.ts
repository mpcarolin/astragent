import { describe, expect, it } from "vitest";

import { nextState } from "./nextState";

describe("nextState", () => {
  it("advances one day per second at a rate of one", () => {
    const next = nextState({ date: 2451545, rate: 1 }, 1000);
    expect(next.date).toBeCloseTo(2451546, 10);
  });

  it("advances five days per second at a rate of five", () => {
    const next = nextState({ date: 2451545, rate: 5 }, 1000);
    expect(next.date).toBeCloseTo(2451550, 10);
  });

  it("holds the date still when no time elapsed", () => {
    const next = nextState({ date: 2461301.5, rate: 5 }, 0);
    expect(next.date).toBe(2461301.5);
  });

  it("runs backwards at a negative rate", () => {
    const next = nextState({ date: 2451545, rate: -2 }, 500);
    expect(next.date).toBeCloseTo(2451544, 10);
  });

  it("carries the rate through unchanged", () => {
    expect(nextState({ date: 2451545, rate: 5 }, 16).rate).toBe(5);
  });

  it("is additive across split frames", () => {
    const once = nextState({ date: 2451545, rate: 5 }, 1000);
    const twice = nextState(nextState({ date: 2451545, rate: 5 }, 500), 500);
    expect(twice.date).toBeCloseTo(once.date, 10);
  });
});
