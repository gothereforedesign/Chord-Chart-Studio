import React, { useMemo } from 'react';
import { parseIRealString, IRealCell } from '../lib/irealParser';
import { ChordChartGrid } from './ChordChartGrid';

interface IRealViewerProps {
  /**
   * The raw iReal Pro URI string.
   * e.g., irealbook://Autumn Leaves=Kosma Joseph=Medium Swing=G-=n=...
   */
  irealUri: string;
  isDark?: boolean;
}

export function IRealViewer({ irealUri, isDark = true }: IRealViewerProps) {
  // Parse the URI into systems whenever it changes
  const systems = useMemo(() => {
    try {
      // 1. Strip the irealbook:// prefix
      const withoutPrefix = irealUri.replace(/^irealbook:\/\//, '');
      
      // 2. Decode URL encoding
      const decoded = decodeURIComponent(withoutPrefix);
      
      // 3. Split parts by '='
      const parts = decoded.split('=');
      
      // Music string is typically after the 'n' or at the 6th position (index 5)
      // irealbook://Title=Composer=Style=Key=n=MusicString
      let musicString = '';
      if (parts.length >= 6) {
        musicString = parts.slice(5).join('='); 
      } else {
        musicString = parts[parts.length - 1]; // Fallback
      }

      // 4. Parse into cells using our ported logic
      const cells = parseIRealString(musicString);
      
      // 5. Chunk into 16-cell systems for the grid
      const matrix: IRealCell[][] = [];
      let currentRow: IRealCell[] = [];
      
      cells.forEach(cell => {
        currentRow.push(cell);
        if (currentRow.length === 16) {
          matrix.push(currentRow);
          currentRow = [];
        }
      });
      
      if (currentRow.length > 0) {
        while (currentRow.length < 16) {
          currentRow.push({ chord: null, annots: [], comments: [], bars: '', spacer: 0 });
        }
        matrix.push(currentRow);
      }
      
      return matrix;
    } catch (e) {
      console.error("Failed to parse iReal URI:", e);
      return [];
    }
  }, [irealUri]);

  if (!systems || systems.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 text-red-500 text-sm font-mono border border-red-500/20">
        Error parsing iReal Pro string. Check console for details.
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 overflow-auto">
      <ChordChartGrid 
        systems={systems} 
        isDark={isDark} 
      />
    </div>
  );
}

