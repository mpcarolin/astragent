import * as THREE from "three";
import { AMBIENT_COLOR, AMBIENT_INTENSITY, COLOR, INTENSITY } from "../constants/light";

export const createLights = () => {
  const sunlight = new THREE.PointLight(COLOR, INTENSITY);
  sunlight.position.set(0, 0, 0);
  const ambient = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);

  return { sunlight, ambient }
}

