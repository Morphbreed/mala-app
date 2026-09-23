import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { CAMERA, COLORS } from './config'
import { createBeadActions } from './interaction/beadActions'
import { setupPicking } from './interaction/picking'
import { BeadLayer } from './scene/beads'
import { createBoard } from './scene/board'
import { setupLighting } from './scene/lighting'
import { MalaState, type ChannelId } from './state/malaState'
import { setupHud } from './ui/hud'
import { setupStonePicker } from './ui/stonePicker'

const canvasElement = document.querySelector<HTMLCanvasElement>('#scene')
if (!canvasElement) throw new Error('#scene Canvas fehlt im HTML')
const canvas: HTMLCanvasElement = canvasElement

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
// Khronos PBR Neutral statt ACES. ACES ist für Film gemacht und drückt
// gesättigte Farben Richtung Weiß, sobald sie hell werden — bei einem
// Steinkatalog ist das fatal: Lapislazuli kam als helles Graublau heraus, im
// Mittel blieb nur ein Fünftel seiner Sättigung übrig. Neutral hält Farben
// innerhalb des Gamuts unverfälscht und rollt erst die Spitzlichter ab. Gemessen
// über Lapislazuli, Malachit, Türkis, Karneol, Tigerauge und Amethyst stieg die
// Sättigungstreue gegenüber der reinen Textur von 67 % auf 89 %.
renderer.toneMapping = THREE.NeutralToneMapping
renderer.toneMappingExposure = 1.0
// Durchsichtige Perlen (Bergkristall & Co.) kosten pro Frame einen zweiten
// Szenen-Durchgang. Halbe Auflösung reicht dafür völlig und spart die Hälfte.
renderer.transmissionResolutionScale = 0.5

const scene = new THREE.Scene()
scene.background = new THREE.Color(COLORS.background)

const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far)
camera.position.set(CAMERA.position.x, CAMERA.position.y, CAMERA.position.z)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.minDistance = CAMERA.minDistance
controls.maxDistance = CAMERA.maxDistance
// Knapp unter der Horizontalen stoppen, damit man nicht unter das Brett fährt.
controls.maxPolarAngle = Math.PI / 2 - 0.05
controls.target.set(0, 0, 0)
// Ausgangsansicht merken, damit der Knopf im HUD dahin zurückkehren kann.
controls.saveState()

const resetView = document.getElementById('reset-view')
if (!(resetView instanceof HTMLButtonElement)) throw new Error('#reset-view fehlt im HTML')
resetView.addEventListener('click', () => controls.reset())

setupLighting(scene, renderer)

const board = createBoard()
scene.add(board.group)

const state = new MalaState(board.channels)
const beads = new BeadLayer(board.group)

const actions = createBeadActions(state, board, beads)
const picker = setupStonePicker()

setupHud(state, actions)
setupPicking({ canvas, camera, state, board, beads, actions, picker })

function resize(): void {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width === 0 || height === 0) return

  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

window.addEventListener('resize', resize)
resize()

// Nur im Entwicklungsmodus: erlaubt automatisierten Tests, eine Rille punktgenau
// anzuklicken, statt Bildschirmkoordinaten zu raten. Landet nicht im Build.
if (import.meta.env.DEV) {
  Object.assign(window, {
    __mala: {
      /**
       * Bildschirmposition des nächsten freien Slots einer Rille.
       *
       * Gemeint ist der Rillenboden, nicht die Perlenmitte: der Klick wird gegen
       * die Rille gestrahlt, und die ist schmal. Eine um den Perlenradius
       * angehobene Position projiziert je nach Kamerawinkel ein paar Pixel
       * daneben — der Strahl geht dann am Pickziel vorbei und der Klick verpufft.
       */
      nextSlotScreenPosition(channelId: ChannelId): { x: number; y: number } | null {
        const slotIndex = state.nextFreeSlot(channelId)
        if (slotIndex === null) return null

        const slot = state.slotPosition(channelId, slotIndex)
        const point = new THREE.Vector3(slot.x, slot.y, board.grooveFloorHeight)

        board.group.updateMatrixWorld(true)
        point.applyMatrix4(board.group.matrixWorld).project(camera)

        const rect = canvas.getBoundingClientRect()
        return {
          x: rect.left + ((point.x + 1) / 2) * rect.width,
          y: rect.top + ((1 - point.y) / 2) * rect.height,
        }
      },
      /**
       * Füllt eine Rille ohne Einzelklicks. Für Screenshots und Aufbauten —
       * die Klickstrecke selbst wird in den Tests mit echten Klicks geprüft.
       */
      place(channelId: ChannelId, count: number, stoneId: string): void {
        for (let i = 0; i < count; i++) actions.place(channelId, stoneId)
      },
      counts: () => state.listChannels().map((c) => `${c.id}:${state.count(c.id)}`).join(' '),
      /** Die gerade gewählte Steinsorte — prüfbar, ohne über DOM-Klassen zu gehen. */
      selectedStone: () => picker.getSelectedId(),
      /** Die Steinsorten der gesetzten Perlen einer Rille, in Slot-Reihenfolge. */
      stonesOn: (channelId: ChannelId) => state.listBeads(channelId).map((bead) => bead.stoneId),
    },
  })
}

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})
