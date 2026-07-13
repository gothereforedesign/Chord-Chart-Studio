/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, Measure, ChordSlot, getNoteName, getJazzSuffixSymbol, KEYS, NoteBlock, formatMusicSymbols, formatChordModifier, formatSectionLabelString, getKeySemitone } from '../types';
import { ChordChartGrid } from './ChordChartGrid';
import { buildIRealGridMatrix, generateIRealUri } from '../lib/irealParser';
import html2pdf from 'html2pdf.js';
import { 
  ArrowLeft, Download, Pencil, X, Music, Check, Sparkles, Layers, GraduationCap,
  RotateCw, ZoomIn, ZoomOut, Maximize2, FileCode, HelpCircle, FileText, ImageIcon, Eye, Info,
  Copy, Scissors, Clipboard, Trash2, Sun, Moon, SlidersHorizontal, MoreVertical, Printer
} from 'lucide-react';

interface LeadSheetProps {
  currentSong: Song;
  theme?: string;
  onSelectSlot: (measureId: string, slotIndex: number) => void;
  selectedMeasureId: string | null;
  selectedSlotIndex: string | number | null;
  onBackToLibrary: () => void;
  onAddMeasure: () => void;
  onRemoveLastMeasure: () => void;
  selectionStart: { measureId: string; slotIndex: number } | null;
  selectionEnd: { measureId: string; slotIndex: number } | null;
  onDragStart: (measureId: string, slotIdx: number) => void;
  onDragEnter: (measureId: string, slotIdx: number) => void;
  onShiftSelect: (measureId: string, slotIdx: number) => void;
  onUpdateSelectionRange: (start: { measureId: string; slotIndex: number } | null, end: { measureId: string; slotIndex: number } | null) => void;
  handlesVisible: boolean;
  setHandlesVisible: (v: boolean) => void;
  onUpdateSongTitle: (songId: string, newTitle: string) => void;
  onUpdateSongSubheading?: (songId: string, newSubheading: string) => void;
  onTransposeSong: (songId: string, targetKey: string, transposeChords: boolean) => void;
  onUpdateSongNotes: (songId: string, category: 'reharm' | 'voicings' | 'improv', notes: NoteBlock[]) => void;
  onCopySelection?: () => void;
  onCutSelection?: () => void;
  onPasteSelection?: () => void;
  onClearSelection?: () => void;
  onDeselect?: () => void;
  onUpdateSongReference?: (songId: string, fields: Partial<Song>) => void;
  chordFont?: 'ptsans' | 'petaluma';
  onUpdateChordFont?: (font: 'ptsans' | 'petaluma') => void;
  notationStyle?: 'standard' | 'ireal';
  onUpdateNotationStyle?: (style: 'standard' | 'ireal') => void;
  showMeasureNumbers?: boolean;
  onUpdateShowMeasureNumbers?: (show: boolean) => void;
  isEditingTitle?: boolean;
  onSetIsEditingTitle?: (v: boolean) => void;
  isKeyChangeOpen?: boolean;
  onSetIsKeyChangeOpen?: (v: boolean) => void;
  isOptionsOpen?: boolean;
  onSetIsOptionsOpen?: (v: boolean) => void;
  onUpdateTimeSignature?: (newSig: '4/4' | '3/4') => void;
}

