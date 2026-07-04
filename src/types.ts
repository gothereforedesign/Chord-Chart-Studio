/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChordSlot {
  root: number; // 0-11 index where 0=C, 1=C#/Db, 2=D, 3=D#/Eb, 4=E, 5=F, 6=F#/Gb, 7=G, 8=G#/Ab, 9=A, 10=A#/Bb, 11=B
  accidental: 'sharp' | 'flat' | 'natural';
  suffix: string; // maj7, -7, 7, 7alt, -7b5, dim7, etc.
  isEmpty: boolean;
  slashRoot?: number | null; // Optional: 0-11 index for the bass note under the slash
  slashAccidental?: 'sharp' | 'flat' | 'natural' | null;
  isSmall?: boolean;
  sizePercent?: number; // 100, 80, 60, or 40. Default is 100
}

export interface Measure {
  id: string;
  slots: ChordSlot[]; // Exactly 4 ChordSlot objects
  label?: string; // Section title (e.g. A, B, Intro, Chorus, etc.)
}

export interface NoteBlock {
  id: string;
  type: 'paragraph' | 'heading';
  text: string;
}

export interface Song {
  id: string;
  title: string;
  key: string; // The song's base key
  grid: Measure[]; // Array of Measure objects
  folderId?: string | null; // Optional folder ID association
  timeSignature?: string; // Default to '4/4'
  subheading?: string; // Optional subheading (composer, subtitle, etc.)
  notesReharm?: NoteBlock[];
  notesVoicings?: NoteBlock[];
  notesImprov?: NoteBlock[];
  referenceImage?: string;
  referenceImageName?: string;
  referencePrompt?: string;
  referenceJSON?: string;
  referenceFileName?: string;
  isDeleted?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // For subfolder support
  isDeleted?: boolean;
}

export interface AccentPalette {
  id: string;
  name: string;
  primary: string;
  hover: string;
  light: string;
  lightHover: string;
  lightBg: string;
  lightBgStrong: string;
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: 'blue',
    name: 'Ocean Slate',
    primary: '#0c4a6e',
    hover: '#072f47',
    light: '#38bdf8',
    lightHover: '#0ea5e9',
    lightBg: 'rgba(12, 74, 110, 0.05)',
    lightBgStrong: 'rgba(12, 74, 110, 0.15)',
  },
  {
    id: 'emerald',
    name: 'Emerald Sage',
    primary: '#047857',
    hover: '#065f46',
    light: '#34d399',
    lightHover: '#10b981',
    lightBg: 'rgba(4, 120, 87, 0.05)',
    lightBgStrong: 'rgba(4, 120, 87, 0.15)',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    primary: '#4f46e5',
    hover: '#3730a3',
    light: '#818cf8',
    lightHover: '#6366f1',
    lightBg: 'rgba(79, 70, 229, 0.05)',
    lightBgStrong: 'rgba(79, 70, 229, 0.15)',
  },
  {
    id: 'amber',
    name: 'Rich Amber',
    primary: '#b45309',
    hover: '#92400e',
    light: '#fbbf24',
    lightHover: '#f59e0b',
    lightBg: 'rgba(180, 83, 9, 0.05)',
    lightBgStrong: 'rgba(180, 83, 9, 0.15)',
  },
  {
    id: 'crimson',
    name: 'Ruby Crimson',
    primary: '#be123c',
    hover: '#9f1239',
    light: '#fb7185',
    lightHover: '#f43f5e',
    lightBg: 'rgba(190, 18, 60, 0.05)',
    lightBgStrong: 'rgba(190, 18, 60, 0.15)',
  },
  {
    id: 'obsidian',
    name: 'Classic Obsidian',
    primary: '#334155',
    hover: '#1e293b',
    light: '#94a3b8',
    lightHover: '#64748b',
    lightBg: 'rgba(51, 65, 85, 0.05)',
    lightBgStrong: 'rgba(51, 65, 85, 0.15)',
  },
];

export const KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
] as const;

export type KeySignature = typeof KEYS[number];

