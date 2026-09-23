/**
 * Alle Maße und Farben des Mala-Boards an einer Stelle.
 *
 * Einheit ist Zentimeter — ein echtes 108er-Mala-Board mit ~9,7 mm Perlen ist
 * ungefähr so groß wie das hier definierte Brett.
 *
 * Koordinaten-Konvention: Brett und Rillen werden in einer 2D-"Shape-Ebene"
 * (x = rechts, y = oben/hinten) konstruiert und entlang +z extrudiert. Die
 * Board-Group wird um -90° um X gedreht, dadurch wird aus Shape-y die Welt-Tiefe
 * und aus der Extrusionsrichtung die Welt-Höhe.
 */

export const BOARD = {
  width: 33,
  height: 42,
  cornerRadius: 3,
  /** Gesamtdicke des Bretts. */
  thickness: 2.4,
  /** Tiefe der eingefrästen Rillen — so dick ist die obere Platte. */
  grooveDepth: 0.35,
  /**
   * Drehung des Bretts in seiner eigenen Ebene, in Grad. Bei 0 zeigt die
   * Öffnung der Mala-Rille zum Betrachter, bei 180 vom Betrachter weg.
   */
  rotationDeg: 180,
} as const

/**
 * Maße einer offenen Schlaufe (Stadionform). Die beiden Radien steuern den
 * Charakter: große Werte ergeben die weiche Kettenform des echten Boards,
 * kleine ein kantiges Rechteck.
 */
export interface LoopSpec {
  halfWidth: number
  halfHeight: number
  /** Oben sehr großzügig — davon lebt die Stadionform. */
  topRadius: number
  /** Unten enger, damit die Enden zur Öffnung einschwenken. */
  bottomRadius: number
  /** Breite der Öffnung an der Unterkante (dort kommen Guru-Perle + Tassel). */
  openingWidth: number
}

/** Äußere Rille: klassische Mala mit 108 Perlen. */
export const MALA_CHANNEL = {
  halfWidth: 13,
  halfHeight: 17.5,
  topRadius: 11,
  bottomRadius: 8,
  openingWidth: 7,
  beadCount: 108,
} as const satisfies LoopSpec & { beadCount: number }

/**
 * Mittlere Rille: Liu Zhu, die taoistische Mala mit 81 Perlen. Dieselbe Form
 * wie die Mala, nur kleiner — die Maße sind so gewählt, dass die Perlen exakt
 * so groß werden wie in den anderen beiden Rillen.
 */
export const LIUZHU_CHANNEL = {
  halfWidth: 9.75,
  halfHeight: 13.13,
  topRadius: 8.25,
  bottomRadius: 6,
  openingWidth: 5.25,
  beadCount: 81,
} as const satisfies LoopSpec & { beadCount: number }

/** Innerste Rille: geschlossener Kreis für Handketten. */
export const BRACELET_CHANNEL = {
  centerX: 0,
  centerY: 1,
  // So gewählt, dass 27 Armband-Perlen exakt so groß werden wie die 108
  // Mala-Perlen — sonst wirken die beiden Ketten unterschiedlich grob.
  radius: 3.927,
  beadCount: 27,
} as const

export const BEAD = {
  /** Perlendurchmesser relativ zum Slot-Abstand — < 1 lässt einen Hauch Luft. */
  fillFactor: 0.94,
  /** Rillenbreite relativ zum Perlendurchmesser — > 1 damit die Perle hineinpasst. */
  channelClearance: 1.18,
  segments: 32,
} as const

/**
 * Olivenholz: heller, goldbeiger Grund mit sehr kontrastreicher, wild
 * geschwungener Maserung — das macht die Sorte aus. `flow` steuert, wie stark
 * die Maserung verwirbelt ist; ohne die Verwirbelung sähe es aus wie Kiefer.
 */
export const WOOD = {
  resolution: 512,
  /**
   * Kantenlänge einer Texturkachel in Brett-Einheiten. Größere Werte ziehen die
   * Zeichnung auseinander — das beruhigt das Brett, ohne den Charakter zu nehmen.
   */
  tileSize: 38,
  /**
   * Wie kräftig die Maserung gegenüber dem ruhigen Grundton heraussticht.
   * 0 = fast einfarbiges Holz, 1 = volle Zeichnung. Der eine Regler, wenn das
   * Brett zu sehr von der Kette ablenkt.
   */
  contrast: 0.5,
  light: '#e3d0aa',
  mid: '#cdb083',
  dark: '#a4804f',
  deep: '#70502c',
  flow: 0.42,
} as const

export const COLORS = {
  /** Neutral — die Bretthelligkeit kommt aus der Holztextur. */
  board: 0xffffff,
  /** Tönt dieselbe Holztextur im Rilleninneren ab. */
  grooveFloor: 0x9b8055,
  background: 0x12151a,
} as const

export const CAMERA = {
  fov: 40,
  near: 0.5,
  far: 500,
  /** Startposition relativ zur Brettmitte. */
  position: { x: 0, y: 42, z: 40 },
  minDistance: 20,
  maxDistance: 120,
} as const

/** Sampling-Auflösung für die Umriss-Generierung der Rillen. */
export const TESSELLATION = {
  malaOutlineSamples: 480,
  braceletOutlineSegments: 128,
  capSegments: 10,
} as const
