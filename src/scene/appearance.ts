import type { TAppearance } from "../types/appearance";

export const appearance: Record<string, TAppearance> = {
  sun: {
    color: 0xffcc33,
    radiusKm: 695_700,
    texture: "2k_sun.jpg",
  },
  mercury: {
    color: 0x8c7853,
    radiusKm: 2439.7,
    texture: "2k_mercury.jpg",
    pole: { x: 0.091378, y: -0.081600, z: 0.992467 },
  },
  venus: {
    color: 0xffc649,
    radiusKm: 6051.8,
    texture: "2k_venus_surface.jpg",
    pole: { x: 0.018691, y: 0.010873, z: 0.999766 },
  },
  earth: {
    color: 0x4488ff,
    radiusKm: 6371.0,
    texture: "2k_earth_daymap.jpg",
    pole: { x: 0, y: 0.397777, z: 0.917482 },
  },
  mars: {
    color: 0xc1440e,
    radiusKm: 3389.5,
    texture: "2k_mars.jpg",
    pole: { x: 0.446155, y: -0.055516, z: 0.893232 },
  },
  jupiter: {
    color: 0xd8ca9d,
    radiusKm: 69_911,
    texture: "2k_jupiter.jpg",
    pole: { x: -0.014597, y: -0.035804, z: 0.999252 },
  },
  saturn: {
    color: 0xead6b8,
    radiusKm: 58_232,
    texture: "2k_saturn.jpg",
    pole: { x: 0.085479, y: 0.462442, z: 0.882520 },
    ring: {
      color: 0xead6b8,
      texture: "2k_saturn_ring_alpha.png",
      innerRadiusKm: 67_000,
      outerRadiusKm: 137_000,
    }
  },
  uranus: {
    color: 0x4fd0e7,
    radiusKm: 25_362,
    texture: "2k_uranus.jpg",
    pole: { x: -0.212000, y: -0.967989, z: 0.134363 },
  },
  neptune: {
    color: 0x4166f5,
    radiusKm: 24_622,
    texture: "2k_neptune.jpg",
    pole: { x: 0.358577, y: -0.314410, z: 0.878959 },
  },
};
