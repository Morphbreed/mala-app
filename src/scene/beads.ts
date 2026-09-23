import * as THREE from 'three'

import { BEAD } from '../config'
import { getStone } from '../stones/catalog'
import { getStoneTexture } from '../stones/textures'
import type { Bead } from '../state/malaState'

/**
 * Verwaltet die Perlen-Meshes. Bei maximal ~135 Perlen ist ein Mesh pro Perle
 * völlig ausreichend und macht Picking und Entfernen trivial. Material und
 * Textur teilen sich alle Perlen derselben Steinsorte.
 */
export class BeadLayer {
  private readonly geometry = new THREE.SphereGeometry(1, BEAD.segments, BEAD.segments / 2)
  private readonly materials = new Map<string, THREE.Material>()
  private readonly meshes = new Map<number, THREE.Mesh>()
  private readonly ghost: THREE.Mesh
  private readonly ghostMaterials = new Map<string, THREE.MeshStandardMaterial>()

  constructor(private readonly parent: THREE.Object3D) {
    this.ghost = new THREE.Mesh(this.geometry, new THREE.MeshStandardMaterial())
    this.ghost.visible = false
    this.ghost.renderOrder = 1
    this.ghost.name = 'bead-ghost'
    this.parent.add(this.ghost)
  }

  /** Alle gesetzten Perlen — die Raycast-Ziele fürs Entfernen. */
  get pickTargets(): THREE.Mesh[] {
    return [...this.meshes.values()]
  }

  add(bead: Bead, position: THREE.Vector2, radius: number, floorHeight: number): void {
    const mesh = new THREE.Mesh(this.geometry, this.materialFor(bead.stoneId))
    mesh.scale.setScalar(radius)
    mesh.position.set(position.x, position.y, floorHeight + radius)
    mesh.userData['beadId'] = bead.id
    mesh.name = `bead-${bead.id}`

    this.meshes.set(bead.id, mesh)
    this.parent.add(mesh)
  }

  remove(beadId: number): void {
    const mesh = this.meshes.get(beadId)
    if (!mesh) return

    this.parent.remove(mesh)
    this.meshes.delete(beadId)
  }

  /** Vorschau der nächsten Perle an der Position, wo sie landen würde. */
  showGhost(stoneId: string, position: THREE.Vector2, radius: number, floorHeight: number): void {
    this.ghost.material = this.ghostMaterialFor(stoneId)
    this.ghost.scale.setScalar(radius)
    this.ghost.position.set(position.x, position.y, floorHeight + radius)
    this.ghost.visible = true
  }

  hideGhost(): void {
    this.ghost.visible = false
  }

  private materialFor(stoneId: string): THREE.Material {
    const cached = this.materials.get(stoneId)
    if (cached) return cached

    const stone = getStone(stoneId)
    const map = getStoneTexture(stoneId)

    // Durchsichtige Steine brauchen echte Lichtbrechung, sonst sieht
    // „Bergkristall – klar“ aus wie eine weiße Kugel. `map` färbt dabei das
    // durchscheinende Licht ein, die Textur bleibt also als Innenleben sichtbar.
    const material = stone.transmission
      ? new THREE.MeshPhysicalMaterial({
          map,
          roughness: stone.roughness,
          metalness: stone.metalness,
          transmission: stone.transmission,
          thickness: 1.1,
          ior: 1.55,
        })
      : new THREE.MeshStandardMaterial({
          map,
          roughness: stone.roughness,
          metalness: stone.metalness,
        })
    this.materials.set(stoneId, material)

    return material
  }

  private ghostMaterialFor(stoneId: string): THREE.MeshStandardMaterial {
    const cached = this.ghostMaterials.get(stoneId)
    if (cached) return cached

    const stone = getStone(stoneId)
    const material = new THREE.MeshStandardMaterial({
      map: getStoneTexture(stoneId),
      roughness: stone.roughness,
      metalness: stone.metalness,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
    this.ghostMaterials.set(stoneId, material)

    return material
  }
}
