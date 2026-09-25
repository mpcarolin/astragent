import type { TState } from "../types/state";
import type { PerspectiveCamera } from "three";

import { PRECISION } from "../constants/debug";

function write(hud: HTMLElement, id: string, value: number): void {
  const output = hud.querySelector(`#${id} output`);
  if (output) {
    output.textContent = value.toFixed(PRECISION);
  }
}

export function updateHud(hud: HTMLElement, camera: PerspectiveCamera, state: TState): void {
  const { position, rotation } = camera;
  write(hud, "hud-x", position.x);
  write(hud, "hud-y", position.y);
  write(hud, "hud-z", position.z);

  write(hud, "hud-rx", rotation.x);
  write(hud, "hud-ry", rotation.y);
  write(hud, "hud-rz", rotation.z);

  write(hud, "hud-rate", state.rate);
}
