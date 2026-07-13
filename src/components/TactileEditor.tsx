/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Undo, Redo, Tag, Music, Clipboard, AlertCircle, Copy, Scissors } from 'lucide-react';
import { ChordSlot, getNoteName, getJazzSuffixSymbol, isFlatKey, formatMusicSymbols, formatChordModifier, KEYS, formatSectionLabelString } from '../types';

interface TactileEditorProps {
  songKey: string;
  selectedMeasureId: string | null;
  selectedSlotIndex: number | null;
  slotData: ChordSlot | null;
  onUpdateSlot: (updatedSlot: ChordSlot) => void;
  onClose: () => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onNavigatePrevMeasure?: () => void;
  onNavigateNextMeasure?: () => void;
  timeSignature?: string;
  onUpdateTimeSignature?: (newSig: '4/4' | '3/4') => void;
  measureNumber: number | null;
  onPaste?: () => void;
  canPaste?: boolean;
  onCopy?: () => void;
  onCut?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentMeasureLabel?: string;
  onUpdateMeasureLabel?: (measureId: string, label: string) => void;
  onTransposeSong: (targetKey: string, transposeChords: boolean) => void;
}

// 30 standard iReal Pro popover suffixes
const POPUP_SUFFIX_GRID = [
  ['5', '2', 'add9', 'aug', 'dim'],
  ['ø', 'sus4', 'maj', 'min', 'maj7'],
  ['min7', '7', '7sus4', 'm7b5', 'dim7'],
  ['dimmaj7', 'maj9', 'maj13', '6', '6/9'],
  ['maj7#11', 'maj9#11', 'maj7#5', 'min6', 'min6/9'],
  ['minmaj7', 'minmaj9', 'min9', 'minadd9', 'min11']
];

// Mapping popover buttons to application strings and screen labels
const SUFFIX_CONFIG: { [key: string]: { value: string, label: string } } = {
  '5': { value: '5', label: '5' },
  '2': { value: '2', label: '2' },
  'add9': { value: 'add9', label: 'add9' },
  'aug': { value: 'aug', label: '+' },
  'dim': { value: 'dim', label: 'o' },
  'ø': { value: 'ø', label: 'ø' },
  'sus4': { value: 'sus4', label: 'sus' },
  'maj': { value: '', label: 'Δ' },
  'min': { value: 'min', label: '–' },
  'maj7': { value: 'maj7', label: 'Δ7' },
  'min7': { value: 'min7', label: '–7' },
  '7': { value: '7', label: '7' },
  '7sus4': { value: '7sus4', label: '7sus' },
  'm7b5': { value: 'm7b5', label: 'ø7' },
  'dim7': { value: 'dim7', label: 'o7' },
  'dimmaj7': { value: 'dimmaj7', label: 'oΔ7' },
  'maj9': { value: 'maj9', label: 'Δ9' },
  'maj13': { value: 'maj13', label: 'Δ13' },
  '6': { value: '6', label: '6' },
  '6/9': { value: '6/9', label: '6/9' },
  'maj7#11': { value: 'maj7#11', label: 'Δ7♯11' },
  'maj9#11': { value: 'maj9#11', label: 'Δ9♯11' },
  'maj7#5': { value: 'maj7#5', label: 'Δ7♯5' },
  'min6': { value: 'min6', label: '–6' },
  'min6/9': { value: 'min6/9', label: '–6/9' },
  'minmaj7': { value: 'minmaj7', label: '–Δ7' },
  'minmaj9': { value: 'minmaj9', label: '–Δ9' },
  'min9': { value: 'min9', label: '–9' },
  'minadd9': { value: 'minadd9', label: '–add9' },
  'min11': { value: 'min11', label: '–11' }
};

