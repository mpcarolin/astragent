import { describe, expect, it } from "vitest";
import { Mesh } from "three";

import type { TBody } from "../types/body";

import { EBodyKind } from "../types/body";

import { toScene } from "./toScene";
import { update } from "./update";

const sun: TBody = { kind: EBodyKind.Star, id: "sun", name: "Sun" };

describe("update", () => {
  it("lands a mesh at toScene of its located position", () => {
    const mesh = new Mesh();
    const position = { x: 1, y: 2, z: 3 };
    update(new Map([["sun", mesh]]), [{ body: sun, position }]);
    expect(mesh.position.equals(toScene(position))).toBe(true);
  });

  it("leaves a mesh with no located body untouched", () => {
    const mesh = new Mesh();
    mesh.position.set(7, 7, 7);
    update(new Map([["sun", mesh]]), []);
    expect(mesh.position.toArray()).toEqual([7, 7, 7]);
  });

  it("ignores a located body with no mesh", () => {
    expect(() => update(new Map(), [{ body: sun, position: { x: 1, y: 1, z: 1 } }])).not.toThrow();
  });
});
