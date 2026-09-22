import type { Mesh, PerspectiveCamera } from "three";

import { Raycaster, Vector2 } from "three";

export function pick(
  event: PointerEvent,
  camera: PerspectiveCamera,
  meshes: ReadonlyMap<string, Mesh>,
): string | null {
  const bounds = (event.target as HTMLElement).getBoundingClientRect();
  const ndc = new Vector2(
    ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
  );

  const raycaster = new Raycaster();
  raycaster.setFromCamera(ndc, camera);

  const hit = raycaster.intersectObjects([...meshes.values()], false)[0];
  return hit ? hit.object.name : null;
}