function parseJazzSuffix(suffixSym: string): { mainPart: string; alterationParts: string[] } {
  const sym = formatMusicSymbols(suffixSym); // Ensure unified flat/sharp symbols Unicode '♭' and '♯'
  
  // 1. Precise mappings for stacked extensions
  // 7th chord with single alteration
  if (sym === '7♭5') return { mainPart: '7', alterationParts: ['♭5'] };
  if (sym === '7♯5') return { mainPart: '7', alterationParts: ['♯5'] };
  if (sym === '7♭9') return { mainPart: '7', alterationParts: ['♭9'] };
  if (sym === '7♯9') return { mainPart: '7', alterationParts: ['♯9'] };
  if (sym === '7♯11') return { mainPart: '7', alterationParts: ['♯11'] };
  if (sym === '7♭13') return { mainPart: '7', alterationParts: ['♭13'] };
  if (sym === '7alt') return { mainPart: '7', alterationParts: ['alt'] };

  // 9th chord with single alteration
  if (sym === '9♭5') return { mainPart: '9', alterationParts: ['♭5'] };
  if (sym === '9♯5') return { mainPart: '9', alterationParts: ['♯5'] };
  if (sym === '9♭13') return { mainPart: '9', alterationParts: ['♭13'] };

  // 13th chord with single alteration
  if (sym === '13♭9') return { mainPart: '13', alterationParts: ['♭9'] };
  if (sym === '13♯11') return { mainPart: '13', alterationParts: ['♯11'] };

  // Major family with alterations
  if (sym === 'Δ7♯11' || sym === 'Δ7#11') return { mainPart: 'Δ7', alterationParts: ['♯11'] };
  if (sym === 'Δ9♯11' || sym === 'Δ9#11') return { mainPart: 'Δ9', alterationParts: ['♯11'] };
  if (sym === 'Δ7♯5' || sym === 'Δ7#5') return { mainPart: 'Δ7', alterationParts: ['♯5'] };

  // Diminished/major
  if (sym === 'oΔ7') return { mainPart: 'o', alterationParts: ['Δ7'] };

  // Minor major family
  if (sym === '-Δ7') return { mainPart: '-', alterationParts: ['Δ7'] };
  if (sym === '-Δ9') return { mainPart: '-', alterationParts: ['Δ9'] };

  // 6/9 chords
  if (sym === '6/9') return { mainPart: '6', alterationParts: ['9'] };
  if (sym === '-6/9') return { mainPart: '-6', alterationParts: ['9'] };

  // Suspended chords
  if (sym === '7sus') return { mainPart: '7', alterationParts: ['sus'] };
  if (sym === '9sus') return { mainPart: '9', alterationParts: ['sus'] };

  // Stack standard extensions on top of their quality symbol
  // Examples: "Δ7" -> { mainPart: "Δ", alterationParts: ["7"] }
  // "-7" -> { mainPart: "-", alterationParts: ["7"] }
  // "maj7" -> { mainPart: "maj", alterationParts: ["7"] }
  const qualityMatch = sym.match(/^([Δ\-øo+])(\d+|sus\d*|alt|add\d+)$/);
  if (qualityMatch) {
    return { mainPart: qualityMatch[1], alterationParts: [qualityMatch[2]] };
  }

  const standardMatch = sym.match(/^(maj|min|dim|aug|m)(\d+|sus\d*|alt|add\d+)$/i);
  if (standardMatch) {
    return { mainPart: standardMatch[1], alterationParts: [standardMatch[2]] };
  }

  if (sym === 'm7♭5' || sym === 'm7#5') {
    return { mainPart: 'm7', alterationParts: [sym.slice(2)] };
  }

  // Support potential compound alterations from edits e.g. "7b9b13" -> "7" + ["♭9", "♭13"]
  // Or "7#9#5" -> "7" + ["♯9", "♯5"]
  if (sym.match(/^(?:[A-G][b#♭♯]?)?7[♭♯b#alt\d]+/)) {
    const matches = sym.match(/^7((?:[♭♯b#alt\d]+)+)$/);
    if (matches) {
      const rest = matches[1];
      const alts: string[] = [];
      const regex = /(♭\d+|♯\d+|♭5|♯5|♭9|♯9|♭13|♯11|alt|b\d+|#\d+)/g;
      let m;
      while ((m = regex.exec(rest)) !== null) {
        alts.push(m[0]);
      }
      if (alts.length > 0) {
        return { mainPart: '7', alterationParts: alts };
      }
    }
  }

  return { mainPart: sym, alterationParts: [] };
}

export function LeadSheet({
  currentSong,
  theme = 'light',
  onSelectSlot,
  selectedMeasureId,
  selectedSlotIndex,
  onBackToLibrary,
  onAddMeasure,
  onRemoveLastMeasure,
  selectionStart,
  selectionEnd,
  onDragStart,
  onDragEnter,
  onShiftSelect,
  onUpdateSelectionRange,
  handlesVisible,
  setHandlesVisible,
  onUpdateSongTitle,
  onUpdateSongSubheading,
  onTransposeSong,
  onUpdateSongNotes,
  onCopySelection,
  onCutSelection,
  onPasteSelection,
  onClearSelection,
  onDeselect,
  onUpdateSongReference,
  chordFont = 'ptsans',
  onUpdateChordFont,
  notationStyle = 'ireal',
  onUpdateNotationStyle,
  showMeasureNumbers = true,
  onUpdateShowMeasureNumbers,
  isEditingTitle: propIsEditingTitle,
  onSetIsEditingTitle,
  isKeyChangeOpen: propIsKeyChangeOpen,
  onSetIsKeyChangeOpen,
  isOptionsOpen: propIsOptionsOpen,
  onSetIsOptionsOpen,
  onUpdateTimeSignature
}: LeadSheetProps) {

  const isDark = theme === 'dark';

  // Local states with fallback to props if supplied
  const [localIsEditingTitle, setLocalIsEditingTitle] = useState(false);
  const isEditingTitle = propIsEditingTitle !== undefined ? propIsEditingTitle : localIsEditingTitle;
  const setIsEditingTitle = onSetIsEditingTitle !== undefined ? onSetIsEditingTitle : setLocalIsEditingTitle;

  const [localTempTitle, setLocalTempTitle] = useState(currentSong.title);
  const [localTempSubheading, setLocalTempSubheading] = useState(currentSong.subheading || '');

  const [localIsKeyChangeOpen, setLocalIsKeyChangeOpen] = useState(false);
  const isKeyChangeOpen = propIsKeyChangeOpen !== undefined ? propIsKeyChangeOpen : localIsKeyChangeOpen;
  const setIsKeyChangeOpen = onSetIsKeyChangeOpen !== undefined ? onSetIsKeyChangeOpen : setLocalIsKeyChangeOpen;

  const [selectedQuality, setSelectedQuality] = useState<'Maj' | 'Min'>('Maj');
  const [toastMessage, setToastMessage] = useState('');

  // Local state aliases mapped for consistent internal references
  const tempTitle = localTempTitle;
  const setTempTitle = setLocalTempTitle;
  const tempSubheading = localTempSubheading;
  const setTempSubheading = setLocalTempSubheading;

  const [activeNotesTab, setActiveNotesTab] = useState<'reharm' | 'voicings' | 'improv'>('reharm');

  // Navigation between Chart view and original reference file view
  const [currentView, setCurrentView] = useState<'chart' | 'reference'>('chart');
  const [referenceZoom, setReferenceZoom] = useState(1);
  const [referenceRotation, setReferenceRotation] = useState(0);
  const [isFullscreenReference, setIsFullscreenReference] = useState(false);

  const [localIsOptionsOpen, setLocalIsOptionsOpen] = useState(false);
  const isOptionsOpen = propIsOptionsOpen !== undefined ? propIsOptionsOpen : localIsOptionsOpen;
  const setIsOptionsOpen = onSetIsOptionsOpen !== undefined ? onSetIsOptionsOpen : setLocalIsOptionsOpen;

  const [canScrollY, setCanScrollY] = useState(true);

  React.useLayoutEffect(() => {
    const board = document.getElementById('music_score_drawing_board');
    if (!board) return;

    const checkScroll = () => {
      // If keyboard is open, always allow scroll
      if (selectedMeasureId !== null && selectedSlotIndex !== null) {
        setCanScrollY(true);
        return;
      }
      const stackBox = document.getElementById('systems_stack_box');
      if (stackBox) {
        // Only allow vertical scrolling if the actual chart content height exceeds the viewport
        const hasOverflow = stackBox.offsetHeight > board.clientHeight;
        setCanScrollY(hasOverflow);
      } else {
        const hasOverflow = board.scrollHeight > board.clientHeight + 4;
        setCanScrollY(hasOverflow);
      }
    };

    // Check immediately
    checkScroll();

    // Use ResizeObserver to check on layout/resize changes
    const observer = new ResizeObserver(() => {
      checkScroll();
    });
    observer.observe(board);
    
    // Also observe systems_stack_box
    const stackBox = document.getElementById('systems_stack_box');
    if (stackBox) {
      observer.observe(stackBox);
    }

    return () => {
      observer.disconnect();
    };
  }, [selectedMeasureId, selectedSlotIndex, currentSong.grid]);

  useEffect(() => {
    setTempTitle(currentSong.title);
    setTempSubheading(currentSong.subheading || '');
  }, [currentSong.title, currentSong.subheading]);

  useEffect(() => {
    if (isKeyChangeOpen) {
      const q = (currentSong.key || '').split(' ')[1] || 'Maj';
      setSelectedQuality(q === 'Min' ? 'Min' : 'Maj');
    }
  }, [isKeyChangeOpen, currentSong.key]);

  const handleSaveTitle = () => {
    onUpdateSongTitle(currentSong.id, tempTitle);
    if (onUpdateSongSubheading) {
      onUpdateSongSubheading(currentSong.id, tempSubheading);
    }
    setIsEditingTitle(false);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleReferenceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    const isImageOrPdf = file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    if (isImageOrPdf) {
      reader.onload = () => {
        const base64 = reader.result as string;
        if (onUpdateSongReference) {
          onUpdateSongReference(currentSong.id, {
            referenceImage: base64,
            referenceImageName: file.name,
            referenceJSON: undefined,
            referenceFileName: undefined,
            referencePrompt: undefined
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = () => {
        const text = reader.result as string;
        if (onUpdateSongReference) {
          onUpdateSongReference(currentSong.id, {
            referenceJSON: text,
            referenceFileName: file.name,
            referenceImage: undefined,
            referenceImageName: undefined,
            referencePrompt: undefined
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadReferenceFile = () => {
    if (currentSong.referenceImage) {
      const link = document.createElement('a');
      link.href = currentSong.referenceImage;
      link.download = currentSong.referenceImageName || 'scanned_sheet_music_reference.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (currentSong.referenceJSON) {
      let ext = '.txt';
      let isJSON = false;
      try {
        JSON.parse(currentSong.referenceJSON);
        ext = '.json';
        isJSON = true;
      } catch (_) {}

      let downloadContent = currentSong.referenceJSON;

      if (isJSON) {
        // Construct updated JSON representation of the live chart so manual edits are saved!
        const keySig = currentSong.key;
        const timeSig = currentSong.timeSignature || '4/4';

        const measuresData = currentSong.grid.map(measure => {
          return measure.slots.map(slot => {
            if (slot.isEmpty) return '.';
            const rootName = getNoteName(slot.root, keySig, slot.accidental || undefined);
            const suffix = slot.suffix || '';
            let slashSuffix = '';
            if (slot.slashRoot !== undefined && slot.slashRoot !== null) {
              const slashName = getNoteName(slot.slashRoot, keySig, slot.slashAccidental || undefined);
              slashSuffix = '/' + slashName;
            }
            return `${rootName}${suffix}${slashSuffix}`;
          });
        });

        let lastNonEmptyIndex = -1;
        for (let i = measuresData.length - 1; i >= 0; i--) {
          const isAllEmpty = measuresData[i].every(b => b === '.' || !b);
          if (!isAllEmpty) {
            lastNonEmptyIndex = i;
            break;
          }
        }

        const slicedMeasures = lastNonEmptyIndex !== -1 
          ? measuresData.slice(0, lastNonEmptyIndex + 1) 
          : measuresData.slice(0, 8);

        const sectionsArray = currentSong.grid
          .map((m, idx) => ({ index: idx, label: m.label ? formatSectionLabelString(m.label.trim()) : undefined }))
          .filter((s): s is { index: number; label: string } => !!s.label && s.label !== '');

        const exportObj: any = {
          title: currentSong.title,
          subheading: currentSong.subheading || '',
          key: keySig,
          timeSignature: timeSig,
          measures: slicedMeasures,
          grid: currentSong.grid.map(m => ({
            id: m.id,
            label: m.label ? formatSectionLabelString(m.label.trim()) : undefined,
            slots: m.slots.map(s => ({
              root: s.root,
              accidental: s.accidental || 'natural',
              suffix: s.suffix || '',
              isEmpty: !!s.isEmpty,
              slashRoot: s.slashRoot !== undefined ? s.slashRoot : null,
              slashAccidental: s.slashAccidental !== undefined ? s.slashAccidental : null,
              sizePercent: s.sizePercent,
              isSmall: s.isSmall
            }))
          }))
        };

        if (sectionsArray.length > 0) {
          exportObj.sections = sectionsArray;
        }

        if (currentSong.notesReharm) exportObj.notesReharm = currentSong.notesReharm;
        if (currentSong.notesVoicings) exportObj.notesVoicings = currentSong.notesVoicings;
        if (currentSong.notesImprov) exportObj.notesImprov = currentSong.notesImprov;
        if (currentSong.referenceImage) exportObj.referenceImage = currentSong.referenceImage;
        if (currentSong.referenceImageName) exportObj.referenceImageName = currentSong.referenceImageName;
        if (currentSong.referencePrompt) exportObj.referencePrompt = currentSong.referencePrompt;
        if (currentSong.referenceFileName) exportObj.referenceFileName = currentSong.referenceFileName;

        downloadContent = JSON.stringify(exportObj, null, 2);
      }

      const mimeType = isJSON ? 'application/json' : 'text/plain';
      const blob = new Blob([downloadContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = currentSong.referenceFileName || `imported_chart_source${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (currentSong.referencePrompt) {
      const blob = new Blob([currentSong.referencePrompt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentSong.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ai_prompt_reference.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleKeySelect = (targetKey: string) => {
    onTransposeSong(currentSong.id, targetKey, true);
    setIsKeyChangeOpen(false);
    setToastMessage(`Chords transposed and base key changed to ${targetKey}`);
  };

  // Layout presentation controls for key transpositions
  const [transpositionMode, setTranspositionMode] = useState<'concert' | 'bb' | 'eb'>('concert');

  const handleSelectAll = () => {
    if (currentSong && currentSong.grid.length > 0) {
      const beatsPerMeasure = currentSong.timeSignature === '3/4' ? 3 : 4;
      const start = { measureId: currentSong.grid[0].id, slotIndex: 0 };
      const end = { measureId: currentSong.grid[currentSong.grid.length - 1].id, slotIndex: beatsPerMeasure - 1 };
      onUpdateSelectionRange(start, end);
      setHandlesVisible(true);
    }
  };

  // Unified global positioning helper
  const getFlatIndex = (mId: string, sIdx: number): number => {
    const idx = currentSong.grid.findIndex(m => m.id === mId);
    if (idx === -1) return -1;
    const beatsPerMeasure = currentSong.timeSignature === '3/4' ? 3 : 4;
    return idx * beatsPerMeasure + sIdx;
  };

  // Local state and refs for selection handles and tap-and-hold (long-press)
  const [activeHandleDrag, setActiveHandleDrag] = useState<'start' | 'end' | null>(null);
  const activeHandleDragRef = React.useRef<'start' | 'end' | null>(null);

  const [showDragEditModal, setShowDragEditModal] = useState(false);
  const [dragEditModalPosition, setDragEditModalPosition] = useState<{ x: number, y: number } | null>(null);

  const longPressTimeoutRef = React.useRef<any>(null);
  const touchStartPosRef = React.useRef<{ x: number, y: number } | null>(null);
  const touchHasMovedRef = React.useRef(false);
  const isLongPressTriggeredRef = React.useRef(false);
  const wasLongPressTriggeredDuringReleaseRef = React.useRef(false);
  const dragCoordsRef = React.useRef<{ x: number, y: number } | null>(null);

  const lastTapTimeRef = React.useRef<number>(0);
  const tapCountRef = React.useRef<number>(0);
  const isDoubleTapTriggeredRef = React.useRef(false);

  // Auto hide popover on copy/unselect trigger
  useEffect(() => {
    if (!selectionStart || !selectionEnd) {
      setShowDragEditModal(false);
    }
  }, [selectionStart, selectionEnd]);

  // Scroll selected slot into view above the Tactile Keyboard Editor panel
  useEffect(() => {
    if (selectedMeasureId && selectedSlotIndex !== null) {
      const flatIdx = getFlatIndex(selectedMeasureId, Number(selectedSlotIndex));
      if (flatIdx !== -1) {
        const timer = setTimeout(() => {
          const el = document.querySelector(`[data-flat-index="${flatIdx}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedMeasureId, selectedSlotIndex]);

  // Continuous smooth auto-scrolling on boundary drag selection
  useEffect(() => {
    let animationFrameId: number;
    let isMouseDown = false;

    const handleGlobalMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown = true;
      }
    };

    const handleGlobalMouseUp = () => {
      isMouseDown = false;
      dragCoordsRef.current = null;
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isMouseDown && selectionStart) {
        dragCoordsRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        dragCoordsRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const tick = () => {
      const isSelectDragging = isLongPressTriggeredRef.current || (isMouseDown && selectionStart !== null);
      const isHandleDragging = activeHandleDragRef.current !== null;
      const coords = dragCoordsRef.current;

      if ((isSelectDragging || isHandleDragging) && coords) {
        const clientY = coords.y;
        const isEditing = selectedMeasureId !== null && selectedSlotIndex !== null;
        const keyboardHeight = isEditing
          ? (window.innerWidth >= 1024 ? 500 : Math.round(window.innerHeight * 0.48))
          : 0;
        const cutoffBottom = window.innerHeight - keyboardHeight;

        let scrollAmount = 0;

        // Top auto-scroll zone (near header)
        if (clientY < 140) {
          if (clientY < 70) {
            scrollAmount = -18;
          } else {
            scrollAmount = -6;
          }
        }
        // Bottom auto-scroll zone (takes tactile keyboard into account)
        else if (clientY > cutoffBottom - 95) {
          if (clientY > cutoffBottom - 25) {
            scrollAmount = 18;
          } else {
            scrollAmount = 6;
          }
        }

        if (scrollAmount !== 0) {
          const scrollContainer = document.getElementById('music_score_drawing_board');
          if (scrollContainer) {
            scrollContainer.scrollBy(0, scrollAmount);
          } else {
            window.scrollBy(0, scrollAmount);
          }

          // After scroll position shift, update coordinates check dynamically to trigger highlight shift of index
          const hoveredElement = document.elementFromPoint(coords.x, coords.y);
          const slotEl = hoveredElement?.closest('[data-flat-index]');
          if (slotEl) {
            const flatIdx = parseInt(slotEl.getAttribute('data-flat-index') || '-1', 10);
            if (flatIdx >= 0) {
              const beatsPerMeasure = currentSong.timeSignature === '3/4' ? 3 : 4;
              if (isSelectDragging && selectionStart) {
                const mIdx = Math.floor(flatIdx / beatsPerMeasure);
                const sIdx = flatIdx % beatsPerMeasure;
                const targetMeasure = currentSong.grid[mIdx];
                if (targetMeasure) {
                  onUpdateSelectionRange(selectionStart, { measureId: targetMeasure.id, slotIndex: sIdx });
                }
              } else if (isHandleDragging && selectionStart && selectionEnd) {
                const draggingType = activeHandleDragRef.current;
                const startIdx = getFlatIndex(selectionStart.measureId, selectionStart.slotIndex);
                const endIdx = getFlatIndex(selectionEnd.measureId, selectionEnd.slotIndex);
                if (startIdx !== -1 && endIdx !== -1) {
                  const currentMin = Math.min(startIdx, endIdx);
                  const currentMax = Math.max(startIdx, endIdx);
                  const targetFixedIdx = draggingType === 'start' ? currentMax : currentMin;

                  const fixedMIdx = Math.floor(targetFixedIdx / beatsPerMeasure);
                  const fixedSIdx = targetFixedIdx % beatsPerMeasure;
                  const fixedMeasure = currentSong.grid[fixedMIdx];

                  const newMIdx = Math.floor(flatIdx / beatsPerMeasure);
                  const newSIdx = flatIdx % beatsPerMeasure;
                  const newMeasure = currentSong.grid[newMIdx];

                  if (fixedMeasure && newMeasure) {
                    onUpdateSelectionRange(
                      { measureId: fixedMeasure.id, slotIndex: fixedSIdx },
                      { measureId: newMeasure.id, slotIndex: newSIdx }
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Schedule next frame during active dragging
      if (isLongPressTriggeredRef.current || activeHandleDragRef.current !== null || (isMouseDown && selectionStart !== null)) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('mousedown', handleGlobalMouseDown);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('touchend', handleGlobalMouseUp);

    // Only start frame if dragging is active
    if (activeHandleDrag !== null || isLongPressTriggeredRef.current || selectionStart !== null) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('mousedown', handleGlobalMouseDown);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [selectionStart, selectionEnd, selectedMeasureId, selectedSlotIndex, currentSong, onUpdateSelectionRange, activeHandleDrag]);

  // Handle outside click to dismiss context popover
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const modalEl = document.getElementById('drag_edit_popover_modal');
      if (modalEl) {
        const target = e.target as HTMLElement;
        if (!modalEl.contains(target)) {
          setShowDragEditModal(false);
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showDragEditModal]);

  // Global mouseup/touchend action handler to position options modal on drag release
  useEffect(() => {
    const handleRelease = (e: MouseEvent | TouchEvent) => {
      if (selectionStart && selectionEnd) {
        const clientX = 'changedTouches' in e 
          ? (e as any).changedTouches[0].clientX 
          : ('touches' in e && (e as any).touches.length > 0 
            ? (e as any).touches[0].clientX 
            : (e as any).clientX);
        const clientY = 'changedTouches' in e 
          ? (e as any).changedTouches[0].clientY 
          : ('touches' in e && (e as any).touches.length > 0 
            ? (e as any).touches[0].clientY 
            : (e as any).clientY);

        if (clientX !== undefined && clientY !== undefined) {
          const menuWidth = window.innerWidth < 480 ? 300 : 350;
          const menuHeight = 40;
          const posX = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, clientX - menuWidth / 2));
          const posY = Math.max(8, Math.min(window.innerHeight - menuHeight - 8, clientY - 55));

          const startIdx = getFlatIndex(selectionStart.measureId, selectionStart.slotIndex);
          const endIdx = getFlatIndex(selectionEnd.measureId, selectionEnd.slotIndex);
          if (startIdx !== -1 && endIdx !== -1) {
            if (isLongPressTriggeredRef.current || wasLongPressTriggeredDuringReleaseRef.current) {
              setDragEditModalPosition({ x: posX, y: posY });
              setShowDragEditModal(true);
            }
          }
        }
      }
      wasLongPressTriggeredDuringReleaseRef.current = false;
    };

    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    return () => {
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
    };
  }, [selectionStart, selectionEnd, currentSong]);

  // User double-tap/double-click: Highlight/select this single chord
  const onDoubleTapSlot = (measureId: string, slotIdx: number) => {
    onUpdateSelectionRange(
      { measureId, slotIndex: slotIdx },
      { measureId, slotIndex: slotIdx }
    );
    setHandlesVisible(true);
    onSelectSlot(measureId, slotIdx);
  };

  // User triple-tap/triple-click: Highlight/select the whole line (system row)
  const onTripleTapSlot = (measureId: string, slotIdx: number) => {
    const measureIdx = currentSong.grid.findIndex(m => m.id === measureId);
    if (measureIdx !== -1) {
      const rowIndex = Math.floor(measureIdx / 4);
      const startMeasureIdx = rowIndex * 4;
      const endMeasureIdx = Math.min(startMeasureIdx + 3, currentSong.grid.length - 1);
      
      const startMeasure = currentSong.grid[startMeasureIdx];
      const endMeasure = currentSong.grid[endMeasureIdx];
      
      if (startMeasure && endMeasure) {
        onUpdateSelectionRange(
          { measureId: startMeasure.id, slotIndex: 0 },
          { measureId: endMeasure.id, slotIndex: endMeasure.slots.length - 1 }
        );
        setHandlesVisible(true);
        onSelectSlot(measureId, slotIdx);
      }
    }
  };

  // Function to begin selection handles dragging
  const handleStartHandleDrag = (type: 'start' | 'end') => {
    setActiveHandleDrag(type);
    activeHandleDragRef.current = type;
  };

  // Safe global handle movement listener
  React.useEffect(() => {
    if (!activeHandleDrag) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const dragging = activeHandleDragRef.current;
      if (!dragging || !selectionStart || !selectionEnd) return;

      const clientX = ('touches' in e && e.touches && e.touches.length > 0) 
        ? e.touches[0].clientX 
        : ('changedTouches' in e && (e as any).changedTouches && (e as any).changedTouches.length > 0)
          ? (e as any).changedTouches[0].clientX
          : (e as MouseEvent).clientX;

      const clientY = ('touches' in e && e.touches && e.touches.length > 0) 
        ? e.touches[0].clientY 
        : ('changedTouches' in e && (e as any).changedTouches && (e as any).changedTouches.length > 0)
          ? (e as any).changedTouches[0].clientY
          : (e as MouseEvent).clientY;

      // Track drag coordinates for continuous auto-scrolling
      dragCoordsRef.current = { x: clientX, y: clientY };

      const hoveredElement = document.elementFromPoint(clientX, clientY);
      const slotEl = hoveredElement?.closest('[data-flat-index]');
      if (slotEl) {
        const flatIdx = parseInt(slotEl.getAttribute('data-flat-index') || '-1', 10);
        if (flatIdx >= 0) {
          const startIdx = getFlatIndex(selectionStart.measureId, selectionStart.slotIndex);
          const endIdx = getFlatIndex(selectionEnd.measureId, selectionEnd.slotIndex);
          if (startIdx === -1 || endIdx === -1) return;

          const currentMin = Math.min(startIdx, endIdx);
          const currentMax = Math.max(startIdx, endIdx);

          let targetFixedIdx = dragging === 'start' ? currentMax : currentMin;

          const beatsPerMeasure = currentSong.timeSignature === '3/4' ? 3 : 4;

          // Map fixed index back
          const fixedMIdx = Math.floor(targetFixedIdx / beatsPerMeasure);
          const fixedSIdx = targetFixedIdx % beatsPerMeasure;
          const fixedMeasure = currentSong.grid[fixedMIdx];

          // Map new index back
          const newMIdx = Math.floor(flatIdx / beatsPerMeasure);
          const newSIdx = flatIdx % beatsPerMeasure;
          const newMeasure = currentSong.grid[newMIdx];

          if (fixedMeasure && newMeasure) {
            onUpdateSelectionRange(
              { measureId: fixedMeasure.id, slotIndex: fixedSIdx },
              { measureId: newMeasure.id, slotIndex: newSIdx }
            );
          }
        }
      }
    };

    const handlePointerUp = () => {
      setActiveHandleDrag(null);
      activeHandleDragRef.current = null;
      dragCoordsRef.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [activeHandleDrag, selectionStart, selectionEnd, currentSong, onUpdateSelectionRange]);

  // Touch and mouse longpress selection helpers
  const handleSlotTouchStart = (measureId: string, slotIdx: number, e: React.TouchEvent | React.MouseEvent) => {
    // Determine coordinates
    const clientX = ('touches' in e && e.touches && e.touches.length > 0)
      ? e.touches[0].clientX
      : ('changedTouches' in e && (e as any).changedTouches && (e as any).changedTouches.length > 0)
        ? (e as any).changedTouches[0].clientX
        : (e as any).clientX;

    const clientY = ('touches' in e && e.touches && e.touches.length > 0)
      ? e.touches[0].clientY
      : ('changedTouches' in e && (e as any).changedTouches && (e as any).changedTouches.length > 0)
        ? (e as any).changedTouches[0].clientY
        : (e as any).clientY;

    touchStartPosRef.current = { x: clientX, y: clientY };
    touchHasMovedRef.current = false;
    isLongPressTriggeredRef.current = false;

    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const now = Date.now();
    const lastTap = lastTapTimeRef.current;
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && (now - lastTap < DOUBLE_TAP_DELAY)) {
      tapCountRef.current = tapCountRef.current + 1;
    } else {
      tapCountRef.current = 1;
    }
    
    lastTapTimeRef.current = now;

    if (tapCountRef.current === 2) {
      isDoubleTapTriggeredRef.current = true;
      onDoubleTapSlot(measureId, slotIdx);
    } else if (tapCountRef.current >= 3) {
      isDoubleTapTriggeredRef.current = true;
      onTripleTapSlot(measureId, slotIdx);
    } else {
      isDoubleTapTriggeredRef.current = false;
      longPressTimeoutRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        onDragStart(measureId, slotIdx);
        setHandlesVisible(true);

        // Play soft haptic feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 1000); // 1000ms (1 second) press-and-hold delay
    }
  };

  const handleSlotTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = ('touches' in e && e.touches && e.touches.length > 0)
      ? e.touches[0].clientX
      : ('changedTouches' in e && (e as any).changedTouches && (e as any).changedTouches.length > 0)
        ? (e as any).changedTouches[0].clientX
        : (e as any).clientX;

    const clientY = ('touches' in e && e.touches && e.touches.length > 0)
      ? e.touches[0].clientY
      : ('changedTouches' in e && (e as any).changedTouches && (e as any).changedTouches.length > 0)
        ? (e as any).changedTouches[0].clientY
        : (e as any).clientY;

    if (isLongPressTriggeredRef.current) {
      if ('touches' in e) {
        // Prevent scrolling once we've entered selection highlighting mode
        e.preventDefault();
      }

      // Track drag coordinates for continuous auto-scrolling
      dragCoordsRef.current = { x: clientX, y: clientY };

      // Drag across canvas highlighting additional sections in order
      const hoveredElement = document.elementFromPoint(clientX, clientY);
      const slotEl = hoveredElement?.closest('[data-flat-index]');
      if (slotEl) {
        const flatIdx = parseInt(slotEl.getAttribute('data-flat-index') || '-1', 10);
        if (flatIdx >= 0 && selectionStart) {
          const beatsPerMeasure = currentSong.timeSignature === '3/4' ? 3 : 4;
          const mIdx = Math.floor(flatIdx / beatsPerMeasure);
          const sIdx = flatIdx % beatsPerMeasure;
          const targetMeasure = currentSong.grid[mIdx];
          if (targetMeasure) {
            onUpdateSelectionRange(selectionStart, { measureId: targetMeasure.id, slotIndex: sIdx });
          }
        }
      }
      return;
    }

    if (touchStartPosRef.current) {
      const dx = clientX - touchStartPosRef.current.x;
      const dy = clientY - touchStartPosRef.current.y;
      // Cancel long press if user moves more than 10px (they are scrolling)
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        touchHasMovedRef.current = true;
        if (longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current);
          longPressTimeoutRef.current = null;
        }
      }
    }
  };

  const handleSlotTouchEnd = (measureId: string, slotIdx: number, e: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    const wasTriggered = isLongPressTriggeredRef.current;
    isLongPressTriggeredRef.current = false;
    wasLongPressTriggeredDuringReleaseRef.current = wasTriggered;
    dragCoordsRef.current = null; // Clear auto-scrolling coordinates
    const hasMoved = touchHasMovedRef.current;
    touchHasMovedRef.current = false;
    touchStartPosRef.current = null;

    if (!wasTriggered && !isDoubleTapTriggeredRef.current && !hasMoved) {
      // Small tap! Clear range selection highlight first, then select slot for tactile editor
      onUpdateSelectionRange(null, null);
      setHandlesVisible(false);
      onSelectSlot(measureId, slotIdx);
    }
  };

  // Transposition mathematics helper
  const semitoneShift = transpositionMode === 'bb' ? 2 : transpositionMode === 'eb' ? 9 : 0;
  const [currentSongKeyRoot, currentSongKeyQuality = 'Maj'] = (currentSong.key || 'C').split(' ');
  const originalKeyIdx = getKeySemitone(currentSongKeyRoot);
  const transposedKeyIdx = (originalKeyIdx + semitoneShift + 12) % 12;
  const transposedKeySpelling = KEYS[transposedKeyIdx] + ' ' + currentSongKeyQuality;

  const handleExport = (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanTitle = currentSong.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '') || 'practice_chart';
    
    const keySig = currentSong.key;
    const timeSig = currentSong.timeSignature || '4/4';

    const measuresData = currentSong.grid.map(measure => {
      return measure.slots.map(slot => {
        if (slot.isEmpty) return '.';
        const rootName = getNoteName(slot.root, keySig, slot.accidental || undefined);
        const suffix = slot.suffix || '';
        let slashSuffix = '';
        if (slot.slashRoot !== undefined && slot.slashRoot !== null) {
          const slashName = getNoteName(slot.slashRoot, keySig, slot.slashAccidental || undefined);
          slashSuffix = '/' + slashName;
        }
        return `${rootName}${suffix}${slashSuffix}`;
      });
    });

    let lastNonEmptyIndex = -1;
    for (let i = measuresData.length - 1; i >= 0; i--) {
      const isAllEmpty = measuresData[i].every(b => b === '.' || !b);
      if (!isAllEmpty) {
        lastNonEmptyIndex = i;
        break;
      }
    }

    const slicedMeasures = lastNonEmptyIndex !== -1 
      ? measuresData.slice(0, lastNonEmptyIndex + 1) 
      : measuresData.slice(0, 8);

    const sectionsArray = currentSong.grid
      .map((m, idx) => ({ index: idx, label: m.label ? formatSectionLabelString(m.label.trim()) : undefined }))
      .filter((s): s is { index: number; label: string } => !!s.label && s.label !== '');

    const exportObj: any = {
      title: currentSong.title,
      subheading: currentSong.subheading || '',
      key: keySig,
      timeSignature: timeSig,
      measures: slicedMeasures,
      grid: currentSong.grid.map(m => ({
        id: m.id,
        label: m.label ? formatSectionLabelString(m.label.trim()) : undefined,
        slots: m.slots.map(s => ({
          root: s.root,
          accidental: s.accidental || 'natural',
          suffix: s.suffix || '',
          isEmpty: !!s.isEmpty,
          slashRoot: s.slashRoot !== undefined ? s.slashRoot : null,
          slashAccidental: s.slashAccidental !== undefined ? s.slashAccidental : null,
          sizePercent: s.sizePercent,
          isSmall: s.isSmall
        }))
      }))
    };

    if (sectionsArray.length > 0) {
      exportObj.sections = sectionsArray;
    }

    if (currentSong.notesReharm) exportObj.notesReharm = currentSong.notesReharm;
    if (currentSong.notesVoicings) exportObj.notesVoicings = currentSong.notesVoicings;
    if (currentSong.notesImprov) exportObj.notesImprov = currentSong.notesImprov;
    if (currentSong.referenceImage) exportObj.referenceImage = currentSong.referenceImage;
    if (currentSong.referenceImageName) exportObj.referenceImageName = currentSong.referenceImageName;
    if (currentSong.referencePrompt) exportObj.referencePrompt = currentSong.referencePrompt;
    if (currentSong.referenceFileName) exportObj.referenceFileName = currentSong.referenceFileName;

    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanTitle}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to parse chord suffix parts for high-fidelity stacked and inline display
  const parseChordSuffixForDisplay = (sym: string): {
    qualitySymbol: string;
    baseExt: string;
    stackedTop: string | null;
    stackedBottom: string | null;
  } => {
    const s = formatMusicSymbols(sym).trim();

    // 1. Double stacked alterations on dominant 7th chords
    // e.g. "7#9#5", "7b9#5", "7#9b5", "7b9b5", "7#11b9", etc.
    const doubleAltMatch = s.match(/^7(♭9|♯9|b9|#9|♭11|♯11|b11|#11|♭13|♯13|b13|#13)(♭5|♯5|b5|#5|♭9|♯9|b9|#9|♭13|♯13|b13|#13|alt)$/);
    if (doubleAltMatch) {
      return {
        qualitySymbol: '',
        baseExt: '7',
        stackedTop: formatMusicSymbols(doubleAltMatch[1]),
        stackedBottom: formatMusicSymbols(doubleAltMatch[2])
      };
    }

    // Also support general "7" followed by two alterations (e.g. from typing or custom edits)
    const generalDoubleAltMatch = s.match(/^7(♭\d+|♯\d+|b\d+|#\d+|alt)(♭\d+|♯\d+|b\d+|#\d+|alt)$/);
    if (generalDoubleAltMatch) {
      return {
        qualitySymbol: '',
        baseExt: '7',
        stackedTop: formatMusicSymbols(generalDoubleAltMatch[1]),
        stackedBottom: formatMusicSymbols(generalDoubleAltMatch[2])
      };
    }

    // 2. 9th chords with single alterations stacked directly (e.g. "9#5", "9b5")
    const singleAlt9Match = s.match(/^9(♭5|♯5|b5|#5|♭13|♯13|b13|#13|♭11|♯11|b11|#11|alt)$/);
    if (singleAlt9Match) {
      return {
        qualitySymbol: '',
        baseExt: '',
        stackedTop: '9',
        stackedBottom: formatMusicSymbols(singleAlt9Match[1])
      };
    }

    // 3. 7th chords with single alterations stacked directly (e.g. "7#5", "7b5")
    const singleAlt7Match = s.match(/^7(♭5|♯5|b5|#5)$/);
    if (singleAlt7Match) {
      return {
        qualitySymbol: '',
        baseExt: '',
        stackedTop: '7',
        stackedBottom: formatMusicSymbols(singleAlt7Match[1])
      };
    }

    // 4. Standard quality + extension combinations: e.g. "-7", "Δ7", "ø7", "o7", "+7"
    const qualExtMatch = s.match(/^([Δ\-øo+])(\d+|sus\d*|alt|add\d+)$/);
    if (qualExtMatch) {
      return {
        qualitySymbol: qualExtMatch[1],
        baseExt: qualExtMatch[2],
        stackedTop: null,
        stackedBottom: null
      };
    }

    // 5. Named qualities with extensions: e.g. "maj7", "min7", "m7", "dim7", "aug7"
    const namedQualExtMatch = s.match(/^(maj|min|dim|aug|m)(\d+|sus\d*|alt|add\d+)$/i);
    if (namedQualExtMatch) {
      let q = namedQualExtMatch[1];
      if (q.toLowerCase() === 'min' || q.toLowerCase() === 'm') q = '-';
      else if (q.toLowerCase() === 'maj') q = 'Δ';
      else if (q.toLowerCase() === 'dim') q = 'o';
      else if (q.toLowerCase() === 'aug') q = '+';
      return {
        qualitySymbol: q,
        baseExt: namedQualExtMatch[2],
        stackedTop: null,
        stackedBottom: null
      };
    }

    // 6. Special fraction for 6/9
    if (s === '6/9' || s === '-6/9') {
      return {
        qualitySymbol: s.startsWith('-') ? '-' : '',
        baseExt: '6/9',
        stackedTop: null,
        stackedBottom: null
      };
    }

    // Fallback parsing
    let qSym = '';
    let rest = s;
    if (s.length > 0 && ['Δ', '-', 'ø', 'o', '+'].includes(s[0])) {
      qSym = s[0];
      rest = s.slice(1);
    } else if (s.startsWith('maj')) {
      qSym = 'Δ';
      rest = s.slice(3);
    } else if (s.startsWith('min') || s.startsWith('m')) {
      qSym = '-';
      rest = s.slice(s.startsWith('min') ? 3 : 1);
    } else if (s.startsWith('dim')) {
      qSym = 'o';
      rest = s.slice(3);
    } else if (s.startsWith('aug')) {
      qSym = '+';
      rest = s.slice(3);
    }

    return {
      qualitySymbol: qSym,
      baseExt: rest,
      stackedTop: null,
      stackedBottom: null
    };
  };

  // Helper to parse chord quality & primary extensions as superscript, and alterations as subscript
  const parseChordSupersub = (sym: string): {
    superscript: string;
    subscript: string;
  } => {
    const s = formatMusicSymbols(sym).trim();
    if (!s) {
      return { superscript: '', subscript: '' };
    }

    // Pattern to match quality prefix at the start
    // Matches Δ, -, ø, o, +, maj, min, dim, aug, m (case-insensitive)
    const qualRegex = /^(Δ|-|ø|o|\+|maj|min|dim|aug|m)/i;
    const qualMatch = s.match(qualRegex);
    
    let quality = '';
    let rest = s;
    
    if (qualMatch) {
      quality = qualMatch[1];
      rest = s.slice(quality.length);
      
      // Normalize quality symbol
      const qLower = quality.toLowerCase();
      if (qLower === 'min' || qLower === 'm') {
        quality = '-';
      } else if (qLower === 'maj') {
        quality = 'Δ';
      } else if (qLower === 'dim') {
        quality = 'o';
      } else if (qLower === 'aug') {
        quality = '+';
      }
    }
    
    // Pattern to match primary extension immediately following
    // Matches 6/9, 13, 11, 9, 7, 6, 5
    const extRegex = /^(6\/9|13|11|9|7|6|5)/;
    const extMatch = rest.match(extRegex);
    
    let primaryExt = '';
    if (extMatch) {
      primaryExt = extMatch[1];
      rest = rest.slice(primaryExt.length);
    }
    
    return {
      superscript: quality + primaryExt,
      subscript: rest
    };
  };

  // Render a musical chord formatted using the active font and layout rules
  const renderFormattedChord = (slot: ChordSlot, measureSlotsOrNum: (ChordSlot | null)[] | number = 1, sIndex?: number) => {
    if (slot.suffix === '%') {
      return (
        <div className="flex items-center justify-center h-full w-full select-none">
          <svg className={`w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] md:w-[38px] md:h-[38px] opacity-80 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} viewBox="0 0 24 24" fill="none">
            <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="8.5" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="15.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </div>
      );
    }

    let rawName = '';
    if (slot.root !== -1 && slot.root !== null && slot.root !== undefined) {
      const transposedRootIndex = (slot.root + semitoneShift + 12) % 12;
      rawName = getNoteName(transposedRootIndex, transposedKeySpelling, slot.accidental);
    }
    const suffixSymbol = getJazzSuffixSymbol(slot.suffix, notationStyle);

    let baseLetter = rawName;
    let accidentalMark = '';

    if (rawName && (rawName.endsWith('b') || rawName.endsWith('♭'))) {
      baseLetter = rawName[0];
      accidentalMark = '♭';
    } else if (rawName && (rawName.endsWith('#') || rawName.endsWith('♯'))) {
      baseLetter = rawName[0];
      accidentalMark = '♯';
    }

    const parsed = parseChordSuffixForDisplay(suffixSymbol);

    const getRootScaleX = (letter: string) => {
      switch (letter) {
        case 'A': return 0.82;
        case 'B': return 0.85;
        case 'C': return 0.84;
        case 'D': return 0.84;
        case 'E': return 0.90;
        case 'F': return 0.92;
        case 'G': return 0.82;
        default: return 0.85;
      }
    };

    // Dynamic typography scaling based on uniform sizing at all times
    let rootTextSize = 'text-[64.8px] sm:text-[75.6px] md:text-[88.2px]';
    let flatAccidentalSize = 'text-[16px] sm:text-[18px] md:text-[20px]';
    let sharpAccidentalSize = 'text-[15px] sm:text-[17px] md:text-[19px]';
    let qualityTextSize = 'text-[25px] sm:text-[29px] md:text-[34px]';

    // Slash Bass root note spelling helper
    let slashRootNote = '';
    if (slot.slashRoot !== undefined && slot.slashRoot !== null) {
      const transposedSlashRootIndex = (slot.slashRoot + semitoneShift + 12) % 12;
      slashRootNote = formatMusicSymbols(getNoteName(transposedSlashRootIndex, transposedKeySpelling, slot.slashAccidental || undefined));
    }

    // Classify non-empty chord count in the current measure for layout responsiveness
    let chordsInMeasure = 1;
    if (Array.isArray(measureSlotsOrNum)) {
      chordsInMeasure = measureSlotsOrNum.filter(s => s && !s.isEmpty).length;
    } else if (typeof measureSlotsOrNum === 'number') {
      chordsInMeasure = measureSlotsOrNum;
    }

    // Check if there is an immediate chord in the next beat inside the same measure
    let hasNextChord = false;
    if (sIndex !== undefined && Array.isArray(measureSlotsOrNum)) {
      const nextIdx = sIndex + 1;
      if (nextIdx < measureSlotsOrNum.length) {
        const nextSlot = measureSlotsOrNum[nextIdx];
        if (nextSlot && !nextSlot.isEmpty) {
          hasNextChord = true;
        }
      }
    }

    const size = slot.sizePercent ?? (slot.isSmall ? 50 : 100);
    const finalScaleX = size === 50 ? 0.8 : 1.0;
    const finalScaleY = size === 50 ? 1.35 : 1.0;

    const activeFontClass = chordFont === 'petaluma' ? 'font-petaluma' : 'font-ptsans';

    const STACKED_CHORDS_MAP: { [key: string]: { top: string, bottom: string } } = {
      '7susb9': { top: 'b9', bottom: 'sus' },
      '7susb9b13': { top: 'b9b13', bottom: 'sus' },
      '7susadd3': { top: 'add3', bottom: 'sus' },
      '7b9b13': { top: 'b9', bottom: 'b13' },
      '7b9#5': { top: 'b9', bottom: '#5' },
      '713add': { top: '13', bottom: 'add' },
      '7#9#11': { top: '#9', bottom: '#11' },
      '7#9b5': { top: '#9', bottom: 'b5' },
      '7#9#5': { top: '#9', bottom: '#5' },
      '7b9#11': { top: 'b9', bottom: '#11' },
      '7b9b5': { top: 'b9', bottom: 'b5' },
      '7b9#9': { top: 'b9', bottom: '#9' },
    };

    // Renders the quality symbol and extensions either horizontally or stacked vertically
    const renderSuffixContent = () => {
      const stackInfo = STACKED_CHORDS_MAP[slot.suffix];

      if (stackInfo) {
        const topText = formatMusicSymbols(notationStyle === 'standard' ? stackInfo.top.replace(/b/g, '♭').replace(/#/g, '♯') : stackInfo.top);
        const bottomText = formatMusicSymbols(notationStyle === 'standard' ? stackInfo.bottom.replace(/b/g, '♭').replace(/#/g, '♯') : stackInfo.bottom);
        return (
          <div className="flex flex-row items-baseline select-none">
            {/* The base '7' */}
            <span 
              className={`${activeFontClass} ${isDark ? 'text-slate-100' : 'text-black'} leading-none pr-[1.5px] text-[18px] sm:text-[20px] md:text-[23px]`}
              style={{ fontWeight: 600 }}
            >
              7
            </span>
            {/* The 2-story stacked column */}
            <div className="flex flex-col justify-end">
              {/* Top story */}
              <span 
                className={`${activeFontClass} ${isDark ? 'text-slate-100' : 'text-black'} leading-none tracking-tight text-[16px] sm:text-[17px] md:text-[20px]`}
                style={{ fontWeight: 600 }}
              >
                {topText}
              </span>
              {/* Bottom story */}
              <span 
                className={`${activeFontClass} ${isDark ? 'text-slate-400' : 'text-slate-500'} leading-none tracking-tighter mt-[1px] sm:mt-[2px] text-[16px] sm:text-[17px] md:text-[20px]`}
                style={{ fontWeight: 600 }}
              >
                {bottomText}
              </span>
            </div>
          </div>
        );
      }

      // If it is a standard non-stacked suffix, render it flat-inline in a single beautiful text block to perfectly match the screenshot
      if (suffixSymbol) {
        let normSuffix = suffixSymbol;
        if (normSuffix === 'maj7') {
          normSuffix = 'Δ7';
        } else if (normSuffix === 'maj9') {
          normSuffix = 'Δ9';
        } else if (normSuffix === 'maj13') {
          normSuffix = 'Δ13';
        } else if (normSuffix.startsWith('maj7')) {
          normSuffix = 'Δ7' + normSuffix.slice(4);
        } else if (normSuffix.startsWith('maj')) {
          normSuffix = 'Δ' + normSuffix.slice(3);
        } else if (normSuffix.startsWith('min')) {
          normSuffix = '–' + normSuffix.slice(3);
        } else if (normSuffix.startsWith('dim')) {
          normSuffix = 'o' + normSuffix.slice(3);
        }

        return (
          <div className="flex flex-row items-baseline select-none" style={{ position: 'relative', bottom: '0px' }}>
            <span 
              className={`${activeFontClass} ${isDark ? 'text-slate-100' : 'text-black'} leading-none tracking-tight text-[19px] sm:text-[21px] md:text-[24px]`}
              style={{ fontWeight: 600 }}
            >
              {formatChordModifier(normSuffix)}
            </span>
          </div>
        );
      }

      return null;
    };

    const isMin7OrDom7 = slot.suffix === 'min7' || slot.suffix === '7' || suffixSymbol === '-7' || suffixSymbol === '–7' || suffixSymbol === '7' || suffixSymbol === 'm7';
    const isMin = slot.suffix?.startsWith('min') || slot.suffix?.startsWith('m') || suffixSymbol?.startsWith('-') || suffixSymbol?.startsWith('–') || suffixSymbol?.startsWith('m');
    let numericGap = isMin7OrDom7 ? 10 : 8;
    if (isMin && accidentalMark) {
      numericGap = 2;
    }
    // Rule 3: When A, Ab, or A# is the root note, provide 1px of gap between the root/accidental and the remaining chord information.
    if (baseLetter === 'A') {
      numericGap = 1;
    }
    // Rule 4: When there's a flat after the root note of any chord, bring the extensions in by 2px, closer to the root/accidental.
    if (accidentalMark === '♭') {
      numericGap = Math.max(0, numericGap - 2);
    }
    const gapVal = "-0.5px";

    const rootAccidentalGap = "-0.5px";

    return (
      <div 
        className={`relative flex flex-row items-end justify-start pl-0 select-none overflow-visible ${slashRootNote ? 'pr-[30px] sm:pr-[36px] md:pr-[42px]' : ''}`} 
        id={`formatted_chord_${baseLetter}`}
        style={{
          height: '100%',
          transform: `scale(${finalScaleX}, ${finalScaleY})`,
          transformOrigin: 'left bottom',
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Main Chord Body (Root + Suffixes) */}
        <div className="flex flex-row items-baseline shrink-0" style={{ gap: gapVal }}>
          {/* Left part: Root letter with superscript accidental */}
          <div className="relative flex flex-row items-start shrink-0" style={{ gap: rootAccidentalGap, marginLeft: '1px' }}>
            <span 
              className={`${activeFontClass} ${rootTextSize} ${isDark ? 'text-slate-100' : 'text-black'} uppercase tracking-tight leading-none select-none pr-0 inline-block`}
              style={{
                transform: `scale(${getRootScaleX(baseLetter)}, 1.0)`,
                transformOrigin: 'left bottom',
                marginRight: '-0.5px',
                fontWeight: 550,
              }}
            >
              {baseLetter}
            </span>
            {accidentalMark && (
              <span 
                className={`relative ${activeFontClass} ${isDark ? 'text-slate-100' : 'text-black'} leading-none select-none ${
                  accidentalMark === '♭' ? flatAccidentalSize : sharpAccidentalSize
                }`}
                style={{
                  fontWeight: 550,
                  alignSelf: 'flex-start',
                  top: '0.55em',
                }}
              >
                {accidentalMark}
              </span>
            )}
          </div>

          {/* Right part: Suffix content (horizontal or stacked) */}
          <div className="flex flex-row items-baseline shrink-0 select-none">
            {renderSuffixContent()}
          </div>
        </div>

        {/* Absolute Anchor for Slash Bass Note at the bottom-right */}
        {slashRootNote && (
          <div className="absolute -bottom-[8px] right-1 flex flex-row items-baseline select-none whitespace-nowrap z-20 pointer-events-none pb-[1px] md:pb-[2px]">
            <span 
              className={`font-sans text-[14px] ${isDark ? 'text-slate-300' : 'text-neutral-600'} select-none leading-none`}
              style={{ fontWeight: 600, marginRight: '-0.5px' }}
            >
              /
            </span>
            <span 
              className={`font-sans text-[14px] ${isDark ? 'text-slate-100' : 'text-black'} select-none uppercase leading-none`}
              style={{ fontWeight: 600 }}
            >
              {slashRootNote}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render draggable handles at start/end boundaries of highlighted sheet beats
  const renderSelectionHandles = (mId: string, sIdx: number) => {
    return null;
  };

  // Render individual cells inside grid systems
  function renderMeasureContent(measure: Measure, absoluteMeasureIdx: number) {
    const beatsPerMeasure = currentSong.timeSignature === '3/4' ? 3 : 4;
    const isHollow = measure.slots.slice(0, beatsPerMeasure).every(slot => slot?.isEmpty ?? true);
    const chordsInMeasure = measure.slots.slice(0, beatsPerMeasure).filter(slot => !slot?.isEmpty).length;

    const isSlotHighlighted = (mId: string, sIdx: number): boolean => {
      if (!selectionStart || !selectionEnd) return false;
      const startIdx = getFlatIndex(selectionStart.measureId, selectionStart.slotIndex);
      const endIdx = getFlatIndex(selectionEnd.measureId, selectionEnd.slotIndex);
      const currentIdx = getFlatIndex(mId, sIdx);
      if (startIdx === -1 || endIdx === -1 || currentIdx === -1) return false;
      const min = Math.min(startIdx, endIdx);
      const max = Math.max(startIdx, endIdx);
      return currentIdx >= min && currentIdx <= max;
    };

    const isMeasureRepeat = measure.slots.slice(0, beatsPerMeasure).some(slot => slot && !slot.isEmpty && slot.suffix === '%');

    if (isHollow || isMeasureRepeat) {
      const isSlotEditing = selectedMeasureId === measure.id && String(selectedSlotIndex) === '0';
      const isHighlighted = isSlotHighlighted(measure.id, 0);
      const hollowFlatIndex = getFlatIndex(measure.id, 0);

      return (
        <button
          data-chord-slot="true"
          data-flat-index={hollowFlatIndex}
          onMouseDown={(e) => {
            if (e.button !== 0) return; // Only left click
            if (e.detail === 2) {
              onDoubleTapSlot(measure.id, 0);
              return;
            }
            if (e.detail === 3) {
              onTripleTapSlot(measure.id, 0);
              return;
            }
            if (e.shiftKey) {
              e.preventDefault();
              onShiftSelect(measure.id, 0);
            } else {
              onDragStart(measure.id, 0);
            }
          }}
          onMouseEnter={() => {
            onDragEnter(measure.id, 0);
          }}
          onTouchStart={(e) => {
            handleSlotTouchStart(measure.id, 0, e);
          }}
          onTouchMove={(e) => {
            handleSlotTouchMove(e);
          }}
          onTouchEnd={(e) => {
            handleSlotTouchEnd(measure.id, 0, e);
          }}
          className={`w-full h-full flex items-center justify-center relative select-none cursor-pointer ${
            isSlotEditing
              ? (isDark ? 'bg-sky-950/40 ring-2 ring-inset ring-sky-500/60 z-10' : 'bg-[#e0f2fe]/50 ring-2 ring-inset ring-sky-400/80 z-10')
              : isHighlighted
              ? 'bg-sky-100/90 text-[#0c4a6e]'
              : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-neutral-50/70')
          }`}
          title={isMeasureRepeat ? "Repeat measure (°/°)" : "Click to insert chord"}
        >
          {isMeasureRepeat && (
            /* Authentic jazz Repeat "°/°" symbol perfectly centered */
            <div className="flex items-center justify-center h-full w-full">
              <svg className={`w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] md:w-[38px] md:h-[38px] opacity-80 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} viewBox="0 0 24 24" fill="none">
                <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="8.5" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="15.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
          )}

          {/* Touch Draggable Selection Handles */}
          {renderSelectionHandles(measure.id, 0)}
        </button>
      );
    }

    // Renting every beat horizontally inside the measure based on time signature. Each is a clickable compartment.
    const activeSlots = Array.from({ length: beatsPerMeasure }, (_, i) => i);

    return (
      <div className="w-full h-full flex relative select-none" id={`m_cell_${measure.id}`}>
        {activeSlots.map((sIndex) => {
          const slot = measure.slots[sIndex] || { root: 0, accidental: 'natural', suffix: 'maj7', isEmpty: true };
          const isSlotEditing = selectedMeasureId === measure.id && String(selectedSlotIndex) === String(sIndex);
          const isHighlighted = isSlotHighlighted(measure.id, sIndex);
          const hasChord = !slot.isEmpty;
          const slotFlatIndex = getFlatIndex(measure.id, sIndex);

          return (
            <React.Fragment key={`slot_${sIndex}`}>
              <button
                data-chord-slot="true"
                data-flat-index={slotFlatIndex}
                onMouseDown={(e) => {
                  if (e.button !== 0) return; // Only left click
                  if (e.detail === 2) {
                    onDoubleTapSlot(measure.id, sIndex);
                    return;
                  }
                  if (e.detail === 3) {
                    onTripleTapSlot(measure.id, sIndex);
                    return;
                  }
                  if (e.shiftKey) {
                    e.preventDefault();
                    onShiftSelect(measure.id, sIndex);
                  } else {
                    onDragStart(measure.id, sIndex);
                  }
                }}
                onMouseEnter={() => {
                  onDragEnter(measure.id, sIndex);
                }}
                onTouchStart={(e) => {
                  handleSlotTouchStart(measure.id, sIndex, e);
                }}
                onTouchMove={(e) => {
                  handleSlotTouchMove(e);
                }}
                onTouchEnd={(e) => {
                  handleSlotTouchEnd(measure.id, sIndex, e);
                }}
                className={`flex-1 min-w-0 w-0 h-full flex items-center justify-start p-0 pl-[1px] overflow-visible relative select-none cursor-pointer ${
                  isSlotEditing
                    ? (isDark ? 'bg-sky-950/40 ring-2 ring-inset ring-sky-500/60 z-10' : 'bg-[#e0f2fe]/50 ring-2 ring-inset ring-sky-400/80 z-10') 
                    : isHighlighted
                    ? 'bg-sky-100/90 text-[#0c4a6e]'
                    : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-neutral-50/50')
                }`}
              >
                {hasChord ? (
                  renderFormattedChord(slot, measure.slots, sIndex)
                ) : (
                  isSlotEditing && (
                    <span className={`text-[9px] sm:text-[11px] font-condensed ${isDark ? 'text-slate-400' : 'text-slate-500'} font-semibold ml-1 uppercase leading-none select-none`}>
                      b{sIndex + 1}
                    </span>
                  )
                )}

                {/* Touch Draggable Selection Handles */}
                {renderSelectionHandles(measure.id, sIndex)}

              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Barline render blocks matching printed fakebook barlines scaled shorter for compact rows
  const SingleBarline = ({ visible = true }: { visible?: boolean }) => (
    <div className={`w-[1.2px] ${visible ? (isDark ? 'bg-slate-700' : 'bg-black') : 'bg-transparent'} h-[58px] sm:h-[70px] md:h-[84px] shrink-0`} />
  );

  const DoubleBarline = ({ visible = true }: { visible?: boolean }) => (
    <div className="flex gap-[1.5px] items-center h-[58px] sm:h-[70px] md:h-[84px] shrink-0">
      <div className={`w-[1px] ${visible ? (isDark ? 'bg-slate-700' : 'bg-black') : 'bg-transparent'} h-full`} />
      <div className={`w-[2.2px] ${visible ? (isDark ? 'bg-slate-700' : 'bg-black') : 'bg-transparent'} h-full`} />
    </div>
  );

  // Convert the internal measure structure into a strict 16-cell iReal grid matrix
  const matrix = buildIRealGridMatrix(
    currentSong.grid, 
    currentSong.timeSignature || '4/4', 
    transposedKeySpelling,
    semitoneShift
  );

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col print:h-auto print:overflow-visible ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-black'} select-none font-sans`} id="chord_chart_core_view">
      {/* ========================================================
          THE CLEAN SHEET BLOCK AREA (FULL WIDTH CANVAS)
          ======================================================== */}
      <div 
        className={`relative flex-1 min-h-0 select-none flex flex-col ${
          canScrollY ? 'overflow-y-auto' : 'overflow-y-hidden'
        } print:overflow-visible print:my-0 print:px-0`} 
        id="music_score_drawing_board"
        onMouseDown={(e) => {
          // If the click is directly on the board or systems stack (not on a cell), clear selection
          if ((e.target as HTMLElement).closest('.ireal-cell') === null) {
            if (onDeselect) {
              onDeselect();
            } else {
              onSelectSlot(null, null);
            }
          }
        }}
      >
        <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} w-full flex-1 ${
          (selectedMeasureId && selectedSlotIndex !== null && (matrix.length >= 10 && matrix[9]?.some(cell => cell.chord !== null)))
            ? 'px-0 py-[2px] pb-[420px] sm:pb-[480px] lg:pb-[520px] print:p-0'
            : 'px-0 py-[2px] pb-6 print:p-0'
        } rounded-none shadow-none border-none`}>
          
          <div className="flex flex-col w-full pt-[2px] print:pt-0" id="systems_stack_box">

            {/* 1. Title Bar - Frameless, transparent, borderless, shadowless, part of the scrolling content */}
            <div className="relative w-full flex-none pt-4 pb-0 px-4 select-none print:hidden z-30" id="sheet_header_box">
              <div className="w-full flex justify-center items-center">
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className={`group relative flex flex-col items-center justify-center py-1.5 px-2 ${isDark ? 'hover:bg-slate-850 hover:border-slate-800' : 'hover:bg-slate-100/85 hover:border-slate-200'} rounded-xl border border-transparent cursor-pointer max-w-full`}
                  title="Click to edit/format song title"
                  id="header_tune_title_trigger"
                >
                  <div className="flex flex-col items-center justify-center leading-tight">
                    <span
                      className={`font-sans font-extrabold text-center ${isDark ? 'text-slate-100' : 'text-slate-900'} tracking-tight truncate block max-w-[280px] xs:max-w-[380px] sm:max-w-[500px] md:max-w-[650px] lg:max-w-[850px] text-[22px]`}
                    >
                      {formatMusicSymbols(currentSong.title.replace(/\n+/g, ' ').trim() || 'Untitled Tune')}
                    </span>
                    {currentSong.subheading && (
                      <span className={`text-[15.5px] sm:text-[16px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} tracking-wide text-center leading-tight`}>
                        {formatMusicSymbols(currentSong.subheading)}
                      </span>
                    )}
                  </div>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition duration-150 text-[9px] bg-slate-900 text-white rounded px-1.5 py-0.5 whitespace-nowrap z-10 pointer-events-none shadow-md">
                    Click to Edit Title
                  </span>
                </button>
              </div>
            </div>

            {/* Printable Header - Visible ONLY when printing */}
            <div className="hidden print:flex flex-col items-center justify-center text-center pb-4 border-b-2 border-black w-full mb-6">
              <h1 className="font-sans font-extrabold text-2xl text-black uppercase tracking-tight leading-tight whitespace-pre-wrap">
                {formatMusicSymbols(currentSong.title)}
              </h1>
              {currentSong.subheading && (
                <p className="text-sm font-semibold text-neutral-605 text-neutral-600 mt-1 uppercase tracking-wider">
                  {formatMusicSymbols(currentSong.subheading)}
                </p>
              )}
            </div>

            {(() => {
              // Convert the internal measure structure into a strict 16-cell iReal grid matrix
              const matrix = buildIRealGridMatrix(
                currentSong.grid, 
                currentSong.timeSignature || '4/4', 
                transposedKeySpelling,
                semitoneShift
              );
              
              return (
                <ChordChartGrid 
                  systems={matrix}
                  isDark={isDark}
                  onSelectSlot={(mId, sIdx) => {
                    // Check if they are trying to clear selection
                    if (mId === null || sIdx === null) {
                      onSelectSlot(null, null);
                      return;
                    }
                    onSelectSlot(mId, sIdx);
                  }}
                  onDragStart={onDragStart}
                  onDragEnter={onDragEnter}
                  selectedMeasureId={selectedMeasureId}
                  selectedSlotIndex={selectedSlotIndex}
                />
              );
            })()}
          </div>
        </div>



      </div>

      {/* 2. Chart Options Modal Overlay with Transposition, Meter/Time signature, and JSON download */}
      <AnimatePresence>
        {isOptionsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none" 
            id="settings_modal_overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOptionsOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.1, x: "35vw", y: "35vh" }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.1, x: "35vw", y: "35vh" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.12 }}
              className={`w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-none transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}
              id="settings_modal"
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4.5 h-4.5 text-[#0c4a6e]" />
                  <h3 className={`font-sans font-bold text-sm uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Chart Options
                  </h3>
                </div>
                <button
                  onClick={() => setIsOptionsOpen(false)}
                  className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-850'}`}
                >
                  <X className="w-5 h-5 pointer-events-none" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 flex flex-col gap-6 text-sm">
                {/* Option 1: Transposition */}
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <select
                      value={currentSong.key ? (currentSong.key.includes(' ') ? currentSong.key : `${currentSong.key} Maj`) : 'C Maj'}
                      onChange={(e) => {
                        const targetKey = e.target.value;
                        onTransposeSong(currentSong.id, targetKey, true);
                        setToastMessage(`Chords adjusted to target key: ${targetKey}`);
                      }}
                      className={`w-full p-2.5 rounded-xl border font-sans font-bold text-xs appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0c4a6e] ${
                        isDark 
                          ? 'bg-slate-900 border-slate-800 text-slate-100' 
                          : 'bg-slate-50 border-slate-200 text-slate-850'
                      }`}
                    >
                      <optgroup label="Major Keys" className={isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-800'}>
                        {['C Maj', 'Db Maj', 'D Maj', 'Eb Maj', 'E Maj', 'F Maj', 'F# Maj', 'G Maj', 'Ab Maj', 'A Maj', 'Bb Maj', 'B Maj'].map((k) => (
                          <option key={k} value={k}>
                            {formatMusicSymbols(k)}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Minor Keys" className={isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-800'}>
                        {['A Min', 'Bb Min', 'B Min', 'C Min', 'C# Min', 'D Min', 'Eb Min', 'E Min', 'F Min', 'F# Min', 'G Min', 'G# Min'].map((k) => (
                          <option key={k} value={k}>
                            {formatMusicSymbols(k)}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <Music className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Option 2: Meter Change */}
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <select
                      value={currentSong.timeSignature || '4/4'}
                      onChange={(e) => {
                        const newSig = e.target.value as '4/4' | '3/4';
                        if (onUpdateTimeSignature) {
                          onUpdateTimeSignature(newSig);
                        } else {
                          onUpdateSongReference?.(currentSong.id, { timeSignature: newSig });
                        }
                        setToastMessage(`Time signature changed to ${newSig}`);
                      }}
                      className={`w-full p-2.5 rounded-xl border font-sans font-bold text-xs appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0c4a6e] ${
                        isDark 
                          ? 'bg-slate-900 border-slate-800 text-slate-100' 
                          : 'bg-slate-50 border-slate-200 text-slate-850'
                      }`}
                    >
                      <option value="4/4">4/4 Standard (Common Time)</option>
                      <option value="3/4">3/4 Waltz (Triple Meter)</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Option 3: Export Details */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      handleExport(e);
                      setIsOptionsOpen(false);
                      setToastMessage("Chart details exported successfully!");
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 border shadow-xs ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Download className="w-4 h-4 text-[#0c4a6e]" />
                    <span>Download Chord Chart (.JSON)</span>
                  </button>
                </div>

                {/* Option: Export to PDF */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsOpen(false);
                      setToastMessage("Generating PDF...");
                      const element = document.getElementById('chord_chart_core_view');
                      if (element) {
                        const opt = {
                          margin: 10,
                          filename: `${currentSong.title.replace(/\s+/g, '_')}_Chart.pdf`,
                          image: { type: 'jpeg' as const, quality: 0.98 },
                          html2canvas: { scale: 2, useCORS: true },
                          jsPDF: { unit: 'mm' as const, format: 'letter', orientation: 'portrait' as const }
                        };
                        html2pdf().set(opt).from(element).save().then(() => {
                          setToastMessage("PDF Exported Successfully!");
                        }).catch((err: any) => {
                          console.error(err);
                          setToastMessage("Failed to generate PDF.");
                        });
                      }
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 border shadow-xs ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-white'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Printer className="w-4 h-4 text-[#0c4a6e]" />
                    <span>Export to PDF (Print)</span>
                  </button>
                </div>

                {/* Option 4: Delete Chart (Soft Delete to Trash) */}
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to send "${currentSong.title}" to the Trash?`)) {
                        setIsOptionsOpen(false);
                        onUpdateSongReference?.(currentSong.id, { isDeleted: true });
                      }
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 border shadow-xs ${
                      isDark
                        ? 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-900/20 text-rose-400'
                        : 'bg-rose-50 border-rose-100 hover:bg-rose-100/60 text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Move Chart to Trash</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`px-5 py-4 border-t flex justify-end transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-55 bg-[#f8fafc] dark:bg-slate-900 border-slate-100'}`}>
                <button
                  onClick={() => setIsOptionsOpen(false)}
                  className={`px-5 py-2 font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer bg-[#0c4a6e] hover:bg-sky-850 text-white`}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditingTitle && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none" 
          id="edit_title_modal_overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTempTitle(currentSong.title);
              setTempSubheading(currentSong.subheading || '');
              setIsEditingTitle(false);
            }
          }}
        >
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden flex flex-col animate-none transition-colors ${isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}
            id="edit_title_modal"
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-505 bg-sky-500 animate-pulse" />
                <h3 className={`font-sans font-bold text-base uppercase tracking-wide ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  Edit Title & Formatting
                </h3>
              </div>
              <button
                onClick={() => {
                  setTempTitle(currentSong.title);
                  setTempSubheading(currentSong.subheading || '');
                  setIsEditingTitle(false);
                }}
                className={`p-1.5 rounded-lg transition active:scale-95 cursor-pointer ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200/60 text-slate-400 hover:text-slate-600'}`}
                title="Close Dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

              {/* Modal Body */}
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label htmlFor="modal_song_title_input" className={`block text-xs font-bold uppercase tracking-widest mb-1.5 pt-1 ${isDark ? 'text-sky-450 text-sky-400' : 'text-slate-500'}`}>
                    Song Title / Subtitle
                  </label>
                  <textarea
                    id="modal_song_title_input"
                    value={tempTitle}
                    onChange={(e) => {
                      if (e.target.value.length <= 45) {
                        setTempTitle(e.target.value);
                      }
                    }}
                    placeholder=""
                    rows={2}
                    maxLength={45}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-sans font-medium focus:outline-hidden transition resize-none leading-relaxed border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-sky-500 focus:bg-slate-955 bg-slate-950' : 'bg-slate-50 border-slate-200/80 text-slate-900 focus:border-[#0c4a6e] focus:bg-white'}`}
                  />
                  <p className="mt-1.5 text-[11px] text-slate-400 font-medium leading-normal">
                    Press <kbd className={`px-1 py-0.2 rounded font-mono text-[9px] font-extrabold border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>Enter</kbd> to add a manual line break. All lines are rendered in equal title sizes.
                  </p>
                </div>

                <div>
                  <label htmlFor="modal_song_subheading_input" className={`block text-xs font-bold uppercase tracking-widest mb-1.5 pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Subheading / Composer (Optional)
                  </label>
                  <input
                    type="text"
                    id="modal_song_subheading_input"
                    value={tempSubheading}
                    onChange={(e) => setTempSubheading(e.target.value)}
                    placeholder=""
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-sans font-medium focus:outline-hidden transition border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100 focus:border-sky-500 focus:bg-slate-955 bg-slate-955' : 'bg-slate-50 border-slate-200/80 text-slate-900 focus:border-[#0c4a6e] focus:bg-white'}`}
                  />
                </div>

                <div className={`pt-4 mt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200/40'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Live Header Preview</span>
                  <div className={`rounded-xl p-4 py-6 flex flex-col items-center justify-center leading-tight min-h-[50px] border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-150'}`}>
                    {tempTitle.split('\n').map((line, idx) => (
                      <span
                        key={`preview_title_${idx}`}
                        className={`font-sans font-extrabold text-center tracking-tight break-words whitespace-pre-wrap text-sm sm:text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
                      >
                        {line.trim() || 'Untitled Tune'}
                      </span>
                    ))}
                    {tempSubheading && (
                      <span className={`text-xs mt-1.5 font-medium text-center leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {tempSubheading}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`px-5 py-3.5 flex items-center justify-end gap-2 shrink-0 border-t transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setTempTitle(currentSong.title);
                    setTempSubheading(currentSong.subheading || '');
                    setIsEditingTitle(false);
                  }}
                  className={`px-4 py-2 font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200/60 hover:bg-slate-200 text-slate-700'}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer ${isDark ? 'bg-sky-505 bg-sky-500 hover:bg-sky-400 text-slate-950' : 'bg-[#0c4a6e] hover:bg-[#072f47] text-white'}`}
                >
                  Save Title
                </button>
              </div>
            </div>
          </div>
        )}



      {/* Small Floating Options Context Modal shown on selection drag let-go */}
      {showDragEditModal && dragEditModalPosition && (
        <div
          style={{
            position: 'fixed',
            left: `${dragEditModalPosition.x}px`,
            top: `${dragEditModalPosition.y}px`,
          }}
          className="z-50 bg-[#1c1c1e]/95 border border-[#2c2c2e] h-10 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.55)] flex flex-row items-center text-slate-200 select-none print:hidden font-sans backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          id="drag_edit_popover_modal"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCutSelection?.();
              setShowDragEditModal(false);
            }}
            className="h-full px-3 text-[11px] sm:text-xs font-bold tracking-tight text-slate-200 hover:text-white active:scale-95 transition cursor-pointer flex items-center justify-center border-r border-[#2d2d30]"
          >
            Cut
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopySelection?.();
              setShowDragEditModal(false);
            }}
            className="h-full px-3 text-[11px] sm:text-xs font-bold tracking-tight text-slate-200 hover:text-white active:scale-95 transition cursor-pointer flex items-center justify-center border-r border-[#2d2d30]"
          >
            Copy
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPasteSelection?.();
              setShowDragEditModal(false);
            }}
            className="h-full px-3 text-[11px] sm:text-xs font-bold tracking-tight text-[#30d158] hover:text-[#34c759] active:scale-95 transition cursor-pointer flex items-center justify-center border-r border-[#2d2d30]"
          >
            Paste
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAll();
              setShowDragEditModal(false);
            }}
            className="h-full px-3 text-[11px] sm:text-xs font-bold tracking-tight text-[#0a84ff] hover:text-[#2f97ff] active:scale-95 transition cursor-pointer flex items-center justify-center border-r border-[#2d2d30]"
          >
            Select All
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearSelection?.();
              setShowDragEditModal(false);
            }}
            className="h-full px-3 text-[11px] sm:text-xs font-bold tracking-tight text-[#ff453a] hover:text-[#ff6961] active:scale-95 transition cursor-pointer flex items-center justify-center"
          >
            Clear
          </button>
        </div>
      )}


      {/* Toast confirmation box */}
      {toastMessage && (
        <div
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-sans rounded-xl py-3 px-6 shadow-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider select-none animate-in fade-in slide-in-from-bottom-5 duration-250"
          id="transpose_toast_banner"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Simplified, Beautiful Full Screen Image Reference Portal */}
      {isFullscreenReference && currentSong.referenceImage && (
        <div 
          className="fixed inset-0 z-50 bg-[#070b13]/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200"
          id="reference_fullscreen_modal"
        >
          {/* Backdoor tap to close */}
          <div 
            className="absolute inset-0 cursor-zoom-out" 
            onClick={() => setIsFullscreenReference(false)} 
          />

          {/* Download and Close panel floating on top bar */}
          <div className="absolute top-4 right-4 z-55 flex items-center gap-3">
            <button
              onClick={downloadReferenceFile}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#0c4a6e] hover:bg-sky-850 text-white font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition duration-150 cursor-pointer shadow-lg active:scale-95 border border-sky-505/20 font-sans"
              title="Download Reference Image"
              id="fullscreen_download_btn"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={() => setIsFullscreenReference(false)}
              className="flex items-center justify-center w-10 h-10 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/50 text-slate-200 hover:text-white rounded-full transition-all active:scale-95 cursor-pointer shadow-md"
              title="Dismiss Full Screen"
              id="fullscreen_close_btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scale Fitted Image */}
          <div className="relative max-w-full max-h-full z-10 select-none animate-in fade-in zoom-in-95 duration-200 flex items-center justify-center w-full h-full">
            {currentSong.referenceImage.startsWith('data:application/pdf') || currentSong.referenceImageName?.toLowerCase().endsWith('.pdf') ? (
              <div className="w-full max-w-lg flex flex-col items-center justify-center py-12 px-6 bg-slate-900 border border-slate-800 rounded-2xl text-center select-none shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-5 border border-amber-500/20 shadow-md">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="font-sans font-extrabold text-slate-200 text-sm uppercase tracking-wider truncate max-w-xs">
                  {currentSong.referenceImageName || 'attachment.pdf'}
                </h4>
                <p className="font-mono text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                  PDF Reference Document
                </p>
                <div className="flex flex-col gap-3 mt-8 w-full">
                  <a 
                    href={currentSong.referenceImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0c4a6e] hover:bg-sky-850 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all active:scale-95 border border-sky-650/30 font-sans"
                  >
                    <span>Open PDF in Nest Tab</span>
                  </a>
                </div>
              </div>
            ) : (
              <img
                src={currentSong.referenceImage}
                alt="Fullscreen Score Sheet Reference"
                className="max-h-[90vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800/80 bg-slate-950/40"
                referrerPolicy="no-referrer"
                onClick={() => setIsFullscreenReference(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Tactile Floating Back to Library Button (FAB) in the bottom-left corner */}
      {selectedMeasureId === null && (
        <button
          type="button"
          onClick={onBackToLibrary}
          className={`fixed bottom-6 left-6 z-45 flex items-center justify-center w-12 h-12 rounded-full transition-all cursor-pointer active:scale-95 border shadow-[0_4px_16px_rgba(0,0,0,0.15)] ${
            isDark 
              ? 'bg-slate-900 hover:bg-slate-855 text-slate-200 border-slate-800' 
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/85 shadow-[0_2px_10px_rgba(15,23,42,0.06)]'
          } backdrop-blur-md`}
          title="Back to Library"
          id="floating_back_btn"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </button>
      )}

      {/* Tactile Floating Options/Settings Action Button (FAB) in the bottom-right corner */}
      {selectedMeasureId === null && (
        <button
          type="button"
          onClick={() => setIsOptionsOpen(!isOptionsOpen)}
          className={`fixed bottom-6 right-6 z-45 flex items-center justify-center w-12 h-12 rounded-full transition-all cursor-pointer active:scale-95 border shadow-[0_4px_16px_rgba(0,0,0,0.15)] ${
            isOptionsOpen 
              ? 'bg-[#0c4a6e] border-[#0c4a6e] text-white' 
              : isDark 
                ? 'bg-slate-900 hover:bg-slate-855 text-slate-200 border-slate-800' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/85 shadow-[0_2px_10px_rgba(15,23,42,0.06)]'
          } backdrop-blur-md`}
          title="Display Chart Options"
          id="floating_settings_btn"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      )}

    </div>
  );
}