export function getKeySemitone(root: string): number {
  if (!root) return -1;
  const normalized = root.replace('♯', '#').replace('♭', 'b').trim();
  switch (normalized) {
    case 'C': return 0;
    case 'C#': case 'Db': return 1;
    case 'D': return 2;
    case 'D#': case 'Eb': return 3;
    case 'E': return 4;
    case 'F': return 5;
    case 'F#': case 'Gb': return 6;
    case 'G': return 7;
    case 'G#': case 'Ab': return 8;
    case 'A': return 9;
    case 'A#': case 'Bb': return 10;
    case 'B': return 11;
    default: return -1;
  }
}

// Sharps spelling map
export const SPELLING_SHARPS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

// Flats spelling map
export const SPELLING_FLATS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
] as const;

// Helper to determine if a key is a "flat" key
export function isFlatKey(key: string): boolean {
  if (!key) return false;
  const normalized = String(key).trim().replace(/\s+/g, ' ');
  const parts = normalized.split(' ');
  const root = parts[0];
  const quality = parts[1] || 'Maj';
  
  const isMinor = quality.toLowerCase().startsWith('min') || quality.toLowerCase() === 'm';
  
  if (isMinor) {
    // Minor flat keys: Dm (1b), Gm (2b), Cm (3b), Fm (4b), Bbm (5b), Ebm (6b), Abm (7b)
    // Sharp minor keys: Am (0), Em (1#), Bm (2#), F#m (3#), C#m (4#), G#m (5#), D#m / A#m
    return ['D', 'G', 'C', 'F', 'Bb', 'Eb', 'Ab'].includes(root);
  } else {
    // Major flat keys: F (1b), Bb (2b), Eb (3b), Ab (4b), Db (5b), Gb (6b), Cb (7b)
    // Sharp major keys: C (0), G (1#), D (2#), A (3#), E (4#), B (5#), F# (6#), C# (7#)
    return ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'].includes(root);
  }
}

