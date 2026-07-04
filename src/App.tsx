/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Song, Folder, Measure, ChordSlot, getNoteName, getJazzSuffixSymbol, KEYS, isFlatKey, NoteBlock, parseSingleChordString, ACCENT_PALETTES, getKeySemitone } from './types';
import { DEFAULT_SONGS, createEmptyMeasure } from './data';
import { LibraryBrowser } from './components/LibraryBrowser';
import { LeadSheet } from './components/LeadSheet';
import { TactileEditor } from './components/TactileEditor';
import { Copy, Scissors, Clipboard, Trash2, X, Check, AlertTriangle, Database, RefreshCw, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Safe LocalStorage wrapper to prevent crash if third-party cookies or storage are blocked in iframes
const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage.getItem failed for key "${key}":`, e);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage.setItem failed for key "${key}":`, e);
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage.removeItem failed for key "${key}":`, e);
    }
  }
};

const INITIAL_FOLDERS: Folder[] = [
  { id: 'standards', name: 'Jazz', parentId: null },
  { id: 'hymns', name: 'Hymns', parentId: null },
  { id: 'practice', name: 'Practice Material', parentId: null }
];

export default function App() {
  // Helper to pad any grid to exactly 128 measures (32 systems of 4 measures each) aware of timeSignature
  const padGridTo128 = (g: Measure[], timeSignature: string = '4/4'): Measure[] => {
    // 1. Ensure we start with a clean list of valid measure objects, filtering out nulls/falsy/non-objects
    let cleaned = Array.isArray(g)
      ? g.filter((m): m is Measure => !!m && typeof m === 'object')
      : [];

    // 2. Map and normalize each measure so that it is syntactically sound and complete
    cleaned = cleaned.map((m, mIdx) => {
      const expectedLength = timeSignature === '3/4' ? 3 : 4;
      
      // Ensure slots is a valid array
      let slots = Array.isArray(m.slots) ? [...m.slots] : [];
      
      // Filter out any invalid slot elements or pad if empty/insufficient
      slots = slots.map(s => {
        if (!s || typeof s !== 'object') {
          return {
            root: 0,
            accidental: 'natural' as const,
            suffix: 'maj7',
            isEmpty: true
          };
        }
        return {
          root: typeof s.root === 'number' ? s.root : 0,
          accidental: (s.accidental === 'sharp' || s.accidental === 'flat' || s.accidental === 'natural') ? s.accidental : 'natural',
          suffix: typeof s.suffix === 'string' ? s.suffix : '',
          isEmpty: s.isEmpty !== false,
          slashRoot: typeof s.slashRoot === 'number' ? s.slashRoot : undefined,
          slashAccidental: (s.slashAccidental === 'sharp' || s.slashAccidental === 'flat' || s.slashAccidental === 'natural') ? s.slashAccidental : undefined,
          sizePercent: typeof s.sizePercent === 'number' ? s.sizePercent : undefined,
          isSmall: !!s.isSmall
        };
      });

      // Pad slots if there are not enough beats in the measure
      while (slots.length < expectedLength) {
        slots.push({
          root: 0,
          accidental: 'natural',
          suffix: '',
          isEmpty: true
        });
      }

      // Truncate if there are somehow too many beats in the measure
      if (slots.length > expectedLength) {
        slots = slots.slice(0, expectedLength);
      }

      return {
        id: m.id || `measure_${mIdx}_${Math.random().toString(36).substr(2, 9)}`,
        label: typeof m.label === 'string' ? m.label : undefined,
        slots: slots
      };
    });

    // 3. Pad grid up to 128 measures
    const padded = [...cleaned];
    while (padded.length < 128) {
      padded.push(createEmptyMeasure(timeSignature));
    }
    return padded.slice(0, 128);
  };

  // Songs list state with localStorage persistence
  const [songs, setSongs] = useState<Song[]>(() => {
    let rawSongs: Song[] = [];
    const saved = safeLocalStorage.getItem('lead_sheet_songs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          rawSongs = parsed;
          // Ensure any default songs that are completely missing are added, so new default songs appear
          for (const defaultSong of DEFAULT_SONGS) {
            if (!rawSongs.some(s => s.id === defaultSong.id)) {
              rawSongs.push(defaultSong);
            }
          }
        }
      } catch (e) {}
    }

    if (rawSongs.length === 0) {
      rawSongs = DEFAULT_SONGS;
    }

    // Map songs through, migrate any old raw SVG references to base64, and pad grid
    return rawSongs
      .filter((s): s is Song => !!s && typeof s === 'object' && typeof s.id === 'string' && typeof s.title === 'string')
      .map(s => {
        let migratedImg = s.referenceImage;
        if (migratedImg && migratedImg.startsWith('data:image/svg+xml;utf8,')) {
          try {
            const rawSvg = migratedImg.substring('data:image/svg+xml;utf8,'.length);
            migratedImg = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(rawSvg)));
          } catch (_) {}
        }
        return {
          ...s,
          referenceImage: migratedImg,
          grid: padGridTo128(s.grid, s.timeSignature)
        };
      });
  });

  // Folders list state with localStorage persistence
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = safeLocalStorage.getItem('lead_sheet_folders');
    let loaded: Folder[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          loaded = parsed;
        } else {
          loaded = [...INITIAL_FOLDERS];
        }
      } catch (e) {
        loaded = [...INITIAL_FOLDERS];
      }
    } else {
      loaded = [...INITIAL_FOLDERS];
    }

    // Ensure loaded is an array
    if (!Array.isArray(loaded)) {
      loaded = [...INITIAL_FOLDERS];
    }

    // Sanitize loaded folders to ensure no corrupt or null values can slip through
    loaded = loaded.filter((f): f is Folder => !!f && typeof f === 'object' && typeof f.id === 'string' && typeof f.name === 'string');

    // Auto-migrate standard categories (only add if missing, honoring user spelling edits)
    const hasStandards = loaded.some(f => f.id === 'standards');
    if (!hasStandards) {
      loaded.push({ id: 'standards', name: 'Jazz', parentId: null });
    }

    const hasHymns = loaded.some(f => f.id === 'hymns');
    if (!hasHymns) {
      loaded.push({ id: 'hymns', name: 'Hymns', parentId: null });
    }

    const hasPractice = loaded.some(f => f.id === 'practice');
    if (!hasPractice) {
      loaded.push({ id: 'practice', name: 'Practice Material', parentId: null });
    }

    // Clean obsolete category definitions
    return loaded.filter(f => f.id !== 'bebop');
  });

  // Current active song ID selection
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);

  // Undo & Redo History state lists for music sheets
  const [songsHistory, setSongsHistory] = useState<Song[][]>([]);
  const [songsRedoStack, setSongsRedoStack] = useState<Song[][]>([]);

  // Custom interactive & animated Database Reset states
  const [resetState, setResetState] = useState<'idle' | 'confirm' | 'wiping' | 'loading' | 'indexing' | 'success'>('idle');
  const [resetPercentage, setResetPercentage] = useState<number>(0);
  const [resetLogs, setResetLogs] = useState<string[]>([]);

  // Wrapper for updating songs with automatic history logging
  const setSongsWithHistory = (updateFnOrValue: Song[] | ((prev: Song[]) => Song[])) => {
    setSongs(prev => {
      const next = typeof updateFnOrValue === 'function' ? updateFnOrValue(prev) : updateFnOrValue;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        setSongsHistory(h => [...h, prev]);
        setSongsRedoStack([]); // Clear redo on new action
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (songsHistory.length === 0) return;
    const prev = songsHistory[songsHistory.length - 1];
    setSongsHistory(h => h.slice(0, -1));
    setSongsRedoStack(r => [songs, ...r]);
    setSongs(prev);
  };

  const handleRedo = () => {
    if (songsRedoStack.length === 0) return;
    const next = songsRedoStack[0];
    setSongsRedoStack(r => r.slice(1));
    setSongsHistory(h => [...h, songs]);
    setSongs(next);
  };

  // Reset undo/redo states when active song changes to prevent history bleeding
  useEffect(() => {
    setSongsHistory([]);
    setSongsRedoStack([]);
  }, [currentSongId]);

  // Active Screen View toggle ('library' | 'chart')
  const [activeScreen, setActiveScreen] = useState<'library' | 'chart'>('library');

  // Persistent category/folder navigation states to preserve view on back
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [currentSubView, setCurrentSubView] = useState<'home' | 'list'>('home');

  // Modal overlays / Side drawers state synchronized with HTML5 History back button
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isNewSongOpen, setIsNewSongOpen] = useState(false);

  // Lifted from LeadSheet to make them part of physical back button navigation
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isKeyChangeOpen, setIsKeyChangeOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Tactile Editor chord cell slots pointers
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Solid monochromatic Light / Dark Mode configuration
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (safeLocalStorage.getItem('lead_sheet_theme') as 'light' | 'dark') || 'light';
  });

  // Lead Sheet Display & Layout Settings (chordFont, notationStyle, showMeasureNumbers)
  const [chordFont, setChordFont] = useState<'ptsans' | 'petaluma'>('ptsans');

  const [notationStyle, setNotationStyle] = useState<'standard' | 'ireal'>('ireal');

  const [showMeasureNumbers, setShowMeasureNumbers] = useState<boolean>(false);

  // Persist settings
  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_chord_font', chordFont);
  }, [chordFont]);

  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_notation_style', notationStyle);
  }, [notationStyle]);

  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_show_measure_numbers', String(showMeasureNumbers));
  }, [showMeasureNumbers]);

  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_selected_category', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_current_sub_view', currentSubView);
  }, [currentSubView]);

  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a'; // dark mode bg
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc'; // library route base bg
    }
  }, [theme]);

  // Accent color state with localStorage persistence
  const [accentColor, setAccentColor] = useState<string>(() => {
    return safeLocalStorage.getItem('lead_sheet_accent_color') || 'blue';
  });

  // Keep track of clicking outside of active chord slot or the keyboard to dismiss editor
  useEffect(() => {
    if (selectedSlotIndex === null) return;

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !document.body.contains(target)) {
        return;
      }

      // If clicked inside the keyboard drawer
      if (target.closest('#tactile_editor_bottom_sheet')) {
        return;
      }

      // We only allow closing the keyboard when tapping the chart area where there is NO measure (below the song)
      const isDrawingBoard = target.id === 'music_score_drawing_board' || target.closest('#music_score_drawing_board') !== null;
      const isInsideSystems = target.closest('#systems_stack_box') !== null;
      const isInsideHeader = target.closest('#sheet_header_box') !== null;

      // Close ONLY if clicked on the drawing board/canvas, but NOT inside the systems stack, NOT inside the sheet header
      const clickIsBelowSong = isDrawingBoard && !isInsideSystems && !isInsideHeader;

      if (!clickIsBelowSong) {
        // Do not close under any other click/tap
        return;
      }

      // Close the editor
      setSelectedMeasureId(null);
      setSelectedSlotIndex(null);
      setSelectionStart(null);
      setSelectionEnd(null);
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('touchstart', handleDocumentClick);
    }, 120);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
    };
  }, [selectedSlotIndex]);

  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_accent_color', accentColor);
    const palette = ACCENT_PALETTES.find(p => p.id === accentColor) || ACCENT_PALETTES[0];
    const root = document.documentElement;
    root.style.setProperty('--accent-deep', palette.primary);
    root.style.setProperty('--accent-hover', palette.hover);
    root.style.setProperty('--accent-light', palette.light);
    root.style.setProperty('--accent-light-hover', palette.lightHover);
    root.style.setProperty('--accent-light-bg', palette.lightBg);
    root.style.setProperty('--accent-light-bg-strong', palette.lightBgStrong);
  }, [accentColor]);

  const isPoppingRef = useRef<boolean>(false);
  const lastHistoryStateRef = useRef<any>(null);

  // Helper to get active nested levels / view hierarchy state representation
  const getNavigationState = (
    screenVal = activeScreen,
    subviewVal = currentSubView,
    songIdVal = currentSongId,
    editingVal = selectedMeasureId !== null,
    settingsOpenVal = isSettingsOpen,
    newFolderOpenVal = isNewFolderOpen,
    newSongOpenVal = isNewSongOpen,
    editingTitleVal = isEditingTitle,
    keyChangeOpenVal = isKeyChangeOpen,
    optionsOpenVal = isOptionsOpen
  ) => {
    return {
      screen: screenVal,
      subview: subviewVal,
      songId: songIdVal,
      editing: editingVal,
      settingsOpen: settingsOpenVal,
      newFolderOpen: newFolderOpenVal,
      newSongOpen: newSongOpenVal,
      editingTitle: editingTitleVal,
      keyChangeOpen: keyChangeOpenVal,
      optionsOpen: optionsOpenVal
    };
  };

  // Safe back navigation helper that exits the app once the homescreen is reached
  const goBackNav = (fallbackAction: () => void) => {
    if (lastHistoryStateRef.current && lastHistoryStateRef.current.depth > 0) {
      window.history.back();
    } else {
      fallbackAction();
    }
  };

  // Synchronize with phone/browser back button via HTML5 History and custom depth tracking
  useEffect(() => {
    const initialState = {
      ...getNavigationState(),
      depth: 0
    };
    window.history.replaceState(initialState, '');
    lastHistoryStateRef.current = initialState;
  }, []);

  useEffect(() => {
    const currentState = getNavigationState();
    if (!lastHistoryStateRef.current) return;

    const hasChanged =
      lastHistoryStateRef.current.screen !== currentState.screen ||
      lastHistoryStateRef.current.subview !== currentState.subview ||
      lastHistoryStateRef.current.songId !== currentState.songId ||
      lastHistoryStateRef.current.editing !== currentState.editing ||
      lastHistoryStateRef.current.settingsOpen !== currentState.settingsOpen ||
      lastHistoryStateRef.current.newFolderOpen !== currentState.newFolderOpen ||
      lastHistoryStateRef.current.newSongOpen !== currentState.newSongOpen ||
      lastHistoryStateRef.current.editingTitle !== currentState.editingTitle ||
      lastHistoryStateRef.current.keyChangeOpen !== currentState.keyChangeOpen ||
      lastHistoryStateRef.current.optionsOpen !== currentState.optionsOpen;

    if (isPoppingRef.current) {
      if (!hasChanged) {
        isPoppingRef.current = false;
      }
      return;
    }

    if (hasChanged) {
      const parentDepth = lastHistoryStateRef.current.depth ?? 0;
      // We calculate depth based on whether we deep-link or return. This keeps depth tracking highly accurate
      const nextState = {
        ...currentState,
        depth: parentDepth + 1
      };
      window.history.pushState(nextState, '');
      lastHistoryStateRef.current = nextState;
    }
  }, [
    activeScreen,
    currentSubView,
    currentSongId,
    selectedMeasureId,
    isSettingsOpen,
    isNewFolderOpen,
    isNewSongOpen,
    isEditingTitle,
    isKeyChangeOpen,
    isOptionsOpen
  ]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state;
      if (!state) return;

      isPoppingRef.current = true;

      // Immediately synchronize top history state ref to halt any spurious watch-push actions
      lastHistoryStateRef.current = state;

      // Batch transition back to historical state values
      if (state.screen !== activeScreen) {
        setActiveScreen(state.screen);
      }
      if (state.subview !== currentSubView) {
        setCurrentSubView(state.subview);
      }
      if (state.songId !== currentSongId) {
        setCurrentSongId(state.songId);
      }
      if (!state.editing) {
        setSelectedMeasureId(null);
        setSelectedSlotIndex(null);
      }
      setIsSettingsOpen(!!state.settingsOpen);
      setIsNewFolderOpen(!!state.newFolderOpen);
      setIsNewSongOpen(!!state.newSongOpen);
      setIsEditingTitle(!!state.editingTitle);
      setIsKeyChangeOpen(!!state.keyChangeOpen);
      setIsOptionsOpen(!!state.optionsOpen);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    activeScreen,
    currentSubView,
    currentSongId,
    isSettingsOpen,
    isNewFolderOpen,
    isNewSongOpen,
    isEditingTitle,
    isKeyChangeOpen,
    isOptionsOpen
  ]);

  // Safeguard: if activeScreen is chart but currentSong is missing or deleted, go back to library screen
  useEffect(() => {
    if (activeScreen === 'chart' && (!currentSongId || !songs.some(s => s.id === currentSongId && !s.isDeleted))) {
      setActiveScreen('library');
    }
  }, [activeScreen, currentSongId, songs]);

  // Handle back button presses in browser/phone to dismiss the keyboard editor
  useEffect(() => {
    const isKeyboardOpen = selectedMeasureId !== null && selectedSlotIndex !== null;
    if (!isKeyboardOpen) return;

    // Push a state to capture the back action
    window.history.pushState({ keyboardOpen: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      handleDeselect();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If closed manually (e.g., via onClose 'X' or outside click), pop the dummy state to keep history clean
      if (window.history.state?.keyboardOpen) {
        window.history.back();
      }
    };
  }, [selectedMeasureId !== null && selectedSlotIndex !== null]);

  // Selection highlighting and clipboard states
  const [selectionStart, setSelectionStart] = useState<{ measureId: string; slotIndex: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ measureId: string; slotIndex: number } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [handlesVisible, setHandlesVisible] = useState(false);
  const [copiedSlots, setCopiedSlots] = useState<ChordSlot[] | null>(() => {
    try {
      const saved = safeLocalStorage.getItem('lead_sheet_repertoire_copied_slots');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'loading' | 'error' | 'info' } | null>(null);

  const setToastMessage = (msg: string) => {
    if (msg) {
      setToast({ message: msg, type: 'success' });
    } else {
      setToast(null);
    }
  };

  const showToast = (message: string, type: 'success' | 'loading' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast && toast.type !== 'loading') {
      const timer = setTimeout(() => {
        setToast(null);
      }, toast.type === 'error' ? 4500 : 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Global mouseup event to terminate drag highlights
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingSelection(prev => {
        if (prev) {
          if (selectionStart && selectionEnd) {
            setHandlesVisible(true);
          }
        }
        return false;
      });
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [selectionStart, selectionEnd]);

  // Convert coordinate to absolute coordinate
  const getFlatIndex = (measureId: string, slotIdx: number): number => {
    if (!currentSong) return -1;
    const idx = currentSong.grid.findIndex(m => m.id === measureId);
    if (idx === -1) return -1;
    const beatsPerMeasure = currentSong.timeSignature === '3/4' ? 3 : 4;
    return idx * beatsPerMeasure + slotIdx;
  };

  const handleDragStart = (measureId: string, slotIdx: number) => {
    setSelectionStart({ measureId, slotIndex: slotIdx });
    setSelectionEnd({ measureId, slotIndex: slotIdx });
    setIsDraggingSelection(true);

    setSelectedMeasureId(measureId);
    setSelectedSlotIndex(slotIdx);
  };

  const handleDragEnter = (measureId: string, slotIdx: number) => {
    if (isDraggingSelection) {
      setSelectionEnd({ measureId, slotIndex: slotIdx });
    }
  };

  const handleShiftSelect = (measureId: string, slotIdx: number) => {
    if (!selectionStart) {
      setSelectionStart({ measureId, slotIndex: slotIdx });
      setSelectionEnd({ measureId, slotIndex: slotIdx });
      setSelectedMeasureId(measureId);
      setSelectedSlotIndex(slotIdx);
    } else {
      setSelectionEnd({ measureId, slotIndex: slotIdx });
    }
  };

  const handleDeselect = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectedMeasureId(null);
    setSelectedSlotIndex(null);
    setHandlesVisible(false);
  };

  const getActiveSelectionRange = (): { start: { measureId: string; slotIndex: number }; end: { measureId: string; slotIndex: number } } | null => {
    if (selectionStart && selectionEnd) {
      return { start: selectionStart, end: selectionEnd };
    }
    if (selectedMeasureId && selectedSlotIndex !== null) {
      const single = { measureId: selectedMeasureId, slotIndex: Number(selectedSlotIndex) };
      return { start: single, end: single };
    }
    return null;
  };

  const handleCopySelection = async () => {
    if (!currentSong) return;
    const range = getActiveSelectionRange();
    if (!range) return;

    const startIdx = getFlatIndex(range.start.measureId, range.start.slotIndex);
    const endIdx = getFlatIndex(range.end.measureId, range.end.slotIndex);
    if (startIdx === -1 || endIdx === -1) return;

    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    const collected: ChordSlot[] = [];
    const textMeasures: string[][] = [];
    const beatsPerMeasure = currentSong.timeSignature === '3/4' ? 3 : 4;

    for (let i = minIdx; i <= maxIdx; i++) {
       const mIdx = Math.floor(i / beatsPerMeasure);
       const sIdx = i % beatsPerMeasure;
       if (mIdx < currentSong.grid.length) {
         const slot = currentSong.grid[mIdx].slots[sIdx];
         collected.push({ ...slot });

         const mSeqIdx = Math.floor((i - minIdx) / beatsPerMeasure);
         if (!textMeasures[mSeqIdx]) textMeasures[mSeqIdx] = [];

         if (slot.isEmpty) {
           textMeasures[mSeqIdx].push('.');
         } else {
           const rawName = getNoteName(slot.root, currentSong.key, slot.accidental);
           const suffixSymbol = getJazzSuffixSymbol(slot.suffix);
           textMeasures[mSeqIdx].push(`${rawName}${suffixSymbol}`);
         }
       }
    }

    setCopiedSlots(collected);
    try {
      safeLocalStorage.setItem('lead_sheet_repertoire_copied_slots', JSON.stringify(collected));
    } catch (_) {}

    const textLines = textMeasures.map(beats => beats.join(' ')).join(' | ');
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(textLines);
      } catch (err) {
        console.warn('Clipboard write fallback:', err);
      }
    } else {
      console.warn('System clipboard writeText is unavailable');
    }
    setToastMessage(`Copied ${collected.length} ${collected.length === 1 ? 'chord' : 'chords'} to clipboard`);
  };

  const handleCutSelection = async () => {
    if (!currentSong) return;
    const range = getActiveSelectionRange();
    if (!range) return;
    
    try {
      await handleCopySelection();
    } catch (err) {
      console.warn('Cut fallback (copy failed):', err);
    }
    
    // Clear selection from grid
    handleClearSelection(true);

    // Deselect range highlight beautifully
    setSelectionStart(null);
    setSelectionEnd(null);
    setHandlesVisible(false);
    setSelectedMeasureId(null);
    setSelectedSlotIndex(null);

    setToastMessage('Selection cut and copied to clipboard');
  };

  const parseExternalClipboardText = (text: string): ChordSlot[] => {
    const result: ChordSlot[] = [];
    const cleaned = text.trim();
    if (!cleaned) return [];

    const beatsPerMeasure = currentSong ? (currentSong.timeSignature === '3/4' ? 3 : 4) : 4;

    if (cleaned.includes('|')) {
      const parts = cleaned.split('|');
      for (const p of parts) {
        const beats = p.trim().split(/\s+/).filter(Boolean);
        for (const b of beats) {
          result.push(parseSingleChordString(b));
        }
        // Fill or pad up to beatsPerMeasure if we are representing a full bar
        while (beats.length > 0 && beats.length < beatsPerMeasure && result.length % beatsPerMeasure !== 0) {
          result.push({ root: 0, accidental: 'natural', suffix: '', isEmpty: true });
        }
      }
    } else {
      const beats = cleaned.split(/\s+/).filter(Boolean);
      for (const b of beats) {
        result.push(parseSingleChordString(b));
      }
    }
    return result;
  };

  const handlePasteSelection = async () => {
    if (!currentSong) return;
    
    let startIdx = -1;
    const range = getActiveSelectionRange();
    if (range) {
      const idx1 = getFlatIndex(range.start.measureId, range.start.slotIndex);
      const idx2 = getFlatIndex(range.end.measureId, range.end.slotIndex);
      if (idx1 !== -1 && idx2 !== -1) {
        startIdx = Math.min(idx1, idx2);
      }
    }
    if (startIdx === -1) return;

    let slotsToPaste: ChordSlot[] = copiedSlots || [];

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText && clipboardText.trim()) {
          const parsed = parseExternalClipboardText(clipboardText);
          if (parsed.length > 0) {
            slotsToPaste = parsed;
          }
        }
      } catch (err) {
        console.warn('Clipboard read error, fallback to internal buffer', err);
      }
    } else {
      console.warn('System clipboard readText is unavailable, using local buffer');
    }

    if (slotsToPaste.length === 0) {
      setToastMessage('Clipboard is empty. Copy some chords first.');
      return;
    }

    setSongsWithHistory(prev => prev.map(s => {
      if (s.id !== currentSong.id) return s;
      const beatsPerMeasure = s.timeSignature === '3/4' ? 3 : 4;
      return {
        ...s,
        grid: s.grid.map((m, mIdx) => {
          const updatedSlots = [...m.slots];
          let changed = false;
          for (let sIdx = 0; sIdx < beatsPerMeasure; sIdx++) {
            const flatIdx = mIdx * beatsPerMeasure + sIdx;
            const offset = flatIdx - startIdx;
            if (offset >= 0 && offset < slotsToPaste.length) {
              updatedSlots[sIdx] = { ...slotsToPaste[offset] };
              changed = true;
            }
          }
          return changed ? { ...m, slots: updatedSlots } : m;
        })
      };
    }));

    setToastMessage(`Pasted ${slotsToPaste.length} ${slotsToPaste.length === 1 ? 'chord' : 'chords'} successfully`);
  };

  const handleClearSelection = (silent = false) => {
    if (!currentSong) return;
    const range = getActiveSelectionRange();
    if (!range) return;

    const startIdx = getFlatIndex(range.start.measureId, range.start.slotIndex);
    const endIdx = getFlatIndex(range.end.measureId, range.end.slotIndex);
    if (startIdx === -1 || endIdx === -1) return;

    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    setSongsWithHistory(prev => prev.map(s => {
      if (s.id !== currentSong.id) return s;
      const beatsPerMeasure = s.timeSignature === '3/4' ? 3 : 4;
      return {
        ...s,
        grid: s.grid.map((m, mIdx) => {
          const updatedSlots = m.slots.map((slot, sIdx) => {
            const flatIdx = mIdx * beatsPerMeasure + sIdx;
            if (flatIdx >= minIdx && flatIdx <= maxIdx) {
              return { root: 0, accidental: 'natural' as const, suffix: 'maj7', isEmpty: true };
            }
            return slot;
          });
          return { ...m, slots: updatedSlots };
        })
      };
    }));

    if (!silent) {
      setSelectionStart(null);
      setSelectionEnd(null);
      setHandlesVisible(false);
      setSelectedMeasureId(null);
      setSelectedSlotIndex(null);
      setToastMessage('Cleared selected chords');
    }
  };

  // Sync state modifications out to local cache
  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_songs', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    safeLocalStorage.setItem('lead_sheet_active_screen', activeScreen);
  }, [activeScreen]);

  useEffect(() => {
    if (currentSongId) {
      safeLocalStorage.setItem('lead_sheet_current_song_id', currentSongId);
    } else {
      safeLocalStorage.removeItem('lead_sheet_current_song_id');
    }
  }, [currentSongId]);

  // Find currently loaded song
  const currentSong = songs.find(s => s.id === currentSongId) || null;

  // Global Keyboard Hook for tactile editing on chart screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeScreen !== 'chart') return;
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Undo & Redo operations
      if (e.code === 'KeyZ' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.code === 'KeyZ' && (e.metaKey || e.ctrlKey) && e.shiftKey) || (e.code === 'KeyY' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Clipboard operations
      if (e.code === 'KeyC' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleCopySelection();
        return;
      }
      if (e.code === 'KeyX' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleCutSelection();
        return;
      }
      if (e.code === 'KeyV' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handlePasteSelection();
        return;
      }
      if (e.code === 'Backspace' || e.code === 'Delete') {
        e.preventDefault();
        handleClearSelection();
        return;
      }

      switch (e.code) {
        case 'Escape':
          e.preventDefault();
          handleDeselect();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleNavigatePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNavigateNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScreen, selectedMeasureId, selectedSlotIndex, currentSong?.grid.length, selectionStart, selectionEnd, copiedSlots, songsHistory, songsRedoStack, songs]);

  // Retrieve data for active selected cell
  const getSelectedSlotData = (): ChordSlot | null => {
    if (!currentSong || !selectedMeasureId || selectedSlotIndex === null) return null;
    const measure = currentSong.grid.find(m => m.id === selectedMeasureId);
    if (!measure) return null;
    return measure.slots[selectedSlotIndex];
  };

  const getSelectedMeasureNumber = (): number | null => {
    if (!currentSong || !selectedMeasureId) return null;
    const idx = currentSong.grid.findIndex(m => m.id === selectedMeasureId);
    return idx !== -1 ? idx + 1 : null;
  };

  // State update actions
  const handleUpdateSlot = (updatedSlot: ChordSlot) => {
    if (!currentSongId || !selectedMeasureId || selectedSlotIndex === null) return;

    const originalSlot = getSelectedSlotData();
    const isSmallChanged = originalSlot && originalSlot.isSmall !== updatedSlot.isSmall;
    const sizePercentChanged = originalSlot && originalSlot.sizePercent !== updatedSlot.sizePercent;

    setSongsWithHistory(prev => prev.map(song => {
      if (song.id !== currentSongId) return song;

      const beatsPerMeasure = song.timeSignature === '3/4' ? 3 : 4;
      let startIdx = -1;
      let endIdx = -1;
      
      if (selectionStart && selectionEnd) {
        const getFlatIndexLocal = (mId: string, sIdx: number): number => {
          const idx = song.grid.findIndex(m => m.id === mId);
          if (idx === -1) return -1;
          return idx * beatsPerMeasure + sIdx;
        };
        startIdx = getFlatIndexLocal(selectionStart.measureId, selectionStart.slotIndex);
        endIdx = getFlatIndexLocal(selectionEnd.measureId, selectionEnd.slotIndex);
      }

      const hasSelection = startIdx !== -1 && endIdx !== -1 && (startIdx !== endIdx);

      return {
        ...song,
        grid: song.grid.map((measure, mIdx) => {
          const localSlots = [...measure.slots];
          let modified = false;

          for (let sIdx = 0; sIdx < localSlots.length; sIdx++) {
            const flatIdx = mIdx * beatsPerMeasure + sIdx;
            
            const isActiveEditingSlot = measure.id === selectedMeasureId && sIdx === selectedSlotIndex;

            const isInSelectionRange = hasSelection && 
              flatIdx >= Math.min(startIdx, endIdx) && 
              flatIdx <= Math.max(startIdx, endIdx);

            if (isActiveEditingSlot) {
              localSlots[sIdx] = updatedSlot;
              modified = true;
            } else if (isInSelectionRange && (isSmallChanged || sizePercentChanged)) {
              localSlots[sIdx] = {
                ...localSlots[sIdx],
                isSmall: updatedSlot.isSmall,
                sizePercent: updatedSlot.sizePercent
              };
              modified = true;
            }
          }

          return modified ? { ...measure, slots: localSlots } : measure;
        })
      };
    }));
  };

  const handleUpdateMeasureLabel = (measureId: string, label: string) => {
    if (!currentSongId) return;

    setSongsWithHistory(prev => prev.map(song => {
      if (song.id !== currentSongId) return song;
      return {
        ...song,
        grid: song.grid.map(measure => {
          if (measure.id !== measureId) return measure;
          return { ...measure, label: label || undefined };
        })
      };
    }));
  };

  const handleNavigatePrev = () => {
    if (!currentSong || !selectedMeasureId || selectedSlotIndex === null) return;
    const currentMeasureIndex = currentSong.grid.findIndex(m => m.id === selectedMeasureId);

    if (selectedSlotIndex > 0) {
      setSelectedSlotIndex(selectedSlotIndex - 1);
    } else if (currentMeasureIndex > 0) {
      const prevMeasure = currentSong.grid[currentMeasureIndex - 1];
      setSelectedMeasureId(prevMeasure.id);
      setSelectedSlotIndex(prevMeasure.slots.length - 1);
    }
  };

  const handleNavigateNext = () => {
    if (!currentSong || !selectedMeasureId || selectedSlotIndex === null) return;
    const currentMeasureIndex = currentSong.grid.findIndex(m => m.id === selectedMeasureId);
    const currentMeasure = currentSong.grid[currentMeasureIndex];
    if (!currentMeasure) return;
    const maxSlotIdx = currentMeasure.slots.length - 1;

    if (selectedSlotIndex < maxSlotIdx) {
      setSelectedSlotIndex(selectedSlotIndex + 1);
    } else if (currentMeasureIndex < currentSong.grid.length - 1) {
      const nextMeasure = currentSong.grid[currentMeasureIndex + 1];
      setSelectedMeasureId(nextMeasure.id);
      setSelectedSlotIndex(0);
    }
  };

  const handleNavigateNextMeasure = () => {
    if (!currentSong || !selectedMeasureId || selectedSlotIndex === null) return;
    const currentMeasureIndex = currentSong.grid.findIndex(m => m.id === selectedMeasureId);
    if (currentMeasureIndex < currentSong.grid.length - 1) {
      const nextMeasure = currentSong.grid[currentMeasureIndex + 1];
      setSelectedMeasureId(nextMeasure.id);
    }
  };

  const handleNavigatePrevMeasure = () => {
    if (!currentSong || !selectedMeasureId || selectedSlotIndex === null) return;
    const currentMeasureIndex = currentSong.grid.findIndex(m => m.id === selectedMeasureId);
    if (currentMeasureIndex > 0) {
      const prevMeasure = currentSong.grid[currentMeasureIndex - 1];
      setSelectedMeasureId(prevMeasure.id);
    }
  };

  const handleCreateFolder = (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: 'folder_' + Date.now(),
      name,
      parentId
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const handleCreateSong = (
    title: string, 
    key: string, 
    folderId: string | null, 
    timeSignature: '4/4' | '3/4' = '4/4', 
    importedSong?: Song,
    subheading?: string,
    referenceImage?: string,
    referenceImageName?: string
  ) => {
    let newSong: Song;
    if (importedSong) {
      newSong = {
        ...importedSong,
        title: title || importedSong.title,
        key: key || importedSong.key,
        timeSignature: timeSignature || importedSong.timeSignature || '4/4',
        folderId
      };
    } else {
      newSong = {
        id: 'song_' + Date.now(),
        title,
        key,
        timeSignature,
        grid: Array.from({ length: 128 }, () => createEmptyMeasure(timeSignature)),
        folderId,
        subheading: subheading || undefined,
        referenceImage: referenceImage || undefined,
        referenceImageName: referenceImageName || undefined
      };
    }
    setSongs(prev => [...prev, newSong]);
    setCurrentSongId(newSong.id);
    setActiveScreen('chart');
    // Clear old panel selection to avoid indexes carry-overs
    setSelectedMeasureId(null);
    setSelectedSlotIndex(null);
  };

  const handleUpdateSongTitle = (songId: string, newTitle: string) => {
    setSongsWithHistory(prev => prev.map(s => {
      if (s.id !== songId) return s;
      return { ...s, title: newTitle };
    }));
  };

  const handleUpdateSongSubheading = (songId: string, newSubheading: string) => {
    setSongsWithHistory(prev => prev.map(s => {
      if (s.id !== songId) return s;
      return { ...s, subheading: newSubheading };
    }));
  };

  const handleUpdateSongNotes = (songId: string, category: 'reharm' | 'voicings' | 'improv', notes: NoteBlock[]) => {
    setSongsWithHistory(prev => prev.map(s => {
      if (s.id !== songId) return s;
      if (category === 'reharm') {
        return { ...s, notesReharm: notes };
      } else if (category === 'voicings') {
        return { ...s, notesVoicings: notes };
      } else {
        return { ...s, notesImprov: notes };
      }
    }));
  };

  const handleUpdateSongReference = (songId: string, fields: Partial<Song>) => {
    setSongs(prev => prev.map(s => {
      if (s.id !== songId) return s;
      return { ...s, ...fields };
    }));
  };

  const handleTransposeSong = (songId: string, targetKey: string, transposeChords: boolean) => {
    setSongsWithHistory(prev => prev.map(s => {
      if (s.id !== songId) return s;
      const [oldKeyRoot, oldKeyQuality = 'Maj'] = (s.key || 'C').split(' ');
      const [newKeyRoot, newKeyQuality = 'Maj'] = (targetKey || 'C').split(' ');

      const oldKeyIdx = getKeySemitone(oldKeyRoot);
      const newKeyIdx = getKeySemitone(newKeyRoot);
      
      if (oldKeyIdx === -1 || newKeyIdx === -1 || !transposeChords) {
        return { ...s, key: targetKey };
      }

      // If absolutely no change in key root and quality, just return s
      if (oldKeyIdx === newKeyIdx && oldKeyQuality === newKeyQuality) {
        return s;
      }

      const diff = (newKeyIdx - oldKeyIdx + 12) % 12;

      // Define helper transformations
      const toMinorSuffix = (suffix: string): string => {
        switch (suffix) {
          case '': return 'min';
          case '6': return 'min6';
          case '6/9': return 'min6/9';
          case 'maj7': return 'min7';
          case 'maj9': return 'min9';
          case 'maj11': return 'min11';
          case 'maj13': return 'min13';
          default: return suffix;
        }
      };

      const toMajorSuffix = (suffix: string): string => {
        switch (suffix) {
          case 'min': return '';
          case 'min6': return '6';
          case 'min6/9': return '6/9';
          case 'min7': return 'maj7';
          case 'min9': return 'maj9';
          case 'min11': return 'maj11';
          case 'min13': return 'maj13';
          default: return suffix;
        }
      };

      return {
        ...s,
        key: targetKey,
        grid: s.grid.map(m => ({
          ...m,
          slots: m.slots.map(slot => {
            if (slot.isEmpty) return slot;

            let newRoot = slot.root;
            let newSuffix = slot.suffix;
            let newSlashRoot = slot.slashRoot;

            if (oldKeyQuality === newKeyQuality) {
              // Direct classic transposition
              newRoot = (slot.root + diff) % 12;
              if (slot.slashRoot !== null && slot.slashRoot !== undefined) {
                newSlashRoot = (slot.slashRoot + diff) % 12;
              }
            } else {
              // Mode transformation (Maj <-> Min)
              const oldOffset = (slot.root - oldKeyIdx + 12) % 12;
              let newOffset = oldOffset;

              if (oldKeyQuality === 'Maj' && newKeyQuality === 'Min') {
                // Major to Minor mode transformation
                switch (oldOffset) {
                  case 0: // I -> Im (root remains 0)
                    newOffset = 0;
                    newSuffix = toMinorSuffix(slot.suffix);
                    break;
                  case 1: // bII -> bII
                    newOffset = 1;
                    break;
                  case 2: // II -> II (often half-diminished in minor: iim7b5)
                    newOffset = 2;
                    if (slot.suffix === 'min7') {
                      newSuffix = 'm7b5';
                    } else if (slot.suffix === 'min') {
                      newSuffix = 'dim';
                    }
                    break;
                  case 3: // bIII -> bIII
                    newOffset = 3;
                    break;
                  case 4: // III -> bIII (shifts down 1)
                    newOffset = 3;
                    newSuffix = toMajorSuffix(slot.suffix);
                    break;
                  case 5: // IV -> IVm
                    newOffset = 5;
                    newSuffix = toMinorSuffix(slot.suffix);
                    break;
                  case 6: // #IV -> #IV
                    newOffset = 6;
                    break;
                  case 7: // V -> V or V7 (keep dominant intact, otherwise minor)
                    newOffset = 7;
                    if (slot.suffix === '' || slot.suffix === 'maj7') {
                      newSuffix = toMinorSuffix(slot.suffix);
                    }
                    break;
                  case 8: // bVI -> bVI
                    newOffset = 8;
                    break;
                  case 9: // VI -> bVI (shifts down 1)
                    newOffset = 8;
                    newSuffix = toMajorSuffix(slot.suffix);
                    break;
                  case 10: // bVII -> bVII
                    newOffset = 10;
                    break;
                  case 11: // VII -> bVII (shifts down 1)
                    newOffset = 10;
                    if (slot.suffix === 'm7b5') {
                      newSuffix = '7'; // e.g. Bm7b5 -> Bb7 (or Bbmaj7)
                    } else {
                      newSuffix = toMajorSuffix(slot.suffix);
                    }
                    break;
                }
              } else {
                // Minor to Major mode transformation (Min -> Maj)
                switch (oldOffset) {
                  case 0: // Im -> I
                    newOffset = 0;
                    newSuffix = toMajorSuffix(slot.suffix);
                    break;
                  case 1: // bII -> bII
                    newOffset = 1;
                    break;
                  case 2: // II (often dim or half-dim, e.g. Dm7b5) -> II (Dm7)
                    newOffset = 2;
                    if (slot.suffix === 'm7b5') {
                      newSuffix = 'min7';
                    } else if (slot.suffix === 'dim') {
                      newSuffix = 'min';
                    }
                    break;
                  case 3: // bIII -> III (shifts up 1)
                    newOffset = 4;
                    newSuffix = toMinorSuffix(slot.suffix);
                    break;
                  case 4: // III -> III
                    newOffset = 4;
                    break;
                  case 5: // IVm -> IV
                    newOffset = 5;
                    newSuffix = toMajorSuffix(slot.suffix);
                    break;
                  case 6: // #IV -> #IV
                    newOffset = 6;
                    break;
                  case 7: // V -> V
                    newOffset = 7;
                    if (slot.suffix === 'min' || slot.suffix === 'min7') {
                      newSuffix = toMajorSuffix(slot.suffix);
                    }
                    break;
                  case 8: // bVI -> VI (shifts up 1)
                    newOffset = 9;
                    newSuffix = toMinorSuffix(slot.suffix);
                    break;
                  case 9: // VI -> VI
                    newOffset = 9;
                    break;
                  case 10: // bVII -> VII (shifts up 1)
                    newOffset = 11;
                    if (slot.suffix === '' || slot.suffix === '7' || slot.suffix === 'maj7') {
                      newSuffix = 'm7b5'; // e.g. Bb7 -> Bm7b5
                    } else {
                      newSuffix = toMinorSuffix(slot.suffix);
                    }
                    break;
                  case 11: // VII -> VII
                    newOffset = 11;
                    break;
                }
              }

              // Compute absolute roots after applying the transformed offset relative to the new key
              newRoot = (newKeyIdx + newOffset) % 12;

              if (slot.slashRoot !== null && slot.slashRoot !== undefined) {
                const slashOffset = (slot.slashRoot - oldKeyIdx + 12) % 12;
                let newSlashOffset = slashOffset;
                if (oldKeyQuality === 'Maj' && newKeyQuality === 'Min') {
                  if (slashOffset === 4) newSlashOffset = 3;
                  else if (slashOffset === 9) newSlashOffset = 8;
                  else if (slashOffset === 11) newSlashOffset = 10;
                } else {
                  if (slashOffset === 3) newSlashOffset = 4;
                  else if (slashOffset === 8) newSlashOffset = 9;
                  else if (slashOffset === 10) newSlashOffset = 11;
                }
                newSlashRoot = (newKeyIdx + newSlashOffset) % 12;
              }
            }

            const isFlat = isFlatKey(targetKey);
            const newAccidental = isFlat ? 'flat' : 'sharp';
            const newSlashAccidental = slot.slashAccidental ? (isFlat ? 'flat' : 'sharp') : slot.slashAccidental;

            return {
              ...slot,
              root: newRoot,
              suffix: newSuffix,
              accidental: slot.accidental === 'natural' ? 'natural' : newAccidental as any,
              slashRoot: newSlashRoot,
              slashAccidental: slot.slashAccidental === 'natural' ? 'natural' : (newSlashAccidental as any)
            };
          })
        }))
      };
    }));
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isDeleted: true } : f));
    setSongs(prev => prev.map(s => s.folderId === folderId ? { ...s, isDeleted: true } : s));
  };

  const handleRestoreFolder = (folderId: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isDeleted: false } : f));
    setSongs(prev => prev.map(s => s.folderId === folderId ? { ...s, isDeleted: false } : s));
  };

  const handlePermanentDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setSongs(prev => prev.filter(s => s.folderId !== folderId));
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
  };

  const handleDeleteSong = (songId: string) => {
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, isDeleted: true } : s));
    if (currentSongId === songId) {
      setCurrentSongId(null);
      setActiveScreen('library');
    }
  };

  const handleRestoreSong = (songId: string) => {
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, isDeleted: false } : s));
    // Also auto-restore parent folder if it was deleted
    const targetSong = songs.find(s => s.id === songId);
    if (targetSong && targetSong.folderId) {
      setFolders(prev => prev.map(f => f.id === targetSong.folderId ? { ...f, isDeleted: false } : f));
    }
  };

  const handlePermanentDeleteSong = (songId: string) => {
    setSongs(prev => prev.filter(s => s.id !== songId));
    if (currentSongId === songId) {
      setCurrentSongId(null);
      setActiveScreen('library');
    }
  };

  const handlePermanentDeleteAll = () => {
    setFolders(prev => prev.filter(f => !f.isDeleted));
    setSongs(prev => prev.filter(s => !s.isDeleted));
  };

  const handleMoveSong = (songId: string, folderId: string | null) => {
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, folderId } : s));
  };

  const handleImportMultipleSongs = (importedSongs: Song[]) => {
    let targetFolderId: string | null = null;
    const firstWithPlaylist = importedSongs.find(s => (s as any).playlistName);
    if (firstWithPlaylist) {
      const pName = (firstWithPlaylist as any).playlistName;
      const existingFolder = folders.find(f => f.name.toLowerCase() === pName.toLowerCase());
      if (existingFolder) {
        targetFolderId = existingFolder.id;
      } else {
        const newFolderId = 'folder_' + Date.now();
        const newFolder: Folder = {
          id: newFolderId,
          name: pName,
          parentId: null
        };
        setFolders(prev => [...prev, newFolder]);
        targetFolderId = newFolderId;
      }
    }

    const newSongs: Song[] = importedSongs.map(s => {
      const generatedId = 'song_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
      return {
        ...s,
        id: generatedId,
        folderId: targetFolderId !== null ? targetFolderId : s.folderId,
        grid: padGridTo128(s.grid, s.timeSignature),
        referenceJSON: s.referenceJSON || JSON.stringify(s, null, 2),
        referenceFileName: s.referenceFileName || (s.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_imported.json')
      };
    });
    setSongs(prev => [...prev, ...newSongs]);
  };

  const handleAddMeasure = () => {
    if (!currentSongId) return;
    setSongsWithHistory(prev => prev.map(s => {
      if (s.id !== currentSongId) return s;
      return {
        ...s,
        grid: [...s.grid, createEmptyMeasure()]
      };
    }));
  };

  const handleRemoveLastMeasure = () => {
    if (!currentSongId) return;
    setSongsWithHistory(prev => prev.map(s => {
      if (s.id !== currentSongId) return s;
      if (s.grid.length <= 1) return s;
      return {
        ...s,
        grid: s.grid.slice(0, -1)
      };
    }));
  };

  const handleFactoryReset = () => {
    setResetState('confirm');
  };

  const executeFactoryReset = () => {
    setResetLogs(['Initializing hardware wipe procedure...', 'Erasing cached local storage tracks...']);
    setResetState('wiping');
    setResetPercentage(15);
    
    setTimeout(() => {
      setResetLogs(prev => [...prev, 'Clearing active repertoire list...', 'Mapping default category paths...', 'Re-creating "Jazz" folder...', 'Re-creating "Hymns" folder...']);
      setResetState('loading');
      setResetPercentage(50);
      
      setTimeout(() => {
        setResetLogs(prev => [...prev, 'Re-creating "Practice Material" folder...', 'Resetting current selected track to null...', 'Verifying local sector checksums...']);
        setResetState('indexing');
        setResetPercentage(85);
        
        setTimeout(() => {
          setResetLogs(prev => [...prev, 'Wipe verification: SUCCESS', 'Restarting Virtuoso Workspace...']);
          setResetState('success');
          setResetPercentage(100);
          
          // Perform actual clean
          safeLocalStorage.removeItem('lead_sheet_songs');
          safeLocalStorage.removeItem('lead_sheet_folders');
          safeLocalStorage.removeItem('lead_sheet_current_song_id');
          safeLocalStorage.removeItem('lead_sheet_active_screen');
          
          setTimeout(() => {
            window.location.reload();
          }, 1100);
        }, 850);
      }, 750);
    }, 700);
  };

  const selectedSlot = getSelectedSlotData();

  const handleSetSettingsOpen = (open: boolean) => {
    if (!open) {
      goBackNav(() => setIsSettingsOpen(false));
    } else {
      setIsSettingsOpen(true);
    }
  };

  const handleSetNewFolderOpen = (open: boolean) => {
    if (!open) {
      goBackNav(() => setIsNewFolderOpen(false));
    } else {
      setIsNewFolderOpen(true);
    }
  };

  const handleSetNewSongOpen = (open: boolean) => {
    if (!open) {
      goBackNav(() => setIsNewSongOpen(false));
    } else {
      setIsNewSongOpen(true);
    }
  };

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden flex flex-col transition-colors duration-150 ${theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'text-[#0f172a] bg-[#f8fafc]'}`} id="app_frame_root">

      {activeScreen === 'library' ? (
        <LibraryBrowser
          songs={songs}
          folders={folders}
          theme={theme}
          onSetTheme={setTheme}
          accentColor={accentColor}
          onSetAccentColor={setAccentColor}
          onSelectSong={(songId) => {
            setCurrentSongId(songId);
            setActiveScreen('chart');
            setSelectedMeasureId(null);
            setSelectedSlotIndex(null);
          }}
          onCreateFolder={handleCreateFolder}
          onCreateSong={handleCreateSong}
          onImportMultipleSongs={handleImportMultipleSongs}
          onDeleteFolder={handleDeleteFolder}
          onRestoreFolder={handleRestoreFolder}
          onPermanentDeleteFolder={handlePermanentDeleteFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteSong={handleDeleteSong}
          onRestoreSong={handleRestoreSong}
          onPermanentDeleteSong={handlePermanentDeleteSong}
          onPermanentDeleteAll={handlePermanentDeleteAll}
          onMoveSong={handleMoveSong}
          onFactoryReset={handleFactoryReset}
          chordFont={chordFont}
          onSetChordFont={setChordFont}
          notationStyle={notationStyle}
          onSetNotationStyle={setNotationStyle}
          showMeasureNumbers={showMeasureNumbers}
          onSetShowMeasureNumbers={setShowMeasureNumbers}
          onShowToast={showToast}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          currentSubView={currentSubView}
          setCurrentSubView={setCurrentSubView}
          isSettingsOpen={isSettingsOpen}
          onSetSettingsOpen={handleSetSettingsOpen}
          isNewFolderOpen={isNewFolderOpen}
          onSetNewFolderOpen={handleSetNewFolderOpen}
          isNewSongOpen={isNewSongOpen}
          onSetNewSongOpen={handleSetNewSongOpen}
        />
      ) : (
        currentSong && (
          <LeadSheet
            currentSong={currentSong}
            theme={theme}
            onSelectSlot={(mId, sIdx) => {
              setSelectedMeasureId(mId);
              setSelectedSlotIndex(sIdx);
            }}
            selectedMeasureId={selectedMeasureId}
            selectedSlotIndex={selectedSlotIndex}
            onBackToLibrary={() => {
              setActiveScreen('library');
              setSelectedMeasureId(null);
              setSelectedSlotIndex(null);
              // Ensure all modals/edit drawers are cleared when returning to library
              setIsSettingsOpen(false);
              setIsNewFolderOpen(false);
              setIsNewSongOpen(false);
              setIsEditingTitle(false);
              setIsKeyChangeOpen(false);
              setIsOptionsOpen(false);
            }}
            onAddMeasure={handleAddMeasure}
            onRemoveLastMeasure={handleRemoveLastMeasure}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onShiftSelect={handleShiftSelect}
            onUpdateSelectionRange={(start, end) => {
              setSelectionStart(start);
              setSelectionEnd(end);
            }}
            handlesVisible={handlesVisible}
            setHandlesVisible={setHandlesVisible}
            onUpdateSongTitle={handleUpdateSongTitle}
            onUpdateSongSubheading={handleUpdateSongSubheading}
            onTransposeSong={handleTransposeSong}
            onUpdateSongNotes={handleUpdateSongNotes}
            onCopySelection={handleCopySelection}
            onCutSelection={handleCutSelection}
            onPasteSelection={handlePasteSelection}
            onClearSelection={handleClearSelection}
            onDeselect={handleDeselect}
            onUpdateSongReference={handleUpdateSongReference}
            onUpdateTimeSignature={(newSig) => {
              setSongsWithHistory(prev => prev.map(s => s.id === currentSong.id ? { ...s, timeSignature: newSig } : s));
            }}
            chordFont={chordFont}
            onUpdateChordFont={setChordFont}
            notationStyle={notationStyle}
            onUpdateNotationStyle={setNotationStyle}
            showMeasureNumbers={showMeasureNumbers}
            onUpdateShowMeasureNumbers={setShowMeasureNumbers}
            isEditingTitle={isEditingTitle}
            onSetIsEditingTitle={(open) => {
              if (!open) {
                goBackNav(() => setIsEditingTitle(false));
              } else {
                setIsEditingTitle(true);
              }
            }}
            isKeyChangeOpen={isKeyChangeOpen}
            onSetIsKeyChangeOpen={(open) => {
              if (!open) {
                goBackNav(() => setIsKeyChangeOpen(false));
              } else {
                setIsKeyChangeOpen(true);
              }
            }}
            isOptionsOpen={isOptionsOpen}
            onSetIsOptionsOpen={(open) => {
              if (!open) {
                goBackNav(() => setIsOptionsOpen(false));
              } else {
                setIsOptionsOpen(true);
              }
            }}
          />
        )
      )}


      {/* Slide-out Tactile Chord Pad Editor */}
      {activeScreen === 'chart' && selectedMeasureId && selectedSlotIndex !== null && selectedSlot && currentSong && (
        <TactileEditor
          songKey={currentSong.key}
          selectedMeasureId={selectedMeasureId}
          selectedSlotIndex={selectedSlotIndex}
          slotData={selectedSlot}
          onUpdateSlot={handleUpdateSlot}
          onClose={() => {
            goBackNav(() => {
              setSelectedMeasureId(null);
              setSelectedSlotIndex(null);
              setSelectionStart(null);
              setSelectionEnd(null);
            });
          }}
          onNavigatePrev={handleNavigatePrev}
          onNavigateNext={handleNavigateNext}
          onNavigatePrevMeasure={handleNavigatePrevMeasure}
          onNavigateNextMeasure={handleNavigateNextMeasure}
          timeSignature={currentSong.timeSignature || '4/4'}
          onUpdateTimeSignature={(newSig) => {
            setSongsWithHistory(prev => prev.map(s => s.id === currentSong.id ? { ...s, timeSignature: newSig } : s));
          }}
          measureNumber={getSelectedMeasureNumber()}
          onPaste={handlePasteSelection}
          canPaste={!!copiedSlots && copiedSlots.length > 0}
          onCopy={handleCopySelection}
          onCut={handleCutSelection}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={songsHistory.length > 0}
          canRedo={songsRedoStack.length > 0}
          currentMeasureLabel={currentSong.grid.find(m => m.id === selectedMeasureId)?.label || ''}
          onUpdateMeasureLabel={handleUpdateMeasureLabel}
          onTransposeSong={(targetKey, transposeChords) => handleTransposeSong(currentSong.id, targetKey, transposeChords)}
        />
      )}

      {/* Global Toast Notification System */}
      {toast && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] bg-[#0f172a] border border-slate-800 text-white font-sans rounded-xl py-3 px-6 shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider select-none animate-in fade-in slide-in-from-bottom-5 duration-250 min-w-[280px]"
          id="global_repertoire_toast"
        >
          {toast.type === 'loading' ? (
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="flex-grow text-center">{toast.message}</span>
        </div>
      )}

      {/* Beautiful Animated Database Factory Reset Modals */}
      <AnimatePresence>
        {resetState !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-default"
            id="reset_flow_backdrop"
          >
            <motion.div
              initial={{ scale: 0.96, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white border border-slate-200 max-w-md w-full rounded-2xl overflow-hidden shadow-[0_40px_80px_-15px_rgba(15,23,42,0.4)] p-6 md:p-8 flex flex-col gap-6"
              id="reset_flow_card"
            >
              {resetState === 'confirm' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-rose-600">
                    <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 animate-pulse">
                      <AlertTriangle className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold uppercase tracking-wider text-sm text-slate-800">
                        System Reset Protocol
                      </h3>
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono">
                        Irreversible Operation
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    This action completely de-allocates local cache tables, wipes browser state caches, and recomputes the workspace back to factory default.
                  </p>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5">
                    <span className="font-extrabold text-[#0c4a6e] uppercase tracking-widest text-[9px] block">
                      Categories To Be Preserved:
                    </span>
                    <ul className="text-[11px] text-slate-500 space-y-1 font-semibold pl-1">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0c4a6e] block shrink-0 animate-bounce" />
                        <span>Jazz Folder Category</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0c4a6e] block shrink-0 animate-bounce delay-100" />
                        <span>Hymns Folder Category</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0c4a6e] block shrink-0 animate-bounce delay-200" />
                        <span>Practice Material Folder Category</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setResetState('idle')}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 border border-transparent uppercase tracking-widest text-[10px] font-extrabold rounded-xl transition cursor-pointer"
                    >
                      Abort Reset
                    </button>
                    <button
                      type="button"
                      onClick={executeFactoryReset}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white border border-rose-700 uppercase tracking-widest text-[10px] font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/10"
                    >
                      <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Confirm Wipe</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {resetState === 'success' ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 flex items-center justify-center text-[#0c4a6e]">
                          <RefreshCw className="w-4 h-4 animate-spin text-[#0c4a6e] stroke-[2.5]" />
                        </div>
                      )}
                      <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                        {resetState === 'success' ? 'Reset Complete' : 'Resetting System Database'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#0c4a6e]">
                      {resetPercentage}%
                    </span>
                  </div>

                  {/* Progress bar container */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 relative">
                    <motion.div
                      animate={{ width: `${resetPercentage}%` }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        resetState === 'success'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-[#0c4a6e] to-sky-800'
                      }`}
                    />
                  </div>

                  {/* Monospaced Log Screen */}
                  <div className="bg-slate-900 border border-slate-950 p-4 rounded-xl flex flex-col gap-1.5 h-[140px] overflow-y-auto font-mono text-[9px] leading-relaxed text-slate-400 shadow-inner">
                    <div className="border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between text-[8px] tracking-wider uppercase text-slate-500 font-extrabold">
                      <span>CONSOLE OUTPUT: /dev/repertoire</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    {resetLogs.map((log, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -3 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex gap-1.5 ${idx === resetLogs.length - 1 ? 'text-white' : ''}`}
                      >
                        <span className="text-slate-600 select-none">[{idx + 1}]</span>
                        <span className={log.includes('SUCCESS') ? 'text-emerald-400 font-semibold' : ''}>{log}</span>
                      </motion.div>
                    ))}
                  </div>

                  {resetState === 'success' && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center font-bold text-[10px] uppercase tracking-widest text-emerald-600 font-mono"
                    >
                      SYSTEM ONLINE. REBOOTING WORKSPACE...
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
