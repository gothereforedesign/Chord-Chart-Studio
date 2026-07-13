
export interface IRealChord {
  root: string;
  modifiers: string;
  over?: IRealChord | null;
  alternate?: IRealChord | null;
}

export interface IRealCell {
  chord: IRealChord | null;
  annots: string[];
  comments: string[];
  bars: string;
  spacer: number;
  // Metadata for tactile editor selection
  measureId?: string;
  slotIdx?: number;
  widthFraction?: number; // E.g., for splitting a cell 50/50
  sizePercent?: number; // E.g., 50 for small, 100 for normal
}

import { Measure, getNoteName, Song } from '../types';

/**
 * Translates the app's internal Measure array into a strict iReal Pro 16-cell matrix.
 * iReal Pro systems have exactly 16 cells. 
 * A 4/4 measure typically occupies 4 cells, allowing 4 measures per line.
 * A 3/4 measure might also occupy 4 cells, or be compressed. For safety, 
 * we'll map a standard 4-measure row directly into 16 cells.
 */
export function buildIRealGridMatrix(measures: Measure[], timeSignature: string, keySig: string, semitoneShift: number = 0): IRealCell[][] {
  const systems: IRealCell[][] = [];
  let currentRow: IRealCell[] = [];
  
  const beatsPerMeasure = timeSignature === '3/4' ? 3 : 4;
  
  // Standard iReal mapping or custom 3/4 layout: distribute `beatsPerMeasure` across slots
  const cellsPerMeasure = beatsPerMeasure; 
  const cellsPerRow = 4 * cellsPerMeasure; // e.g., 12 or 16 cells per system row

  measures.forEach((measure, measureIdx) => {
    // Generate the cells for this measure
    let measureCells: IRealCell[] = Array(cellsPerMeasure).fill(null).map(() => ({
      chord: null,
      annots: [],
      comments: [],
      bars: '',
      spacer: 0
    }));

    measure.slots.forEach((slot, sIdx) => {
      if (sIdx >= beatsPerMeasure) return;
      if (!slot.isEmpty) {
        // Find which cell to place this in
        let cellIdx = sIdx; 

        let rootName = '';
        let suffix = '';
        if (slot.root !== undefined && slot.root !== null && slot.root !== -1) {
          const transposedRootIndex = (slot.root + semitoneShift + 120) % 12;
          rootName = getNoteName(transposedRootIndex, keySig, slot.accidental || undefined);
          suffix = slot.suffix || '';
        }
        let over: IRealCell['chord'] = undefined;
        if (slot.slashRoot !== undefined && slot.slashRoot !== null) {
          const transposedSlashRootIndex = (slot.slashRoot + semitoneShift + 120) % 12;
          const slashName = getNoteName(transposedSlashRootIndex, keySig, slot.slashAccidental || undefined);
          over = { root: slashName, modifiers: '' };
        }

        measureCells[cellIdx] = {
          ...measureCells[cellIdx],
          chord: {
            root: rootName,
            modifiers: suffix,
            over: over
          },
          measureId: measure.id,
          slotIdx: sIdx,
          sizePercent: slot.sizePercent ?? (slot.isSmall ? 50 : 100)
        };
      } else {
        // Empty slot, but still keep metadata so user can click to edit
        measureCells[sIdx] = {
          ...measureCells[sIdx],
          measureId: measure.id,
          slotIdx: sIdx
        };
      }
    });

    // Handle barlines
    if (measureCells.length > 0) {
      measureCells[0].bars = '|';
    }
    
    if (measure.label) {
      measureCells[0].annots.push(`*${measure.label}`);
    }

    currentRow.push(...measureCells);

    // If we hit standard row width, wrap the system
    if (currentRow.length >= cellsPerRow) {
      // Append closing barline to the last cell
      if (currentRow.length > 0) {
        currentRow[currentRow.length - 1].bars += '|';
      }
      systems.push(currentRow);
      currentRow = [];
    }
  });

  if (currentRow.length > 0) {
    // Pad remaining with empty cells to make exactly cellsPerRow
    while (currentRow.length < cellsPerRow) {
      currentRow.push({ chord: null, annots: [], comments: [], bars: '', spacer: 0 });
    }
    currentRow[currentRow.length - 1].bars += '|';
    systems.push(currentRow);
  }

  return systems;
}

