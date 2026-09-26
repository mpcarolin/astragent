import type { TFocus } from "../types/focus";
import type { TLocated } from "../types/located";
import type { TState } from "../types/state";
import type { TVec3 } from "../types/vec3";

import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { START_POSITION } from "../constants/camera";
import { ZOOM_FLOOR } from "../constants/controls";
import { DURATION_MS } from "../constants/focus";
import { solar } from "../data/solar";
import { appearance } from "./appearance";
import { destination } from "./destination";
import { extent } from "./extent";
import { focus } from "./focus";
import { toScene } from "./toScene";

const TOLERANCE = 1e-9;
const STARTED = 1000;
const FROM = { x: 0, y: 150, z: 0 };
const FROM_TARGET = { x: 0, y: 0, z: 0 };

const locate = (id: string, position: TVec3): TLocated => {
  const body = solar.find((candidate) => candidate.id === id);
  if (!body) {
    throw new Error(`no body for ${id}`);
  }
  return { body, position };
};

const sun = locate("sun", { x: 0, y: 0, z: 0 });
const earth = locate("earth", { x: 1, y: 0, z: 0 });
const saturn = locate("saturn", { x: 9.5, y: 0, z: 0 });
const located = [sun, earth, saturn];

const flight = (targetId: string | null): TFocus => ({
  targetId,
  startedAt: STARTED,
  from: FROM,
  fromTarget: FROM_TARGET,
});

const stateOf = (targetId: string | null): TState => ({
  date: 2451545,
  rate: 1,
  focus: flight(targetId),
  pointer: null,
});

const rig = (position: TVec3 = FROM, target: TVec3 = FROM_TARGET) => {
  const camera = new PerspectiveCamera();
  camera.position.set(position.x, position.y, position.z);
  const controls = new OrbitControls(camera);
  controls.target.set(target.x, target.y, target.z);
  return { camera, controls };
};

const lookOf = (id: string) => {
  const look = appearance[id];
  if (!look) {
    throw new Error(`no appearance for ${id}`);
  }
  return look;
};

const midway = STARTED + DURATION_MS / 2;
const landing = STARTED + DURATION_MS;

const starting = { now: STARTED, previous: STARTED - 16 };
const flying = { now: midway, previous: midway - 16 };
const stalled = { now: STARTED + 10 * DURATION_MS, previous: midway };
const following = { now: landing + 16, previous: landing };

describe("focus", () => {
  it("starts the flight exactly where the camera and target were", () => {
    const { camera, controls } = rig();

    focus({ state: stateOf("earth"), located, camera, controls, ...starting });

    expect(camera.position.distanceTo(new Vector3(FROM.x, FROM.y, FROM.z))).toBe(0);
    expect(controls.target.distanceTo(new Vector3())).toBe(0);
  });

  it("is halfway along both paths at half the flight's duration", () => {
    const { camera, controls } = rig();
    const end = destination(earth, sun, lookOf("earth"));
    const halfway = new Vector3(FROM.x, FROM.y, FROM.z).add(end).multiplyScalar(0.5);

    focus({ state: stateOf("earth"), located, camera, controls, ...flying });

    expect(camera.position.distanceTo(halfway)).toBeLessThan(TOLERANCE);
    const halfTarget = toScene(earth.position).multiplyScalar(0.5);
    expect(controls.target.distanceTo(halfTarget)).toBeLessThan(TOLERANCE);
  });

  it("eases out of the start, a sixteenth of the way along at a quarter of the time", () => {
    const { camera, controls } = rig();
    const now = STARTED + DURATION_MS / 4;
    const sixteenth = toScene(earth.position).multiplyScalar(1 / 16);

    focus({ state: stateOf("earth"), located, camera, controls, now, previous: now - 16 });

    expect(controls.target.distanceTo(sixteenth)).toBeLessThan(TOLERANCE);
  });

  it("points the camera at the target during the flight", () => {
    const { camera, controls } = rig();

    focus({ state: stateOf("earth"), located, camera, controls, ...flying });

    const facing = camera.getWorldDirection(new Vector3());
    const toTarget = controls.target.clone().sub(camera.position).normalize();
    expect(facing.distanceTo(toTarget)).toBeLessThan(TOLERANCE);
  });

  it("snaps onto the destination when a stalled frame jumps past landing", () => {
    const { camera, controls } = rig();
    const end = destination(earth, sun, lookOf("earth"));

    focus({ state: stateOf("earth"), located, camera, controls, ...stalled });

    expect(camera.position.distanceTo(end)).toBeLessThan(TOLERANCE);
    expect(controls.target.distanceTo(toScene(earth.position))).toBeLessThan(TOLERANCE);
  });

  it("follows the body once focus is complete, keeping the camera's offset from it", () => {
    const { camera, controls } = rig({ x: 3, y: 4, z: 5 }, { x: 1, y: 0, z: 0 });
    const moved = locate("earth", { x: 0.2, y: 0, z: 0 });

    focus({
      state: stateOf("earth"),
      located: [sun, moved],
      camera,
      controls,
      ...following,
    });

    expect(controls.target.distanceTo(new Vector3(2, 0, 0))).toBeLessThan(TOLERANCE);
    expect(camera.position.distanceTo(new Vector3(4, 4, 5))).toBeLessThan(TOLERANCE);
  });

  it("flies to the overview above the sun when no body is focused", () => {
    const { camera, controls } = rig({ x: 5, y: 5, z: 5 }, { x: 10, y: 0, z: 0 });
    const overview = new Vector3(START_POSITION.x, START_POSITION.y, START_POSITION.z);

    focus({ state: stateOf(null), located, camera, controls, ...stalled });

    expect(camera.position.distanceTo(overview)).toBeLessThan(TOLERANCE);
    expect(controls.target.distanceTo(new Vector3())).toBeLessThan(TOLERANCE);
  });

  it("sets the zoom floor outside the target's rings even in flight", () => {
    const { camera, controls } = rig();

    focus({ state: stateOf("saturn"), located, camera, controls, ...flying });

    const floor = extent(saturn.body, lookOf("saturn")) * ZOOM_FLOOR;
    expect(controls.minDistance).toBeCloseTo(floor, 12);
  });

  it("leaves the camera alone when the target is not among the located bodies", () => {
    const { camera, controls } = rig({ x: 3, y: 4, z: 5 }, { x: 1, y: 0, z: 0 });
    const position = camera.position.clone();
    const target = controls.target.clone();
    const floor = controls.minDistance;

    focus({ state: stateOf("vulcan"), located, camera, controls, ...flying });

    expect(camera.position.equals(position)).toBe(true);
    expect(controls.target.equals(target)).toBe(true);
    expect(controls.minDistance).toBe(floor);
  });
});
