/**
 * Perlen-Katalog, zusammengestellt aus den Seiten 1–3 von
 * https://www.edelsteine-wimmer.at/shop/edelstein-perlen/
 *
 * Aufgenommen wurden nur die runden Perlen — keine Herz-Perlen, Rondellen oder
 * Plätzchen. Pro Steinsorte gibt es genau einen Eintrag: wo der Shop dieselbe
 * Sorte glatt und facettiert führt, steht hier die glatte Variante; Sorten, die
 * es ausschließlich facettiert gibt, sind trotzdem dabei.
 *
 * `palette` und `pattern` beschreiben, wie der Stein aussieht — daraus baut
 * `textures.ts` die Textur. Die Farbangabe im Shop-Namen (`colorLabel`) ist die
 * Vorlage für die Grundfarbe.
 */

export type StonePattern =
  /** Nahezu einfarbig, nur feine Struktur. */
  | 'solid'
  /** Wolkige Farbübergänge. */
  | 'mottled'
  /** Parallele, geschwungene Bänder. */
  | 'banded'
  /** Grundfarbe mit eingestreuten Punkten. */
  | 'speckled'
  /** Helle Grundmasse mit verästelten Einschlüssen. */
  | 'dendritic'
  /** Dünne, scharfe Adern. */
  | 'veined'
  /** Seidiger Lichtstreifen (Katzenaugen-Effekt). */
  | 'chatoyant'
  /** Eckige Bruchlinien im klaren Stein. */
  | 'crackled'
  /** Dunkle Masse mit Poren. */
  | 'porous'
  /** Funkelnde Kristallpunkte. */
  | 'druzy'

export interface StonePalette {
  base: string
  secondary: string
  accent?: string
}

export interface StoneDefinition {
  id: string
  /** Steinname ohne „Perlen“, z.B. „Baumachat“. */
  name: string
  /** Farbangabe aus dem Shop-Namen, z.B. „grünweiß“. */
  colorLabel: string
  shopUrl: string
  pattern: StonePattern
  palette: StonePalette
  roughness: number
  metalness: number
  /**
   * Lichtdurchlässigkeit 0–1. Steine mit einem Wert > 0 bekommen ein
   * physikalisches Glasmaterial statt einer undurchsichtigen Oberfläche —
   * sonst wirkt etwa „Bergkristall – klar“ wie eine weiße Plastikkugel.
   */
  transmission?: number
  /** Wie deutlich sich das Muster von der Grundfarbe abhebt (0–1). */
  contrast: number
}

const SHOP = 'https://www.edelsteine-wimmer.at/produkt'

