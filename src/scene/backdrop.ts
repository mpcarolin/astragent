import type { Texture } from "three";

import { EquirectangularReflectionMapping } from "three";

import { loadTexture } from "./loadTexture";

export async function backdrop(file: string): Promise<Texture | null> {
  const texture = await loadTexture(file);
  if (texture) {
    texture.mapping = EquirectangularReflectionMapping;
  }
  return texture;
}
