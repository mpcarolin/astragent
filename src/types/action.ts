import type { TFocus } from "./focus";

export enum EActionKind {
  Tick = "tick",
  Focus = "focus",
  FocusRelease = "release",
  PointerDown = "pointerDown",
  PointerMove = "pointerMove",
  PointerUp = "pointerUp",
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

export type TAction =
  | TTickAction
  | TFocusAction
  | TReleaseAction
  | TPointerDownAction
  | TPointerMoveAction
  | TPointerUpAction;
