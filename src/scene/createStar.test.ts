import { describe, expect, it, vi } from "vitest";

import type { Mesh } from "three";
import type { TAppearance } from "../types/appearance";

import { MeshBasicMaterial, PointLight, SphereGeometry } from "three";

import { STAR_RADIUS } from "../constants/scale";
import { createStar } from "./createStar";

vi.mock("./loadTexture", async () => {
  const { Texture } = await import("three");
  return {
    loadTexture: async (file: string) =>
      file === "missing.jpg" ? null : Object.assign(new Texture(), { name: file }),
  };
});

const look: TAppearance = { color: 0xffcc33, radiusKm: 695_700, texture: "2k_sun.jpg" };
const missing: TAppearance = { ...look, texture: "missing.jpg" };

function material(mesh: Mesh): MeshBasicMaterial {
  expect(mesh.material).toBeInstanceOf(MeshBasicMaterial);
  return mesh.material as MeshBasicMaterial;
}

describe("createStar", () => {
  it("renders at the constant star radius rather than the physical one", async () => {
    const geometry = (await createStar(look)).geometry;
    expect(geometry).toBeInstanceOf(SphereGeometry);
    expect((geometry as SphereGeometry).parameters.radius).toBe(STAR_RADIUS);
  });

  it("carries its own point light", async () => {
    const children = (await createStar(look)).children;
    expect(children.filter((child) => child instanceof PointLight)).toHaveLength(1);
  });

  it("applies the appearance's texture as the colour map", async () => {
    expect(material(await createStar(look)).map?.name).toBe(look.texture);
  });

  it("leaves the map empty when the texture fails to load", async () => {
    expect(material(await createStar(missing)).map).toBe(null);
  });

  it("does not tint the texture with the appearance colour", async () => {
    expect(material(await createStar(look)).color.getHex()).toBe(0xffffff);
  });

  it("falls back to the appearance colour when the texture fails to load", async () => {
    expect(material(await createStar(missing)).color.getHex()).toBe(missing.color);
  });
});
