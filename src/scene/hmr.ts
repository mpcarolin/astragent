import type { PerspectiveCamera } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { TState } from "../types/state";
import type { TVec3 } from "../types/vec3";

type TSnapshot = {
  readonly state: TState;
  readonly position: TVec3;
  readonly target: TVec3;
};

const KEY = "astragent:hmr";

let latest: TState | null = null;

function copy({ x, y, z }: TVec3): TVec3 {
  return { x, y, z };
}

function shift(state: TState, by: number): TState {
  if (!state.focus) {
    return state;
  }
  return { ...state, focus: { ...state.focus, startedAt: state.focus.startedAt + by } };
}

function save(camera: PerspectiveCamera, controls: OrbitControls): void {
  if (!latest) {
    return;
  }
  const snapshot: TSnapshot = {
    state: { ...shift(latest, -performance.now()), pointer: null },
    position: copy(camera.position),
    target: copy(controls.target),
  };
  sessionStorage.setItem(KEY, JSON.stringify(snapshot));
}

function restore(state: TState, camera: PerspectiveCamera, controls: OrbitControls): TState {
  const raw = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  if (!raw) {
    return state;
  }
  const saved: TSnapshot = JSON.parse(raw);
  camera.position.set(saved.position.x, saved.position.y, saved.position.z);
  controls.target.set(saved.target.x, saved.target.y, saved.target.z);
  return shift({ ...state, ...saved.state }, performance.now());
}

export function hmr(
  state: TState,
  camera: PerspectiveCamera,
  controls: OrbitControls,
): TState {
  const hot = import.meta.hot;
  // hot = undefined in vite builds, so this only runs on dev
  if (!hot) {
    return state;
  }
  if (!latest) {
    hot.on("vite:beforeFullReload", () => save(camera, controls));
    latest = restore(state, camera, controls);
    return latest;
  }
  latest = state;
  return state;
}
