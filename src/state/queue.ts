import type { TAction } from "../types/action";

const queue: TAction[] = [];

/**
 * Queues up an action to be run at the next tick of the game loop
 */
export function dispatch(action: TAction): void {
  queue.push(action);
}

/**
 * Empty queue of all actions, return as array.
 */
export function drain(): TAction[] {
  return queue.splice(0, queue.length);
}
