import { createCamera } from "./scene/createCamera";
import { createControls } from "./scene/createControls";
import { createLights } from "./scene/createLights";
import { createHud } from "./scene/createHud";
import { createPlanet } from "./scene/createPlanet";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { orbitPosition } from "./simulator/orbitPosition";
import { createStar } from "./scene/createStar";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("no #scene canvas");

const renderer = createRenderer(canvas);
const scene = createScene();
const camera = createCamera();

const planetSpecs = [
  { name: 'mercury', color: 0x8c7853, size: 0.4, radius: 10, incline: 3, speed: 1.6 },
  { name: 'venus', color: 0xffc649, size: 0.9, radius: 20, incline: -2, speed: 1.2 },
  { name: 'earth', color: 0x4488ff, size: 1, radius: 30, incline: 0, speed: 1 },
  { name: 'mars', color: 0xc1440e, size: 0.75, radius: 40, incline: 2, speed: 0.8 },
  { name: 'jupiter', color: 0xd8ca9d, size: 3, radius: 50, incline: -4, speed: 0.45 },
  { name: 'saturn', color: 0xead6b8, size: 2.5, radius: 60, incline: 5, speed: 0.33 },
  { name: 'uranus', color: 0x4fd0e7, size: 1.8, radius: 70, incline: -6, speed: 0.24 },
  { name: 'neptune', color: 0x4166f5, size: 1.7, radius: 80, incline: 4, speed: 0.18 },
];

const planets = planetSpecs.map(planetSpec => {
  const planet = createPlanet(planetSpec);
  scene.add(planet);
  return { planet, spec: planetSpec };
});

const sun = createStar()
scene.add(sun);

const { sunlight, ambient } = createLights()
scene.add(sunlight);
scene.add(ambient);

const controls = createControls(camera, canvas);
const updateHud = createHud(camera);

renderer.setAnimationLoop((time) => {
  planets.forEach(({ planet, spec }) => {
    const { x, y, z } = orbitPosition(time, spec);
    planet.position.set(x, y, z);
    planet.rotation.y = time / 2000;
  });
  controls.update();
  updateHud();
  renderer.render(scene, camera);
});
