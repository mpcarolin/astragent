import { beforeEach, describe, expect, it } from "vitest";

import { EActionKind } from "../types/action";
import { drain, dispatch } from "./queue";

const release = { kind: EActionKind.Release } as const;
const tick = { kind: EActionKind.Tick, elapsedMs: 16 } as const;

describe("queue", () => {
  beforeEach(() => {
    drain();
  });

  it("returns nothing when empty", () => {
    expect(drain()).toEqual([]);
  });

  it("returns a pushed action", () => {
    dispatch(release);
    expect(drain()).toEqual([release]);
  });

  it("preserves the order actions were pushed in", () => {
    dispatch(tick);
    dispatch(release);
    expect(drain()).toEqual([tick, release]);
  });

  it("empties on drain", () => {
    dispatch(release);
    drain();
    expect(drain()).toEqual([]);
  });

  it("does not hand back a live view of its buffer", () => {
    dispatch(release);
    const drained = drain();
    dispatch(tick);
    expect(drained).toEqual([release]);
  });
});
