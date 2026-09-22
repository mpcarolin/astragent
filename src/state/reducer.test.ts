import type { TFocus } from "../types/focus";
import type { TState } from "../types/state";
import type { TVec2 } from "../types/vec2";

import { describe, expect, it } from "vitest";

import { EActionKind } from "../types/action";
import { reducer } from "./reducer";

const tick = (elapsedMs: number) => ({ kind: EActionKind.Tick, elapsedMs }) as const;
const release = { kind: EActionKind.Release } as const;

const focusAction = {
  kind: EActionKind.Focus,
  targetId: "earth",
  startedAt: 500,
  from: { x: 0, y: 150, z: 0 },
  fromTarget: { x: 0, y: 0, z: 0 },
} as const;

const focus: TFocus = {
  targetId: "earth",
  startedAt: 500,
  from: { x: 0, y: 150, z: 0 },
  fromTarget: { x: 0, y: 0, z: 0 },
};

const state = (
  date: number,
  rate: number,
  at: TFocus | null = null,
  pointer: TVec2 | null = null,
): TState => ({
  date,
  rate,
  focus: at,
  pointer,
});

const down = (x: number, y: number) =>
  ({ kind: EActionKind.PointerDown, x, y }) as const;

const move = (x: number, y: number) =>
  ({ kind: EActionKind.PointerMove, x, y }) as const;

const up = (x: number, y: number, at: TFocus | null = focus) =>
  ({ kind: EActionKind.PointerUp, x, y, focus: at }) as const;

