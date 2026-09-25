import type { Texture } from "three";

import { SRGBColorSpace, TextureLoader } from "three";

import { TEXTURE_ANISOTROPY, TEXTURE_PATH } from "../constants/textures";

export async function loadTexture(file: string): Promise<Texture | null> {
  try {
    const texture = await new TextureLoader().setPath(TEXTURE_PATH).loadAsync(file);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = TEXTURE_ANISOTROPY;
    return texture;
  } catch {
    return null;
  }
}
