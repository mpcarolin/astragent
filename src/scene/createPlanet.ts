import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";

export function createPlanet({ color, size }: { color: string | number; size: number }): Mesh {
  return new Mesh(
    new SphereGeometry(size, 32, 16),
    new MeshStandardMaterial({ color, roughness: 1, metalness: 0 }),
  );
}
