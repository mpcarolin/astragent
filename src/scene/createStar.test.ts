import { describe, expect, it } from "vitest";

import type { TAppearance } from "../types/appearance";

import { MeshBasicMaterial, PointLight, SphereGeometry, Texture } from "three";

import { STAR_RADIUS } from "../constants/scale";
import { createStar } from "./createStar";

const look: TAppearance = { color: 0xffcc33, radiusKm: 695_700, texture: "2k_sun.jpg" };

function material(mesh: ReturnType<typeof createStar>): MeshBasicMaterial {
  expect(mesh.material).toBeInstanceOf(MeshBasicMaterial);
  return mesh.material as MeshBasicMaterial;
}

describe("createStar", () => {
  it("renders at the constant star radius rather than the physical one", () => {
    const geometry = createStar(look, null).geometry;
    expect(geometry).toBeInstanceOf(SphereGeometry);
    expect((geometry as SphereGeometry).parameters.radius).toBe(STAR_RADIUS);
  });

  it("carries its own point light", () => {
    const children = createStar(look, null).children;
    expect(children.filter((child) => child instanceof PointLight)).toHaveLength(1);
  });

  it("applies the passed texture as the colour map", () => {
    const texture = new Texture();
    expect(material(createStar(look, texture)).map).toBe(texture);
  });

  it("leaves the map empty when no texture is given", () => {
    expect(material(createStar(look, null)).map).toBe(null);
  });

  it("does not tint the texture with the appearance colour", () => {
    const texture = new Texture();
    expect(material(createStar(look, texture)).color.getHex()).toBe(0xffffff);
  });

  it("falls back to the appearance colour when there is no texture", () => {
    expect(material(createStar(look, null)).color.getHex()).toBe(look.color);
  });
});
