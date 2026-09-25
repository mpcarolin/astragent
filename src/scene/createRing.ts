import type { TRingAppearance } from "../types/appearance";

import { DoubleSide, Mesh, MeshStandardMaterial, RingGeometry, Vector3 } from "three";
import { loadTexture } from "./loadTexture";
import { ringRadius } from "./ringRadius";
import { ringUvs } from "./ringUvs";

export async function createRing(ring: TRingAppearance): Promise<Mesh> {
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
