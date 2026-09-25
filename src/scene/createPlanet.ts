import type { TAppearance, TRingAppearance } from "../types/appearance";

import { radius } from "./radius";
import { ringRadius } from "./ringRadius";
import { loadTexture } from "./loadTexture";
import { AXIAL_TILT } from "../constants/debug";
import { UNTINTED } from "../constants/textures";
import { SEGMENTS_HEIGHT, SEGMENTS_WIDTH } from "../constants/scale";
import { DoubleSide, Mesh, MeshStandardMaterial, RingGeometry, SphereGeometry, Vector3 } from "three";
import { ringUvs } from "./ringUvs";

async function createRing(ring: TRingAppearance): Promise<Mesh> {
  const texture = ring.texture ? await loadTexture(ring.texture) : null;
  const radii = ringRadius(ring);

  const geo = new RingGeometry(radii.inner, radii.outer);
  geo.setAttribute(
    "uv",
    ringUvs(geo.getAttribute("position"), radii)
  );

  const ringMesh = new Mesh(
    geo,
    new MeshStandardMaterial({
      map: texture,
      side: DoubleSide,
      roughness: 0.5,
      metalness: 0,
      transparent: true
    })
  );

  ringMesh.rotateOnAxis(new Vector3(1, 0, 0), -1 * (Math.PI / 2));

  return ringMesh;
}

export async function createPlanet(appearance: TAppearance): Promise<Mesh> {
  const map = await loadTexture(appearance.texture);
  const { color, ring } = appearance;
  const planet = new Mesh(
    new SphereGeometry(radius(appearance.radiusKm), SEGMENTS_WIDTH, SEGMENTS_HEIGHT),
    new MeshStandardMaterial({
      color: map ? UNTINTED : color,
      map,
      roughness: 1,
      metalness: 0,
    }),
  );

  // planet.rotateZ(AXIAL_TILT);

  if (ring) {
    planet.add(await createRing(ring));
  }

  return planet;
}
