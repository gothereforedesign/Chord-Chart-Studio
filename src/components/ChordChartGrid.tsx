
import React from 'react';
import { IRealCell } from '../lib/irealParser';
import { formatMusicSymbols, formatChordModifier } from '../types';

interface ChordChartGridProps {
  systems: IRealCell[][];
  onSelectSlot?: (measureId: string, slotIndex: number) => void;
  onDragStart?: (measureId: string, slotIndex: number) => void;
  onDragEnter?: (measureId: string, slotIndex: number) => void;
  selectedMeasureId?: string | null;
  selectedSlotIndex?: string | number | null;
  isDark?: boolean;
}

export const ChordChartGrid: React.FC<ChordChartGridProps> = ({
  systems,
  onSelectSlot,
  onDragStart,
  onDragEnter,
  selectedMeasureId,
  selectedSlotIndex,
  isDark = false
}) => {
  return (
    <div className="w-full flex flex-col gap-[6px] px-0 print:gap-[6px] print:px-0 mt-4 pb-2">
      {systems.map((rowCells, rowIdx) => {
        const hasChordsInRow = rowCells.some(cell => cell.chord);
        return (
          <div key={`sys_${rowIdx}`} className="relative w-full flex justify-center">
            {/* IREAL PRO STRICT 16-COLUMN GRID */}
            <div 
              className="ireal-row h-[58px] sm:h-[70px] md:h-[84px] relative mx-auto gap-[4px] pl-[2px]"
              style={{ gridTemplateColumns: `repeat(${rowCells.length}, minmax(0, 1fr))` }}
            >
              {(() => {
                const elements = [];
                let skipCounter = 0;
                
                const cellsPerMeasure = rowCells.length / 4;

                for (let colIdx = 0; colIdx < rowCells.length; colIdx++) {
                  if (skipCounter > 0) {
                    skipCounter--;
                    continue;
                  }
                  
                  const cell = rowCells[colIdx];
                  const isStartOfMeasure = colIdx % cellsPerMeasure === 0;
                  const isMeasureRepeat = isStartOfMeasure && rowCells.slice(colIdx, colIdx + cellsPerMeasure).some(c => c.chord?.modifiers === '%');

                  if (isMeasureRepeat) {
                    const span = cellsPerMeasure;
                    skipCounter = cellsPerMeasure - 1;
                    const isEndOfMeasure = true;

                    const isSelected =
                      cell.measureId === selectedMeasureId &&
                      selectedMeasureId !== null &&
                      selectedSlotIndex !== null &&
                      rowCells.slice(colIdx, colIdx + cellsPerMeasure).some(c => 
                        c.measureId === selectedMeasureId && 
                        c.slotIdx !== undefined && 
                        String(c.slotIdx) === String(selectedSlotIndex)
                      );

                    elements.push(
                      <div
                        key={`cell_repeat_${rowIdx}_${colIdx}`}
                        style={{ gridColumn: `span ${span} / span ${span}` }}
                        className={`ireal-cell flex items-center justify-center relative
                          ${isEndOfMeasure && hasChordsInRow ? 'border-r border-slate-800 dark:border-slate-400' : ''}
                          ${isSelected ? (isDark ? 'bg-sky-950/60 ring-2 ring-inset ring-sky-500 z-10' : 'bg-sky-100 ring-2 ring-inset ring-sky-400 z-10') : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                          cursor-pointer select-none transition-colors h-full`}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          if (cell.measureId) {
                            onDragStart?.(cell.measureId, 0);
                            onSelectSlot?.(cell.measureId, 0);
                          }
                        }}
                        onMouseEnter={() => {
                          if (cell.measureId) {
                            onDragEnter?.(cell.measureId, 0);
                          }
                        }}
                      >
                        {/* System bracket / Repeat markers */}
                        {cell.annots.map((annot, i) => (
                          <div 
                            key={i} 
                            className={`absolute top-0 left-0 text-[10px] font-semibold uppercase tracking-widest px-0.5 py-0.5 rounded-none z-20 leading-none ${
                              isDark ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {annot.replace('*', '')}
                          </div>
                        ))}

                        {/* Beautiful centered RepeatBarSymbol */}
                        <div className="flex items-center justify-center h-full w-full">
                          <svg className={`w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] md:w-[38px] md:h-[38px] opacity-80 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} viewBox="0 0 24 24" fill="none">
                            <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            <circle cx="8.5" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                            <circle cx="15.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                      </div>
                    );
                    continue;
                  }

                  const isSelected =
                    cell.measureId === selectedMeasureId &&
                    cell.slotIdx !== undefined &&
                    String(cell.slotIdx) === String(selectedSlotIndex);

                  
                  // Determine span: if size is 100% (default for full size) and not the last column, span 2
                  const isFullSize = !!cell.chord;
                  // Prevent spanning across measure boundaries
                  const canSpan = colIdx % cellsPerMeasure !== cellsPerMeasure - 1 && colIdx < rowCells.length - 1;
                  const span = (isFullSize && canSpan) ? 2 : 1;
                  
                  if (span === 2) skipCounter = 1;

                  const isEndOfMeasure = (colIdx + span - 1) % cellsPerMeasure === cellsPerMeasure - 1;

                  // Fixed viewBox width so all chords scale to the exact same height identically
                  const viewBoxWidth = 100;
                  
                  elements.push(
                    <div
                      key={`cell_${rowIdx}_${colIdx}`}
                      style={{ gridColumn: `span ${span} / span ${span}` }}
                      className={`ireal-cell flex items-center justify-start pl-[2px] relative
                        ${isEndOfMeasure && hasChordsInRow ? 'border-r border-slate-800 dark:border-slate-400' : ''}
                        ${isSelected ? (isDark ? 'bg-sky-950/60 ring-2 ring-inset ring-sky-500 z-10 rounded-none' : 'bg-sky-100 ring-2 ring-inset ring-sky-400 z-10 rounded-none') : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-none'}
                        cursor-pointer select-none transition-colors h-full`}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (cell.measureId && cell.slotIdx !== undefined) {
                        onDragStart?.(cell.measureId, cell.slotIdx);
                        onSelectSlot?.(cell.measureId, cell.slotIdx);
                      }
                    }}
                    onMouseEnter={() => {
                      if (cell.measureId && cell.slotIdx !== undefined) {
                        onDragEnter?.(cell.measureId, cell.slotIdx);
                      }
                    }}
                  >
                    {/* System bracket / Repeat markers */}
                    {cell.annots.map((annot, i) => (
                      <div 
                        key={i} 
                        className={`absolute top-0 left-0 text-[10px] font-semibold uppercase tracking-widest px-0.5 py-0.5 rounded-none z-20 leading-none ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {annot.replace('*', '')}
                      </div>
                    ))}

                    {/* CHORD RENDERING USING SVG FOR PERFECT SCALING & ALIGNMENT */}
                    {cell.chord && (() => {
                      if (cell.chord.modifiers === '%') {
                        return (
                          <div className="flex items-center justify-center h-full w-full">
                            <svg className={`w-[26px] h-[26px] sm:w-[32px] sm:h-[32px] md:w-[38px] md:h-[38px] opacity-80 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} viewBox="0 0 24 24" fill="none">
                              <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                              <circle cx="8.5" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                              <circle cx="15.5" cy="15.5" r="2.2" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          </div>
                        );
                      }

                      const getChordParts = (chordStr: string) => {
                        if (!chordStr) return { root: '', acc: '' };
                        const root = chordStr[0] || '';
                        const acc = chordStr.slice(1).replace(/b/g, '♭').replace(/#/g, '♯');
                        return { root, acc };
                      };
                      const { root: mainRoot, acc: mainAcc } = getChordParts(cell.chord.root);
                      
                      const modText = cell.chord.modifiers || '';
                      const formattedMod = formatChordModifier(modText);
                      const isMin = modText.startsWith('min') || modText.startsWith('m') || formattedMod.startsWith('-') || formattedMod.startsWith('–') || formattedMod.startsWith('m');
                      const isBm = mainRoot === 'B' && isMin;

                      const size = cell.sizePercent;
                      const finalScaleX = size === 50 ? 0.5 : 1.0;
                      const textScaleY = 1.0;
                      
                      return (
                      <svg 
                        viewBox={`0 0 ${viewBoxWidth} 44`} 
                        preserveAspectRatio="xMinYMid meet"
                        style={{
                          height: '80%',
                          width: 'auto',
                          aspectRatio: `${viewBoxWidth} / 44`,
                          overflow: 'visible',
                          transform: `scale(${finalScaleX}, 1.0)`,
                          transformOrigin: '0px 34px'
                        }}
                        className={`max-w-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
                      >
                        <text 
                          x="0" 
                          y="34" 
                          textAnchor="start" 
                          fill="currentColor" 
                          className="ireal-chords-font" 
                          style={{
                            letterSpacing: '-0.04em',
                            fontWeight: 550,
                            transform: `scale(1.0, ${textScaleY})`,
                            transformOrigin: '0px 34px'
                          }}
                        >
                          <tspan fontSize="40">{mainRoot}</tspan>
                          {mainAcc && (
                            <tspan 
                              y="15" 
                              dx="-0.5" 
                              fontSize="36"
                              style={{ fontWeight: 550 }}
                            >
                              {mainAcc}
                            </tspan>
                          )}
                          
                          {/* Extensions */}
                          {cell.chord.modifiers && (() => {
                            const mod = formatChordModifier(cell.chord.modifiers);
                            const dxVal = mainAcc ? "-1" : "-0.5";
                            return (
                              <tspan y="34" dx={dxVal} fontSize="20" style={{ fontWeight: 600 }}>{mod}</tspan>
                            );
                          })()}
                          
                          {/* Slash Chords */}
                          {cell.chord.over && (() => {
                            const { root: slashRoot, acc: slashAcc } = getChordParts(cell.chord.over.root);
                            return (
                              <tspan 
                                y="34" 
                                dx="-0.5"
                                className={isDark ? 'fill-slate-400' : 'fill-slate-600'}
                              >
                                <tspan fontSize="28" dx="-0.5">/{slashRoot}</tspan>
                                {slashAcc && <tspan y="22" dx="-0.5" fontSize="24">{slashAcc}</tspan>}
                              </tspan>
                            );
                          })()}
                        </text>
                      </svg>
                      );
                    })()}

                    {/* Empty Beat Click Target Indicator */}
                    {isSelected && !cell.chord && cell.slotIdx !== undefined && (
                      <span className="absolute bottom-1 right-1 text-[8px] font-mono text-sky-500 opacity-60">
                        b{cell.slotIdx + 1}
                      </span>
                    )}
                  </div>
                );
              }
              return elements;
            })()}
          </div>
        </div>
        );
      })}
    </div>
  );
};