// Function to format standard 'b' and '#' into actual musical unicode '♭' and '♯'
export function formatMusicSymbols(str: string): string {
  if (!str) return '';
  return str
    .replace(/([A-G]|\d|\/|ø)b/g, '$1♭')
    .replace(/([A-G]|\d|\/)#/g, '$1♯')
    .replace(/\^/g, 'Δ');
}

export function formatChordModifier(str: string): string {
  if (!str) return '';
  return formatMusicSymbols(str)
    .replace(/maj/g, 'Δ')
    .replace(/min/g, '-')
    .replace(/dim/g, '°')
    .replace(/aug/g, '+')
    // Safe single letter replacements: only if they are the first char, or preceded by something safe,
    // but honestly just checking first char is usually enough for suffixes like 'm7', 'o7', 'h7'
    .replace(/^m/g, '-')
    .replace(/^o/g, '°')
    .replace(/^h/g, 'ø');
}

export function formatSectionLabelString(str: string): string {
  if (!str) return '';
  // Format letter-accidentals inside section titles (e.g. AB -> A♭, Bb -> B♭, F# -> F♯)
  // preventing collisions with full lowercase word labels like "Bridge" or "Chorus"
  let result = str.replace(/([A-G])([Bb♭])(?![a-z])/g, '$1♭');
  result = result.replace(/([A-G])([#♯])(?![a-z])/g, '$1♯');
  return result;
}

// Function to get note name based on root index and active key spelling rule
export function getNoteName(root: number, key: string, customAccidental?: 'sharp' | 'flat' | 'natural'): string {
  const parsedRoot = Number(root);
  const safeRoot = isNaN(parsedRoot) ? 0 : ((Math.floor(parsedRoot) % 12) + 12) % 12;

  if (customAccidental === 'sharp') {
    return SPELLING_SHARPS[safeRoot] || 'C';
  }
  if (customAccidental === 'flat') {
    return SPELLING_FLATS[safeRoot] || 'C';
  }
  
  // Default to key spelling rule
  if (isFlatKey(key)) {
    return SPELLING_FLATS[safeRoot] || 'C';
  }
  return SPELLING_SHARPS[safeRoot] || 'C';
}

export function getJazzSuffixSymbol(suffix: string, notationStyle: 'standard' | 'ireal' = 'ireal'): string {
  if (notationStyle === 'standard') {
    switch (suffix) {
      // Basic / Triads
      case 'maj7': return 'maj7';
      case 'min7': return 'm7';
      case 'm7b5': return 'm7♭5';
      case 'dim7': return 'dim7';
      case '7': return '7';
      case 'min': return 'm';
      case 'dim': return 'dim';
      case 'aug': return 'aug';
      case '6': return '6';
      case '6/9': return '6/9';

      // Minor Family
      case 'min9': return 'm9';
      case 'min6': return 'm6';
      case 'min6/9': return 'm6/9';
      case 'min7b6': return 'm7♭6';
      case 'min9b6': return 'm9♭6';
      case 'min11': return 'm11';
      case 'min13': return 'm13';
      case 'minb6': return 'm(♭6)';
      case 'min#5': return 'm(♯5)';
      case 'm9b5': return 'm9♭5';
      case 'minmaj7': return 'm(maj7)';
      case 'minmaj9': return 'm(maj9)';
      case 'minmaj11': return 'm(maj11)';
      case 'minmaj13': return 'm(maj13)';
      case 'dimmaj7': return 'dim(maj7)';
      case 'minadd2': return 'm(add2)';
      case 'minadd4': return 'm(add4)';

      // Major Family
      case 'maj7#11': return 'maj7(♯11)';
      case 'maj7b5': return 'maj7(♭5)';
      case 'maj7#5': return 'maj7(♯5)';
      case 'maj7#9': return 'maj7(♯9)';
      case 'maj9': return 'maj9';
      case 'maj9#11': return 'maj9(♯11)';
      case 'maj13': return 'maj13';
      case 'maj13#11': return 'maj13(♯11)';

      // Dominant / Sus Family
      case '9': return '9';
      case '7alt': return '7alt';
      case '7b9': return '7♭9';
      case '7#9': return '7♯9';
      case '7sus': return '7sus';
      case 'sus2': return 'sus2';
      case 'sus4': return 'sus4';
      case 'add2': return 'add2';
      case 'add4': return 'add4';
      case '5': return '5';
      case '9sus': return '9sus';
      case '13sus': return '13sus';
      case '7#11': return '7♯11';
      case '7b5': return '7♭5';
      case '7#5': return '7♯5';
      case '7b13': return '7♭13';
      case '7#9#11': return '7♯9♯11';
      case '9#11': return '9♯11';
      case '9b5': return '9♭5';
      case '9#5': return '9♯5';
      case '7#9b5': return '7♯9♭5';
      case '7#9#5': return '7♯9♯5';
      case '7b9#11': return '7♭9♯11';
      case '7b9b5': return '7♭9♭5';
      case '7b9#9': return '7♭9♯9';
      case '13': return '13';
      case '13#11': return '13♯11';
      case '13#9': return '13♯9';
      case '13b9': return '13♭9';

      // Stacked Suffixes
      case '7susb9': return '7sus(♭9)';
      case '7susb9b13': return '7sus(♭9♭13)';
      case '7susadd3': return '7sus(add3)';
      case '7b9b13': return '7♭9♭13';
      case '7b9#5': return '7♭9♯5';
      case '713add': return '7(13add)';

      default: return suffix;
    }
  }

  // Default 'ireal' style - exactly matches the screenshot
  switch (suffix) {
    // Basic / Triads
    case 'maj7': return 'Δ7';
    case 'min7': return '-7';
    case 'm7b5': return 'ø7';
    case 'dim7': return 'o7';
    case '7': return '7';
    case 'min': return '-';
    case 'dim': return 'o';
    case 'aug': return '+';
    case '6': return '6';
    case '6/9': return '6/9';

    // Minor Family
    case 'min9': return '-9';
    case 'min6': return '-6';
    case 'min6/9': return '-6/9';
    case 'min7b6': return '-7b6';
    case 'min9b6': return '-9b6';
    case 'min11': return '-11';
    case 'min13': return '-13';
    case 'minb6': return '-b6';
    case 'min#5': return '-#5';
    case 'm9b5': return 'ø9';
    case 'minmaj7': return '-Δ7';
    case 'minmaj9': return '-Δ9';
    case 'minmaj11': return '-Δ11';
    case 'minmaj13': return '-Δ13';
    case 'dimmaj7': return 'oΔ7';
    case 'minadd2': return '-add2';
    case 'minadd4': return '-add4';

    // Major Family
    case 'maj7#11': return 'Δ7#11';
    case 'maj7b5': return 'Δ7b5';
    case 'maj7#5': return 'Δ7#5';
    case 'maj7#9': return 'Δ7#9';
    case 'maj9': return 'Δ9';
    case 'maj9#11': return 'Δ9#11';
    case 'maj13': return 'Δ13';
    case 'maj13#11': return 'Δ13#11';

    // Dominant / Sus Family
    case '9': return '9';
    case '7alt': return '7alt';
    case '7b9': return '7b9';
    case '7#9': return '7#9';
    case '7sus': return '7sus';
    case 'sus2': return 'sus2';
    case 'sus4': return 'sus4';
    case 'add2': return 'add2';
    case 'add4': return 'add4';
    case '5': return '5';
    case '9sus': return '9sus';
    case '13sus': return '13sus';
    case '7#11': return '7#11';
    case '7b5': return '7b5';
    case '7#5': return '7#5';
    case '7b13': return '7b13';
    case '7#9#11': return '7#9#11';
    case '9#11': return '9#11';
    case '9b5': return '9b5';
    case '9#5': return '9#5';
    case '7#9b5': return '7#9b5';
    case '7#9#5': return '7#9#5';
    case '7b9#11': return '7b9#11';
    case '7b9b5': return '7b9b5';
    case '7b9#9': return '7b9#9';
    case '13': return '13';
    case '13#11': return '13#11';
    case '13#9': return '13#9';
    case '13b9': return '13b9';

    // Stacked Suffixes
    case '7susb9': return '7susb9';
    case '7susb9b13': return '7susb9b13';
    case '7susadd3': return '7susadd3';
    case '7b9b13': return '7b9b13';
    case '7b9#5': return '7b9#5';
    case '713add': return '713add';

    default: return suffix;
  }
}

export function parseSingleChordString(raw: string): ChordSlot {
  if (typeof raw !== 'string') {
    return { root: 0, accidental: 'natural', suffix: '', isEmpty: true };
  }
  let t = raw.trim();

  // Strip out any parenthesized optional alternative chords (e.g. "(Am7)", "(G7)", "(Bb)")
  t = t.replace(/\(\s*[A-G][^)]*\)/g, '').trim();

  if (!t || t === '.' || t === '/' || t === '-' || t === '_') {
    return { root: 0, accidental: 'natural', suffix: '', isEmpty: true };
  }

  // Handle slash chord parsing (e.g. Cmin7/Eb)
  let mainPart = t;
  let slashPart = '';
  if (t.includes('/')) {
    const parts = t.split('/');
    mainPart = parts[0].trim();
    slashPart = parts[1]?.trim() || '';
  }

  let rootStr = '';
  let rest = '';

  if (mainPart.length > 0) {
    const first = mainPart[0].toUpperCase();
    if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(first)) {
      rootStr = first;
      let nextIdx = 1;
      const char1 = mainPart[1];
      const isSus = char1 && (char1 === 's' || char1 === 'S') && mainPart.substring(1).toLowerCase().startsWith('sus');
      if (char1 === '#' || char1 === '♯' || ((char1 === 's' || char1 === 'S') && !isSus)) {
        rootStr += '#';
        nextIdx = 2;
      } else if (char1 === 'b' || char1 === '♭' || char1 === 'f' || char1 === 'F') {
        rootStr += 'b';
        nextIdx = 2;
      }
      rest = mainPart.substring(nextIdx);
    }
  }

  if (!rootStr) {
    return { root: 0, accidental: 'natural', suffix: '', isEmpty: true };
  }

  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  let rootIdx = sharps.indexOf(rootStr);
  if (rootIdx === -1) {
    rootIdx = flats.indexOf(rootStr);
  }
  const rootVal = rootIdx !== -1 ? rootIdx : 0;
  
  // High fidelity accidental preservation
  let accidental: 'sharp' | 'flat' | 'natural' = 'natural';
  if (rootStr.endsWith('#') || rootStr.endsWith('♯')) {
    accidental = 'sharp';
  } else if (rootStr.endsWith('b') || rootStr.endsWith('♭')) {
    accidental = 'flat';
  }

  const suffix = rest.trim();
  const norm = suffix.replace(/♭/g, 'b').replace(/♯/g, '#').replace(/ /g, '').trim();

  // Precise normalized map matching exactly the screenshot
  const NORM_SUFFIX_MAP: { [key: string]: string } = {
    'maj7': 'maj7', 'Δ7': 'maj7', 'm7': 'min7', '-7': 'min7', 'min7': 'min7',
    'ø7': 'm7b5', 'h7': 'm7b5', 'm7b5': 'm7b5', 'min7b5': 'm7b5',
    'o7': 'dim7', 'dim7': 'dim7', '7': '7',
    'm': 'min', 'min': 'min', '-': 'min',
    'o': 'dim', 'dim': 'dim',
    '+': 'aug', 'aug': 'aug',
    '6': '6', '6/9': '6/9', '69': '6/9',
    
    'm9': 'min9', 'min9': 'min9', '-9': 'min9',
    'm6': 'min6', 'min6': 'min6', '-6': 'min6',
    'm6/9': 'min6/9', 'min6/9': 'min6/9', '-6/9': 'min6/9', '-69': 'min6/9',
    'm7b6': 'min7b6', 'min7b6': 'min7b6', '-7b6': 'min7b6',
    'm9b6': 'min9b6', 'min9b6': 'min9b6', '-9b6': 'min9b6',
    'm11': 'min11', 'min11': 'min11', '-11': 'min11',
    'm13': 'min13', 'min13': 'min13', '-13': 'min13',
    'mb6': 'minb6', 'minb6': 'minb6', '-b6': 'minb6',
    'm#5': 'min#5', 'min#5': 'min#5', '-#5': 'min#5',
    'ø9': 'm9b5', 'm9b5': 'm9b5', 'min9b5': 'm9b5',
    'mΔ7': 'minmaj7', 'minmaj7': 'minmaj7', '-Δ7': 'minmaj7',
    'mΔ9': 'minmaj9', 'minmaj9': 'minmaj9', '-Δ9': 'minmaj9',
    'mΔ11': 'minmaj11', 'minmaj11': 'minmaj11', '-Δ11': 'minmaj11',
    'mΔ13': 'minmaj13', 'minmaj13': 'minmaj13', '-Δ13': 'minmaj13',
    'oΔ7': 'dimmaj7', 'dimmaj7': 'dimmaj7',
    'madd2': 'minadd2', 'minadd2': 'minadd2', '-add2': 'minadd2',
    'madd4': 'minadd4', 'minadd4': 'minadd4', '-add4': 'minadd4',

    'Δ7#11': 'maj7#11', 'maj7#11': 'maj7#11',
    'Δ7b5': 'maj7b5', 'maj7b5': 'maj7b5',
    'Δ7#5': 'maj7#5', 'maj7#5': 'maj7#5',
    'Δ7#9': 'maj7#9', 'maj7#9': 'maj7#9',
    'Δ9': 'maj9', 'maj9': 'maj9',
    'Δ9#11': 'maj9#11', 'maj9#11': 'maj9#11',
    'Δ13': 'maj13', 'maj13': 'maj13',
    'Δ13#11': 'maj13#11', 'maj13#11': 'maj13#11',

    '9': '9', '7alt': '7alt', 'alt7': '7alt', 'alt': '7alt',
    '7b9': '7b9', '7#9': '7#9', '7sus': '7sus', '7sus4': '7sus',
    'sus2': 'sus2', 'sus4': 'sus4', 'sus': 'sus4',
    'add2': 'add2', 'add4': 'add4', '5': '5',
    '9sus': '9sus', '9sus4': '9sus',
    '13sus': '13sus', '13sus4': '13sus',
    '7#11': '7#11', '7b5': '7b5', '7#5': '7#5', '7b13': '7b13',
    '7#9#11': '7#9#11', '9#11': '9#11', '9b5': '9b5', '9#5': '9#5',
    '7#9b5': '7#9b5', '7#9#5': '7#9#5', '7b9#11': '7b9#11',
    '7b9b5': '7b9b5', '7b9#9': '7b9#9', '13': '13',
    '13#11': '13#11', '13#9': '13#9', '13b9': '13b9',

    '7susb9': '7susb9', '7susb9b13': '7susb9b13', '7susadd3': '7susadd3',
    '7b9b13': '7b9b13', '7b9#5': '7b9#5', '713add': '713add'
  };

  let mappedSuffix = '';
  if (NORM_SUFFIX_MAP[norm]) {
    mappedSuffix = NORM_SUFFIX_MAP[norm];
  } else {
    // Fallback parsing
    if (norm.startsWith('m') || norm.startsWith('-')) {
      mappedSuffix = 'min';
    } else {
      mappedSuffix = '';
    }
  }

  let slashRoot: number | null = null;
  let slashAccidental: 'sharp' | 'flat' | 'natural' | null = null;

  if (slashPart) {
    const firstS = slashPart[0].toUpperCase();
    if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(firstS)) {
      let slashRootStr = firstS;
      const sChar1 = slashPart[1];
      const sIsSus = sChar1 && (sChar1 === 's' || sChar1 === 'S') && slashPart.substring(1).toLowerCase().startsWith('sus');
      if (sChar1 === '#' || sChar1 === '♯' || ((sChar1 === 's' || sChar1 === 'S') && !sIsSus)) {
        slashRootStr += '#';
      } else if (sChar1 === 'b' || sChar1 === '♭' || sChar1 === 'f' || sChar1 === 'F') {
        slashRootStr += 'b';
      }
      let sRootIdx = sharps.indexOf(slashRootStr);
      if (sRootIdx === -1) {
        sRootIdx = flats.indexOf(slashRootStr);
      }
      if (sRootIdx !== -1) {
        slashRoot = sRootIdx;
        let sAccValue: 'sharp' | 'flat' | 'natural' = 'natural';
        if (slashRootStr.endsWith('#') || slashRootStr.endsWith('♯')) {
          sAccValue = 'sharp';
        } else if (slashRootStr.endsWith('b') || slashRootStr.endsWith('♭')) {
          sAccValue = 'flat';
        }
        slashAccidental = sAccValue;
      }
    }
  }

  return {
    root: rootVal,
    accidental,
    suffix: mappedSuffix,
    isEmpty: false,
    slashRoot,
    slashAccidental
  };
}

export function importSongFromJSON(jsonString: string): Song {
  const data = JSON.parse(jsonString);
  
  // Robust Title extraction fallback
  const rawTitle = data.title || data.name || data.songTitle || data.song_title || data.chartName;
  if (!rawTitle) {
    throw new Error("Missing title in song schema");
  }

  const id = data.id || ('song_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
  const title = String(rawTitle);
  const rawKey = String(data.key || data.keySignature || data.originalKey || 'C').trim();
  let key = rawKey;
  if (rawKey) {
    if (!rawKey.includes(' ')) {
      if (rawKey.endsWith('m') || rawKey.endsWith('min') || rawKey.endsWith('Min') || (rawKey.length > 1 && rawKey.toLowerCase() === rawKey && !rawKey.endsWith('#') && !rawKey.endsWith('b'))) {
        const letter = rawKey.replace(/min|Min|m/g, '').trim() || 'C';
        key = (letter[0].toUpperCase() + letter.slice(1)) + ' Min';
      } else {
        key = rawKey + ' Maj';
      }
    }
  } else {
    key = 'C Maj';
  }
  
  const timeSignature = data.timeSignature ? String(data.timeSignature).trim() : '4/4';
  
  let subheading = data.subheading ? String(data.subheading) : (data.subtitle ? String(data.subtitle) : (data.subTitle ? String(data.subTitle) : undefined));
  
  // Rule: If "Baptist Hymnal" or "Hymn Booklet" followed by a number is detected in ANY field, it MUST be the subheading.
  const hymnalRegex = /(?:(?:\d{4})\s+)?(?:Baptist\s+Hymnal|Hymn\s+Booklet)(?:\s+(?:No\.?|#)?\s*\d+)?/i;
  let detectedHymnal: string | undefined = undefined;
  const candidates = [
    data.subheading,
    data.subtitle,
    data.subTitle,
    data.title,
    data.name,
    data.songTitle,
    data.song_title,
    data.chartName
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string') {
      const match = c.match(hymnalRegex);
      if (match) {
        detectedHymnal = match[0].trim();
        break;
      }
    }
  }
  if (detectedHymnal) {
    subheading = detectedHymnal;
  }
  
  let beatsPerMeasure = 4;
  const beatsMatch = timeSignature.match(/^(\d+)/);
  if (beatsMatch) {
    const num = parseInt(beatsMatch[1], 10);
    if (num >= 2 && num <= 12) {
      beatsPerMeasure = num;
    }
  }

  let grid: Measure[] = [];

  // 1. Gather rawMeasures from any standard measures input
  let rawMeasures: any[] = Array.isArray(data.measures) 
    ? data.measures 
    : (Array.isArray(data.chords) 
        ? data.chords 
        : (Array.isArray(data.progression) ? data.progression : []));

  // 2. Identify if rawMeasures is a flat 1D array of single beat-level items rather than measures.
  // If it's a flat array of strings and contains '.' (dots), or is longer than 32 elements, we should group it into actual measures!
  let isNested = rawMeasures.some(item => 
    Array.isArray(item) || 
    (typeof item === 'string' && item.trim().split(/\s+/).filter(t => t && !t.startsWith('/')).length > 1)
  );

  if (!isNested && rawMeasures.length > 0) {
    const hasDots = rawMeasures.some(item => typeof item === 'string' && (item.trim() === '.' || item.trim() === ''));
    if (hasDots || rawMeasures.length > 32) {
      // Chunk rawMeasures into groups of beatsPerMeasure
      const chunked: any[] = [];
      for (let i = 0; i < rawMeasures.length; i += beatsPerMeasure) {
        chunked.push(rawMeasures.slice(i, i + beatsPerMeasure));
      }
      rawMeasures = chunked;
      isNested = true;
    }
  }

  // 3. Populate grid from rawMeasures if present
  if (rawMeasures.length > 0) {
    if (isNested) {
      grid = rawMeasures.map((measureItem) => {
        const mRawBeats = Array.isArray(measureItem) 
          ? measureItem 
          : (measureItem ? [measureItem] : []);

        // Robust space-separated token splitting & slash attachment logic
        const mBeats: string[] = [];
        for (const rawBeat of mRawBeats) {
          const str = String(rawBeat || '').trim();
          if (!str) continue;
          const tokens = str.split(/\s+/);
          for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.startsWith('/') && mBeats.length > 0) {
              mBeats[mBeats.length - 1] = mBeats[mBeats.length - 1] + token;
            } else {
              mBeats.push(token);
            }
          }
        }

        const slots: ChordSlot[] = [];
        
        // Let's distribute mBeats into a stable beatsPerMeasure physical layout
        if (beatsPerMeasure === 4) {
          if (mBeats.length === 1) {
            slots.push(parseSingleChordString(String(mBeats[0])));
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
          } else if (mBeats.length === 2) {
            slots.push(parseSingleChordString(String(mBeats[0])));
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
            slots.push(parseSingleChordString(String(mBeats[1])));
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
          } else if (mBeats.length === 3) {
            slots.push(parseSingleChordString(String(mBeats[0])));
            slots.push(parseSingleChordString(String(mBeats[1])));
            slots.push(parseSingleChordString(String(mBeats[2])));
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
          } else {
            // 4 or more
            for (let i = 0; i < beatsPerMeasure; i++) {
              if (i < mBeats.length) {
                slots.push(parseSingleChordString(String(mBeats[i])));
              } else {
                slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
              }
            }
          }
        } else if (beatsPerMeasure === 3) {
          if (mBeats.length === 1) {
            slots.push(parseSingleChordString(String(mBeats[0])));
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
          } else if (mBeats.length === 2) {
            slots.push(parseSingleChordString(String(mBeats[0])));
            slots.push(parseSingleChordString(String(mBeats[1])));
            slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
          } else {
            for (let i = 0; i < beatsPerMeasure; i++) {
              if (i < mBeats.length) {
                slots.push(parseSingleChordString(String(mBeats[i])));
              } else {
                slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
              }
            }
          }
        } else {
          // General fallback distribution for other time signatures
          for (let i = 0; i < beatsPerMeasure; i++) {
            if (i < mBeats.length) {
              slots.push(parseSingleChordString(String(mBeats[i])));
            } else {
              slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
            }
          }
        }

        return {
          id: 'measure_' + Math.random().toString(36).substr(2, 9),
          slots,
          label: measureItem && typeof measureItem === 'object' && !Array.isArray(measureItem) && measureItem.label ? String(measureItem.label) : undefined
        };
      });
    } else {
      // Flat array of strings: each element is exactly 1 measure containing 1 chord!
      grid = rawMeasures.map((chordItem) => {
        const chordStr = String(chordItem || '');
        const slots: ChordSlot[] = [];
        slots.push(parseSingleChordString(chordStr));
        for (let i = 1; i < beatsPerMeasure; i++) {
          slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
        }
        return {
          id: 'measure_' + Math.random().toString(36).substr(2, 9),
          slots
        };
      });
    }
  } else if (Array.isArray(data.grid)) {
    // Fallback: If no rawMeasures are present at all, parse from grid directly
    grid = data.grid.map((m: any) => {
      let slots: ChordSlot[] = [];
      if (Array.isArray(m.slots)) {
        slots = m.slots.map((s: any) => {
          if (typeof s.root === 'string' || Number.isNaN(Number(s.root))) {
            const parsed = parseSingleChordString(String(s.root) + (s.suffix || ''));
            return {
              root: parsed.root,
              accidental: parsed.accidental,
              suffix: s.suffix || parsed.suffix || '',
              isEmpty: s.isEmpty !== undefined ? !!s.isEmpty : parsed.isEmpty,
              slashRoot: s.slashRoot !== undefined ? s.slashRoot : parsed.slashRoot,
              slashAccidental: s.slashAccidental !== undefined ? s.slashAccidental : parsed.slashAccidental,
              sizePercent: s.sizePercent !== undefined ? Number(s.sizePercent) : undefined,
              isSmall: s.isSmall !== undefined ? !!s.isSmall : undefined
            };
          }
          return {
            root: Number(s.root) || 0,
            accidental: s.accidental || 'natural',
            suffix: String(s.suffix ?? ''),
            isEmpty: !!s.isEmpty,
            slashRoot: s.slashRoot !== undefined ? s.slashRoot : null,
            slashAccidental: s.slashAccidental !== undefined ? s.slashAccidental : null,
            sizePercent: s.sizePercent !== undefined ? Number(s.sizePercent) : undefined,
            isSmall: s.isSmall !== undefined ? !!s.isSmall : undefined
          };
        });
      }

      while (slots.length < beatsPerMeasure) {
        slots.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
      }
      return {
        id: m.id || ('measure_' + Math.random().toString(36).substr(2, 9)),
        slots: slots.slice(0, beatsPerMeasure),
        label: m.label ? String(m.label) : undefined
      };
    });
  }

  // 4. Overlaid Grid Merging: If BOTH rawMeasures and data.grid were loaded/supplied, 
  // let's layer the high-fidelity properties (isSmall, sizePercent) onto the robustly-built grid.
  if (rawMeasures.length > 0 && Array.isArray(data.grid)) {
    data.grid.forEach((m: any, i: number) => {
      if (grid[i]) {
        if (m.label && !grid[i].label) {
          grid[i].label = String(m.label);
        }
        if (Array.isArray(m.slots)) {
          m.slots.forEach((s: any, j: number) => {
            if (grid[i].slots[j]) {
              if (s.isSmall !== undefined) {
                grid[i].slots[j].isSmall = !!s.isSmall;
              }
              if (s.sizePercent !== undefined) {
                grid[i].slots[j].sizePercent = Number(s.sizePercent);
              }
            }
          });
        }
      }
    });
  }

  // 3. Apply sections if provided (mapping index to label)
  if (Array.isArray(data.sections)) {
    data.sections.forEach((sec: any) => {
      const idx = Number(sec.index);
      if (idx >= 0 && idx < grid.length && sec.label) {
        grid[idx].label = formatSectionLabelString(String(sec.label));
      }
    });
  }

  // Pad to 128 measures
  while (grid.length < 128) {
    grid.push({
      id: 'measure_' + Math.random().toString(36).substr(2, 9),
      slots: Array.from({ length: beatsPerMeasure }, () => ({
        root: 0,
        accidental: 'natural',
        suffix: '',
        isEmpty: true
      }))
    });
  }
  grid = grid.slice(0, 128);

  return {
    id,
    title,
    key,
    timeSignature,
    grid,
    folderId: data.folderId || null,
    subheading,
    referenceImage: data.referenceImage || undefined,
    referenceImageName: data.referenceImageName || undefined,
    referencePrompt: data.referencePrompt || undefined,
    referenceJSON: data.referenceJSON || undefined,
    referenceFileName: data.referenceFileName || undefined,
    notesReharm: data.notesReharm || undefined,
    notesVoicings: data.notesVoicings || undefined,
    notesImprov: data.notesImprov || undefined,
  };
}

