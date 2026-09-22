import type { TAppearance } from "../types/appearance";

export const appearance: Record<string, TAppearance> = {
  sun: { color: 0xffcc33, radiusKm: 695_700, texture: "2k_sun.jpg" },
  mercury: { color: 0x8c7853, radiusKm: 2439.7, texture: "2k_mercury.jpg" },
  venus: { color: 0xffc649, radiusKm: 6051.8, texture: "2k_venus_surface.jpg" },
  earth: { color: 0x4488ff, radiusKm: 6371.0, texture: "2k_earth_daymap.jpg" },
  mars: { color: 0xc1440e, radiusKm: 3389.5, texture: "2k_mars.jpg" },
  jupiter: { color: 0xd8ca9d, radiusKm: 69_911, texture: "2k_jupiter.jpg" },
  saturn: { color: 0xead6b8, radiusKm: 58_232, texture: "2k_saturn.jpg" },
  uranus: { color: 0x4fd0e7, radiusKm: 25_362, texture: "2k_uranus.jpg" },
  neptune: { color: 0x4166f5, radiusKm: 24_622, texture: "2k_neptune.jpg" },
};
