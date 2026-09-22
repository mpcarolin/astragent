import type { Mesh } from "three";
import type { THandles } from "../types/handles";

import { Scene } from "three";

import { appearance } from "./appearance";
import { backdrop } from "./backdrop";
import { createStar } from "./createStar";
import { createLights } from "./createLights";
import { createPlanet } from "./createPlanet";
import { solar } from "../data/solar";

export function createScene(): THandles {
  const scene = new Scene();
  scene.background = backdrop();

  const bodies = new Map<string, Mesh>(
    solar.map((body) => {
      const look = appearance[body.id];
      if (!look) throw new Error(`no appearance for body "${body.id}"`);
      const mesh = body.kind === "star" ? createStar(look) : createPlanet(look);
      mesh.name = body.id;
      return [body.id, mesh];
    }),
  );
  bodies.forEach((body) => scene.add(body));

  const { sunlight, ambient } = createLights();
  scene.add(sunlight);
  scene.add(ambient);

  return { scene, bodies };
}
