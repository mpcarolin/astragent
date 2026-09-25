import type { Mesh } from "three";
import type { TBody } from "../types/body";
import type { THandles } from "../types/handles";
import type { TVec3 } from "../types/vec3";

import { EBodyKind } from "../types/body";

import { Scene } from "three";
import { appearance } from "./appearance";
import { backdrop } from "./backdrop";
import { createAmbient } from "./createAmbient";
import { createOrbitLines } from "./createOrbitLines";
import { createPlanet } from "./createPlanet";
import { createStar } from "./createStar";

export async function createScene(
  solar: readonly TBody[],
  orbits: ReadonlyMap<string, readonly TVec3[]>,
): Promise<THandles> {
  const scene = new Scene();
  scene.background = backdrop();

  const bodies = new Map<string, Mesh>(
    await Promise.all(
      solar.map(async (body): Promise<readonly [string, Mesh]> => {
        const look = appearance[body.id];
        if (!look) throw new Error(`no appearance for body "${body.id}"`);
        const mesh =
          body.kind === EBodyKind.Star ? await createStar(look) : await createPlanet(look);
        mesh.name = body.id;
        return [body.id, mesh];
      }),
    ),
  );
  bodies.forEach((body) => scene.add(body));

  orbits.forEach((points, id) => {
    const line = createOrbitLines(points);
    line.name = `${id}-orbit`;
    scene.add(line);
  });

  scene.add(createAmbient());

  return { scene, bodies };
}
