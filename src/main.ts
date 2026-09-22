import type { TState } from "./types/state";

import { createCamera } from "./scene/createCamera";
import { createControls } from "./scene/createControls";
import { createHud } from "./scene/createHud";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { loadTextures } from "./scene/loadTextures";
import { update } from "./scene/update";
import { orbits } from "./data/orbits";
import { solar } from "./data/solar";
import { simulate } from "./simulator/simulate";
import { initial } from "./state/initial";
import { nextState } from "./state/nextState";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("no #scene canvas");

const start = initial(new Date());

const textures = await loadTextures(solar.map((body) => body.id)).catch(
  () => new Map<string, never>(),
);

const camera = createCamera();
const updateHud = createHud(camera);
const { scene, bodies } = createScene(solar, orbits(solar, start.date), textures);
const renderer = createRenderer(canvas);
const controls = createControls(camera, canvas);

function loop(state: TState, previous: number) {
  return (timestamp: number) => {
    const elapsed = previous === 0 ? 0 : timestamp - previous;

    const next = nextState(state, elapsed);

    update(bodies, simulate(solar, next.date));

    updateHud();
    controls.update();
    renderer.render(scene, camera);

    renderer.setAnimationLoop(loop(next, timestamp));
  };
}

renderer.setAnimationLoop(loop(start, 0));
