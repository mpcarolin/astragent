import type { Mesh } from "three";
import type { TState } from "./types/state";

import { createCamera } from "./scene/createCamera";
import { createControls } from "./scene/createControls";
import { createLights } from "./scene/createLights";
import { createHud } from "./scene/createHud";
import { createPlanet } from "./scene/createPlanet";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { createStar } from "./scene/createStar";
import { update } from "./scene/update";
import { appearance } from "./scene/appearance";
import { solar } from "./data/solar";
import { simulate } from "./simulator/simulate";
import { initial } from "./state/initial";
import { nextState } from "./state/nextState";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("no #scene canvas");

const renderer = createRenderer(canvas);
const scene = createScene();
const camera = createCamera();

const meshes = new Map<string, Mesh>(
  solar.map((body) => {
    const look = appearance[body.id];
    if (!look) throw new Error(`no appearance for body "${body.id}"`);
    const mesh = body.kind === "star" ? createStar(look) : createPlanet(look);
    mesh.name = body.id;
    return [body.id, mesh];
  }),
);
meshes.forEach((mesh) => scene.add(mesh));

const { sunlight, ambient } = createLights();
scene.add(sunlight);
scene.add(ambient);

const controls = createControls(camera, canvas);
const updateHud = createHud(camera);

function loop(state: TState, previous: number) {
  return (timestamp: number) => {
    const elapsed = previous === 0 ? 0 : timestamp - previous;

    const next = nextState(state, elapsed);

    update(meshes, simulate(solar, next.date));

    updateHud();
    controls.update();
    renderer.render(scene, camera);

    renderer.setAnimationLoop(loop(next, timestamp));
  };
}

renderer.setAnimationLoop(loop(initial(new Date()), 0));