export const STONES: StoneDefinition[] = [
  { id: 'achat', name: 'Achat', colorLabel: 'grau', shopUrl: `${SHOP}/achat-perlen/`, pattern: 'banded', palette: { base: '#b9b4ad', secondary: '#f0ece5', accent: '#7d786f' }, roughness: 0.26, metalness: 0, contrast: 0.8 },
  { id: 'amazonit', name: 'Amazonit', colorLabel: 'helltürkis', shopUrl: `${SHOP}/amazonit-perlen/`, pattern: 'mottled', palette: { base: '#7ec8bd', secondary: '#c6e7e0', accent: '#568f86' }, roughness: 0.30, metalness: 0, contrast: 0.6 },
  { id: 'amethyst', name: 'Amethyst', colorLabel: 'violett', shopUrl: `${SHOP}/amethyst-perlen/`, pattern: 'mottled', palette: { base: '#8a5fb0', secondary: '#c8a9de', accent: '#603f80' }, roughness: 0.14, metalness: 0, contrast: 0.55, transmission: 0.42 },
  { id: 'andenopal', name: 'Andenopal', colorLabel: 'rosa', shopUrl: `${SHOP}/andenopal-perlen-facettiert/`, pattern: 'solid', palette: { base: '#e0a3a8', secondary: '#f5d6d8' }, roughness: 0.24, metalness: 0, contrast: 0.4, transmission: 0.22 },
  { id: 'angelit', name: 'Angelit', colorLabel: 'hellblau', shopUrl: `${SHOP}/angelit-perlen/`, pattern: 'mottled', palette: { base: '#a9c0d4', secondary: '#dbe7f0', accent: '#8195a8' }, roughness: 0.42, metalness: 0, contrast: 0.45 },
  { id: 'apatit', name: 'Apatit', colorLabel: 'türkisblau', shopUrl: `${SHOP}/apatit-perlen/`, pattern: 'mottled', palette: { base: '#2f8fa8', secondary: '#69c0d2', accent: '#1d6378' }, roughness: 0.20, metalness: 0, contrast: 0.6 },
  { id: 'aquamarin', name: 'Aquamarin', colorLabel: 'hellblau', shopUrl: `${SHOP}/aquamarin-perlen-facettiert/`, pattern: 'solid', palette: { base: '#a8d8dc', secondary: '#e0f3f4' }, roughness: 0.11, metalness: 0, contrast: 0.35, transmission: 0.58 },
  { id: 'aventurin-gruen', name: 'Aventurin', colorLabel: 'hellgrün', shopUrl: `${SHOP}/aventurin-perlen/`, pattern: 'speckled', palette: { base: '#7ba882', secondary: '#a8c9ac', accent: '#e9f0e6' }, roughness: 0.30, metalness: 0, contrast: 0.5 },
  { id: 'aventurin-orange', name: 'Aventurin', colorLabel: 'orange', shopUrl: `${SHOP}/aventurin-perlen-orange/`, pattern: 'speckled', palette: { base: '#c9703f', secondary: '#e29c6c', accent: '#f6d5b4' }, roughness: 0.30, metalness: 0, contrast: 0.5 },
  { id: 'baumachat', name: 'Baumachat', colorLabel: 'grünweiß', shopUrl: `${SHOP}/baumachat-perlen/`, pattern: 'dendritic', palette: { base: '#eceae0', secondary: '#dcd8ca', accent: '#4e7a48' }, roughness: 0.30, metalness: 0, contrast: 0.95 },
  { id: 'bergkristall-crash', name: 'Bergkristall', colorLabel: 'gecrashed', shopUrl: `${SHOP}/bergkristall-perlen-crash/`, pattern: 'crackled', palette: { base: '#dde8ec', secondary: '#ffffff', accent: '#8fa6b0' }, roughness: 0.09, metalness: 0, contrast: 0.95, transmission: 0.68 },
  { id: 'bergkristall', name: 'Bergkristall', colorLabel: 'klar', shopUrl: `${SHOP}/bergkristall-perlen/`, pattern: 'solid', palette: { base: '#e8eff2', secondary: '#ffffff' }, roughness: 0.05, metalness: 0, contrast: 0.25, transmission: 0.95 },
  { id: 'bernstein', name: 'Bernstein', colorLabel: 'honiggelb', shopUrl: `${SHOP}/bernstein-perlen/`, pattern: 'mottled', palette: { base: '#d99a2b', secondary: '#f2c468', accent: '#a86d14' }, roughness: 0.12, metalness: 0, contrast: 0.5, transmission: 0.48 },
  { id: 'bronzit', name: 'Bronzit', colorLabel: 'goldbraun', shopUrl: `${SHOP}/bronzit-perlen/`, pattern: 'chatoyant', palette: { base: '#7b5a33', secondary: '#b28c52', accent: '#dcb87e' }, roughness: 0.30, metalness: 0.25, contrast: 0.7 },
  { id: 'calcit', name: 'Calcit', colorLabel: 'gelb', shopUrl: `${SHOP}/calcit-perlen/`, pattern: 'mottled', palette: { base: '#e8d67a', secondary: '#f8efc0', accent: '#c4ad4f' }, roughness: 0.22, metalness: 0, contrast: 0.45 },
  { id: 'chalcedon', name: 'Chalcedon', colorLabel: 'hellblau', shopUrl: `${SHOP}/chalcedon-perlen/`, pattern: 'solid', palette: { base: '#a9c6d6', secondary: '#e0ecf2' }, roughness: 0.18, metalness: 0, contrast: 0.35, transmission: 0.2 },
  { id: 'chrysopras', name: 'Chrysopras', colorLabel: 'mintgrün', shopUrl: `${SHOP}/chrysopras-perlen-facettiert/`, pattern: 'solid', palette: { base: '#86c9a4', secondary: '#c4e8d2' }, roughness: 0.18, metalness: 0, contrast: 0.35, transmission: 0.22 },
  { id: 'citrin', name: 'Citrin', colorLabel: 'gelb', shopUrl: `${SHOP}/citrin-perlen/`, pattern: 'solid', palette: { base: '#e0b23f', secondary: '#f6dd88' }, roughness: 0.12, metalness: 0, contrast: 0.4, transmission: 0.42 },
  { id: 'dalmatinerjaspis', name: 'Dalmatinerjaspis', colorLabel: 'gefleckt', shopUrl: `${SHOP}/dalmatinerjaspis-perlen/`, pattern: 'speckled', palette: { base: '#e6dfd0', secondary: '#d4cab4', accent: '#26231f' }, roughness: 0.32, metalness: 0, contrast: 1.0 },
  { id: 'druzy-achat', name: 'Druzy Achat', colorLabel: 'grau', shopUrl: `${SHOP}/druzy-achat-perlen/`, pattern: 'druzy', palette: { base: '#4a4845', secondary: '#6f6c68', accent: '#ffffff' }, roughness: 0.16, metalness: 0.1, contrast: 0.9 },
  { id: 'dumortierit', name: 'Dumortierit', colorLabel: 'dunkelblau', shopUrl: `${SHOP}/dumortierit-perlen/`, pattern: 'mottled', palette: { base: '#2c4470', secondary: '#5a76a4', accent: '#dadfe8' }, roughness: 0.30, metalness: 0, contrast: 0.7 },
  { id: 'erdbeerquarz', name: 'Erdbeerquarz', colorLabel: 'rosa', shopUrl: `${SHOP}/erdbeerquarz-perlen/`, pattern: 'speckled', palette: { base: '#d4707a', secondary: '#eaa8ad', accent: '#8e3c46' }, roughness: 0.20, metalness: 0, contrast: 0.6 },
  { id: 'fluorit', name: 'Fluorit', colorLabel: 'bunt', shopUrl: `${SHOP}/fluorit-perlen/`, pattern: 'banded', palette: { base: '#7fc5b6', secondary: '#9a7fc5', accent: '#e4f2ec' }, roughness: 0.12, metalness: 0, contrast: 0.8, transmission: 0.32 },
  { id: 'goldobsidian', name: 'Goldobsidian', colorLabel: 'goldschwarz', shopUrl: `${SHOP}/goldobsidian-perlen/`, pattern: 'chatoyant', palette: { base: '#1c1a18', secondary: '#8a6a32', accent: '#cda85e' }, roughness: 0.12, metalness: 0.40, contrast: 0.85 },
  { id: 'granat', name: 'Granat', colorLabel: 'rotbraun', shopUrl: `${SHOP}/granat-perlen/`, pattern: 'solid', palette: { base: '#7a2a24', secondary: '#ab4a3d' }, roughness: 0.15, metalness: 0, contrast: 0.45, transmission: 0.26 },
  { id: 'haematit', name: 'Hämatit', colorLabel: 'silber', shopUrl: `${SHOP}/haematit-perlen/`, pattern: 'solid', palette: { base: '#4a4e55', secondary: '#949ba5' }, roughness: 0.18, metalness: 0.95, contrast: 0.45 },
  { id: 'heliotrop', name: 'Heliotrop', colorLabel: 'dunkelgrün', shopUrl: `${SHOP}/heliotrop-perlen/`, pattern: 'speckled', palette: { base: '#2f5138', secondary: '#41694a', accent: '#9e2f28' }, roughness: 0.25, metalness: 0, contrast: 0.85 },
  { id: 'honigjade', name: 'Honigjade', colorLabel: 'gelb', shopUrl: `${SHOP}/honigjade-perlen-facettiert/`, pattern: 'mottled', palette: { base: '#d9b45f', secondary: '#f2dca4', accent: '#b08c3e' }, roughness: 0.20, metalness: 0, contrast: 0.45 },
  { id: 'honigopal', name: 'Honigopal', colorLabel: 'gelb', shopUrl: `${SHOP}/honigopal-perlen-facettiert/`, pattern: 'solid', palette: { base: '#e2b45c', secondary: '#f7dfa4' }, roughness: 0.15, metalness: 0, contrast: 0.35, transmission: 0.32 },
  { id: 'howlith', name: 'Howlith', colorLabel: 'weiß', shopUrl: `${SHOP}/howlith-perlen-weiss/`, pattern: 'veined', palette: { base: '#f2f0ea', secondary: '#e2dfd6', accent: '#5e5c57' }, roughness: 0.36, metalness: 0, contrast: 0.9 },
  { id: 'jade', name: 'Jade', colorLabel: 'dunkelgrün', shopUrl: `${SHOP}/jade-perlen-dunkel/`, pattern: 'mottled', palette: { base: '#3f6b4c', secondary: '#72a07a', accent: '#2a4a34' }, roughness: 0.20, metalness: 0, contrast: 0.55 },
  { id: 'jaspis', name: 'Jaspis', colorLabel: 'hellrot', shopUrl: `${SHOP}/jaspis-perlen/`, pattern: 'mottled', palette: { base: '#a6483a', secondary: '#cc7560', accent: '#752c24' }, roughness: 0.30, metalness: 0, contrast: 0.65 },
  { id: 'karneol', name: 'Karneol', colorLabel: 'orange', shopUrl: `${SHOP}/karneol-perlen/`, pattern: 'mottled', palette: { base: '#c25a26', secondary: '#e69158', accent: '#94401a' }, roughness: 0.15, metalness: 0, contrast: 0.5 },
  { id: 'kirschbluetenachat', name: 'Kirschblütenachat', colorLabel: 'apricot', shopUrl: `${SHOP}/kirschbluetenachat-perlen/`, pattern: 'mottled', palette: { base: '#f0d8c8', secondary: '#e0b4a0', accent: '#c4846e' }, roughness: 0.26, metalness: 0, contrast: 0.6 },
  { id: 'kunzit', name: 'Kunzit', colorLabel: 'flieder', shopUrl: `${SHOP}/kunzit-perlen/`, pattern: 'solid', palette: { base: '#d9a7cb', secondary: '#f2d8ea' }, roughness: 0.12, metalness: 0, contrast: 0.35, transmission: 0.38 },
  { id: 'labradorit', name: 'Labradorit', colorLabel: 'grau', shopUrl: `${SHOP}/labradorit-perlen/`, pattern: 'chatoyant', palette: { base: '#4c5257', secondary: '#828b92', accent: '#4a8ea8' }, roughness: 0.13, metalness: 0.25, contrast: 0.85 },
  { id: 'landschaftsjaspis', name: 'Landschaftsjaspis', colorLabel: 'beige', shopUrl: `${SHOP}/landschaftsjaspis-perlen/`, pattern: 'banded', palette: { base: '#cbb695', secondary: '#e6d8bd', accent: '#8a7050' }, roughness: 0.32, metalness: 0, contrast: 0.8 },
  { id: 'lapislazuli', name: 'Lapislazuli', colorLabel: 'dunkelblau', shopUrl: `${SHOP}/lapislazuli-perlen/`, pattern: 'speckled', palette: { base: '#22397a', secondary: '#3e5aa6', accent: '#d8b44e' }, roughness: 0.25, metalness: 0, contrast: 0.8 },
  { id: 'larimar', name: 'Larimar', colorLabel: 'meerblau', shopUrl: `${SHOP}/larimar-perlen-facettiert/`, pattern: 'mottled', palette: { base: '#6fb3c8', secondary: '#e2f0f4', accent: '#42869e' }, roughness: 0.20, metalness: 0, contrast: 0.8 },
  { id: 'lava', name: 'Lava', colorLabel: 'schwarz', shopUrl: `${SHOP}/lava-perlen/`, pattern: 'porous', palette: { base: '#2b2926', secondary: '#141312', accent: '#413d38' }, roughness: 0.92, metalness: 0, contrast: 1.0 },
  { id: 'lepidolith', name: 'Lepidolith', colorLabel: 'lila', shopUrl: `${SHOP}/lepidolith-perlen-lila/`, pattern: 'veined', palette: { base: '#a888bd', secondary: '#d2badf', accent: '#755a8e' }, roughness: 0.32, metalness: 0.15, contrast: 0.7 },
  { id: 'mahagoniobsidian', name: 'Mahagoniobsidian', colorLabel: 'rotschwarz', shopUrl: `${SHOP}/mahagoniobsidian-perlen/`, pattern: 'mottled', palette: { base: '#221e1c', secondary: '#7e3526', accent: '#ad573c' }, roughness: 0.12, metalness: 0, contrast: 0.95 },
  { id: 'malachit', name: 'Malachit', colorLabel: 'dunkelgrün', shopUrl: `${SHOP}/malachit-perlen/`, pattern: 'banded', palette: { base: '#1d5a44', secondary: '#54a67e', accent: '#0e3629' }, roughness: 0.20, metalness: 0, contrast: 0.95 },
  { id: 'mondstein-creme', name: 'Mondstein', colorLabel: 'creme', shopUrl: `${SHOP}/mondstein-perlen-creme/`, pattern: 'chatoyant', palette: { base: '#ece5d8', secondary: '#fcf8f0', accent: '#cbdee8' }, roughness: 0.12, metalness: 0, contrast: 0.5 },
  { id: 'mondstein-pfirsich', name: 'Mondstein', colorLabel: 'pfirsich', shopUrl: `${SHOP}/mondstein-perlen-pfirsich/`, pattern: 'chatoyant', palette: { base: '#ecd3bd', secondary: '#faeade', accent: '#d8b092' }, roughness: 0.15, metalness: 0, contrast: 0.45 },
  { id: 'mookait', name: 'Mookait', colorLabel: 'bunt', shopUrl: `${SHOP}/mookait-perlen/`, pattern: 'banded', palette: { base: '#a8452f', secondary: '#d9a24e', accent: '#6e2a22' }, roughness: 0.26, metalness: 0, contrast: 0.9 },
  { id: 'moosachat', name: 'Moosachat', colorLabel: 'dunkelgrün', shopUrl: `${SHOP}/moosachat-perlen/`, pattern: 'dendritic', palette: { base: '#e2e4dc', secondary: '#c6cbc0', accent: '#2f5a35' }, roughness: 0.22, metalness: 0, contrast: 1.0 },
  { id: 'obsidian', name: 'Obsidian', colorLabel: 'schwarz', shopUrl: `${SHOP}/obsidian-perlen-schwarz/`, pattern: 'solid', palette: { base: '#17161a', secondary: '#332f38' }, roughness: 0.07, metalness: 0, contrast: 0.4 },
  { id: 'onyx', name: 'Onyx', colorLabel: 'schwarz', shopUrl: `${SHOP}/onyx-perlen/`, pattern: 'solid', palette: { base: '#121212', secondary: '#282828' }, roughness: 0.11, metalness: 0, contrast: 0.3 },
  { id: 'peridot', name: 'Peridot', colorLabel: 'grün', shopUrl: `${SHOP}/peridot-perlen-facettiert/`, pattern: 'solid', palette: { base: '#8fb23a', secondary: '#c2d97c' }, roughness: 0.10, metalness: 0, contrast: 0.4, transmission: 0.42 },
  { id: 'picassojaspis', name: 'Picassojaspis', colorLabel: 'bunt', shopUrl: `${SHOP}/picassojaspis-perlen/`, pattern: 'veined', palette: { base: '#cfc3ae', secondary: '#8c7a62', accent: '#3a332a' }, roughness: 0.30, metalness: 0, contrast: 0.9 },
  { id: 'prehnit', name: 'Prehnit', colorLabel: 'hellgrün', shopUrl: `${SHOP}/prehnit-perlen/`, pattern: 'mottled', palette: { base: '#b6cc92', secondary: '#e2ecca', accent: '#94ad70' }, roughness: 0.20, metalness: 0, contrast: 0.45 },
  { id: 'pyrit', name: 'Pyrit', colorLabel: 'gold', shopUrl: `${SHOP}/pyrit-perlen/`, pattern: 'speckled', palette: { base: '#b08a2e', secondary: '#dcb750', accent: '#f4e29c' }, roughness: 0.22, metalness: 1.0, contrast: 0.6 },
  { id: 'rauchquarz', name: 'Rauchquarz', colorLabel: 'braun', shopUrl: `${SHOP}/rauchquarz-perlen/`, pattern: 'mottled', palette: { base: '#6b5a4c', secondary: '#a89484', accent: '#4a3d33' }, roughness: 0.10, metalness: 0, contrast: 0.5 },
  { id: 'rhodochrosit', name: 'Rhodochrosit', colorLabel: 'hellrosa', shopUrl: `${SHOP}/rhodochrosit-perlen/`, pattern: 'banded', palette: { base: '#e08a95', secondary: '#f8d4d8', accent: '#b85c6b' }, roughness: 0.20, metalness: 0, contrast: 0.85 },
  { id: 'rhodonit', name: 'Rhodonit', colorLabel: 'dunkelrosa', shopUrl: `${SHOP}/rhodonit-perlen/`, pattern: 'veined', palette: { base: '#c25f78', secondary: '#dd8fa0', accent: '#2a2622' }, roughness: 0.25, metalness: 0, contrast: 0.9 },
  { id: 'rosenquarz', name: 'Rosenquarz', colorLabel: 'hellrosa', shopUrl: `${SHOP}/rosenquarz-perlen/`, pattern: 'solid', palette: { base: '#e8bcc0', secondary: '#f9e4e6' }, roughness: 0.16, metalness: 0, contrast: 0.35, transmission: 0.22 },
  { id: 'rubin', name: 'Rubin', colorLabel: 'rotviolett', shopUrl: `${SHOP}/rubin-perlen-facettiert/`, pattern: 'solid', palette: { base: '#8e1f3c', secondary: '#bd4a62' }, roughness: 0.12, metalness: 0, contrast: 0.45, transmission: 0.28 },
  { id: 'rubin-zoisit', name: 'Rubin Zoisit', colorLabel: 'dunkelgrün', shopUrl: `${SHOP}/rubin-zoisit-perlen/`, pattern: 'mottled', palette: { base: '#3d6b3f', secondary: '#648f5e', accent: '#a8263f' }, roughness: 0.30, metalness: 0, contrast: 0.9 },
  { id: 'schneeflockenobsidian', name: 'Schneeflockenobsidian', colorLabel: 'gefleckt', shopUrl: `${SHOP}/schneeflockenobsidian-perlen/`, pattern: 'speckled', palette: { base: '#1b1a1c', secondary: '#302e32', accent: '#cbc7c3' }, roughness: 0.15, metalness: 0, contrast: 0.95 },
  { id: 'selenit', name: 'Selenit', colorLabel: 'weiß', shopUrl: `${SHOP}/selenit-perlen/`, pattern: 'chatoyant', palette: { base: '#eeece6', secondary: '#ffffff', accent: '#d2cec4' }, roughness: 0.26, metalness: 0, contrast: 0.5, transmission: 0.3 },
  { id: 'serpentin', name: 'Serpentin', colorLabel: 'hellgrün', shopUrl: `${SHOP}/serpentin-perlen/`, pattern: 'mottled', palette: { base: '#8ab06a', secondary: '#bdd49e', accent: '#5a7845' }, roughness: 0.30, metalness: 0, contrast: 0.65 },
  { id: 'sodalith', name: 'Sodalith', colorLabel: 'dunkelblau', shopUrl: `${SHOP}/sodalith-perlen/`, pattern: 'mottled', palette: { base: '#26407e', secondary: '#4f68a6', accent: '#e8eaee' }, roughness: 0.25, metalness: 0, contrast: 0.8 },
  { id: 'sonnenstein', name: 'Sonnenstein', colorLabel: 'orange', shopUrl: `${SHOP}/sonnenstein-perlen/`, pattern: 'druzy', palette: { base: '#c4693a', secondary: '#e0945e', accent: '#f6c884' }, roughness: 0.25, metalness: 0.25, contrast: 0.7 },
  { id: 'tigerauge', name: 'Tigerauge', colorLabel: 'goldgelb', shopUrl: `${SHOP}/tigerauge-perlen/`, pattern: 'chatoyant', palette: { base: '#7a5420', secondary: '#c99c3c', accent: '#eccb78' }, roughness: 0.15, metalness: 0.15, contrast: 0.95 },
  { id: 'tuerkis', name: 'Türkis', colorLabel: 'türkis', shopUrl: `${SHOP}/tuerkis-perlen-facettiert/`, pattern: 'veined', palette: { base: '#3fb0b8', secondary: '#86d4d8', accent: '#4a3d2e' }, roughness: 0.30, metalness: 0, contrast: 0.85 },
  { id: 'turmalin-schwarz', name: 'Turmalin', colorLabel: 'schwarz', shopUrl: `${SHOP}/turmalin-perlen/`, pattern: 'chatoyant', palette: { base: '#17171a', secondary: '#38383f', accent: '#55555e' }, roughness: 0.12, metalness: 0.1, contrast: 0.6 },
  { id: 'turmalin-oliv', name: 'Turmalin', colorLabel: 'olivgrün', shopUrl: `${SHOP}/turmalin-perlen-facettiert-olivgruen/`, pattern: 'solid', palette: { base: '#5a6b32', secondary: '#8b9d5e' }, roughness: 0.12, metalness: 0, contrast: 0.4 },
  { id: 'turmalin-rosa', name: 'Turmalin', colorLabel: 'rosa', shopUrl: `${SHOP}/turmalin-perlen-facettiert-rosa/`, pattern: 'solid', palette: { base: '#c9527a', secondary: '#e491a8' }, roughness: 0.12, metalness: 0, contrast: 0.4 },
  { id: 'versteinertes-holz', name: 'Versteinertes Holz', colorLabel: 'braun', shopUrl: `${SHOP}/versteinertes-holz-perlen/`, pattern: 'banded', palette: { base: '#7a5f45', secondary: '#ab8d6a', accent: '#4e3c2c' }, roughness: 0.36, metalness: 0, contrast: 0.85 },
  { id: 'zebrajaspis', name: 'Zebrajaspis', colorLabel: 'marmoriert', shopUrl: `${SHOP}/zebrajaspis-perlen/`, pattern: 'banded', palette: { base: '#e0dcd2', secondary: '#6e6a62', accent: '#3b3833' }, roughness: 0.30, metalness: 0, contrast: 1.0 },
]

/** Beim Start ausgewählter Stein. */
export const DEFAULT_STONE_ID = 'lapislazuli'

const BY_ID = new Map(STONES.map((stone) => [stone.id, stone]))

export function getStone(id: string): StoneDefinition {
  const stone = BY_ID.get(id)
  if (!stone) throw new Error(`Unbekannter Stein: ${id}`)
  return stone
}

/** Voller Anzeigename, z.B. „Mondstein – pfirsich“. */
export function stoneLabel(stone: StoneDefinition): string {
  return `${stone.name} – ${stone.colorLabel}`
}