describe("reducer", () => {
  describe("tick", () => {
    it("advances one day per second at a rate of one", () => {
      expect(reducer(state(2451545, 1), tick(1000)).date).toBeCloseTo(2451546, 10);
    });

    it("advances five days per second at a rate of five", () => {
      expect(reducer(state(2451545, 5), tick(1000)).date).toBeCloseTo(2451550, 10);
    });

    it("holds the date still when no time elapsed", () => {
      expect(reducer(state(2461301.5, 5), tick(0)).date).toBe(2461301.5);
    });

    it("runs backwards at a negative rate", () => {
      expect(reducer(state(2451545, -2), tick(500)).date).toBeCloseTo(2451544, 10);
    });

    it("carries the rate through unchanged", () => {
      expect(reducer(state(2451545, 5), tick(16)).rate).toBe(5);
    });

    it("is additive across split frames", () => {
      const once = reducer(state(2451545, 5), tick(1000));
      const twice = reducer(reducer(state(2451545, 5), tick(500)), tick(500));
      expect(twice.date).toBeCloseTo(once.date, 10);
    });

    it("carries a null focus through", () => {
      expect(reducer(state(2451545, 5), tick(16)).focus).toBeNull();
    });

    it("does not disturb a focus in flight", () => {
      expect(reducer(state(2451545, 5, focus), tick(16)).focus).toEqual(focus);
    });
  });

  describe("focus", () => {
    it("takes the focus from the action", () => {
      expect(reducer(state(2451545, 5), focusAction).focus).toEqual(focus);
    });

    it("leaves the date untouched", () => {
      expect(reducer(state(2451545, 5), focusAction).date).toBe(2451545);
    });

    it("leaves the rate untouched", () => {
      expect(reducer(state(2451545, 5), focusAction).rate).toBe(5);
    });

    it("replaces a focus already in flight", () => {
      const second = { ...focusAction, targetId: "mars", startedAt: 900 } as const;
      expect(reducer(state(2451545, 5, focus), second).focus?.targetId).toBe("mars");
      expect(reducer(state(2451545, 5, focus), second).focus?.startedAt).toBe(900);
    });
  });

  describe("release", () => {
    it("clears a focus in flight", () => {
      expect(reducer(state(2451545, 5, focus), release).focus).toBeNull();
    });

    it("leaves the date untouched", () => {
      expect(reducer(state(2451545, 5, focus), release).date).toBe(2451545);
    });

    it("is harmless when nothing is focused", () => {
      expect(reducer(state(2451545, 5), release).focus).toBeNull();
    });
  });

  describe("pointer down", () => {
    it("records where the pointer went down", () => {
      expect(reducer(state(2451545, 5), down(40, 60)).pointer).toEqual({ x: 40, y: 60 });
    });

    it("leaves the date untouched", () => {
      expect(reducer(state(2451545, 5), down(40, 60)).date).toBe(2451545);
    });

    it("does not disturb a focus in flight", () => {
      expect(reducer(state(2451545, 5, focus), down(40, 60)).focus).toEqual(focus);
    });

    it("replaces an earlier pointer position", () => {
      const state1 = reducer(state(2451545, 5), down(40, 60));
      expect(reducer(state1, down(10, 10)).pointer).toEqual({ x: 10, y: 10 });
    });
  });

  describe("pointer move", () => {
    it("is inert when the pointer is up", () => {
      expect(reducer(state(2451545, 5), move(400, 400))).toEqual(state(2451545, 5));
    });

    it("holds the pointer within the slop", () => {
      const held = state(2451545, 5, null, { x: 40, y: 60 });
      expect(reducer(held, move(41, 60)).pointer).toEqual({ x: 40, y: 60 });
    });

    it("clears the pointer past the slop", () => {
      const held = state(2451545, 5, null, { x: 40, y: 60 });
      expect(reducer(held, move(400, 60)).pointer).toBeNull();
    });

    it("releases a focus in flight when dragged past the slop", () => {
      const held = state(2451545, 5, focus, { x: 40, y: 60 });
      expect(reducer(held, move(400, 60)).focus).toBeNull();
    });

    it("does not release a focus in flight within the slop", () => {
      const held = state(2451545, 5, focus, { x: 40, y: 60 });
      expect(reducer(held, move(41, 60)).focus).toEqual(focus);
    });

    it("leaves the date untouched", () => {
      const held = state(2451545, 5, null, { x: 40, y: 60 });
      expect(reducer(held, move(400, 60)).date).toBe(2451545);
    });
  });

  describe("pointer up", () => {
    it("takes the focus from a click that did not travel", () => {
      const held = state(2451545, 5, null, { x: 40, y: 60 });
      expect(reducer(held, up(40, 60)).focus).toEqual(focus);
    });

    it("clears the pointer", () => {
      const held = state(2451545, 5, null, { x: 40, y: 60 });
      expect(reducer(held, up(40, 60)).pointer).toBeNull();
    });

    it("ignores the payload when the pointer travelled past the slop", () => {
      const held = state(2451545, 5, null, { x: 40, y: 60 });
      expect(reducer(held, up(400, 60)).focus).toBeNull();
    });

    it("is inert with no preceding pointer down", () => {
      expect(reducer(state(2451545, 5), up(40, 60)).focus).toBeNull();
    });

    it("leaves a focus in flight alone with no preceding pointer down", () => {
      expect(reducer(state(2451545, 5, focus), up(40, 60, null)).focus).toEqual(focus);
    });

    it("keeps a focus in flight when the click hit nothing", () => {
      const held = state(2451545, 5, focus, { x: 40, y: 60 });
      expect(reducer(held, up(40, 60, null)).focus).toEqual(focus);
    });

    it("leaves the date untouched", () => {
      const held = state(2451545, 5, null, { x: 40, y: 60 });
      expect(reducer(held, up(40, 60)).date).toBe(2451545);
    });
  });

  describe("pointer sequences", () => {
    it("focuses on down, a move inside the slop, then up", () => {
      const actions = [down(40, 60), move(42, 60), up(42, 60)];
      const end = actions.reduce(reducer, state(2451545, 5));
      expect(end.focus).toEqual(focus);
      expect(end.pointer).toBeNull();
    });

    it("does not focus on down, a move past the slop, then up", () => {
      const actions = [down(40, 60), move(400, 60), up(400, 60)];
      const end = actions.reduce(reducer, state(2451545, 5));
      expect(end.focus).toBeNull();
      expect(end.pointer).toBeNull();
    });

    it("does not focus when a drag wanders back to its origin", () => {
      const actions = [down(40, 60), move(400, 60), up(40, 60)];
      const end = actions.reduce(reducer, state(2451545, 5));
      expect(end.focus).toBeNull();
    });

    it("releases a flight when the drag starts during it", () => {
      const actions = [down(40, 60), move(400, 60)];
      const end = actions.reduce(reducer, state(2451545, 5, focus));
      expect(end.focus).toBeNull();
    });
  });

  it("folds a run of actions in order", () => {
    const actions = [tick(1000), focusAction, tick(1000), release];
    const end = actions.reduce(reducer, state(2451545, 1));
    expect(end.date).toBeCloseTo(2451547, 10);
    expect(end.focus).toBeNull();
  });
});
