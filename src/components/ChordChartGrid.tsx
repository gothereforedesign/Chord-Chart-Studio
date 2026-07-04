
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
    <div className="w-full flex flex-col gap-[4px] px-2 print:gap-[4px] print:px-0 mt-4 pb-48">
      {systems.map((rowCells, rowIdx) => (
        <div key={`sys_${rowIdx}`} className="relative w-full flex justify-center">
          {/* IREAL PRO STRICT 16-COLUMN GRID */}
          <div className="ireal-row h-[62px] sm:h-[74px] md:h-[88px] relative mx-auto gap-[4px]">
            {(() => {
              const elements = [];
              let skipNext = false;
              
              for (let colIdx = 0; colIdx < rowCells.length; colIdx++) {
                if (skipNext) {
                  skipNext = false;
                  continue;
                }
                
                const cell = rowCells[colIdx];
                const isSelected =
                  cell.measureId === selectedMeasureId &&
                  cell.slotIdx !== undefined &&
                  String(cell.slotIdx) === String(selectedSlotIndex);

                
                // Determine span: if size is 100% (default for full size) and not the last column, span 2
                const isFullSize = !!cell.chord;
                // Prevent spanning across measure boundaries (colIdx % 4 === 3 is the last slot of a measure)
                const canSpan = colIdx % 4 !== 3 && colIdx < 15;
                const span = (isFullSize && canSpan) ? 2 : 1;
                
                if (span === 2) skipNext = true;

                const isEndOfMeasure = (colIdx + span - 1) % 4 === 3;

                // Fixed viewBox width so all chords scale to the exact same height identically
                const viewBoxWidth = 100;
                
                elements.push(
                  <div
                    key={`cell_${rowIdx}_${colIdx}`}
                    style={{ gridColumn: `span ${span} / span ${span}` }}
                    className={`ireal-cell flex items-center justify-start pl-1 relative
                      ${isEndOfMeasure ? 'border-r border-slate-800 dark:border-slate-400' : ''}
                      ${isSelected ? (isDark ? 'bg-sky-950/60 ring-2 ring-inset ring-sky-500 z-10 rounded' : 'bg-sky-100 ring-2 ring-inset ring-sky-400 z-10 rounded') : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded'}
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
                        className={`absolute top-0 left-0 text-[10px] font-semibold uppercase tracking-widest px-0.5 py-0.5 rounded-br z-20 leading-none ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {annot.replace('*', '')}
                      </div>
                    ))}

                    {/* CHORD RENDERING USING SVG FOR PERFECT SCALING & ALIGNMENT */}
                    {cell.chord && (() => {
                      const getChordParts = (chordStr: string) => {
                        if (!chordStr) return { root: '', acc: '' };
                        const root = chordStr[0] || '';
                        const acc = chordStr.slice(1).replace(/b/g, '♭').replace(/#/g, '♯');
                        return { root, acc };
                      };
                      const { root: mainRoot, acc: mainAcc } = getChordParts(cell.chord.root);
                      
                      const modText = cell.chord.modifiers || '';
                      const formattedMod = formatChordModifier(modText);
                      const isMin = modText.startsWith('min') || modText.startsWith('m') || formattedMod.startsWith('-') || formattedMod.startsWith('m');
                      const isBm = mainRoot === 'B' && isMin;

                      const size = cell.sizePercent;
                      const finalScaleX = size === 50 ? 0.95 : 1.0;
                      
                      return (
                      <svg 
                        viewBox={`0 0 ${viewBoxWidth} 44`} 
                        preserveAspectRatio="xMinYMid meet"
                        style={{
                          height: '100%',
                          width: 'auto',
                          aspectRatio: `${viewBoxWidth} / 44`,
                          overflow: 'visible',
                          transform: `scale(${finalScaleX}, 1.0)`,
                          transformOrigin: 'left bottom'
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
                            transform: 'scale(1.0, 1.35)',
                            transformOrigin: '0px 34px'
                          }}
                        >
                          <tspan fontSize="36">{mainRoot}</tspan>
                          {mainAcc && <tspan y="20" dx={isBm ? "1" : undefined} fontSize="22">{mainAcc}</tspan>}
                          
                          {/* Extensions */}
                          {cell.chord.modifiers && (() => {
                            const mod = formatChordModifier(cell.chord.modifiers);
                            const cellIsMin = cell.chord.modifiers.startsWith('min') || cell.chord.modifiers.startsWith('m') || mod.startsWith('-') || mod.startsWith('m');
                            let dxValue = 2;
                            if (cellIsMin && mainAcc) {
                              dxValue = -6;
                            }
                            // Rule 3: When A, Ab, or A# is the root note, provide 1px of gap between the root/accidental and the remaining chord information.
                            if (mainRoot === 'A') {
                              dxValue = 1;
                            }
                            // Rule 4: When there's a flat after the root note of any chord, bring the extensions in by 2px, closer to the root/accidental.
                            if (mainAcc === '♭') {
                              dxValue -= 2;
                            }
                            return (
                              <tspan y="34" dx={`${dxValue}`} fontSize="16">{mod}</tspan>
                            );
                          })()}
                          
                          {/* Slash Chords */}
                          {cell.chord.over && (() => {
                            const { root: slashRoot, acc: slashAcc } = getChordParts(cell.chord.over.root);
                            return (
                              <tspan 
                                y="34" 
                                dx="2"
                                className={isDark ? 'fill-slate-400' : 'fill-slate-600'}
                              >
                                <tspan fontSize="24">/{slashRoot}</tspan>
                                {slashAcc && <tspan y="22" fontSize="16">{slashAcc}</tspan>}
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
      ))}
    </div>
  );
};
