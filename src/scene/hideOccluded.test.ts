import type { TLocated } from "../types/located";
import type { TVec3 } from "../types/vec3";

import { describe, expect, it } from "vitest";
import { Mesh, Object3D, PerspectiveCamera } from "three";

import { solar } from "../data/solar";
import { hideOccluded } from "./hideOccluded";

const ORIGIN = { x: 0, y: 0, z: 0 };

const locate = (id: string): TLocated => {
  const body = solar.find((candidate) => candidate.id === id);
  if (!body) {
    throw new Error(`no body for ${id}`);
  }
  return { body, position: ORIGIN };
};

const mesh = ({ x, y, z }: TVec3) => {
  const drawn = new Mesh();
  drawn.position.set(x, y, z);
  return drawn;
};

const cameraAt = ({ x, y, z }: TVec3) => {
  const camera = new PerspectiveCamera();
  camera.position.set(x, y, z);
  return camera;
};

const shown = () => new Object3D();

const hidden = () => {
  const name = new Object3D();
  name.visible = false;
  return name;
};

const located = [locate("earth"), locate("mars"), locate("sun")];

describe("hideOccluded", () => {
  it("hides the name of a body whose mesh sits behind the sun", () => {
    const names = new Map([["earth", shown()]]);
    const meshes = new Map([
      ["sun", mesh(ORIGIN)],
      ["earth", mesh({ x: 0, y: 0, z: -50 })],
    ]);

    hideOccluded({ names, meshes, located, camera: cameraAt({ x: 0, y: 0, z: 100 }) });

    expect(names.get("earth")?.visible).toBe(false);
  });

  it("shows the name of a body clear of the sun, even one hidden last frame", () => {
    const names = new Map([["mars", hidden()]]);
    const meshes = new Map([
      ["sun", mesh(ORIGIN)],
      ["mars", mesh({ x: 60, y: 0, z: -50 })],
    ]);

    hideOccluded({ names, meshes, located, camera: cameraAt({ x: 0, y: 0, z: 100 }) });

    expect(names.get("mars")?.visible).toBe(true);
  });

  it("measures against the sun's mesh wherever it is drawn", () => {
    const names = new Map([["earth", shown()]]);
    const meshes = new Map([
      ["sun", mesh({ x: 10, y: 0, z: 0 })],
      ["earth", mesh({ x: 10, y: 0, z: -50 })],
    ]);

    hideOccluded({ names, meshes, located, camera: cameraAt({ x: 10, y: 0, z: 100 }) });

    expect(names.get("earth")?.visible).toBe(false);
  });

  it("leaves a name without a mesh untouched", () => {
    const names = new Map([["pluto", hidden()]]);
    const meshes = new Map([["sun", mesh(ORIGIN)]]);

    hideOccluded({ names, meshes, located, camera: cameraAt({ x: 0, y: 0, z: 100 }) });

    expect(names.get("pluto")?.visible).toBe(false);
  });

  it("changes nothing when no star is located", () => {
    const names = new Map([["earth", shown()]]);
    const meshes = new Map([
      ["sun", mesh(ORIGIN)],
      ["earth", mesh({ x: 0, y: 0, z: -50 })],
    ]);

    hideOccluded({
      names,
      meshes,
      located: [locate("earth")],
      camera: cameraAt({ x: 0, y: 0, z: 100 }),
    });

    expect(names.get("earth")?.visible).toBe(true);
  });
});
