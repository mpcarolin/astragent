import { beforeEach, describe, expect, it } from "vitest";

import { EActionKind } from "../types/action";
import { drainActionQueue, dispatch } from "./queue";

const release = { kind: EActionKind.FocusRelease } as const;
const tick = { kind: EActionKind.Tick, elapsedMs: 16 } as const;

describe("queue", () => {
  beforeEach(() => {
    drainActionQueue();
  });

  it("returns nothing when empty", () => {
    expect(drainActionQueue()).toEqual([]);
  });

  it("returns a pushed action", () => {
    dispatch(release);
    expect(drainActionQueue()).toEqual([release]);
  });

  it("preserves the order actions were pushed in", () => {
    dispatch(tick);
    dispatch(release);
    expect(drainActionQueue()).toEqual([tick, release]);
  });

  it("empties on drain", () => {
    dispatch(release);
    drainActionQueue();
    expect(drainActionQueue()).toEqual([]);
  });

  it("does not hand back a live view of its buffer", () => {
    dispatch(release);
    const drained = drainActionQueue();
    dispatch(tick);
    expect(drained).toEqual([release]);
  });
});
