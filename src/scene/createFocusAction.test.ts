import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { EActionKind } from "../types/action";
import { createFocusAction } from "./createFocusAction";

const rig = () => {
  const camera = new PerspectiveCamera();
  const controls = new OrbitControls(camera);
  camera.position.set(3, 4, 5);
  controls.target.set(1, 2, 3);
  return { camera, controls };
};

describe("createFocusAction", () => {
  it("is a focus action for the given body", () => {
    const { camera, controls } = rig();
    const action = createFocusAction("mars", camera, controls);
    expect(action.kind).toBe(EActionKind.Focus);
    expect(action.targetId).toBe("mars");
  });

  it("carries a null target for the overview", () => {
    const { camera, controls } = rig();
    expect(createFocusAction(null, camera, controls).targetId).toBeNull();
  });

  it("starts the flight from where the camera and its target are now", () => {
    const { camera, controls } = rig();
    const action = createFocusAction("mars", camera, controls);
    expect(action.from).toEqual({ x: 3, y: 4, z: 5 });
    expect(action.fromTarget).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("keeps its starting point when the camera moves afterwards", () => {
    const { camera, controls } = rig();
    const action = createFocusAction("mars", camera, controls);

    camera.position.set(30, 40, 50);
    controls.target.set(10, 20, 30);

    expect(action.from).toEqual({ x: 3, y: 4, z: 5 });
    expect(action.fromTarget).toEqual({ x: 1, y: 2, z: 3 });
  });

  it("stamps the flight with the page clock at the moment of the call", () => {
    const { camera, controls } = rig();
    const before = performance.now();
    const action = createFocusAction("mars", camera, controls);
    const after = performance.now();
    expect(action.startedAt).toBeGreaterThanOrEqual(before);
    expect(action.startedAt).toBeLessThanOrEqual(after);
  });
});
