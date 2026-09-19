import * as THREE from 'three';

const INITIAL_CAM_DIST = 3

function registerListeners(camera: THREE.PerspectiveCamera) {
  const meter = document.getElementById("distance") as HTMLInputElement | null
  meter?.addEventListener("input", () => {
    camera.position.z = meter.valueAsNumber
  })
}


function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(1, 1, 1)
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xFF6237 });
  const cube = new THREE.Mesh(geometry, material);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 'black' })
  )
  cube.add(line)
  scene.add(cube);

  return { scene, cube }
}

function createCamera() {
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
  camera.position.z = INITIAL_CAM_DIST;
  return camera
}

function render() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  const camera = createCamera()
  const { scene, cube } = createScene()
  registerListeners(camera)

  // loop
  const animate = (time: DOMHighResTimeStamp) => {
    cube.rotation.x = time / 3000;
    cube.rotation.y = time / 1500;
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);
}

render()
