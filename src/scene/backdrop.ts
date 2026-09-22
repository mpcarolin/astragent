import {
  Color,
  DataTexture,
  EquirectangularReflectionMapping,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from "three";

import {
  BACKDROP_ECLIPTIC_COLOR,
  BACKDROP_FALLOFF,
  BACKDROP_HEIGHT,
  BACKDROP_POLE_COLOR,
  BACKDROP_WIDTH,
} from "../constants/space";

const CHANNELS = 4;
const OPAQUE = 255;

export function backdrop(): DataTexture {
  const pole = new Color(BACKDROP_POLE_COLOR);
  const ecliptic = new Color(BACKDROP_ECLIPTIC_COLOR);
  const blend = new Color();

  const data = new Uint8Array(BACKDROP_WIDTH * BACKDROP_HEIGHT * CHANNELS);

  for (let y = 0; y < BACKDROP_HEIGHT; y += 1) {
    const latitude = (y + 0.5) / BACKDROP_HEIGHT;
    const toPole = Math.pow(Math.abs(1 - 2 * latitude), BACKDROP_FALLOFF);

    blend.copy(ecliptic).lerp(pole, toPole).convertLinearToSRGB();

    const red = Math.round(blend.r * OPAQUE);
    const green = Math.round(blend.g * OPAQUE);
    const blue = Math.round(blend.b * OPAQUE);

    for (let x = 0; x < BACKDROP_WIDTH; x += 1) {
      const offset = (y * BACKDROP_WIDTH + x) * CHANNELS;
      data[offset] = red;
      data[offset + 1] = green;
      data[offset + 2] = blue;
      data[offset + 3] = OPAQUE;
    }
  }

  const texture = new DataTexture(
    data,
    BACKDROP_WIDTH,
    BACKDROP_HEIGHT,
    RGBAFormat,
    UnsignedByteType,
  );

  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;

  return texture;
}
