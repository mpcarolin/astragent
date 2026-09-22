import type { TState } from "./types/state";

import { createCamera } from "./scene/createCamera";
import { createControls } from "./scene/createControls";
import { createHud } from "./scene/createHud";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { update } from "./scene/update";
import { solar } from "./data/solar";
import { simulate } from "./simulator/simulate";
import { initial } from "./state/initial";
import { nextState } from "./state/nextState";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("no #scene canvas");

const camera = createCamera();
const updateHud = createHud(camera);
const { scene, bodies } = createScene();
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

renderer.setAnimationLoop(loop(initial(new Date()), 0));
