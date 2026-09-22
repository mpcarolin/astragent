import { describe, expect, it } from "vitest";

import type { TAppearance } from "../types/appearance";

import { MeshStandardMaterial, SphereGeometry, SRGBColorSpace, Texture } from "three";

import { KM_PER_AU } from "../constants/astronomy";
import { RADIUS_SCALE } from "../constants/scale";
import { createPlanet } from "./createPlanet";

const look: TAppearance = { color: 0x4488ff, radiusKm: 6371, texture: "2k_earth_daymap.jpg" };

function material(mesh: ReturnType<typeof createPlanet>): MeshStandardMaterial {
  expect(mesh.material).toBeInstanceOf(MeshStandardMaterial);
  return mesh.material as MeshStandardMaterial;
}

describe("createPlanet", () => {
  it("scales the physical radius into scene units", () => {
    const geometry = createPlanet(look, null).geometry;
    expect(geometry).toBeInstanceOf(SphereGeometry);
    expect((geometry as SphereGeometry).parameters.radius).toBeCloseTo(
      (6371 / KM_PER_AU) * RADIUS_SCALE,
      12,
    );
  });

  it("applies the passed texture as the colour map", () => {
    const texture = new Texture();
    expect(material(createPlanet(look, texture)).map).toBe(texture);
  });

  it("leaves the map empty when no texture is given", () => {
    expect(material(createPlanet(look, null)).map).toBe(null);
  });

  it("falls back to the appearance colour when there is no texture", () => {
    expect(material(createPlanet(look, null)).color.getHex()).toBe(look.color);
  });

  it("does not tint the texture with the appearance colour", () => {
    const texture = new Texture();
    expect(material(createPlanet(look, texture)).color.getHex()).toBe(0xffffff);
  });

  it("stays matte whether or not a texture is present", () => {
    const lit = material(createPlanet(look, new Texture()));
    expect(lit.roughness).toBe(1);
    expect(lit.metalness).toBe(0);
  });

  it("does not change the colour space of the texture it is handed", () => {
    const texture = new Texture();
    texture.colorSpace = SRGBColorSpace;
    expect(material(createPlanet(look, texture)).map?.colorSpace).toBe(SRGBColorSpace);
  });
});
