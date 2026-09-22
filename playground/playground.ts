import * as THREE from 'three';

const INITIAL_CAM_DIST = 50

function orbitPosition(time: DOMHighResTimeStamp, { incline = 3, speed = 1, scalar = 1 }: { incline?: number, speed?: number, scalar?: number } = {}) {
  const ORBIT_SEMI_MAJOR = 20
  const ORBIT_SEMI_MINOR = 14
  const ORBIT_MS_PER_RADIAN = 1000 / speed;
  const theta = time / ORBIT_MS_PER_RADIAN
  return {
    x: ORBIT_SEMI_MAJOR * scalar * Math.cos(theta),
    y: incline * Math.cos(theta),
    z: ORBIT_SEMI_MINOR * scalar * Math.sin(theta),
  }
}

function registerListeners(camera: THREE.PerspectiveCamera) {
  const meter = document.getElementById("distance") as HTMLInputElement | null
  meter?.addEventListener("input", () => {
    camera.position.z = meter.valueAsNumber
  })
}

function createStar() {
  const geometry = new THREE.SphereGeometry(6, 32, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const sphere = new THREE.Mesh(geometry, material);
  const edges = new THREE.EdgesGeometry(geometry);
  const lines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 'black' })
  )
  sphere.add(lines);
  return sphere
}

function createPlanet(color: string) {
  const geometry = new THREE.SphereGeometry(1, 32, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);
  const edges = new THREE.EdgesGeometry(geometry);
  const lines = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 'black' })
  )
  sphere.add(lines);
  return sphere
}

function createCube() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xFF6237 });
  const cube = new THREE.Mesh(geometry, material);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 'black' })
  )
  cube.add(line)
  return cube
}


function createLight() {
  const light = new THREE.PointLight()
  light.position.x = 8
  light.position.y = 8
  return light
}

function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.007, 0.007, 0.007)
  const cube = createCube()
  const star = createStar()
  const earth = createPlanet('blue')
  const mars = createPlanet('red')
  // scene.add(cube);
  scene.add(star);
  scene.add(earth);
  scene.add(mars);
  scene.add(createLight())

  return { scene, cube, star, earth, mars, objects: [star, earth, mars] }
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
  camera.position.z = INITIAL_CAM_DIST * 2;
  camera.position.y = 25;
  camera.rotation.x += -0.5
  return camera
}

function render() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);

  const camera = createCamera()
  const { scene, objects, earth, mars } = createScene()
  registerListeners(camera)

  const loop = (time: DOMHighResTimeStamp) => {
    objects.forEach(object => {
      object.rotation.y = time / 6000
    });

    const earthPos = orbitPosition(time)
    earth.position.set(earthPos.x, earthPos.y, earthPos.z)

    const marsPos = orbitPosition(time, { incline: -5, scalar: 2, speed: 0.5 })
    mars.position.set(marsPos.x, marsPos.y, marsPos.z)

    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(loop);
}

render()
