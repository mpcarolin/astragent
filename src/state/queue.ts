import type { TAction } from "../types/action";

const pending: TAction[] = [];

export function push(action: TAction): void {
  pending.push(action);
}

export function drain(): readonly TAction[] {
  return pending.splice(0, pending.length);
}
