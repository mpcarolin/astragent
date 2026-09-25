import type { TFocus } from "./focus";

export enum EActionKind {
  Tick = "tick",
  Rate = "rate",
  Focus = "focus",
  FocusRelease = "release",
  PointerDown = "pointerDown",
  PointerMove = "pointerMove",
  PointerUp = "pointerUp",
  ToggleRate = "toggle-rate",
}

export type TTickAction = {
  readonly kind: EActionKind.Tick;
  readonly elapsedMs: number;
};

export type TFocusAction = TFocus & {
  readonly kind: EActionKind.Focus;
};

export type TReleaseAction = {
  readonly kind: EActionKind.FocusRelease;
};

export type TPointerDownAction = {
  readonly kind: EActionKind.PointerDown;
  readonly x: number;
  readonly y: number;
};

export type TPointerMoveAction = {
  readonly kind: EActionKind.PointerMove;
  readonly x: number;
  readonly y: number;
};

export type TPointerUpAction = {
  readonly kind: EActionKind.PointerUp;
  readonly x: number;
  readonly y: number;
  readonly focus: TFocus | null;
};

export type TRateAction = {
  readonly kind: EActionKind.Rate;
  /**
   * Non-negative number. 0 = stop time, 1 = normal speed, 2 = double speed, etc */
  readonly rate: number;
}

export type TToggleRateAction = {
  readonly kind: EActionKind.ToggleRate;
}

export type TAction =
  | TTickAction
  | TRateAction
  | TToggleRateAction
  | TFocusAction
  | TReleaseAction
  | TPointerDownAction
  | TPointerMoveAction
  | TPointerUpAction;
