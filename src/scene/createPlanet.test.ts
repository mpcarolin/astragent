import { describe, expect, it, vi } from "vitest";

import type { Mesh } from "three";
import type { TAppearance } from "../types/appearance";

import { MeshStandardMaterial, SphereGeometry, Vector3 } from "three";

import { KM_PER_AU } from "../constants/astronomy";
import { AXIAL_TILT } from "../constants/debug";
import { RADIUS_SCALE } from "../constants/scale";
import { createPlanet } from "./createPlanet";

vi.mock("./loadTexture", async () => {
  const { Texture } = await import("three");
  return {
    loadTexture: async (file: string) =>
      file === "missing.jpg" ? null : Object.assign(new Texture(), { name: file }),
  };
});

const look: TAppearance = { color: 0x4488ff, radiusKm: 6371, texture: "2k_earth_daymap.jpg" };
const missing: TAppearance = { ...look, texture: "missing.jpg" };

function material(mesh: Mesh): MeshStandardMaterial {
  expect(mesh.material).toBeInstanceOf(MeshStandardMaterial);
  return mesh.material as MeshStandardMaterial;
}

describe("createPlanet", () => {
  it("scales the physical radius into scene units", async () => {
    const geometry = (await createPlanet(look)).geometry;
    expect(geometry).toBeInstanceOf(SphereGeometry);
    expect((geometry as SphereGeometry).parameters.radius).toBeCloseTo(
      (6371 / KM_PER_AU) * RADIUS_SCALE,
      12,
    );
  });

  it("applies the appearance's texture as the colour map", async () => {
    expect(material(await createPlanet(look)).map?.name).toBe(look.texture);
  });

  it("leaves the map empty when the texture fails to load", async () => {
    expect(material(await createPlanet(missing)).map).toBe(null);
  });

  it("falls back to the appearance colour when the texture fails to load", async () => {
    expect(material(await createPlanet(missing)).color.getHex()).toBe(missing.color);
  });

  it("does not tint the texture with the appearance colour", async () => {
    expect(material(await createPlanet(look)).color.getHex()).toBe(0xffffff);
  });

  it("stays matte whether or not a texture is present", async () => {
    const lit = material(await createPlanet(look));
    expect(lit.roughness).toBe(1);
    expect(lit.metalness).toBe(0);
  });

  it("leans its pole away from ecliptic north by the axial tilt", async () => {
    const up = new Vector3(0, 1, 0);
    const pole = up.clone().applyQuaternion((await createPlanet(look)).quaternion);
    expect(pole.angleTo(up)).toBeCloseTo(AXIAL_TILT, 12);
  });
});