function parseChordString(inputStr: string): { root: number; accidental: 'natural' | 'flat' | 'sharp'; suffix: string; slashRoot?: number | null; slashAccidental?: 'flat' | 'sharp' | null; isEmpty: boolean } {
  const clean = inputStr.trim();
  if (!clean) {
    return { root: 0, accidental: 'natural', suffix: '', isEmpty: true, slashRoot: null, slashAccidental: null };
  }

  // Handle slash-only chords (e.g. /A, /F#)
  if (clean.startsWith('/')) {
    const slashLetter = clean.slice(1, 2);
    const slashAcc = clean.slice(2);
    const baseMap: { [key: string]: number } = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    if (slashLetter && baseMap[slashLetter.toUpperCase()] !== undefined) {
      let sRoot = baseMap[slashLetter.toUpperCase()];
      let slashAccidentalVal: 'flat' | 'sharp' | null = null;
      if (slashAcc === 'b' || slashAcc === '♭') {
        slashAccidentalVal = 'flat';
        if (sRoot === 11) sRoot = 10;
        else if (sRoot === 4) sRoot = 3;
        else if (sRoot === 9) sRoot = 8;
        else if (sRoot === 2) sRoot = 1;
        else if (sRoot === 7) sRoot = 6;
      } else if (slashAcc === '#' || slashAcc === '♯') {
        slashAccidentalVal = 'sharp';
        if (sRoot === 0) sRoot = 1;
        else if (sRoot === 2) sRoot = 3;
        else if (sRoot === 5) sRoot = 6;
        else if (sRoot === 7) sRoot = 8;
        else if (sRoot === 9) sRoot = 10;
      }
      return {
        root: -1,
        accidental: 'natural',
        suffix: '',
        slashRoot: sRoot,
        slashAccidental: slashAccidentalVal,
        isEmpty: false
      };
    }
  }

  // Matches Root (A-G), optional accidental (b,#,flat,sharp), optional suffix, optional slash with another root/accidental
  const regex = /^([A-G])(b|#|♭|♯)?([^/]*)(?:\/([A-G])(b|#|♭|♯)?)?$/i;
  const match = clean.match(regex);
  if (!match) {
    return { root: 0, accidental: 'natural', suffix: '', isEmpty: true };
  }

  const [_, rootLetter, acc, suffix, slashLetter, slashAcc] = match;

  const baseMap: { [key: string]: number } = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let root = baseMap[rootLetter.toUpperCase()];
  let accidental: 'natural' | 'flat' | 'sharp' = 'natural';

  if (acc === 'b' || acc === '♭') {
    accidental = 'flat';
    if (root === 11) root = 10;
    else if (root === 4) root = 3;
    else if (root === 9) root = 8;
    else if (root === 2) root = 1;
    else if (root === 7) root = 6;
  } else if (acc === '#' || acc === '♯') {
    accidental = 'sharp';
    if (root === 0) root = 1;
    else if (root === 2) root = 3;
    else if (root === 5) root = 6;
    else if (root === 7) root = 8;
    else if (root === 9) root = 10;
  }

  // Normalize suffix
  let normSuffix = suffix.trim();
  // Map common abbreviations to iReal Pro standard
  if (normSuffix === 'm' || normSuffix === '-') {
    normSuffix = 'min';
  } else if (normSuffix === 'maj' || normSuffix === 'Δ' || normSuffix === 'M') {
    normSuffix = '';
  } else if (normSuffix === 'm7' || normSuffix === '-7') {
    normSuffix = 'min7';
  } else if (normSuffix === 'Δ7' || normSuffix === 'M7') {
    normSuffix = 'maj7';
  } else if (normSuffix === 'h7' || normSuffix === 'ø' || normSuffix === 'ø7' || normSuffix === 'half-diminished') {
    normSuffix = 'm7b5';
  } else if (normSuffix === 'o' || normSuffix === 'o7' || normSuffix === 'diminished') {
    normSuffix = 'dim7';
  } else if (normSuffix === 'sus' || normSuffix === 'sus4') {
    normSuffix = 'sus4';
  }

  let slashRootVal: number | null = null;
  let slashAccidentalVal: 'flat' | 'sharp' | null = null;

  if (slashLetter) {
    let sRoot = baseMap[slashLetter.toUpperCase()];
    if (slashAcc === 'b' || slashAcc === '♭') {
      slashAccidentalVal = 'flat';
      if (sRoot === 11) sRoot = 10;
      else if (sRoot === 4) sRoot = 3;
      else if (sRoot === 9) sRoot = 8;
      else if (sRoot === 2) sRoot = 1;
      else if (sRoot === 7) sRoot = 6;
    } else if (slashAcc === '#' || slashAcc === '♯') {
      slashAccidentalVal = 'sharp';
      if (sRoot === 0) sRoot = 1;
      else if (sRoot === 2) sRoot = 3;
      else if (sRoot === 5) sRoot = 6;
      else if (sRoot === 7) sRoot = 8;
      else if (sRoot === 9) sRoot = 10;
    }
    slashRootVal = sRoot;
  }

  return {
    root,
    accidental,
    suffix: normSuffix,
    slashRoot: slashRootVal,
    slashAccidental: slashAccidentalVal,
    isEmpty: false
  };
}

function getChordString(slot: ChordSlot): string {
  if (slot.isEmpty) return '';
  const noteName = getNoteName(slot.root, 'C', slot.accidental); // Neutral key mapping
  const suffix = slot.suffix;
  let slash = '';
  if (slot.slashRoot !== null && slot.slashRoot !== undefined) {
    const sName = getNoteName(slot.slashRoot, 'C', slot.slashAccidental ?? undefined);
    slash = `/${sName}`;
  }
  return `${noteName}${suffix}${slash}`;
}

export function TactileEditor({
  songKey,
  selectedMeasureId,
  selectedSlotIndex,
  slotData,
  onUpdateSlot,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  onNavigatePrevMeasure,
  onNavigateNextMeasure,
  timeSignature = '4/4',
  onUpdateTimeSignature,
  measureNumber,
  onPaste,
  canPaste,
  onCopy,
  onCut,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  currentMeasureLabel = '',
  onUpdateMeasureLabel,
  onTransposeSong
}: TactileEditorProps) {
  
  const editorRef = React.useRef<HTMLDivElement>(null);
  
  // Tactical States
  const [isSlashPopupOpen, setIsSlashPopupOpen] = React.useState(false);
  const [isSuffixPopupOpen, setIsSuffixPopupOpen] = React.useState(false);
  const [abcSpelling, setAbcSpelling] = React.useState(false); // ABC Spelling: Standard maj7/min7 vs iReal Δ7/-7 labels
  const [activeTab, setActiveTab] = React.useState<'basic' | 'minor' | 'major' | 'dominant' | 'altered'>('basic');
  const [isCompactMode, setIsCompactMode] = React.useState(true);
  const [chordInputValue, setChordInputValue] = React.useState('');

  const lastSelectedCellRef = React.useRef<{ measureId: string | null; slotIndex: number | null }>({ measureId: null, slotIndex: null });

  React.useEffect(() => {
    const cellChanged = 
      lastSelectedCellRef.current.measureId !== selectedMeasureId ||
      lastSelectedCellRef.current.slotIndex !== selectedSlotIndex;

    lastSelectedCellRef.current = { measureId: selectedMeasureId, slotIndex: selectedSlotIndex };

    if (slotData) {
      if (cellChanged) {
        setChordInputValue(getChordString(slotData));
      } else {
        const parsedCurrentInput = parseChordString(chordInputValue);
        const normSlotSlashAcc = (slotData.slashAccidental === 'natural' || !slotData.slashAccidental) ? null : slotData.slashAccidental;
        const normParsedSlashAcc = parsedCurrentInput.slashAccidental || null;

        const isSame = 
          slotData.isEmpty === parsedCurrentInput.isEmpty &&
          (slotData.isEmpty || (
            slotData.root === parsedCurrentInput.root &&
            slotData.accidental === parsedCurrentInput.accidental &&
            slotData.suffix === parsedCurrentInput.suffix &&
            (slotData.slashRoot ?? null) === (parsedCurrentInput.slashRoot ?? null) &&
            normSlotSlashAcc === normParsedSlashAcc
          ));

        if (!isSame) {
          setChordInputValue(getChordString(slotData));
        }
      }
    } else {
      setChordInputValue('');
    }
  }, [selectedMeasureId, selectedSlotIndex, slotData]);

  const handleInputChange = (val: string) => {
    setChordInputValue(val);
    const parsed = parseChordString(val);
    onUpdateSlot({
      ...slotData,
      root: parsed.root,
      accidental: parsed.accidental,
      suffix: parsed.suffix,
      slashRoot: parsed.slashRoot,
      slashAccidental: parsed.slashAccidental,
      isEmpty: parsed.isEmpty
    });
  };
  
  // Settings & Prompts
  const [isPromptingSection, setIsPromptingSection] = React.useState(false);
  const [sectionInputValue, setSectionInputValue] = React.useState('');
  const [isPromptingKey, setIsPromptingKey] = React.useState(false);
  const [selectedQuality, setSelectedQuality] = React.useState<'Maj' | 'Min'>(() => {
    const q = (songKey || '').split(' ')[1] || 'Maj';
    return q as 'Maj' | 'Min';
  });

  React.useEffect(() => {
    if (songKey) {
      const q = songKey.split(' ')[1] || 'Maj';
      setSelectedQuality(q as 'Maj' | 'Min');
    }
  }, [songKey]);

  React.useEffect(() => {
    setIsSlashPopupOpen(false);
    setIsSuffixPopupOpen(false);
    setSectionInputValue(currentMeasureLabel || '');
    setIsPromptingSection(false);
    setIsPromptingKey(false);
  }, [selectedMeasureId, selectedSlotIndex, currentMeasureLabel]);

  // Handle click outside to close
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!editorRef.current) return;
      const target = e.target as HTMLElement;
      if (!target || !document.body.contains(target)) return;
      if (editorRef.current.contains(target)) return;
      
      // Exclude all active sheet interactions
      if (
        target.closest('[data-flat-index]') ||
        target.closest('[data-chord-slot]') ||
        target.closest('#systems_stack_box') ||
        target.closest('#sheet_header_box') ||
        target.closest('#edit_title_modal') ||
        target.closest('#edit_title_modal_overlay') ||
        target.closest('#chart_options_modal_overlay') ||
        target.closest('#chord-drag-modal') ||
        target.closest('.toast-container') ||
        target.closest('#header_chart_options_btn') ||
        target.closest('#header_workspace_controls')
      ) {
        return;
      }
      onClose();
    };

    const handleOutsideTouchStart = (e: TouchEvent) => {
      if (!editorRef.current) return;
      const target = e.target as HTMLElement;
      if (!target || !document.body.contains(target)) return;
      if (editorRef.current.contains(target)) return;
      
      // Exclude all active sheet interactions
      if (
        target.closest('[data-flat-index]') ||
        target.closest('[data-chord-slot]') ||
        target.closest('#systems_stack_box') ||
        target.closest('#sheet_header_box') ||
        target.closest('#edit_title_modal') ||
        target.closest('#edit_title_modal_overlay') ||
        target.closest('#chart_options_modal_overlay') ||
        target.closest('#chord-drag-modal') ||
        target.closest('.toast-container') ||
        target.closest('#header_chart_options_btn') ||
        target.closest('#header_workspace_controls')
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideTouchStart);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideTouchStart);
    };
  }, [onClose]);

  if (!selectedMeasureId || selectedSlotIndex === null || !slotData) {
    return null;
  }

  // Active root note spellings
  const rootName = getNoteName(slotData.root, songKey, slotData.accidental);
  const suffixSymbol = getJazzSuffixSymbol(slotData.suffix);
  
  // Custom Accidental Modifiers
  const handleFlat = () => {
    if (slotData.isEmpty) return;
    if (slotData.root === -1) {
      if (slotData.slashAccidental === 'flat') {
        onUpdateSlot({ ...slotData, slashAccidental: null });
      } else {
        let newSlashRoot = slotData.slashRoot ?? 0;
        if (newSlashRoot === 11) newSlashRoot = 10;
        else if (newSlashRoot === 4) newSlashRoot = 3;
        else if (newSlashRoot === 9) newSlashRoot = 8;
        else if (newSlashRoot === 2) newSlashRoot = 1;
        else if (newSlashRoot === 7) newSlashRoot = 6;
        onUpdateSlot({ ...slotData, slashRoot: newSlashRoot, slashAccidental: 'flat' });
      }
    } else {
      if (slotData.accidental === 'flat') {
        onUpdateSlot({ ...slotData, accidental: 'natural' });
      } else {
        let newRoot = slotData.root;
        if (newRoot >= 0) {
          if (slotData.root === 11) newRoot = 10;
          else if (slotData.root === 4) newRoot = 3;
          else if (slotData.root === 9) newRoot = 8;
          else if (slotData.root === 2) newRoot = 1;
          else if (slotData.root === 7) newRoot = 6;
        }
        onUpdateSlot({ ...slotData, root: newRoot, accidental: 'flat' });
      }
    }
  };

  const handleSharp = () => {
    if (slotData.isEmpty) return;
    if (slotData.root === -1) {
      if (slotData.slashAccidental === 'sharp') {
        onUpdateSlot({ ...slotData, slashAccidental: null });
      } else {
        let newSlashRoot = slotData.slashRoot ?? 0;
        if (newSlashRoot === 0) newSlashRoot = 1;
        else if (newSlashRoot === 2) newSlashRoot = 3;
        else if (newSlashRoot === 5) newSlashRoot = 6;
        else if (newSlashRoot === 7) newSlashRoot = 8;
        else if (newSlashRoot === 9) newSlashRoot = 10;
        onUpdateSlot({ ...slotData, slashRoot: newSlashRoot, slashAccidental: 'sharp' });
      }
    } else {
      if (slotData.accidental === 'sharp') {
        onUpdateSlot({ ...slotData, accidental: 'natural' });
      } else {
        let newRoot = slotData.root;
        if (newRoot >= 0) {
          if (slotData.root === 0) newRoot = 1;
          else if (slotData.root === 2) newRoot = 3;
          else if (slotData.root === 5) newRoot = 6;
          else if (slotData.root === 7) newRoot = 8;
          else if (slotData.root === 9) newRoot = 10;
        }
        onUpdateSlot({ ...slotData, root: newRoot, accidental: 'sharp' });
      }
    }
  };

  // Keyboard Letter Input Handler (Initializes slot if empty)
  const handleSelectBaseRoot = (baseLetter: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B') => {
    const baseMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const baseIdx = baseMap[baseLetter];
    
    if (isSlashPopupOpen) {
      onUpdateSlot({
        ...slotData,
        root: (slotData.isEmpty || slotData.root === null || slotData.root === undefined) ? -1 : slotData.root,
        slashRoot: baseIdx,
        slashAccidental: undefined,
        isEmpty: false
      });
      setIsSlashPopupOpen(false);
    } else {
      onUpdateSlot({
        ...slotData,
        root: baseIdx,
        accidental: 'natural',
        suffix: slotData.isEmpty ? '' : slotData.suffix,
        isEmpty: false
      });
    }
  };

  const handleApplySuffixValue = (suffixVal: string) => {
    onUpdateSlot({
      ...slotData,
      suffix: suffixVal,
      isEmpty: false
    });
    setIsSuffixPopupOpen(false);
  };

  const handleClearSlot = () => {
    onUpdateSlot({
      root: 0,
      accidental: 'natural',
      suffix: '',
      isEmpty: true,
      slashRoot: null,
      slashAccidental: null,
      isSmall: false,
      sizePercent: 100
    });
  };

  const handleSaveSectionLabel = (forcedValue?: string) => {
    const finalVal = forcedValue !== undefined ? forcedValue : sectionInputValue;
    if (onUpdateMeasureLabel && selectedMeasureId) {
      onUpdateMeasureLabel(selectedMeasureId, formatSectionLabelString(finalVal.trim()));
    }
    setIsPromptingSection(false);
  };

  // Row 4 Operations
  const handleCycleMeasureEndings = () => {
    if (!onUpdateMeasureLabel || !selectedMeasureId) return;
    if (currentMeasureLabel === '1.') {
      onUpdateMeasureLabel(selectedMeasureId, '2.');
    } else if (currentMeasureLabel === '2.') {
      onUpdateMeasureLabel(selectedMeasureId, '3.');
    } else if (currentMeasureLabel === '3.') {
      onUpdateMeasureLabel(selectedMeasureId, '');
    } else {
      onUpdateMeasureLabel(selectedMeasureId, '1.');
    }
  };

  const handleCycleRehearsalSigns = () => {
    if (!onUpdateMeasureLabel || !selectedMeasureId) return;
    const sequence = ['A', 'B', 'C', 'Intro', 'Chorus', 'Bridge', 'Outro', ''];
    const idx = sequence.indexOf(currentMeasureLabel);
    const nextIdx = (idx + 1) % sequence.length;
    onUpdateMeasureLabel(selectedMeasureId, sequence[nextIdx]);
  };

  const handleToggleCodaEnding = () => {
    if (!onUpdateMeasureLabel || !selectedMeasureId) return;
    if (currentMeasureLabel === 'Coda' || currentMeasureLabel === '𝄌') {
      onUpdateMeasureLabel(selectedMeasureId, '');
    } else {
      onUpdateMeasureLabel(selectedMeasureId, 'Coda');
    }
  };

  const SUFFIX_TABS = {
    basic: [
      { value: 'maj7', label: 'Δ7' },
      { value: 'min7', label: '–7' },
      { value: 'm7b5', label: 'ø7' },
      { value: 'dim7', label: 'o7' },
      { value: '7', label: '7' },
      { value: 'min', label: '–' },
      { value: 'dim', label: 'o' },
      { value: 'aug', label: '+' },
      { value: '6', label: '6' },
      { value: '6/9', label: '6/9' },
    ],
    minor: [
      { value: 'min9', label: '–9' },
      { value: 'min6', label: '–6' },
      { value: 'min6/9', label: '–6/9' },
      { value: 'min7b6', label: '–7b6' },
      { value: 'min9b6', label: '–9b6' },
      { value: 'min11', label: '–11' },
      { value: 'min13', label: '–13' },
      { value: 'minb6', label: '–b6' },
      { value: 'min#5', label: '–#5' },
      { value: 'm9b5', label: 'ø9' },
      { value: 'minmaj7', label: '–Δ7' },
      { value: 'minmaj9', label: '–Δ9' },
      { value: 'minmaj11', label: '–Δ11' },
      { value: 'minmaj13', label: '–Δ13' },
      { value: 'dimmaj7', label: 'oΔ7' },
      { value: 'minadd2', label: '–add2' },
      { value: 'minadd4', label: '–add4' },
    ],
    major: [
      { value: 'maj7#11', label: 'Δ7#11' },
      { value: 'maj7b5', label: 'Δ7b5' },
      { value: 'maj7#5', label: 'Δ7#5' },
      { value: 'maj7#9', label: 'Δ7#9' },
      { value: 'maj9', label: 'Δ9' },
      { value: 'maj9#11', label: 'Δ9#11' },
      { value: 'maj13', label: 'Δ13' },
      { value: 'maj13#11', label: 'Δ13#11' },
    ],
    dominant: [
      { value: '9', label: '9' },
      { value: '7alt', label: '7alt' },
      { value: '7b9', label: '7b9' },
      { value: '7#9', label: '7#9' },
      { value: '7sus', label: '7sus' },
      { value: 'sus2', label: 'sus2' },
      { value: 'sus4', label: 'sus4' },
      { value: 'add2', label: 'add2' },
      { value: 'add4', label: 'add4' },
      { value: '5', label: '5' },
      { value: '9sus', label: '9sus' },
      { value: '13sus', label: '13sus' },
      { value: '7#11', label: '7#11' },
      { value: '7b5', label: '7b5' },
      { value: '7#5', label: '7#5' },
      { value: '7b13', label: '7b13' },
      { value: '7#9#11', label: '7#9#11' },
      { value: '9#11', label: '9#11' },
      { value: '9b5', label: '9b5' },
      { value: '9#5', label: '9#5' },
      { value: '13', label: '13' },
      { value: '13#11', label: '13#11' },
      { value: '13#9', label: '13#9' },
      { value: '13b9', label: '13b9' },
    ],
    altered: [
      { value: '7susb9', label: '7susb9' },
      { value: '7susb9b13', label: '7susb9b13' },
      { value: '7susadd3', label: '7susadd3' },
      { value: '7b9b13', label: '7b9b13' },
      { value: '7b9#5', label: '7b9#5' },
      { value: '713add', label: '713add' },
      { value: '7#9#11', label: '7#9#11' },
      { value: '7#9b5', label: '7#9b5' },
      { value: '7#9#5', label: '7#9#5' },
      { value: '7b9#11', label: '7b9#11' },
      { value: '7b9b5', label: '7b9b5' },
      { value: '7b9#9', label: '7b9#9' },
    ]
  };

  return (
    <div
      ref={editorRef}
      id="tactile_editor_bottom_sheet"
      className={`fixed bottom-0 left-0 right-0 bg-[#161618] border-t border-[#2e2e30] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col rounded-t-3xl select-none print:hidden text-white font-sans ${
        isCompactMode ? 'max-h-[300px] lg:max-h-[230px]' : 'max-h-[90vh] lg:max-h-[520px]'
      }`}
    >
        {/* Outer board container containing the tactile matrix rows */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-[#19191b] space-y-2.5 relative" id="ireal_keyboard_board">
          {/* Thin local utility bar for Undo/Redo/Clipboard */}
          <div className="flex items-center justify-between pb-1.5 gap-2 shrink-0 border-b border-stone-800/40 text-[11px] font-sans">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className={`transition p-1 rounded hover:bg-[#252528] ${canUndo ? 'text-stone-300 hover:text-white cursor-pointer active:scale-95' : 'text-stone-600 cursor-not-allowed'}`}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4 stroke-[2.75]" />
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                className={`transition p-1 rounded hover:bg-[#252528] ${canRedo ? 'text-stone-300 hover:text-white cursor-pointer active:scale-95' : 'text-stone-600 cursor-not-allowed'}`}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4 stroke-[2.75]" />
              </button>

              <span className="text-stone-800 font-light select-none">|</span>

              <button
                type="button"
                onClick={onCopy}
                className="transition p-1 px-1.5 rounded hover:bg-[#252528] text-stone-300 hover:text-white cursor-pointer active:scale-95 flex items-center gap-1"
                title="Copy (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5 stroke-[2.25]" />
                <span className="hidden sm:inline">Copy</span>
              </button>

              <button
                type="button"
                onClick={onCut}
                className="transition p-1 px-1.5 rounded hover:bg-[#252528] text-stone-300 hover:text-white cursor-pointer active:scale-95 flex items-center gap-1"
                title="Cut (Ctrl+X)"
              >
                <Scissors className="w-3.5 h-3.5 stroke-[2.25]" />
                <span className="hidden sm:inline">Cut</span>
              </button>

              <button
                type="button"
                onClick={onPaste}
                disabled={!canPaste}
                className={`transition p-1 px-1.5 rounded hover:bg-[#252528] flex items-center gap-1 ${
                  canPaste ? 'text-stone-300 hover:text-white cursor-pointer active:scale-95' : 'text-stone-600 cursor-not-allowed'
                }`}
                title="Paste (Ctrl+V)"
              >
                <Clipboard className="w-3.5 h-3.5 stroke-[2.25]" />
                <span className="hidden sm:inline">Paste</span>
              </button>

              <span className="text-stone-800 font-light select-none">|</span>

              <button
                type="button"
                onClick={() => setIsCompactMode(!isCompactMode)}
                className={`transition p-1 px-2 rounded flex items-center gap-1 cursor-pointer active:scale-95 ${
                  isCompactMode ? 'bg-blue-600/30 text-blue-400 font-bold border border-blue-600/50' : 'text-stone-400 hover:text-white border border-transparent'
                }`}
                title="Toggle Compact Keyboard Layout"
              >
                <span className="text-[10px] font-mono">⌨ {isCompactMode ? "Compact" : "Full Matrix"}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2.5 text-stone-400 font-semibold tracking-wider text-[10px] uppercase">
              Beat {selectedSlotIndex + 1} of Measure {measureNumber}
            </div>
          </div>

          {isCompactMode ? (
            /* COMPACT KEYBOARD MODE: Only 2 rows! */
            <div className="flex flex-col gap-3 py-1 flex-1 justify-center">
              {/* Row A: Input Field + Clear + Arrows */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <span className="text-xs font-mono text-sky-400 font-bold uppercase tracking-wider">CHORD:</span>
                  </div>
                  <input
                    type="text"
                    value={chordInputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Type chord (e.g., C, F#m7, G/B)..."
                    className="w-full bg-[#1e1e21] border border-stone-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-2 pl-16 pr-4 text-base font-black text-white placeholder-stone-600 outline-none transition"
                    autoFocus
                  />
                </div>

                {/* Repeat Toggle */}
                <button
                  onClick={() => {
                    const isRepeat = !slotData.isEmpty && slotData.suffix === '%';
                    if (isRepeat) {
                      handleClearSlot();
                    } else {
                      onUpdateSlot({
                        root: 0,
                        accidental: 'natural',
                        suffix: '%',
                        isEmpty: false,
                        slashRoot: null,
                        slashAccidental: null,
                      });
                    }
                  }}
                  className={`h-[42px] px-3.5 rounded-xl border flex items-center justify-center transition active:scale-95 border-b-2 ${
                    !slotData.isEmpty && slotData.suffix === '%'
                      ? 'bg-blue-600 border-blue-800 text-white shadow shadow-blue-900/30'
                      : 'bg-[#252528] hover:bg-[#343438] text-stone-100 border-[#1a1a1c]'
                  }`}
                  title="Repeat chord measure (%)"
                >
                  <svg className="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none">
                    <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="8.5" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="15.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </button>

                {/* Size Toggle */}
                <button
                  onClick={() => {
                    if (slotData.isEmpty) return;
                    const currentSize = slotData.sizePercent ?? (slotData.isSmall ? 50 : 100);
                    let nextSize = 100;
                    if (currentSize === 100) {
                      nextSize = 50;
                    } else {
                      nextSize = 100;
                    }
                    onUpdateSlot({
                      ...slotData,
                      sizePercent: nextSize,
                      isSmall: nextSize === 50
                    });
                  }}
                  disabled={slotData.isEmpty}
                  className={`h-[42px] px-2 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 border-b-2 font-black ${
                    slotData.isEmpty
                      ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                      : (slotData.sizePercent === 50 || slotData.isSmall)
                          ? 'bg-amber-700 border-amber-900 text-white shadow font-black'
                          : 'bg-[#252528] hover:bg-[#343438] text-white border-[#1a1a1c]'
                  }`}
                  title="Toggle chord width (W: Whole / H: Half)"
                >
                  <span className="text-[8px] leading-none uppercase font-extrabold text-amber-500">Width</span>
                  <span className="text-[12px] font-black leading-none">
                    {(slotData.sizePercent === 50 || slotData.isSmall) ? 'H' : 'W'}
                  </span>
                </button>

                {/* Clear Button */}
                <button
                  onClick={handleClearSlot}
                  disabled={slotData.isEmpty}
                  className={`h-[42px] px-3 rounded-xl border flex items-center justify-center transition active:scale-95 border-b-2 text-sm font-black ${
                    slotData.isEmpty
                      ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                      : 'bg-[#3b1515] text-red-500 border-red-950 hover:bg-[#4a1a1a]'
                  }`}
                  title="Delete Chord (Backspace)"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Left Arrow Navigate */}
                <button
                  onClick={onNavigatePrev}
                  type="button"
                  className="h-[42px] w-12 rounded-xl border bg-[#252528] hover:bg-[#343438] text-stone-100 border-[#1a1a1c] flex items-center justify-center transition active:scale-95 text-lg font-black"
                  title="Previous Beat (Left Arrow)"
                >
                  ←
                </button>

                {/* Right Arrow Navigate */}
                <button
                  onClick={onNavigateNext}
                  type="button"
                  className="h-[42px] w-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold flex items-center justify-center cursor-pointer transition active:scale-95 border-b-2 border-blue-800 shadow shadow-blue-900/30 text-lg font-black"
                  title="Next Beat (Right Arrow)"
                >
                  →
                </button>
              </div>

              {/* Row B: Quick Sequential Helpers (Root + Qualities) */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 justify-between">
                {/* Letters */}
                <div className="flex items-center gap-1">
                  {(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const).map((letter) => {
                    const baseIdx = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter];
                    const isActive = !slotData.isEmpty && (
                      slotData.root === -1 
                        ? slotData.slashRoot === baseIdx 
                        : slotData.root === baseIdx
                    );
                    return (
                      <button
                        key={`compact_root_${letter}`}
                        onClick={() => handleSelectBaseRoot(letter)}
                        type="button"
                        className={`h-9 w-9 sm:w-10 rounded-lg text-sm font-black transition-all border flex items-center justify-center cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-blue-600 border-blue-800 text-white'
                            : 'bg-[#252528] hover:bg-[#343438] text-stone-200 border-[#1a1a1c]'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                  {/* Flat */}
                  <button
                    onClick={handleFlat}
                    disabled={slotData.isEmpty}
                    className={`h-9 w-9 sm:w-10 rounded-lg text-sm font-black border flex items-center justify-center transition active:scale-95 ${
                      slotData.isEmpty
                        ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                        : (slotData.root === -1 ? slotData.slashAccidental === 'flat' : slotData.accidental === 'flat')
                          ? 'bg-blue-600 border-blue-800 text-white'
                          : 'bg-[#252528] hover:bg-[#343438] text-stone-200 border-[#1a1a1c]'
                    }`}
                  >
                    ♭
                  </button>
                  {/* Sharp */}
                  <button
                    onClick={handleSharp}
                    disabled={slotData.isEmpty}
                    className={`h-9 w-9 sm:w-10 rounded-lg text-sm font-black border flex items-center justify-center transition active:scale-95 ${
                      slotData.isEmpty
                        ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                        : (slotData.root === -1 ? slotData.slashAccidental === 'sharp' : slotData.accidental === 'sharp')
                          ? 'bg-blue-600 border-blue-800 text-white'
                          : 'bg-[#252528] hover:bg-[#343438] text-stone-200 border-[#1a1a1c]'
                    }`}
                  >
                    ♯
                  </button>
                  {/* Slash / Over Chord Toggle */}
                  <button
                    onClick={() => {
                      if (slotData.slashRoot !== null && slotData.slashRoot !== undefined) {
                        onUpdateSlot({
                          ...slotData,
                          slashRoot: null,
                          slashAccidental: null
                        });
                        setIsSlashPopupOpen(false);
                      } else {
                        setIsSlashPopupOpen(!isSlashPopupOpen);
                        setIsSuffixPopupOpen(false);
                      }
                    }}
                    type="button"
                    className={`h-9 w-9 sm:w-10 rounded-lg text-sm font-black border flex items-center justify-center transition active:scale-95 border-b-2 ${
                      isSlashPopupOpen
                        ? 'bg-sky-600 border-sky-800 text-white font-black animate-pulse'
                        : (slotData && slotData.slashRoot !== null && slotData.slashRoot !== undefined)
                          ? 'bg-[#164e63] text-stone-200 border-[#0891b2]'
                          : 'bg-[#252528] hover:bg-[#343438] text-sky-400 border-[#1a1a1c]'
                    }`}
                    title="Slash Note mode (Click then select root letter C-B)"
                  >
                    /
                  </button>
                </div>

                <div className="h-4 w-[1px] bg-stone-800 hidden md:block"></div>

                {/* Popular Qualities */}
                <div className="flex items-center gap-1">
                  {[
                    { value: '', label: 'Δ' },
                    { value: 'maj7', label: 'Δ7' },
                    { value: 'min', label: '–' },
                    { value: 'min7', label: '–7' },
                    { value: '7', label: '7' },
                    { value: 'm7b5', label: 'ø7' },
                    { value: 'dim7', label: 'o7' },
                    { value: 'sus4', label: 'sus' }
                  ].map((item) => {
                    const isActive = !slotData.isEmpty && slotData.suffix === item.value;
                    return (
                      <button
                        key={`compact_qual_${item.value}`}
                        onClick={() => {
                          if (slotData.isEmpty) return;
                          handleApplySuffixValue(item.value);
                        }}
                        disabled={slotData.isEmpty}
                        className={`h-9 px-2 sm:px-2.5 rounded-lg text-xs font-bold border flex items-center justify-center transition active:scale-95 ${
                          slotData.isEmpty
                            ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                            : isActive
                              ? 'bg-blue-600 border-blue-800 text-white font-black'
                              : 'bg-[#252528] hover:bg-[#343438] text-stone-200 border-[#1a1a1c]'
                        }`}
                      >
                        {formatChordModifier(item.label)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* =========================================================
                  ROW 1: C, D, E, F, G, A, B, b, #, ⌫ (10 keys)
                  ========================================================= */}
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                {(['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const).map((letter) => {
                  const baseIdx = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter];
                  const isActive = !slotData.isEmpty && (
                    slotData.root === -1 
                      ? slotData.slashRoot === baseIdx 
                      : slotData.root === baseIdx
                  );

                  return (
                    <button
                      key={`letter_key_${letter}`}
                      onClick={() => handleSelectBaseRoot(letter)}
                      type="button"
                      className={`h-11 rounded-lg text-[18px] sm:text-[21px] font-black transition-all border flex items-center justify-center cursor-pointer active:scale-95 border-b-2 ${
                        isActive
                           ? 'bg-blue-600 border-blue-800 text-white font-black shadow-inner'
                          : 'bg-[#252528] hover:bg-[#343438] text-stone-100 border-[#1a1a1c]'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}

                {/* b flat */}
                <button
                  onClick={handleFlat}
                  disabled={slotData.isEmpty}
                  className={`h-11 rounded-lg text-[19px] sm:text-[22px] font-black border flex items-center justify-center transition active:scale-95 border-b-2 ${
                    slotData.isEmpty
                      ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                      : (slotData.root === -1 ? slotData.slashAccidental === 'flat' : slotData.accidental === 'flat')
                        ? 'bg-blue-600 border-blue-800 text-white font-black'
                        : 'bg-[#252528] hover:bg-[#343438] text-stone-100 border-[#1a1a1c]'
                  }`}
                  title="Flat Accidental (b)"
                >
                  ♭
                </button>

                {/* # sharp */}
                <button
                  onClick={handleSharp}
                  disabled={slotData.isEmpty}
                  className={`h-11 rounded-lg text-[18px] sm:text-[21px] font-black border flex items-center justify-center transition active:scale-95 border-b-2 ${
                    slotData.isEmpty
                      ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                      : (slotData.root === -1 ? slotData.slashAccidental === 'sharp' : slotData.accidental === 'sharp')
                        ? 'bg-blue-600 border-blue-800 text-white font-black'
                        : 'bg-[#252528] hover:bg-[#343438] text-stone-100 border-[#1a1a1c]'
                  }`}
                  title="Sharp Accidental (#)"
                >
                  ♯
                </button>

                {/* Red X Backspace / Clear Active Beat Chord */}
                <button
                  onClick={handleClearSlot}
                  disabled={slotData.isEmpty}
                  className={`h-11 rounded-lg border flex items-center justify-center transition active:scale-95 border-b-2 text-[17px] sm:text-[19px] font-black ${
                    slotData.isEmpty
                      ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                      : 'bg-[#3b1515] text-red-500 border-red-950 hover:bg-[#4a1a1a]'
                  }`}
                  title="Delete Chord (Backspace)"
                >
                  <X className={`w-5 h-5 ${slotData.isEmpty ? 'text-stone-700' : 'text-red-500 stroke-[3]'}`} />
                </button>
              </div>

              {/* =========================================================
                  ROW 2: CATEGORY TABS + UNDO/REDO BUTTONS (7 columns)
                  ========================================================= */}
              <div className="grid grid-cols-7 gap-1.5 shrink-0">
                {/* Prominent Tactile Undo Key */}
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className={`py-2 rounded-lg text-[11px] sm:text-[12px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 border-b-2 ${
                    canUndo
                      ? 'bg-[#2b2b2e] border-stone-700 hover:bg-[#343438] text-stone-100'
                      : 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                  }`}
                  title="Undo last change (Ctrl+Z)"
                >
                  <Undo className="w-3.5 h-3.5 stroke-[2.75]" />
                  <span className="hidden sm:inline">Undo</span>
                </button>

                {(['basic', 'minor', 'major', 'dominant', 'altered'] as const).map((tab) => (
                  <button
                    key={`tab_${tab}`}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 rounded-lg text-[11px] sm:text-[12px] font-black uppercase tracking-wider transition cursor-pointer border border-b-2 ${
                      activeTab === tab
                        ? 'bg-blue-600 border-blue-800 text-white font-black'
                        : 'bg-[#252528] border-[#1a1a1c] hover:bg-[#343438] text-stone-300'
                    }`}
                  >
                    {tab === 'dominant' ? 'Dom/Sus' : tab}
                  </button>
                ))}

                {/* Prominent Tactile Redo Key */}
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className={`py-2 rounded-lg text-[11px] sm:text-[12px] font-black uppercase tracking-wider transition cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 border-b-2 ${
                    canRedo
                      ? 'bg-[#2b2b2e] border-stone-700 hover:bg-[#343438] text-stone-100'
                      : 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                  }`}
                  title="Redo last reverted change (Ctrl+Y)"
                >
                  <Redo className="w-3.5 h-3.5 stroke-[2.75]" />
                  <span className="hidden sm:inline">Redo</span>
                </button>
              </div>

              {/* =========================================================
                  ROW 3: DYNAMIC SUFFIX GRID OF ACTIVE TAB
                  ========================================================= */}
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5 max-h-[145px] overflow-y-auto pr-0.5 custom-scrollbar py-0.5" style={{ minHeight: '90px' }}>
                {SUFFIX_TABS[activeTab].map((item) => {
                  const isActive = slotData.suffix === item.value;
                  return (
                    <button
                      key={`suff_btn_${item.value}`}
                      onClick={() => {
                        if (slotData.isEmpty) return;
                        onUpdateSlot({ ...slotData, suffix: item.value, isEmpty: false });
                      }}
                      disabled={slotData.isEmpty}
                      className={`h-11 rounded-lg font-bold border flex items-center justify-center transition active:scale-95 cursor-pointer text-[13px] sm:text-[15px] ${
                        slotData.isEmpty
                          ? 'bg-stone-900 border-transparent text-stone-700 cursor-not-allowed'
                          : isActive
                            ? 'bg-blue-600 border-transparent text-white font-black shadow'
                            : 'bg-[#252528] border-[#1a1a1c] hover:bg-[#343438] text-stone-100'
                      }`}
                    >
                      {formatChordModifier(item.label)}
                    </button>
                  );
                })}
              </div>

              {/* =========================================================
                  ROW 4: SYMMETRIC 10-COLUMN LAYOUT / UTILITIES / NAVIGATION
                  ========================================================= */}
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5 font-mono">
                {/* 1. Time Signature Toggle */}
                <button
                  onClick={() => {
                    if (onUpdateTimeSignature) {
                      onUpdateTimeSignature(timeSignature === '4/4' ? '3/4' : '4/4');
                    }
                  }}
                  className="h-11 rounded-lg border bg-[#252528] hover:bg-[#343438] text-white font-bold border-[#1a1a1c] flex flex-col items-center justify-center gap-0.5 transition active:scale-95"
                  title="Toggle Time Signature"
                >
                  <span className="text-[9px] sm:text-[10px] leading-none uppercase font-extrabold text-sky-400">Sig</span>
                  <span className="text-[12px] sm:text-[14px] font-black leading-none">{timeSignature}</span>
                </button>

                {/* 2. °/° Repeat */}
                <button
                  onClick={() => {
                    const isRepeat = slotData && !slotData.isEmpty && slotData.suffix === '%';
                    if (isRepeat) {
                      onUpdateSlot({
                        root: 0,
                        accidental: 'natural',
                        suffix: '',
                        isEmpty: true,
                        slashRoot: null,
                        slashAccidental: null,
                      });
                    } else {
                      onUpdateSlot({
                        root: slotData?.root ?? 0,
                        accidental: slotData?.accidental ?? 'natural',
                        suffix: '%',
                        isEmpty: false,
                        slashRoot: null,
                        slashAccidental: null,
                      });
                    }
                  }}
                  className={`h-11 rounded-lg border flex items-center justify-center transition active:scale-95 border-b-2 ${
                    slotData && !slotData.isEmpty && slotData.suffix === '%'
                      ? 'bg-blue-600 border-blue-800 text-white'
                      : 'bg-[#252528] hover:bg-[#343438] text-stone-100 border-[#1a1a1c]'
                  }`}
                  title="Repeat chord measure (°/°)"
                >
                  <svg className="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none">
                    <line x1="6" y1="18" x2="18" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="8.5" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="15.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                  </svg>
                </button>

                {/* 3. / Slash Note Mode */}
                <button
                  onClick={() => {
                    if (slotData.slashRoot !== null && slotData.slashRoot !== undefined) {
                      onUpdateSlot({
                        ...slotData,
                        slashRoot: null,
                        slashAccidental: null
                      });
                      setIsSlashPopupOpen(false);
                    } else {
                      setIsSlashPopupOpen(!isSlashPopupOpen);
                      setIsSuffixPopupOpen(false);
                    }
                  }}
                  className={`h-11 rounded-lg border flex items-center justify-center transition active:scale-95 border-b-2 text-[18px] sm:text-[21px] font-black ${
                    isSlashPopupOpen
                      ? 'bg-sky-600 border-sky-800 text-white font-black animate-pulse'
                      : slotData.slashRoot !== null && slotData.slashRoot !== undefined
                        ? 'bg-[#164e63] text-stone-200 border-[#0891b2] font-black'
                        : 'bg-[#252528] hover:bg-[#343438] text-sky-400 border-[#1a1a1c]'
                  }`}
                  title="Slash Note mode (Click then select root letter C-B)"
                >
                  /
                </button>

                {/* 4. Size Toggle */}
                <button
                  onClick={() => {
                    if (slotData.isEmpty) return;
                    const currentSize = slotData.sizePercent ?? (slotData.isSmall ? 50 : 100);
                    let nextSize = 100;
                    if (currentSize === 100) {
                      nextSize = 50;
                    } else {
                      nextSize = 100;
                    }
                    onUpdateSlot({
                      ...slotData,
                      sizePercent: nextSize,
                      isSmall: nextSize === 50
                    });
                  }}
                  disabled={slotData.isEmpty}
                  className={`h-11 rounded-lg border font-bold flex flex-col items-center justify-center gap-0.5 transition active:scale-95 border-b-2 ${
                    slotData.isEmpty
                      ? 'bg-[#19191b] border-transparent text-stone-700 cursor-not-allowed'
                      : (slotData.sizePercent === 50 || slotData.isSmall)
                          ? 'bg-amber-700 border-amber-900 text-white shadow font-black'
                          : 'bg-[#252528] hover:bg-[#343438] text-white border-[#1a1a1c]'
                  }`}
                  title="Toggle chord width (W: Whole / H: Half)"
                >
                  <span className="text-[9px] sm:text-[10px] leading-none uppercase font-extrabold text-amber-500">Width</span>
                  <span className="text-[12px] sm:text-[14px] font-black leading-none">
                    {(slotData.sizePercent === 50 || slotData.isSmall) ? 'H' : 'W'}
                  </span>
                </button>

                {/* 5. Ending Marker Cycle */}
                <button
                  onClick={handleCycleMeasureEndings}
                  className={`h-11 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition active:scale-95 font-black border-b-2 ${
                    currentMeasureLabel === '1.' || currentMeasureLabel === '2.' || currentMeasureLabel === '3.'
                      ? 'bg-[#0f766e] border-[#115e59] text-white'
                      : 'bg-[#252528] hover:bg-[#343438] text-white border-[#1a1a1c]'
                  }`}
                  title="Measure Repeat endings (1st / 2nd / 3rd)"
                >
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-400">End</span>
                  <span className="text-[12px] sm:text-[14px] font-black leading-none">{['1.', '2.', '3.'].includes(currentMeasureLabel) ? currentMeasureLabel : '|1.'}</span>
                </button>

                {/* 6. Section Header Cycle */}
                <button
                  onClick={handleCycleRehearsalSigns}
                  className={`h-11 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition active:scale-95 font-bold border-b-2 ${
                    ['A', 'B', 'C', 'Intro', 'Chorus', 'Bridge'].includes(currentMeasureLabel)
                      ? 'bg-[#3b82f6] border-[#1d4ed8] text-white font-black'
                      : 'bg-[#252528] hover:bg-[#343438] text-white border-[#1a1a1c]'
                  }`}
                  title="Assign Section Rehearsal Sign"
                >
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold leading-none text-sky-400">Sec</span>
                  <span className="text-[12px] sm:text-[14px] font-black leading-none">{['A', 'B', 'C', 'Intro', 'Chorus', 'Bridge'].includes(currentMeasureLabel) ? currentMeasureLabel : 'A'}</span>
                </button>

                {/* 7. Coda Symbol Toggle */}
                <button
                  onClick={handleToggleCodaEnding}
                  className={`h-11 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition active:scale-95 border-b-2 ${
                    currentMeasureLabel === 'Coda'
                      ? 'bg-[#6b21a8] border-[#581c87] text-white'
                      : 'bg-[#252528] hover:bg-[#343438] text-white border-[#1a1a1c]'
                  }`}
                  title="Coda Sign ending"
                >
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-purple-400">Coda</span>
                  <span className="text-[14px] sm:text-[16px] font-black leading-none">𝄌</span>
                </button>

                {/* 8. ↓ Down / Next Measure */}
                <button
                  onClick={onNavigateNextMeasure}
                  className="h-11 rounded-lg border bg-[#252528] hover:bg-[#343438] text-stone-100 border-[#1a1a1c] flex items-center justify-center transition active:scale-95 text-[18px] sm:text-[21px] font-black"
                  title="Next Measure Row"
                >
                  ↓
                </button>

                {/* 9. ← Left Arrow Navigate */}
                <button
                  onClick={onNavigatePrev}
                  type="button"
                  className="h-11 rounded-lg border bg-[#252528] hover:bg-[#343438] text-stone-100 border-[#1a1a1c] flex items-center justify-center transition active:scale-95 text-[21px] sm:text-[24px] font-black"
                  title="Previous Beat (Left Arrow)"
                >
                  ←
                </button>

                {/* 10. → Right Arrow Navigate */}
                <button
                  onClick={onNavigateNext}
                  type="button"
                  className="h-11 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold flex items-center justify-center cursor-pointer transition active:scale-95 border-b-2 border-blue-800 shadow shadow-blue-900/30 text-[21px] sm:text-[24px] font-black"
                  title="Next Beat (Right Arrow)"
                >
                  →
                </button>
              </div>
            </>
          )}
        </div>
    </div>
  );
}
