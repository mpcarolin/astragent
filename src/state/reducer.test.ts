import type { TFocus } from "../types/focus";
import type { TState } from "../types/state";
import type { TVec2 } from "../types/vec2";

import { describe, expect, it } from "vitest";

import { START_POSITION } from "../constants/camera";
import { DURATION_MS } from "../constants/focus";
import { EActionKind } from "../types/action";
import { reducer } from "./reducer";

const tick = (elapsedMs: number) => ({ kind: EActionKind.Tick, elapsedMs }) as const;

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

const home: TFocus = {
  targetId: null,
  startedAt: -DURATION_MS,
  from: START_POSITION,
  fromTarget: { x: 0, y: 0, z: 0 },
};

type TStateParams = {
  readonly date: number;
  readonly rate: number;
  readonly focus?: TFocus;
  readonly pointer?: TVec2 | null;
};

const state = (params: TStateParams): TState => {
  const { date, rate, focus: at = home, pointer = null } = params;
  return { date, rate, focus: at, pointer };
};

const down = (x: number, y: number) =>
  ({ kind: EActionKind.PointerDown, x, y }) as const;

const move = (x: number, y: number) =>
  ({ kind: EActionKind.PointerMove, x, y }) as const;

const up = (x: number, y: number, at: TFocus | null = focus) =>
  ({ kind: EActionKind.PointerUp, x, y, focus: at }) as const;

