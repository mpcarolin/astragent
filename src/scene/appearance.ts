import type { TAppearance } from "../types/appearance";

export const appearance: Record<string, TAppearance> = {
  sun: { color: 0xffcc33, radiusKm: 695_700 },
  mercury: { color: 0x8c7853, radiusKm: 2439.7 },
  venus: { color: 0xffc649, radiusKm: 6051.8 },
  earth: { color: 0x4488ff, radiusKm: 6371.0 },
  mars: { color: 0xc1440e, radiusKm: 3389.5 },
  jupiter: { color: 0xd8ca9d, radiusKm: 69_911 },
  saturn: { color: 0xead6b8, radiusKm: 58_232 },
  uranus: { color: 0x4fd0e7, radiusKm: 25_362 },
  neptune: { color: 0x4166f5, radiusKm: 24_622 },
};
