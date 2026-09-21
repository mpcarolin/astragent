import * as THREE from "three";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("no #scene canvas");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.01,
  500,
);
camera.position.set(0, 1, 4);
camera.lookAt(0, 0, 0);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 16),
  new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 1, metalness: 0 }),
);
scene.add(sphere);

const light = new THREE.PointLight(0xffffff, 40);
light.position.set(3, 3, 3);
scene.add(light);

renderer.setAnimationLoop((time) => {
  sphere.rotation.y = time / 2000;
  renderer.render(scene, camera);
});
