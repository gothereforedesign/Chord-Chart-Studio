/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Song, Measure, ChordSlot } from './types';

// Helper to create an empty measure with empty chord slots based on time signature
export function createEmptyMeasure(timeSignature: string = '4/4'): Measure {
  let length = 4;
  const match = String(timeSignature).match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 2 && num <= 12) {
      length = num;
    }
  }
  return {
    id: 'measure_' + Math.random().toString(36).substr(2, 9),
    slots: Array.from({ length }, () => ({
      root: 0,
      accidental: 'natural',
      suffix: 'maj7',
      isEmpty: true
    }))
  };
}

// Helper to make a filled slot
export function makeSlot(root: number, suffix: string, accidental: 'natural' | 'sharp' | 'flat' = 'natural'): ChordSlot {
  return {
    root,
    accidental,
    suffix,
    isEmpty: false
  };
}

// Helper to make an empty slot
export function makeEmptySlot(): ChordSlot {
  return {
    root: 0,
    accidental: 'natural',
    suffix: '',
    isEmpty: true
  };
}

export function generateSampleSVGReference(title: string, key: string, chordsCsv: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="100%" height="100%" style="background-color:%23FAF6EE; font-family:Georgia, serif;">
  <rect x="25" y="25" width="750" height="1050" fill="none" stroke="%233A3025" stroke-width="2" rx="4"/>
  <rect x="30" y="30" width="740" height="1040" fill="none" stroke="%233A3025" stroke-width="0.5" rx="2"/>
  
  <text x="400" y="90" text-anchor="middle" font-size="28" font-weight="extrabold" fill="%230F172A" letter-spacing="1">CHORD REFERENCE SCORE</text>
  <text x="400" y="130" text-anchor="middle" font-size="34" font-weight="950" font-family="'Times New Roman', Times, serif" fill="%230c4a6e" font-style="italic">${title}</text>
  <text x="400" y="160" text-anchor="middle" font-size="14" font-weight="bold" fill="%2364748b" letter-spacing="2">KEY: ${key} | TIME: 4/4</text>
  
  <line x1="100" y1="185" x2="700" y2="185" stroke="%233A3025" stroke-width="1.5" stroke-dasharray="4,4"/>
  
  <text x="400" y="215" text-anchor="middle" font-size="11" font-weight="bold" fill="%233A3025" letter-spacing="1.5">VIRTUOSO PRACTICE SUITE — HAND-ENGRAVED MANUSCRIPT</text>
  
  <g transform="translate(80, 260)">
    <line x1="0" y1="0" x2="640" y2="0" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="10" x2="640" y2="10" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="20" x2="640" y2="20" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="30" x2="640" y2="30" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="40" x2="640" y2="40" stroke="%23475569" stroke-width="1"/>
    
    <path d="M 12 45 C 15 45, 18 35, 15 25 C 12 15, 5 10, 8 2 C 10 -5, 16 -5, 14 15 C 12 35, 22 40, 20 50 C 18 60, 5 55, 12 45 Z" fill="none" stroke="%23000" stroke-width="2.5" transform="scale(0.85) translate(10, -5)"/>
    
    <line x1="0" y1="0" x2="0" y2="40" stroke="%23000" stroke-width="2"/>
    <line x1="210" y1="0" x2="210" y2="40" stroke="%23475569" stroke-width="1.5"/>
    <line x1="430" y1="0" x2="430" y2="40" stroke="%23475569" stroke-width="1.5"/>
    <line x1="640" y1="0" x2="640" y2="40" stroke="%23000" stroke-width="2"/>
    
    <text x="40" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[0] || ''}</text>
    <text x="250" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[1] || ''}</text>
    <text x="470" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[2] || ''}</text>

    <ellipse cx="60" cy="20" rx="6" ry="4" fill="%230F172A" />
    <line x1="66" y1="20" x2="66" y2="-15" stroke="%23000" stroke-width="1.5"/>
    
    <ellipse cx="120" cy="15" rx="6" ry="4" fill="%230F172A" />
    <line x1="126" y1="15" x2="126" y2="-20" stroke="%23000" stroke-width="1.5"/>

    <ellipse cx="270" cy="10" rx="6" ry="4" fill="%230F172A" />
    <line x1="276" y1="10" x2="276" y2="-25" stroke="%23000" stroke-width="1.5"/>

    <ellipse cx="490" cy="25" rx="6" ry="4" fill="%230F172A" />
    <line x1="496" y1="25" x2="496" y2="-10" stroke="%23000" stroke-width="1.5"/>
  </g>
  
  <g transform="translate(80, 440)">
    <line x1="0" y1="0" x2="640" y2="0" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="10" x2="640" y2="10" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="20" x2="640" y2="20" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="30" x2="640" y2="30" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="40" x2="640" y2="40" stroke="%23475569" stroke-width="1"/>
    
    <line x1="0" y1="0" x2="0" y2="40" stroke="%23000" stroke-width="2"/>
    <line x1="210" y1="0" x2="210" y2="40" stroke="%23475569" stroke-width="1.5"/>
    <line x1="430" y1="0" x2="430" y2="40" stroke="%23475569" stroke-width="1.5"/>
    <line x1="640" y1="0" x2="640" y2="40" stroke="%23000" stroke-width="2"/>
    
    <text x="40" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[3] || ''}</text>
    <text x="250" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[4] || ''}</text>
    <text x="470" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[5] || ''}</text>

    <ellipse cx="80" cy="15" rx="6" ry="4" fill="%230F172A" />
    <line x1="86" y1="15" x2="86" y2="-20" stroke="%23000" stroke-width="1.5"/>
    
    <ellipse cx="290" cy="20" rx="6" ry="4" fill="%230F172A" />
    <line x1="296" y1="20" x2="296" y2="-15" stroke="%23000" stroke-width="1.5"/>
  </g>

  <g transform="translate(80, 620)">
    <line x1="0" y1="0" x2="640" y2="0" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="10" x2="640" y2="10" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="20" x2="640" y2="20" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="30" x2="640" y2="30" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="40" x2="640" y2="40" stroke="%23475569" stroke-width="1"/>
    
    <line x1="0" y1="0" x2="0" y2="40" stroke="%23000" stroke-width="2"/>
    <line x1="210" y1="0" x2="210" y2="40" stroke="%23475569" stroke-width="1.5"/>
    <line x1="430" y1="0" x2="430" y2="40" stroke="%23475569" stroke-width="1.5"/>
    <line x1="640" y1="0" x2="640" y2="40" stroke="%23000" stroke-width="2"/>
    
    <text x="40" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[6] || ''}</text>
    <text x="250" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[7] || ''}</text>
    <text x="470" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[8] || ''}</text>
  </g>

  <g transform="translate(80, 800)">
    <line x1="0" y1="0" x2="640" y2="0" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="10" x2="640" y2="10" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="20" x2="640" y2="20" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="30" x2="640" y2="30" stroke="%23475569" stroke-width="1"/>
    <line x1="0" y1="40" x2="640" y2="40" stroke="%23475569" stroke-width="1"/>
    
    <line x1="0" y1="0" x2="0" y2="40" stroke="%23000" stroke-width="2"/>
    <line x1="210" y1="0" x2="210" y2="40" stroke="%23475569" stroke-width="1.5"/>
    <line x1="430" y1="0" x2="430" y2="40" stroke="%23475569" stroke-width="1.5"/>
    <line x1="640" y1="0" x2="640" y2="40" stroke="%23000" stroke-width="2"/>
    
    <text x="40" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[9] || ''}</text>
    <text x="250" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[10] || ''}</text>
    <text x="470" y="-15" font-size="18" font-weight="900" fill="%230c4a6e" font-family="sans-serif">${chordsCsv.split(',')[11] || ''}</text>
  </g>
  
  <line x1="50" y1="1010" x2="750" y2="1010" stroke="%233A3025" stroke-width="0.5"/>
  <text x="400" y="1035" text-anchor="middle" font-size="11" font-weight="bold" fill="%2364748b" letter-spacing="1">ARCHIVAL TRANSCRIPT — PROPERTY OF VIRTUOSO PRACTICE SUITE</text>
  <text x="400" y="1050" text-anchor="middle" font-size="9.5" font-weight="bold" fill="%2394a3b8">DISTRIBUTION RESTRICTED • FOR PERSONAL SCHOLARLY STUDY ONLY</text>
</svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

export const DEFAULT_SONGS: Song[] = [
  {
    id: 'a_mighty_fortress',
    title: 'A Mighty Fortress',
    key: 'C Maj',
    folderId: 'hymns',
    referenceImage: generateSampleSVGReference('A Mighty Fortress', 'C Maj', 'C,G,C,F,C,G,C,C,F,C,Dm,G,C,G,C,C'),
    referenceImageName: 'a_mighty_fortress.svg',
    grid: [
      { id: 'amf_m1', slots: [makeSlot(0, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'amf_m2', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(0, ''), makeEmptySlot()] },
      { id: 'amf_m3', slots: [makeSlot(5, ''), makeEmptySlot(), makeSlot(0, ''), makeEmptySlot()] },
      { id: 'amf_m4', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(0, ''), makeEmptySlot()] },
      { id: 'amf_m5', slots: [makeSlot(0, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'amf_m6', slots: [makeSlot(5, ''), makeEmptySlot(), makeSlot(0, ''), makeEmptySlot()] },
      { id: 'amf_m7', slots: [makeSlot(2, 'min'), makeEmptySlot(), makeSlot(7, ''), makeEmptySlot()] },
      { id: 'amf_m8', slots: [makeSlot(0, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'amf_m9', slots: [makeSlot(0, ''), makeEmptySlot(), makeSlot(7, ''), makeEmptySlot()] },
      { id: 'amf_m10', slots: [makeSlot(0, ''), makeEmptySlot(), makeSlot(5, ''), makeEmptySlot()] },
      { id: 'amf_m11', slots: [makeSlot(0, ''), makeEmptySlot(), makeSlot(7, ''), makeEmptySlot()] },
      { id: 'amf_m12', slots: [makeSlot(0, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'amf_m13', slots: [makeSlot(9, 'min'), makeEmptySlot(), makeSlot(5, ''), makeEmptySlot()] },
      { id: 'amf_m14', slots: [makeSlot(0, ''), makeEmptySlot(), makeSlot(7, ''), makeEmptySlot()] },
      { id: 'amf_m15', slots: [makeSlot(0, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'amf_m16', slots: [makeSlot(0, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'great_is_thy_faithfulness',
    title: 'Great Is Thy Faithfulness',
    key: 'Eb Maj',
    folderId: 'hymns',
    referenceImage: generateSampleSVGReference('Great Is Thy Faithfulness', 'E♭ Maj', 'A♭,D♭/E♭,A♭,B♭7,E♭,A♭,E♭/B♭7,E♭,B♭7,E♭,C7,Fm,B♭7,E♭,A♭/B♭7,E♭'),
    referenceImageName: 'great_is_thy_faithfulness.svg',
    grid: [
      { id: 'gitf_m1', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m2', slots: [makeSlot(1, '', 'flat'), makeEmptySlot(), makeSlot(3, '', 'flat'), makeEmptySlot()] },
      { id: 'gitf_m3', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m4', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m5', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m6', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m7', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] },
      { id: 'gitf_m8', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m9', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m10', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m11', slots: [makeSlot(0, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m12', slots: [makeSlot(5, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m13', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m14', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'gitf_m15', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] },
      { id: 'gitf_m16', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'amazing_grace',
    title: 'Amazing Grace',
    key: 'G Maj',
    timeSignature: '3/4',
    folderId: 'hymns',
    referenceImage: generateSampleSVGReference('Amazing Grace', 'G Maj', 'G,G,C,G,G,G,D7,D7,G,G,C,G,Em,D7,G,G'),
    referenceImageName: 'amazing_grace.svg',
    grid: [
      { id: 'ag_m1', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m2', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m3', slots: [makeSlot(0, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m4', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m5', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m6', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m7', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m8', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m9', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m10', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m11', slots: [makeSlot(0, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m12', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m13', slots: [makeSlot(9, 'min'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m14', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m15', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ag_m16', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'how_firm_a_foundation',
    title: 'How Firm A Foundation',
    key: 'Ab Maj',
    folderId: 'hymns',
    referenceImage: generateSampleSVGReference('How Firm A Foundation', 'A♭ Maj', 'A♭,A♭/D♭,A♭,E♭,A♭,A♭/D♭,A♭/E♭,A♭,A♭/D♭,A♭,A♭,E♭,A♭,D♭,A♭/E♭,A♭'),
    referenceImageName: 'how_firm_a_foundation.svg',
    grid: [
      { id: 'hfaf_m1', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m2', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeSlot(1, '', 'flat'), makeEmptySlot()] },
      { id: 'hfaf_m3', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m4', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m5', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m6', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeSlot(1, '', 'flat'), makeEmptySlot()] },
      { id: 'hfaf_m7', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeSlot(3, '', 'flat'), makeEmptySlot()] },
      { id: 'hfaf_m8', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m9', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeSlot(1, '', 'flat'), makeEmptySlot()] },
      { id: 'hfaf_m10', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m11', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m12', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m13', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m14', slots: [makeSlot(1, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hfaf_m15', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeSlot(3, '', 'flat'), makeEmptySlot()] },
      { id: 'hfaf_m16', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'be_thou_my_vision',
    title: 'Be Thou My Vision',
    key: 'Eb Maj',
    timeSignature: '3/4',
    folderId: 'hymns',
    referenceImage: generateSampleSVGReference('Be Thou My Vision', 'E♭ Maj', 'E♭,Fm7,E♭,B♭,E♭,A♭,E♭,E♭,Cm,B♭,A♭,B♭7,E♭,Fm7,B♭7,E♭'),
    referenceImageName: 'be_thou_my_vision.svg',
    grid: [
      { id: 'btmv_m1', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m2', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m3', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m4', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m5', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m6', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m7', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m8', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m9', slots: [makeSlot(0, 'min'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m10', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m11', slots: [makeSlot(8, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m12', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m13', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m14', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m15', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot()] },
      { id: 'btmv_m16', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'how_great_thou_art',
    title: 'How Great Thou Art',
    key: 'Bb Maj',
    folderId: 'hymns',
    referenceImage: generateSampleSVGReference('How Great Thou Art', 'B♭ Maj', 'B♭,B♭,E♭,E♭,F7,F7,B♭,B♭,B♭,E♭,B♭,B♭,Cm7,F7,B♭,B♭'),
    referenceImageName: 'how_great_thou_art.svg',
    grid: [
      { id: 'hgta_m1', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m2', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m3', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m4', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m5', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m6', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m7', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m8', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m9', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m10', slots: [makeSlot(3, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m11', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m12', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m13', slots: [makeSlot(0, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m14', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m15', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'hgta_m16', slots: [makeSlot(10, '', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'brethren_we_have_met',
    title: 'Brethren We Have Met To Worship',
    key: 'G Maj',
    folderId: 'hymns',
    referenceImage: generateSampleSVGReference('Brethren We Have Met', 'G Maj', 'G,G/D,G,C/G,G,G/D,G,G,G/Am,G/D,G/Am,G/D,G,G/D,G/C,G'),
    referenceImageName: 'brethren_we_have_met.svg',
    grid: [
      { id: 'bwhm_m1', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'bwhm_m2', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, ''), makeEmptySlot()] },
      { id: 'bwhm_m3', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'bwhm_m4', slots: [makeSlot(0, ''), makeEmptySlot(), makeSlot(7, ''), makeEmptySlot()] },
      { id: 'bwhm_m5', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'bwhm_m6', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, ''), makeEmptySlot()] },
      { id: 'bwhm_m7', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'bwhm_m8', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'bwhm_m9', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(9, 'min'), makeEmptySlot()] },
      { id: 'bwhm_m10', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, ''), makeEmptySlot()] },
      { id: 'bwhm_m11', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(9, 'min'), makeEmptySlot()] },
      { id: 'bwhm_m12', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, ''), makeEmptySlot()] },
      { id: 'bwhm_m13', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'bwhm_m14', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, ''), makeEmptySlot()] },
      { id: 'bwhm_m15', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(0, ''), makeEmptySlot()] },
      { id: 'bwhm_m16', slots: [makeSlot(7, ''), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'come_thou_fount',
    title: 'Come Thou Fount',
    key: 'D Maj',
    timeSignature: '3/4',
    folderId: 'hymns',
    referenceImage: generateSampleSVGReference('Come Thou Fount', 'D Maj', 'D,D/A,G/D,A7/D,D,D/A,G/D,A7/D,D,Bm/A,G/D,G/A7,D,Bm/A,G/D,A7/D'),
    referenceImageName: 'come_thou_fount.svg',
    grid: [
      { id: 'ctf_m1', slots: [makeSlot(2, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ctf_m2', slots: [makeSlot(2, ''), makeEmptySlot(), makeSlot(9, '')] },
      { id: 'ctf_m3', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, '')] },
      { id: 'ctf_m4', slots: [makeSlot(9, '7'), makeEmptySlot(), makeSlot(2, '')] },
      { id: 'ctf_m5', slots: [makeSlot(2, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ctf_m6', slots: [makeSlot(2, ''), makeEmptySlot(), makeSlot(9, '')] },
      { id: 'ctf_m7', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, '')] },
      { id: 'ctf_m8', slots: [makeSlot(9, '7'), makeEmptySlot(), makeSlot(2, '')] },
      { id: 'ctf_m9', slots: [makeSlot(2, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ctf_m10', slots: [makeSlot(11, 'min'), makeEmptySlot(), makeSlot(9, '')] },
      { id: 'ctf_m11', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, '')] },
      { id: 'ctf_m12', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(9, '7')] },
      { id: 'ctf_m13', slots: [makeSlot(2, ''), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ctf_m14', slots: [makeSlot(11, 'min'), makeEmptySlot(), makeSlot(9, '')] },
      { id: 'ctf_m15', slots: [makeSlot(7, ''), makeEmptySlot(), makeSlot(2, '')] },
      { id: 'ctf_m16', slots: [makeSlot(9, '7'), makeEmptySlot(), makeSlot(2, '')] }
    ]
  },
  {
    id: 'sentimental_reasons',
    title: 'I Love You (For Sentimental Reasons)',
    key: 'F Maj',
    folderId: 'standards',
    referenceImage: generateSampleSVGReference('Sentimental Reasons', 'F Maj', 'Fmaj7,Gm7/C7,Fmaj7,Am7/D7,Gm7,C7,Fmaj7/D7alt,Gm7/C7'),
    referenceImageName: 'sentimental_reasons.svg',
    grid: [
      { id: 'sr_m1', slots: [makeSlot(5, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m2', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeSlot(0, '7'), makeEmptySlot()] },
      { id: 'sr_m3', slots: [makeSlot(5, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m4', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeSlot(2, '7'), makeEmptySlot()] },
      { id: 'sr_m5', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m6', slots: [makeSlot(0, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m7', slots: [makeSlot(5, 'maj7'), makeEmptySlot(), makeSlot(2, '7alt'), makeEmptySlot()] },
      { id: 'sr_m8', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeSlot(0, '7'), makeEmptySlot()] },
      { id: 'sr_m9', slots: [makeSlot(5, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m10', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeSlot(0, '7'), makeEmptySlot()] },
      { id: 'sr_m11', slots: [makeSlot(5, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m12', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeSlot(2, '7'), makeEmptySlot()] },
      { id: 'sr_m13', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m14', slots: [makeSlot(0, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m15', slots: [makeSlot(5, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sr_m16', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeSlot(0, '7'), makeEmptySlot()] }
    ]
  },
  {
    id: 'lazy_bird',
    title: 'Lazy Bird',
    key: 'G Maj',
    folderId: 'standards',
    referenceImage: generateSampleSVGReference('Lazy Bird', 'G Maj', 'Am7,D7,Gmaj7,C7,Fm7,B♭7,E♭maj7,E♭maj7,Am7,D7,Gmaj7,Gmaj7'),
    referenceImageName: 'lazy_bird.svg',
    grid: [
      { id: 'lb_m1', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m2', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m3', slots: [makeSlot(7, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m4', slots: [makeSlot(0, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m5', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m6', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m7', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m8', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m9', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m10', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m11', slots: [makeSlot(7, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m12', slots: [makeSlot(7, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m13', slots: [makeSlot(11, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m14', slots: [makeSlot(4, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m15', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lb_m16', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'lady_bird',
    title: 'Lady Bird',
    key: 'C Maj',
    folderId: 'standards',
    referenceImage: generateSampleSVGReference('Lady Bird', 'C Maj', 'Cmaj7,Fm7,B♭7,Cmaj7,B♭m7,E♭7,A♭maj7,Am7,D7,Dm7,G7,Cmaj7,E♭7,A♭maj7,D♭7'),
    referenceImageName: 'lady_bird.svg',
    grid: [
      { id: 'lady_bird_m1', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m2', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m3', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m4', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m5', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m6', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m7', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m8', slots: [makeSlot(3, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m9', slots: [makeSlot(8, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m10', slots: [makeSlot(8, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m11', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m12', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m13', slots: [makeSlot(2, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m14', slots: [makeSlot(7, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'lady_bird_m15', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeSlot(3, '7', 'flat'), makeEmptySlot()] },
      { id: 'lady_bird_m16', slots: [makeSlot(8, 'maj7', 'flat'), makeEmptySlot(), makeSlot(1, '7', 'flat'), makeEmptySlot()] }
    ]
  },
  {
    id: 'misty',
    title: 'Misty',
    key: 'Eb Maj',
    folderId: 'standards',
    referenceImage: generateSampleSVGReference('Misty', 'E♭ Maj', 'E♭maj7,B♭m7/E♭7,A♭maj7,A♭m7/D♭7,E♭maj7/Cm7,Fm7/B♭7,Gm7/C7,Fm7/B♭7'),
    referenceImageName: 'misty.svg',
    grid: [
      { id: 'mis_m1', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m2', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeSlot(3, '7', 'flat'), makeEmptySlot()] },
      { id: 'mis_m3', slots: [makeSlot(8, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m4', slots: [makeSlot(8, 'min7', 'flat'), makeEmptySlot(), makeSlot(1, '7', 'flat'), makeEmptySlot()] },
      { id: 'mis_m5', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeSlot(0, 'min7'), makeEmptySlot()] },
      { id: 'mis_m6', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] },
      { id: 'mis_m7', slots: [makeSlot(7, 'min7'), makeEmptySlot(), makeSlot(0, '7'), makeEmptySlot()] },
      { id: 'mis_m8', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] },
      { id: 'mis_m9', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m10', slots: [makeSlot(3, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m11', slots: [makeSlot(8, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m12', slots: [makeSlot(8, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m13', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m14', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m15', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mis_m16', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'autumn_leaves',
    title: 'Autumn Leaves',
    key: 'G Min',
    folderId: 'standards',
    referenceImage: generateSampleSVGReference('Autumn Leaves', 'G Min', 'Cm7,F7,B♭maj7,E♭maj7,Am7♭5,D7alt,Gm,Gm,Cm7,F7,B♭maj7,E♭maj7'),
    referenceImageName: 'autumn_leaves_engraving.svg',
    grid: [
      { id: 'al_m1', slots: [makeSlot(0, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m2', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m3', slots: [makeSlot(10, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m4', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m5', slots: [makeSlot(9, 'm7b5'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m6', slots: [makeSlot(2, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m7', slots: [makeSlot(7, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m8', slots: [makeSlot(7, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m9', slots: [makeSlot(0, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m10', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m11', slots: [makeSlot(10, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m12', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m13', slots: [makeSlot(9, 'm7b5'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m14', slots: [makeSlot(2, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m15', slots: [makeSlot(7, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'al_m16', slots: [makeSlot(7, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'fly_me_to_the_moon',
    title: 'Fly Me To The Moon',
    key: 'C Maj',
    folderId: 'standards',
    referenceImage: generateSampleSVGReference('Fly Me To The Moon', 'C Maj', 'Am7,Dm7,G7,Cmaj7,Fmaj7,Bm7♭5,E7alt,Am7/A7,Dm7,G7,Cmaj7,Am7'),
    referenceImageName: 'fly_me_to_the_moon.svg',
    grid: [
      { id: 'fmtm_m1', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m2', slots: [makeSlot(2, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m3', slots: [makeSlot(7, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m4', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m5', slots: [makeSlot(5, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m6', slots: [makeSlot(11, 'm7b5'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m7', slots: [makeSlot(4, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m8', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeSlot(9, '7'), makeEmptySlot()] },
      { id: 'fmtm_m9', slots: [makeSlot(2, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m10', slots: [makeSlot(7, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m11', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m12', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m13', slots: [makeSlot(11, 'm7b5'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m14', slots: [makeSlot(4, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m15', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'fmtm_m16', slots: [makeSlot(11, 'm7b5'), makeEmptySlot(), makeSlot(4, '7alt'), makeEmptySlot()] }
    ]
  },
  {
    id: 'september_in_the_rain',
    title: 'September In The Rain',
    key: 'Eb Maj',
    folderId: 'standards',
    referenceImage: generateSampleSVGReference('September In The Rain', 'E♭ Maj', 'E♭maj7,C7alt,Fm7,B♭7,E♭maj7,C7alt,Fm7,B♭7,B♭m7,E♭7,A♭maj7,D♭7'),
    referenceImageName: 'september_in_the_rain.svg',
    grid: [
      { id: 'sitr_m1', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m2', slots: [makeSlot(0, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m3', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m4', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m5', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m6', slots: [makeSlot(0, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m7', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m8', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m9', slots: [makeSlot(10, 'min7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m10', slots: [makeSlot(3, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m11', slots: [makeSlot(8, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m12', slots: [makeSlot(1, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m13', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m14', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] },
      { id: 'sitr_m15', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'sitr_m16', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] }
    ]
  },
  {
    id: 'all_of_me',
    title: 'All of Me',
    key: 'C Maj',
    folderId: 'standards',
    referenceImage: generateSampleSVGReference('All of Me', 'C Maj', 'Cmaj7,Cmaj7,E7,E7,A7,A7,Dm7,Dm7,E7,E7,Am,Am,D7,D7,Dm7,G7'),
    referenceImageName: 'all_of_me.svg',
    grid: [
      { id: 'aom_m1', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m2', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m3', slots: [makeSlot(4, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m4', slots: [makeSlot(4, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m5', slots: [makeSlot(9, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m6', slots: [makeSlot(9, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m7', slots: [makeSlot(2, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m8', slots: [makeSlot(2, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m9', slots: [makeSlot(4, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m10', slots: [makeSlot(4, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m11', slots: [makeSlot(9, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m12', slots: [makeSlot(9, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m13', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m14', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m15', slots: [makeSlot(2, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'aom_m16', slots: [makeSlot(7, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'ii_v_i',
    title: 'Standard ii-V-I Progression',
    key: 'C Maj',
    folderId: 'practice',
    referenceImage: generateSampleSVGReference('Standard ii-V-I', 'C Maj', 'Dm7,G7,Cmaj7,Cmaj7,Dm7,G7,Cmaj7,Cmaj7,Dm7,G7,Cmaj7,Cmaj7'),
    referenceImageName: 'ii_v_i_engraving.svg',
    grid: [
      { id: 'ivi_m1', slots: [makeSlot(2, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ivi_m2', slots: [makeSlot(7, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ivi_m3', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'ivi_m4', slots: [makeSlot(0, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'minor_ii_v_i',
    title: 'Minor ii-V-i Workout',
    key: 'C Min',
    folderId: 'practice',
    referenceImage: generateSampleSVGReference('Minor ii-V-i', 'C Min', 'Dm7♭5,G7alt,Cm,Cm,Fm7,B♭7,E♭maj7,A♭maj7,Dm7♭5,G7alt,Cm,Cm'),
    referenceImageName: 'minor_ii_v_i_engraving.svg',
    grid: [
      { id: 'mivi_m1', slots: [makeSlot(2, 'm7b5'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m2', slots: [makeSlot(7, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m3', slots: [makeSlot(0, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m4', slots: [makeSlot(0, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m5', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m6', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m7', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m8', slots: [makeSlot(8, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m9', slots: [makeSlot(2, 'm7b5'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m10', slots: [makeSlot(7, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m11', slots: [makeSlot(0, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'mivi_m12', slots: [makeSlot(0, 'min'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'cycle_of_fifths',
    title: 'Dominant Cycle of Fourths',
    key: 'C Maj',
    folderId: 'practice',
    referenceImage: generateSampleSVGReference('Cycle of Fourths', 'C Maj', 'C7,F7,B♭7,E♭7,A♭7,D♭7,F♯7,B7,E7,A7,D7,G7'),
    referenceImageName: 'cycle_of_fifths_engraving.svg',
    grid: [
      { id: 'cof_m1', slots: [makeSlot(0, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m2', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m3', slots: [makeSlot(10, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m4', slots: [makeSlot(3, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m5', slots: [makeSlot(8, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m6', slots: [makeSlot(1, '7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m7', slots: [makeSlot(6, '7', 'sharp'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m8', slots: [makeSlot(11, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m9', slots: [makeSlot(4, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m10', slots: [makeSlot(9, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m11', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cof_m12', slots: [makeSlot(7, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'turnaround_bridge',
    title: 'Turnaround & Bridge Study',
    key: 'Bb Maj',
    folderId: 'practice',
    referenceImage: generateSampleSVGReference('Turnaround & Bridge', 'B♭ Maj', 'B♭maj7,G7alt,Cm7,F7,B♭maj7,G7alt,Cm7,F7,D7,G7,C7,F7'),
    referenceImageName: 'turnaround_bridge_engraving.svg',
    grid: [
      { id: 'tab_m1', slots: [makeSlot(10, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m2', slots: [makeSlot(7, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m3', slots: [makeSlot(0, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m4', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m5', slots: [makeSlot(10, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m6', slots: [makeSlot(7, '7alt'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m7', slots: [makeSlot(0, 'min7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m8', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m9', slots: [makeSlot(2, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m10', slots: [makeSlot(7, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m11', slots: [makeSlot(0, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'tab_m12', slots: [makeSlot(5, '7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] }
    ]
  },
  {
    id: 'coltrane_thirds',
    title: 'Coltrane Major Thirds Steps',
    key: 'C Maj',
    folderId: 'practice',
    referenceImage: generateSampleSVGReference('Coltrane Steps', 'C/Ab/E Maj', 'Bmaj7,D7,Gmaj7,B♭7,E♭maj7,Am7/D7,Gmaj7,B♭7,E♭maj7,F♯7,Bmaj7,F7'),
    referenceImageName: 'coltrane_steps_engraving.svg',
    grid: [
      { id: 'cts_m1', slots: [makeSlot(11, 'maj7'), makeEmptySlot(), makeSlot(2, '7'), makeEmptySlot()] },
      { id: 'cts_m2', slots: [makeSlot(7, 'maj7'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] },
      { id: 'cts_m3', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cts_m4', slots: [makeSlot(9, 'min7'), makeEmptySlot(), makeSlot(2, '7'), makeEmptySlot()] },
      { id: 'cts_m5', slots: [makeSlot(7, 'maj7'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] },
      { id: 'cts_m6', slots: [makeSlot(3, 'maj7', 'flat'), makeEmptySlot(), makeSlot(6, '7', 'sharp'), makeEmptySlot()] },
      { id: 'cts_m7', slots: [makeSlot(11, 'maj7'), makeEmptySlot(), makeEmptySlot(), makeEmptySlot()] },
      { id: 'cts_m8', slots: [makeSlot(5, 'min7'), makeEmptySlot(), makeSlot(10, '7', 'flat'), makeEmptySlot()] }
    ]
  }
];
