import * as THREE from "three";
import { STAR_COLOR } from "../constants/scale";

export const createStar = (color: string | number = STAR_COLOR) => {
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(8, 32, 16),
    new THREE.MeshBasicMaterial({ color }),
  );

  return star
}
