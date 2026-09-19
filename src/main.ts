import * as THREE from 'three';

// setup scene + geometry
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 'blue' });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// setup camera
const options = {
  fov: 75,
  aspect: (window.innerWidth / window.innerHeight),
  clipping: {
    near: 0.1,
    far: 1000
  },
}
const camera = new THREE.PerspectiveCamera(
  options.fov,
  options.aspect,
  options.clipping.near,
  options.clipping.far
);
camera.position.z = 5;

// setup renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// loop
function animate(time: DOMHighResTimeStamp) {
  cube.rotation.x = time / 2000;
  cube.rotation.y = time / 1000;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

export { }
