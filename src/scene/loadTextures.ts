import type { Texture } from "three";

import { SRGBColorSpace, TextureLoader } from "three";

import { TEXTURE_ANISOTROPY, TEXTURE_PATH } from "../constants/textures";
import { appearance } from "./appearance";

export async function loadTextures(
  ids: readonly string[],
): Promise<ReadonlyMap<string, Texture>> {
  const loader = new TextureLoader().setPath(TEXTURE_PATH);

  const loaded = await Promise.all(
    ids.map(async (id): Promise<readonly [string, Texture]> => {
      const look = appearance[id];
      if (!look) throw new Error(`no appearance for body "${id}"`);

      const texture = await loader.loadAsync(look.texture);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = TEXTURE_ANISOTROPY;

      return [id, texture];
    }),
  );

  return new Map(loaded);
}
