import { beforeEach, describe, expect, it } from "vitest";

import { EActionKind } from "../types/action";
import { drainActionQueue, dispatch } from "./queue";

const toggle = { kind: EActionKind.ToggleRate } as const;
const tick = { kind: EActionKind.Tick, elapsedMs: 16 } as const;

describe("queue", () => {
  beforeEach(() => {
    drainActionQueue();
  });

  it("returns nothing when empty", () => {
    expect(drainActionQueue()).toEqual([]);
  });

  it("returns a pushed action", () => {
    dispatch(toggle);
    expect(drainActionQueue()).toEqual([toggle]);
  });

  it("preserves the order actions were pushed in", () => {
    dispatch(tick);
    dispatch(toggle);
    expect(drainActionQueue()).toEqual([tick, toggle]);
  });

  it("empties on drain", () => {
    dispatch(toggle);
    drainActionQueue();
    expect(drainActionQueue()).toEqual([]);
  });

  it("does not hand back a live view of its buffer", () => {
    dispatch(toggle);
    const drained = drainActionQueue();
    dispatch(tick);
    expect(drained).toEqual([toggle]);
  });
});
