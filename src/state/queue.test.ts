import { beforeEach, describe, expect, it } from "vitest";

import { EActionKind } from "../types/action";
import { drain, push } from "./queue";

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
    push(release);
    expect(drain()).toEqual([release]);
  });

  it("preserves the order actions were pushed in", () => {
    push(tick);
    push(release);
    expect(drain()).toEqual([tick, release]);
  });

  it("empties on drain", () => {
    push(release);
    drain();
    expect(drain()).toEqual([]);
  });

  it("does not hand back a live view of its buffer", () => {
    push(release);
    const drained = drain();
    push(tick);
    expect(drained).toEqual([release]);
  });
});
