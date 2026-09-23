import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/**
 * Weiches Studio-Licht. Die RoomEnvironment liefert als Environment-Map die
 * Reflexe, die den Perlen ohne jede Textur ihren Glanz geben.
 */
export function setupLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.55
  pmrem.dispose()

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2b2f36, 1.1))

  const key = new THREE.DirectionalLight(0xfff4e2, 2.1)
  key.position.set(-18, 34, 22)
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xdce8ff, 0.5)
  fill.position.set(20, 14, -24)
  scene.add(fill)
}