describe("reducer", () => {
  describe("tick", () => {
    it("advances one day per second at a rate of one", () => {
      expect(reducer(state({ date: 2451545, rate: 1 }), tick(1000)).date).toBeCloseTo(2451546, 10);
    });

    it("advances five days per second at a rate of five", () => {
      expect(reducer(state({ date: 2451545, rate: 5 }), tick(1000)).date).toBeCloseTo(2451550, 10);
    });

    it("holds the date still when no time elapsed", () => {
      expect(reducer(state({ date: 2461301.5, rate: 5 }), tick(0)).date).toBe(2461301.5);
    });

    it("runs backwards at a negative rate", () => {
      expect(reducer(state({ date: 2451545, rate: -2 }), tick(500)).date).toBeCloseTo(2451544, 10);
    });

    it("carries the rate through unchanged", () => {
      expect(reducer(state({ date: 2451545, rate: 5 }), tick(16)).rate).toBe(5);
    });

    it("is additive across split frames", () => {
      const once = reducer(state({ date: 2451545, rate: 5 }), tick(1000));
      const twice = reducer(reducer(state({ date: 2451545, rate: 5 }), tick(500)), tick(500));
      expect(twice.date).toBeCloseTo(once.date, 10);
    });

    it("carries the focus through unchanged", () => {
      expect(reducer(state({ date: 2451545, rate: 5 }), tick(16)).focus).toEqual(home);
    });

    it("does not disturb a focus in flight", () => {
      expect(reducer(state({ date: 2451545, rate: 5, focus }), tick(16)).focus).toEqual(focus);
    });
  });

  describe("focus", () => {
    it("takes the focus from the action", () => {
      expect(reducer(state({ date: 2451545, rate: 5 }), focusAction).focus).toEqual(focus);
    });

    it("leaves the date untouched", () => {
      expect(reducer(state({ date: 2451545, rate: 5 }), focusAction).date).toBe(2451545);
    });

    it("keeps the rate", () => {
      expect(reducer(state({ date: 2451545, rate: 5 }), focusAction).rate).toBe(5);
    });

    it("replaces a focus already in flight", () => {
      const second = { ...focusAction, targetId: "mars", startedAt: 900 } as const;
      expect(reducer(state({ date: 2451545, rate: 5, focus }), second).focus.targetId).toBe("mars");
      expect(reducer(state({ date: 2451545, rate: 5, focus }), second).focus.startedAt).toBe(900);
    });
  });

  describe("pointer down", () => {
    it("records where the pointer went down", () => {
      const next = reducer(state({ date: 2451545, rate: 5 }), down(40, 60));
      expect(next.pointer).toEqual({ x: 40, y: 60 });
    });

    it("leaves the date untouched", () => {
      expect(reducer(state({ date: 2451545, rate: 5 }), down(40, 60)).date).toBe(2451545);
    });

    it("does not disturb a focus in flight", () => {
      expect(reducer(state({ date: 2451545, rate: 5, focus }), down(40, 60)).focus).toEqual(focus);
    });

    it("replaces an earlier pointer position", () => {
      const state1 = reducer(state({ date: 2451545, rate: 5 }), down(40, 60));
      expect(reducer(state1, down(10, 10)).pointer).toEqual({ x: 10, y: 10 });
    });
  });

  describe("pointer move", () => {
    it("is inert when the pointer is up", () => {
      const idle = state({ date: 2451545, rate: 5 });
      expect(reducer(idle, move(400, 400))).toEqual(idle);
    });

    it("holds the pointer within the slop", () => {
      const held = state({ date: 2451545, rate: 5, pointer: { x: 40, y: 60 } });
      expect(reducer(held, move(41, 60)).pointer).toEqual({ x: 40, y: 60 });
    });

    it("clears the pointer past the slop", () => {
      const held = state({ date: 2451545, rate: 5, pointer: { x: 40, y: 60 } });
      expect(reducer(held, move(400, 60)).pointer).toBeNull();
    });

    it("keeps a focus in flight when dragged past the slop", () => {
      const held = state({ date: 2451545, rate: 5, focus, pointer: { x: 40, y: 60 } });
      expect(reducer(held, move(400, 60)).focus).toEqual(focus);
    });

    it("keeps a focus in flight within the slop", () => {
      const held = state({ date: 2451545, rate: 5, focus, pointer: { x: 40, y: 60 } });
      expect(reducer(held, move(41, 60)).focus).toEqual(focus);
    });

    it("leaves the date untouched", () => {
      const held = state({ date: 2451545, rate: 5, pointer: { x: 40, y: 60 } });
      expect(reducer(held, move(400, 60)).date).toBe(2451545);
    });
  });

  describe("pointer up", () => {
    it("takes the focus from a click that did not travel", () => {
      const held = state({ date: 2451545, rate: 5, pointer: { x: 40, y: 60 } });
      expect(reducer(held, up(40, 60)).focus).toEqual(focus);
    });

    it("clears the pointer", () => {
      const held = state({ date: 2451545, rate: 5, pointer: { x: 40, y: 60 } });
      expect(reducer(held, up(40, 60)).pointer).toBeNull();
    });

    it("keeps the prior focus when the pointer travelled past the slop", () => {
      const held = state({ date: 2451545, rate: 5, pointer: { x: 40, y: 60 } });
      expect(reducer(held, up(400, 60)).focus).toEqual(home);
    });

    it("keeps the prior focus with no preceding pointer down", () => {
      expect(reducer(state({ date: 2451545, rate: 5 }), up(40, 60)).focus).toEqual(home);
    });

    it("leaves a focus in flight alone with no preceding pointer down", () => {
      const next = reducer(state({ date: 2451545, rate: 5, focus }), up(40, 60, null));
      expect(next.focus).toEqual(focus);
    });

    it("keeps a focus in flight when the click hit nothing", () => {
      const held = state({ date: 2451545, rate: 5, focus, pointer: { x: 40, y: 60 } });
      expect(reducer(held, up(40, 60, null)).focus).toEqual(focus);
    });

    it("leaves the date untouched", () => {
      const held = state({ date: 2451545, rate: 5, pointer: { x: 40, y: 60 } });
      expect(reducer(held, up(40, 60)).date).toBe(2451545);
    });
  });

  describe("pointer sequences", () => {
    it("focuses on down, a move inside the slop, then up", () => {
      const actions = [down(40, 60), move(42, 60), up(42, 60)];
      const end = actions.reduce(reducer, state({ date: 2451545, rate: 5 }));
      expect(end.focus).toEqual(focus);
      expect(end.pointer).toBeNull();
    });

    it("keeps the prior focus on down, a move past the slop, then up", () => {
      const actions = [down(40, 60), move(400, 60), up(400, 60)];
      const end = actions.reduce(reducer, state({ date: 2451545, rate: 5 }));
      expect(end.focus).toEqual(home);
      expect(end.pointer).toBeNull();
    });

    it("keeps the prior focus when a drag wanders back to its origin", () => {
      const actions = [down(40, 60), move(400, 60), up(40, 60)];
      const end = actions.reduce(reducer, state({ date: 2451545, rate: 5 }));
      expect(end.focus).toEqual(home);
    });

    it("keeps a focus in flight when the drag starts during it", () => {
      const actions = [down(40, 60), move(400, 60)];
      const end = actions.reduce(reducer, state({ date: 2451545, rate: 5, focus }));
      expect(end.focus).toEqual(focus);
    });
  });

  it("folds a run of actions in order", () => {
    const actions = [tick(1000), focusAction, tick(1000)];
    const end = actions.reduce(reducer, state({ date: 2451545, rate: 1 }));
    expect(end.date).toBeCloseTo(2451547, 10);
    expect(end.focus).toEqual(focus);
    expect(end.rate).toBe(1);
  });
});