export function generateIRealUri(song: Song): string {
  let musicString = `T${(song.timeSignature || '4/4').replace('/', '')}`;
  
  const matrix = buildIRealGridMatrix(song.grid, song.timeSignature || '4/4', song.key || 'C', 0);
  
  matrix.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      // Annotations (e.g. *A)
      if (cell.annots && cell.annots.length > 0) {
        musicString += cell.annots.join('');
      }

      // Add start barline if needed
      if (rowIdx === 0 && colIdx === 0) {
        musicString += '[';
      }

      // Chord or space
      if (cell.chord) {
        let chordStr = cell.chord.root + (cell.chord.modifiers || '');
        if (cell.chord.over) {
          chordStr += '/' + cell.chord.over.root;
        }
        musicString += chordStr;
      } else {
        musicString += ' ';
      }

      // Add closing or intermediate barlines
      if (rowIdx === matrix.length - 1 && colIdx === row.length - 1) {
        musicString += ']';
      } else if (cell.bars.includes('|')) {
        musicString += '|';
      }
    });
  });

  // URL format: irealbook://Song Title=LastName FirstName=Style=Key=n=MusicString
  // We don't have composer, just use "Unknown"
  const title = song.title || 'Untitled';
  const composer = song.subheading || 'Unknown';
  const style = 'Medium Swing'; // Default style
  const key = song.key || 'C';
  
  return `irealbook://${title}=${composer}=${style}=${key}=n=${musicString}`;
}

export function generateIRealPlaylistUri(playlistName: string, songs: Song[]): string {
  let uri = `irealbook://`;
  
  songs.forEach((song, idx) => {
    let musicString = `T${(song.timeSignature || '4/4').replace('/', '')}`;
    const matrix = buildIRealGridMatrix(song.grid, song.timeSignature || '4/4', song.key || 'C', 0);
    
    matrix.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (cell.annots && cell.annots.length > 0) {
          musicString += cell.annots.join('');
        }
        if (rowIdx === 0 && colIdx === 0) {
          musicString += '[';
        }
        if (cell.chord) {
          let chordStr = cell.chord.root + (cell.chord.modifiers || '');
          if (cell.chord.over) {
            chordStr += '/' + cell.chord.over.root;
          }
          musicString += chordStr;
        } else {
          musicString += ' ';
        }
        
        if (rowIdx === matrix.length - 1 && colIdx === row.length - 1) {
          musicString += ']';
        } else if (cell.bars.includes('|')) {
          musicString += '|';
        }
      });
    });
    
    const title = song.title || 'Untitled';
    const composer = song.subheading || 'Unknown';
    const style = 'Medium Swing';
    const key = song.key || 'C';
    
    const songString = `${title}=${composer}=${style}=${key}=n=${musicString}`;
    if (idx > 0) {
      uri += `=${songString}`;
    } else {
      uri += songString;
    }
  });
  
  uri = uri.replace(/^irealbook:\/\//, `irealbook://${playlistName}=`);
  
  return uri;
}
export function parseIRealString(musicString: string): IRealCell[] {
  // A robust, simplified parser based on the iReal protocol as provided in the instructions
  const cells: IRealCell[] = [];
  const tokens = musicString.split(/([|\[\]{}*<>,])/).filter(t => t.length > 0);
  
  let currentCell: IRealCell = { chord: null, annots: [], comments: [], bars: '', spacer: 0 };

  tokens.forEach(token => {
    if (token === '|') {
      currentCell.bars += token;
      cells.push(currentCell);
      currentCell = { chord: null, annots: [], comments: [], bars: '', spacer: 0 };
    } else if (token.startsWith('*')) {
      currentCell.annots.push(token);
    } else if (token.trim() && !['[', ']', '{', '}', '<', '>', ',', ' '].includes(token)) {
      currentCell.chord = { root: token[0], modifiers: token.substring(1) };
    }
  });
  
  if (currentCell.chord || currentCell.bars) cells.push(currentCell);

  return cells;
}
