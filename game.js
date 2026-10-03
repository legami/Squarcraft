import * as THREE from 'three';

const canvas = document.querySelector('#game');
const shell = document.querySelector('#game-shell');
const welcome = document.querySelector('#welcome');
const startButton = document.querySelector('#start-button');
const slots = [...document.querySelectorAll('.slot')];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#7fb9d3');
scene.fog = new THREE.Fog('#7fb9d3', 17, 50);
const camera = new THREE.PerspectiveCamera(72, 1, .1, 100);
camera.position.set(0, 7, 12);
const yaw = new THREE.Object3D(); const pitch = new THREE.Object3D();
yaw.add(pitch); pitch.add(camera); scene.add(yaw);

scene.add(new THREE.HemisphereLight('#d9f1ff', '#5b7949', 2.1));
const sun = new THREE.DirectionalLight('#fff4d2', 3.1); sun.position.set(-10, 18, 7); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); scene.add(sun);

const world = new THREE.Group(); scene.add(world);
const blocks = new Map();
const cube = new THREE.BoxGeometry(1, 1, 1);
const materials = {
  grass: [new THREE.MeshLambertMaterial({ color: '#6eab43' }), new THREE.MeshLambertMaterial({ color: '#754b2a' }), new THREE.MeshLambertMaterial({ color: '#a07844' })],
  dirt: new THREE.MeshLambertMaterial({ color: '#80552f' }),
  stone: new THREE.MeshLambertMaterial({ color: '#78868c' })
};
const key = (x, y, z) => `${x},${y},${z}`;
function addBlock(x, y, z, type) {
  const id = key(x, y, z); if (blocks.has(id)) return;
  const block = new THREE.Mesh(cube, materials[type]);
  block.position.set(x, y, z); block.castShadow = true; block.receiveShadow = true;
  block.userData = { type, x, y, z }; world.add(block); blocks.set(id, block);
}
function removeBlock(block) { world.remove(block); blocks.delete(key(block.userData.x, block.userData.y, block.userData.z)); }
function heightAt(x, z) { return Math.floor(2.4 + Math.sin(x * .56) * .8 + Math.cos(z * .42) * .8 + Math.sin((x + z) * .27) * .65); }
for (let x = -13; x <= 13; x++) for (let z = -13; z <= 13; z++) {
  const h = heightAt(x, z); for (let y = -2; y <= h; y++) addBlock(x, y, z, y === h ? 'grass' : y > h - 3 ? 'dirt' : 'stone');
}
// A few simple block trees give the island a recognizable silhouette.
for (const [x, z] of [[-7,-5], [5,-7], [8,5], [-4,7]]) {
  const ground = heightAt(x, z); for (let y = 1; y <= 3; y++) addBlock(x, ground + y, z, 'dirt');
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let dy = 3; dy <= 4; dy++) if (Math.abs(dx) + Math.abs(dz) < 2 || dy === 3) addBlock(x + dx, ground + dy, z + dz, 'grass');
}

const keys = {}; let selected = 'grass'; let locked = false; let verticalVelocity = 0; let onGround = false;
const raycaster = new THREE.Raycaster(); raycaster.far = 6;
function select(type) { selected = type; slots.forEach(slot => slot.classList.toggle('active', slot.dataset.block === type)); }
function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
addEventListener('keydown', event => { keys[event.code] = true; if (['Digit1','Digit2','Digit3'].includes(event.code)) select(['grass','dirt','stone'][Number(event.code.at(-1)) - 1]); });
addEventListener('keyup', event => { keys[event.code] = false; });
slots.forEach(slot => slot.addEventListener('click', () => select(slot.dataset.block)));

startButton.addEventListener('click', () => canvas.requestPointerLock());
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; shell.classList.toggle('playing', locked); });
document.addEventListener('mousemove', event => { if (!locked) return; yaw.rotation.y -= event.movementX * .0022; pitch.rotation.x = THREE.MathUtils.clamp(pitch.rotation.x - event.movementY * .0022, -1.42, 1.42); });
canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('mousedown', event => {
  if (!locked) return; raycaster.setFromCamera(new THREE.Vector2(), camera); const hit = raycaster.intersectObjects(world.children)[0]; if (!hit) return;
  if (event.button === 0) removeBlock(hit.object);
  if (event.button === 2) { const p = hit.object.position.clone().add(hit.face.normal); addBlock(Math.round(p.x), Math.round(p.y), Math.round(p.z), selected); }
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate); const dt = Math.min(clock.getDelta(), .05);
  if (locked) {
    const direction = new THREE.Vector3((keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.KeyQ || keys.ArrowLeft ? 1 : 0), 0, (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.KeyZ || keys.ArrowUp ? 1 : 0));
    if (direction.lengthSq()) { direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.rotation.y); yaw.position.addScaledVector(direction, 6 * dt); }
    verticalVelocity -= 20 * dt; if ((keys.Space || keys.Numpad0) && onGround) verticalVelocity = 8;
    yaw.position.y += verticalVelocity * dt; const floor = heightAt(Math.round(yaw.position.x), Math.round(yaw.position.z)) + 1.75;
    if (yaw.position.y <= floor) { yaw.position.y = floor; verticalVelocity = 0; onGround = true; } else onGround = false;
    yaw.position.x = THREE.MathUtils.clamp(yaw.position.x, -13, 13); yaw.position.z = THREE.MathUtils.clamp(yaw.position.z, -13, 13);
  }
  renderer.render(scene, camera);
}
yaw.position.set(0, heightAt(0, 12) + 1.75, 12); animate();
