/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Trash2,
  Plus,
  Search,
  Folder as FolderIcon,
  FolderPlus,
  X,
  Upload,
  Settings,
  Sun,
  Moon,
  Info,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  FileDown,
  Edit2,
  Check,
  FileText,
  Copy
} from 'lucide-react';
import { Song, Folder, KEYS, KeySignature, importSongFromJSON, ACCENT_PALETTES } from '../types';
import { generateIRealPlaylistUri } from '../lib/irealParser';

interface LibraryBrowserProps {
  songs: Song[];
  folders: Folder[];
  onSelectSong: (songId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onCreateSong: (
    title: string, 
    key: string, 
    folderId: string | null, 
    timeSignature: '4/4' | '3/4', 
    importedSong?: Song,
    subheading?: string,
    referenceImage?: string,
    referenceImageName?: string
  ) => void;
  onImportMultipleSongs?: (importedSongs: Song[]) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteSong: (songId: string) => void;
  onMoveSong: (songId: string, folderId: string | null) => void;
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
  accentColor: string;
  onSetAccentColor: (accent: string) => void;
  onFactoryReset?: () => void;
  chordFont: 'ptsans' | 'petaluma';
  onSetChordFont: (font: 'ptsans' | 'petaluma') => void;
  notationStyle: 'standard' | 'ireal';
  onSetNotationStyle: (style: 'standard' | 'ireal') => void;
  showMeasureNumbers: boolean;
  onSetShowMeasureNumbers: (show: boolean) => void;
  onShowToast?: (message: string, type?: 'success' | 'loading' | 'error' | 'info') => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  currentSubView: 'home' | 'list';
  setCurrentSubView: (view: 'home' | 'list') => void;
  onRestoreFolder?: (folderId: string) => void;
  onRestoreSong?: (songId: string) => void;
  onPermanentDeleteFolder?: (folderId: string) => void;
  onPermanentDeleteSong?: (songId: string) => void;
  onPermanentDeleteAll?: () => void;
  isSettingsOpen: boolean;
  onSetSettingsOpen: (open: boolean) => void;
  isNewFolderOpen: boolean;
  onSetNewFolderOpen: (open: boolean) => void;
  isNewSongOpen: boolean;
  onSetNewSongOpen: (open: boolean) => void;
}

export function LibraryBrowser({
  songs,
  folders,
  onSelectSong,
  onCreateFolder,
  onCreateSong,
  onImportMultipleSongs,
  onDeleteFolder,
  onRenameFolder,
  onDeleteSong,
  onMoveSong,
  theme,
  onSetTheme,
  accentColor,
  onSetAccentColor,
  onFactoryReset,
  chordFont,
  onSetChordFont,
  notationStyle,
  onSetNotationStyle,
  showMeasureNumbers,
  onSetShowMeasureNumbers,
  onShowToast,
  selectedCategory,
  setSelectedCategory,
  currentSubView,
  setCurrentSubView,
  onRestoreFolder,
  onRestoreSong,
  onPermanentDeleteFolder,
  onPermanentDeleteSong,
  onPermanentDeleteAll,
  isSettingsOpen,
  onSetSettingsOpen: setIsSettingsOpen,
  isNewFolderOpen,
  onSetNewFolderOpen: setIsNewFolderOpen,
  isNewSongOpen,
  onSetNewSongOpen: setIsNewSongOpen
}: LibraryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Modal triggers
  const [deleteConfirmSongId, setDeleteConfirmSongId] = useState<string | null>(null);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [renameFolderNameInput, setRenameFolderNameInput] = useState('');
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);

  // Form Inputs
  const [folderNameInput, setFolderNameInput] = useState('');
  const [songTitleInput, setSongTitleInput] = useState('');
  const [songSubheadingInput, setSongSubheadingInput] = useState('');
  const [songKeyInput, setSongKeyInput] = useState<KeySignature>('C');
  const [songKeyQualityInput, setSongKeyQualityInput] = useState<'Maj' | 'Min'>('Maj');
  const [songTimeSignatureInput, setSongTimeSignatureInput] = useState<'4/4' | '3/4'>('4/4');
  const [songFolderInput, setSongFolderInput] = useState<string>('none');

  // JSON File upload/parsing states
  const [activeCreationMode, setActiveCreationMode] = useState<'manual' | 'json'>('manual');
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [chartDescription, setChartDescription] = useState('');
  const [uploadError, setUploadError] = useState<string>('');

  const handleStartRename = (folder: Folder) => {
    setRenameFolderId(folder.id);
    setRenameFolderNameInput(folder.name);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameFolderId && renameFolderNameInput.trim() && onRenameFolder) {
      onRenameFolder(renameFolderId, renameFolderNameInput.trim());
      setRenameFolderId(null);
      setRenameFolderNameInput('');
    }
  };

  // Unified, smart extractor that retrieves and parses valid Song objects
  // from any raw text, stripping markdown, resolving outer containers, etc.
  // It is 100% robust at extracting multiple individual JSON arrays or objects.
  const extractSongsFromText = (rawText: string): Song[] => {
    const songsCollected: Song[] = [];
    
    // Scan text, find all JSON-like structures and parse them
    let i = 0;
    while (i < rawText.length) {
      const char = rawText[i];
      if (char === '{' || char === '[') {
        let braceCount = 0;
        let bracketCount = 0;
        let insideString = false;
        let escape = false;
        let j = i;
        let foundEnd = false;
 
        while (j < rawText.length) {
          const c = rawText[j];
          if (escape) {
            escape = false;
            j++;
            continue;
          }
          if (c === '\\') {
            escape = true;
            j++;
            continue;
          }
          if (c === '"') {
            insideString = !insideString;
            j++;
            continue;
          }

          if (!insideString) {
            if (c === '{') braceCount++;
            else if (c === '}') {
              braceCount--;
              if (braceCount === 0 && bracketCount === 0) {
                foundEnd = true;
                j++;
                break;
              }
            }
            else if (c === '[') bracketCount++;
            else if (c === ']') {
              bracketCount--;
              if (braceCount === 0 && bracketCount === 0) {
                foundEnd = true;
                j++;
                break;
              }
            }
          }
          j++;
        }

        if (foundEnd) {
          const possibleJson = rawText.substring(i, j).trim();
          try {
            const parsed = JSON.parse(possibleJson);
            const playlistNameAttr = parsed && typeof parsed === 'object' ? parsed.playlistName : undefined;
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any) => {
                if (item && typeof item === 'object') {
                  try {
                    const songStr = JSON.stringify(item);
                    const song = importSongFromJSON(songStr);
                    song.referenceJSON = songStr;
                    songsCollected.push(song);
                  } catch (e) {
                    // ignore non-song structures
                  }
                }
              });
            } else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.songs)) {
                parsed.songs.forEach((item: any) => {
                  try {
                    const songStr = JSON.stringify(item);
                    const song = importSongFromJSON(songStr);
                    song.referenceJSON = songStr;
                    if (playlistNameAttr) {
                      (song as any).playlistName = playlistNameAttr;
                    }
                    songsCollected.push(song);
                  } catch (e) {}
                });
              } else if (Array.isArray(parsed.charts)) {
                parsed.charts.forEach((item: any) => {
                  try {
                    const songStr = JSON.stringify(item);
                    const song = importSongFromJSON(songStr);
                    song.referenceJSON = songStr;
                    if (playlistNameAttr) {
                      (song as any).playlistName = playlistNameAttr;
                    }
                    songsCollected.push(song);
                  } catch (e) {}
                });
              } else if (parsed.title || parsed.name || parsed.songTitle) {
                try {
                  const songStr = JSON.stringify(parsed);
                  const song = importSongFromJSON(songStr);
                  song.referenceJSON = songStr;
                  if (playlistNameAttr) {
                    (song as any).playlistName = playlistNameAttr;
                  }
                  songsCollected.push(song);
                } catch (e) {}
              }
            }
            i = j;
            continue;
          } catch (e) {
            // failed parsing, advance by 1
          }
        }
      }
      i++;
    }

    if (songsCollected.length === 0) {
      // Fallback: simple text sanitization
      let cleaned = rawText.trim();
      if (cleaned.includes('```')) {
        const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          cleaned = match[1].trim();
        } else {
          cleaned = cleaned.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();
        }
      }
      const parsed = JSON.parse(cleaned);
      let songItems: any[] = [];
      const playlistNameAttr = parsed && typeof parsed === 'object' ? parsed.playlistName : undefined;
      if (Array.isArray(parsed)) {
        songItems = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.songs)) {
          songItems = parsed.songs;
        } else if (Array.isArray(parsed.charts)) {
          songItems = parsed.charts;
        } else if (parsed.title || parsed.name || parsed.chartName) {
          songItems = [parsed];
        }
      }
      return songItems.map((item: any) => {
        const songStr = JSON.stringify(item);
        const song = importSongFromJSON(songStr);
        song.referenceJSON = songStr;
        if (playlistNameAttr) {
          (song as any).playlistName = playlistNameAttr;
        }
        return song;
      });
    }

    return songsCollected;
  };

  // Drag and drop or paste submission for JSON charts
  const handleJsonTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    if (!pastedJsonText.trim()) return;

    try {
      const songList = extractSongsFromText(pastedJsonText);
      const destFolderId = songFolderInput === 'none' ? null : songFolderInput;

      if (songList.length > 1) {
        // Multi-song import
        if (onImportMultipleSongs) {
          const processedList = songList.map(song => ({
            ...song,
            folderId: destFolderId !== null ? destFolderId : song.folderId
          }));
          onImportMultipleSongs(processedList);
          onShowToast?.(`Successfully imported ${songList.length} charts!`, 'success');
        }
      } else if (songList.length === 1) {
        // Single-song import
        const imported = songList[0];
        onCreateSong(
          imported.title,
          imported.key,
          destFolderId,
          (imported.timeSignature as '4/4' | '3/4') || '4/4',
          imported
        );
        onShowToast?.(`Successfully imported "${imported.title}"!`, 'success');
      }
      setIsNewSongOpen(false);
      setPastedJsonText('');
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error parsing pasted JSON. Verify it matches the chord chart schema.');
    }
  };

  const isDark = theme === 'dark';

  const selectedFolderName = selectedCategory === 'all'
    ? 'Songs'
    : selectedCategory === 'recent'
    ? 'Recently Added'
    : selectedCategory === 'uncategorized'
    ? 'Uncategorized'
    : selectedCategory === 'trash'
    ? 'Trash'
    : (folders.find(f => f.id === selectedCategory)?.name || 'Playlist');

  // Create Category / Folder Action
  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;
    onCreateFolder(folderNameInput.trim(), null);
    setFolderNameInput('');
    setIsNewFolderOpen(false);
  };

  // Create Song / Chart Action
  const handleCreateSongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitleInput.trim()) return;
    const destFolderId = songFolderInput === 'none' ? null : songFolderInput;
    onCreateSong(
      songTitleInput.trim(),
      `${songKeyInput} ${songKeyQualityInput}`,
      destFolderId,
      songTimeSignatureInput,
      undefined,
      songSubheadingInput.trim() || undefined,
      undefined,
      undefined
    );
    // Reset Form
    setSongTitleInput('');
    setSongSubheadingInput('');
    setSongKeyInput('C');
    setSongTimeSignatureInput('4/4');
    setIsNewSongOpen(false);
  };

  // JSON File Importer (Supports single or multiple file uploads)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let importedCount = 0;

    const promises = fileList.map((file: File) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            const songList = extractSongsFromText(text);

            if (songList.length > 1) {
              if (onImportMultipleSongs) {
                onImportMultipleSongs(songList);
                importedCount += songList.length;
              }
            } else if (songList.length === 1) {
              const imported = songList[0];
              imported.referenceFileName = file.name;
              onCreateSong(
                imported.title,
                imported.key,
                imported.folderId || null,
                (imported.timeSignature as '4/4' | '3/4') || '4/4',
                imported
              );
              importedCount += 1;
            }
            resolve();
          } catch (err: any) {
            reject(new Error(`Failed to parse '${file.name}': ${err.message || 'Verify syntax.'}`));
          }
        };
        reader.onerror = () => reject(new Error(`Failed to read file '${file.name}'`));
        reader.readAsText(file);
      });
    });

    Promise.all(promises)
      .then(() => {
        setIsNewSongOpen(false);
      })
      .catch((err: any) => {
        setUploadError(err.message || 'Error processing JSON file upload list.');
      })
      .finally(() => {
        e.target.value = '';
      });
  };


  // Fast Full Catalog JSON Backup Download
  const handleDownloadFullBackup = () => {
    try {
      const dataStr = JSON.stringify(songs, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", url);
      dlAnchorElem.setAttribute("download", `virtuoso_repertoire_backup_${new Date().toISOString().slice(0,10)}.json`);
      dlAnchorElem.click();
      URL.revokeObjectURL(url);
      if (onShowToast) {
        onShowToast(`Exported ${songs.length} charts successfully as JSON!`, 'success');
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(`Export failed: ${err.message}`, 'error');
      }
    }
  };

  // Section specific (or playlist-specific) song backup downloader
  const handleDownloadSectionBackup = () => {
    let filteredSongs = songs;
    let filenameParam = "all_songs";
    
    if (currentSubView === 'list') {
      if (selectedCategory === 'uncategorized') {
        filteredSongs = songs.filter(s => s.folderId === null);
        filenameParam = "uncategorized_songs";
      } else if (selectedCategory === 'recent') {
        filteredSongs = [...songs].reverse().slice(0, 5);
        filenameParam = "recent_songs";
      } else if (selectedCategory === 'trash') {
        filteredSongs = [];
        filenameParam = "trash_songs";
      } else if (selectedCategory === 'all') {
        filteredSongs = songs;
        filenameParam = "all_songs";
      } else {
        filteredSongs = songs.filter(s => s.folderId === selectedCategory);
        const folderObj = folders.find(f => f.id === selectedCategory);
        filenameParam = folderObj ? folderObj.name.toLowerCase().replace(/\s+/g, '_') : 'playlist';
      }
    }

    try {
      const dataStr = JSON.stringify(filteredSongs, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", url);
      dlAnchorElem.setAttribute("download", `virtuoso_${filenameParam}_backup_${new Date().toISOString().slice(0,10)}.json`);
      dlAnchorElem.click();
      URL.revokeObjectURL(url);

      if (onShowToast) {
        onShowToast(`Exported ${filteredSongs.length} charts successfully as JSON!`, 'success');
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(`Export failed: ${err.message}`, 'error');
      }
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`} id="library_browser_root">
      
      {/* 1. Header with dynamic navigation */}
      <header className={`border-b px-5 py-4 flex items-center justify-between sticky top-0 z-20 ${isDark ? 'bg-slate-905 bg-slate-900/95 border-slate-800 backdrop-blur-sm' : 'bg-white border-slate-200'}`} id="library_top_header_banner">
        <div className="flex items-center gap-2 min-w-0">
          {currentSubView === 'list' && (
            <button
              onClick={() => {
                setCurrentSubView('home');
                setSearchQuery('');
              }}
              className={`p-2 rounded-full cursor-pointer transition mr-1 ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-705'}`}
              title="Go back to Home library"
              id="header_btn_back"
            >
              <ChevronRight className={`w-5 h-5 rotate-180 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
            </button>
          )}
          <div className="min-w-0 flex items-center gap-2">
            <h1 className={`font-extrabold uppercase tracking-widest text-sm sm:text-base select-none flex items-center gap-1.5 min-w-0 ${isDark ? 'text-slate-100' : 'text-[#0f172a]'}`}>
              <span className="truncate">{currentSubView === 'home' ? 'Chord Chart Studio' : selectedFolderName}</span>
              {currentSubView === 'list' && selectedCategory !== 'all' && selectedCategory !== 'recent' && selectedCategory !== 'uncategorized' && selectedCategory !== 'trash' && (
                <button
                  onClick={() => {
                    const currentFolder = folders.find(f => f.id === selectedCategory);
                    if (currentFolder) {
                      handleStartRename(currentFolder);
                    }
                  }}
                  className={`p-1 rounded-md transition shrink-0 cursor-pointer ${isDark ? 'text-slate-400 hover:text-sky-450 hover:bg-slate-800' : 'text-slate-400 hover:text-[#0c4a6e] hover:bg-slate-150'}`}
                  title="Rename this category"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </h1>
          </div>
        </div>

        {/* Action icons relocated to bottom for ease of access */}
        <div className="flex items-center gap-2.5 select-none shrink-0" id="library_top_action_box">
          
          {/* Download Backup Button (Section Specific) */}
          {currentSubView === 'list' && selectedCategory !== 'trash' && (
            <button
              onClick={handleDownloadSectionBackup}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition cursor-pointer active:scale-95 ${isDark ? 'bg-sky-400/10 text-sky-400 hover:bg-sky-400/20' : 'bg-[#0c4a6e]/10 text-[#0c4a6e]/20 text-[#0c4a6e]'}`}
              title={`Download ${selectedFolderName} Backup JSON`}
              id="header_btn_download"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>
          )}

          {/* Empty Trash Button */}
          {currentSubView === 'list' && selectedCategory === 'trash' && (
            <button
              onClick={() => setIsConfirmEmptyTrashOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition cursor-pointer active:scale-95 bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/20"
              title="Empty Trash Can"
              id="header_btn_empty_trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Content Canvas */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col pb-28">
        {currentSubView === 'home' ? (
          /* HOME STATE: iReal Pro main navigation lists */
          <div className="flex flex-col select-none" id="ireal_home_sections">
            
            {/* LIBRARY SECTION HEADER */}
            <div className={`px-6 py-2 border-b transition-colors ${isDark ? 'bg-slate-900/40 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                LIBRARY
              </span>
            </div>

            {/* Songs Row */}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentSubView('list');
              }}
              className={`w-full text-left flex items-center justify-between py-4 px-6 border-b transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-800/40' 
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Music className={`w-4.5 h-4.5 ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`} />
                <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Songs</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {songs.length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {/* Recently Added Row */}
            <button
              onClick={() => {
                setSelectedCategory('recent');
                setCurrentSubView('list');
              }}
              className={`w-full text-left flex items-center justify-between py-4 px-6 border-b transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-800/40' 
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Sun className={`w-4.5 h-4.5 ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`} />
                <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Recently Added</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {songs.length > 5 ? 5 : songs.length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {/* Uncategorized Row */}
            <button
              onClick={() => {
                setSelectedCategory('uncategorized');
                setCurrentSubView('list');
              }}
              className={`w-full text-left flex items-center justify-between py-4 px-6 border-b transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-800/40' 
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <FolderIcon className={`w-4.5 h-4.5 ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`} />
                <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Uncategorized</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {songs.filter(s => !s.isDeleted && s.folderId === null).length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {/* Trash Row */}
            <button
              onClick={() => {
                setSelectedCategory('trash');
                setCurrentSubView('list');
              }}
              className={`w-full text-left flex items-center justify-between py-4 px-6 border-b transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-800/40' 
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Trash2 className={`w-4.5 h-4.5 ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`} />
                <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Trash</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {folders.filter(f => f.isDeleted).length + songs.filter(s => s.isDeleted).length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {/* PLAYLISTS SECTION HEADER */}
            <div className={`px-6 py-2 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-slate-900/40 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                PLAYLISTS
              </span>
            </div>

             {/* Playlists Dynamic Rows */}
            {[...folders].filter(f => !f.isDeleted).sort((a, b) => a.name.localeCompare(b.name)).map(folder => {
              const folderCount = songs.filter(s => !s.isDeleted && s.folderId === folder.id).length;
              return (
                <div
                  key={folder.id}
                  className={`group w-full flex items-center justify-between border-b transition-colors ${
                    isDark 
                      ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-800/40' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedCategory(folder.id);
                      setCurrentSubView('list');
                    }}
                    className="flex-1 text-left flex items-center justify-between py-4 px-6 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <FolderIcon className={`w-4.5 h-4.5 shrink-0 ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`} />
                      <span className={`text-sm font-bold truncate pr-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {folder.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {folderCount}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>

                  {/* Options: only the edit/rename button on the outer row (Trash is inside modal/pencil click) */}
                  <div className="flex items-center pr-5 pl-1 shrink-0 gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleStartRename(folder)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${isDark ? 'text-slate-400 hover:text-sky-450 hover:bg-slate-800' : 'text-slate-400 hover:text-[#0c4a6e] hover:bg-slate-200'}`}
                      title="Edit Category or Playlist"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        ) : (
          /* LIST STATE: Display songs in the selected category sorted alphabetically */
          <div className="flex flex-col flex-1" id="ireal_song_list_view">
            
            {/* List items block */}
            <div className={`flex flex-col divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`} id="ireal_song_list_items">
              {(() => {
                // Inline filtering and sorting calculation with alphabetical sorting guarantee
                let list = songs.filter(s => !s.isDeleted);
                if (selectedCategory === 'uncategorized') {
                  list = songs.filter(s => !s.isDeleted && s.folderId === null);
                } else if (selectedCategory === 'recent') {
                  list = songs.filter(s => !s.isDeleted);
                  list = [...list].sort((a,b) => b.id.localeCompare(a.id)).slice(0, 5);
                } else if (selectedCategory !== 'all' && selectedCategory !== 'trash') {
                  list = songs.filter(s => !s.isDeleted && s.folderId === selectedCategory);
                }

                // If selected category is TRASH, render custom side-by-side or stacked deleted folders and deleted songs
                if (selectedCategory === 'trash') {
                  const deletedFolders = folders.filter(f => f.isDeleted);
                  const deletedSongs = songs.filter(s => s.isDeleted);
                  
                  if (deletedFolders.length === 0 && deletedSongs.length === 0) {
                    return (
                      <div className="text-center py-20 px-6 text-slate-400">
                        <Trash2 className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-rose-400' : 'text-slate-350'}`} />
                        <p className={`text-sm font-semibold select-none ${isDark ? 'text-slate-300' : 'text-slate-705'}`}>Trash is empty</p>
                        <p className={`text-xs max-w-sm mx-auto mt-2 leading-relaxed text-center ${isDark ? 'text-slate-400' : 'text-slate-450'}`}>
                          Folders and songs sent to the trash can will appear here. You can restore them or permanently empty the trash can.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6 py-4 flex-1">
                      {/* Deleted Playlists */}
                      {deletedFolders.length > 0 && (
                        <div className="space-y-2">
                          <h3 className={`text-[10px] font-black uppercase tracking-widest font-mono px-6 py-1 ${isDark ? 'text-rose-450' : 'text-rose-700'}`}>
                            Deleted Playlists ({deletedFolders.length})
                          </h3>
                          {deletedFolders.map(folder => {
                            const folderSongs = songs.filter(s => s.folderId === folder.id);
                            return (
                              <div
                                key={folder.id}
                                className={`flex items-center justify-between py-3 px-6 border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-800/40' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <FolderIcon className={`w-4 h-4 shrink-0 p-0.5 rounded-sm ${isDark ? 'text-rose-400 bg-rose-500/10' : 'text-rose-600 bg-rose-50'}`} />
                                  <div className="min-w-0">
                                    <span className={`text-sm font-bold truncate block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                      {folder.name}
                                    </span>
                                    <span className={`text-[10px] font-semibold text-slate-400 block`}>
                                      {folderSongs.length} songs at deletion
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (onRestoreFolder) {
                                        onRestoreFolder(folder.id);
                                        onShowToast?.(`Restored playlist "${folder.name}" and its songs`, 'success');
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${isDark ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400' : 'bg-[#0c4a6e]/10 hover:bg-[#0c4a6e]/20 text-[#0c4a6e]'}`}
                                    title="Restore Playlist"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Permanently delete the playlist "${folder.name}" and all of its tracks? This cannot be undone.`)) {
                                        if (onPermanentDeleteFolder) {
                                          onPermanentDeleteFolder(folder.id);
                                        }
                                        onShowToast?.(`Permanently deleted playlist "${folder.name}"`, 'info');
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg transition text-rose-500 hover:bg-rose-500/10 cursor-pointer`}
                                    title="Permanently Delete Playlist"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Trashed Songs */}
                      {deletedSongs.length > 0 && (
                        <div className="space-y-1">
                          <h3 className={`text-[10px] font-black uppercase tracking-widest font-mono px-6 py-1 ${isDark ? 'text-rose-450' : 'text-rose-700'}`}>
                            Deleted Songs / Charts ({deletedSongs.length})
                          </h3>
                          {deletedSongs.map(song => {
                            const parentF = folders.find(f => f.id === song.folderId);
                            return (
                              <div
                                key={song.id}
                                className={`flex items-center justify-between py-3 px-6 border-b transition-colors ${isDark ? 'border-slate-800 bg-slate-900/20 hover:bg-slate-800/40' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                              >
                                <div className="min-w-0 flex-1 pr-3">
                                  <span className={`font-bold text-sm block truncate ${isDark ? 'text-slate-150' : 'text-[#0f172a]'}`}>
                                    {song.title}
                                  </span>
                                  {song.subheading && (
                                    <p className={`text-[10px] font-semibold truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {song.subheading}
                                    </p>
                                  )}
                                  {parentF && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block ${isDark ? 'bg-slate-800/60 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                                      Category: {parentF.name}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => {
                                      if (onRestoreSong) {
                                        onRestoreSong(song.id);
                                        onShowToast?.(`Restored "${song.title}"`, 'success');
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${isDark ? 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400' : 'bg-[#0c4a6e]/10 hover:bg-[#0c4a6e]/20 text-[#0c4a6e]'}`}
                                    title="Restore Chart"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Permanently delete "${song.title}"? This cannot be undone.`)) {
                                        if (onPermanentDeleteSong) {
                                          onPermanentDeleteSong(song.id);
                                        }
                                        onShowToast?.(`Permanently deleted "${song.title}"`, 'info');
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg transition text-rose-500 hover:bg-rose-500/10 cursor-pointer`}
                                    title="Permanently Delete Chart"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Unless it is the 'recent' timeline, sort all lists alphabetically by title
                if (selectedCategory !== 'recent') {
                  list = [...list].sort((a, b) => a.title.localeCompare(b.title));
                }

                if (list.length === 0) {
                  return (
                    <div className="text-center py-20 px-6 text-slate-400">
                      <Music className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-sky-400' : 'text-slate-330'}`} />
                      <p className={`text-sm font-semibold select-none ${isDark ? 'text-slate-305' : 'text-slate-705'}`}>No charts found matching filters</p>
                      <button
                        onClick={() => {
                          setSongFolderInput(selectedCategory !== 'all' && selectedCategory !== 'uncategorized' && selectedCategory !== 'recent' && selectedCategory !== 'trash' ? selectedCategory : 'none');
                          setIsNewSongOpen(true);
                        }}
                        className={`mt-4 inline-flex items-center gap-1.5 py-2 px-4 transition font-extrabold text-xs uppercase tracking-wide rounded-xl cursor-pointer ${isDark ? 'bg-sky-500 hover:bg-sky-400 text-slate-950' : 'bg-[#0c4a6e] hover:bg-[#072f47] text-white'}`}
                      >
                        <Plus className="w-4 h-4" /> Add Score Chart
                      </button>
                    </div>
                  );
                }

                return (
                  <AnimatePresence initial={false}>
                    {list.map(song => (
                      <motion.div
                        key={song.id}
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0, transition: { height: { duration: 0.2 }, opacity: { duration: 0.15 } } }}
                        className="relative overflow-hidden w-full bg-rose-600"
                        id={`song_row_container_${song.id}`}
                      >
                        {/* Underneath background exposed on drag */}
                        <div className="absolute inset-0 bg-gradient-to-l from-rose-600 to-rose-500 flex items-center justify-end px-6 text-white font-sans select-none z-0">
                          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                            <Trash2 className="w-4 h-4 animate-bounce text-white" />
                            <span>Swipe to Trash</span>
                          </div>
                        </div>

                        {/* Foreground draggable song card */}
                        <motion.div
                          drag="x"
                          dragDirectionLock
                          dragConstraints={{ left: -180, right: 0 }}
                          dragElastic={{ left: 0.3, right: 0.05 }}
                          dragSnapToOrigin={true}
                          onDragEnd={(_, info) => {
                            // High sensitivity swipe to delete: if drag offset is past -80px or quick flick left
                            const isSwipeTrash = info.offset.x < -80 || (info.offset.x < -30 && info.velocity.x < -185);
                            if (isSwipeTrash) {
                              onDeleteSong(song.id);
                              onShowToast?.(`"${song.title}" sent to Trash`, 'info');
                            }
                          }}
                          onClick={() => onSelectSong(song.id)}
                          className={`w-full flex items-center justify-between py-4 px-6 border-b transition-colors cursor-pointer select-none relative z-10 ${isDark ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-100' : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-900'}`}
                          style={{ touchAction: 'pan-y' }}
                          id={`song_row_item_${song.id}`}
                        >
                          {/* Left: Music Note Details (Filling space) */}
                          <div className="flex items-center min-w-0 flex-1 pr-4">
                            <div className="min-w-0 flex-1">
                              <span className={`font-bold text-sm block truncate ${isDark ? 'text-slate-100' : 'text-[#0f172a]'}`}>
                                {song.title}
                              </span>
                              {song.subheading && (
                                <p className={`text-[11px] font-semibold truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {song.subheading}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions Row and Chevron */}
                          <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                            
                            {/* Compact actions available inline. Always visible for great tactile responsiveness */}
                            <div className="flex items-center gap-2">
                              {/* Folder Relocation */}
                              <select
                                value={song.folderId || 'none'}
                                onChange={(e) => {
                                  const val = e.target.value === 'none' ? null : e.target.value;
                                  onMoveSong(song.id, val);
                                }}
                                className={`appearance-none text-[10px] uppercase tracking-wider font-extrabold py-1.5 px-2 rounded-full border border-transparent text-center focus:outline-hidden cursor-pointer transition ${
                                  isDark 
                                    ? 'bg-sky-400/10 hover:bg-sky-400/20 text-sky-400 focus:border-sky-500/30' 
                                    : 'bg-[#0c4a6e]/10 hover:bg-[#0c4a6e]/20 text-[#0c4a6e] focus:border-[#0c4a6e]/20'
                                }`}
                                title="Relocate category"
                              >
                                <option value="none" className={isDark ? 'bg-slate-900 text-slate-100' : 'text-slate-800'}>Uncategorized</option>
                                {[...folders].filter(f => !f.isDeleted).sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                                  <option key={`song_row_sel_f_${song.id}_${f.id}`} value={f.id} className={isDark ? 'bg-slate-900 text-slate-100' : 'text-slate-800'}>
                                    {f.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                );
              })()}
            </div>

          </div>
        )}
      </div>

      {/* Bottom Header Banner was relocated back to the top according to user layout directive */}

      {/* Sticky/Fixed bottom action bar for ease of access (options relocated from top) */}
      <div className={`fixed bottom-0 left-0 right-0 border-t px-6 py-4 z-45 flex justify-around items-center print:hidden transition-colors duration-150 ${
        isDark
          ? 'bg-slate-900/95 backdrop-blur-md border-slate-800'
          : 'bg-white/95 backdrop-blur-md border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]'
      }`} id="library_bottom_options_bar">
        {/* Create/Import Chart Button (Page icon with a plus in it!) */}
        <button
          onClick={() => {
            setSongFolderInput(currentSubView === 'list' && selectedCategory !== 'all' && selectedCategory !== 'uncategorized' && selectedCategory !== 'recent' && selectedCategory !== 'trash' ? selectedCategory : 'none');
            setIsNewSongOpen(true);
          }}
          className={`flex flex-col items-center gap-1 transition cursor-pointer active:scale-95 ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-[#0c4a6e] hover:text-[#072f47]'}`}
          title="Create or Import Chart"
          id="bottom_btn_create_chart"
        >
          <div className={`p-2.5 rounded-full transition-colors ${isDark ? 'bg-sky-400/10 hover:bg-sky-400/20 text-sky-400' : 'bg-[#0c4a6e]/10 hover:bg-[#0c4a6e]/20 text-[#0c4a6e]'}`}>
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest mt-0.5">Add Chart</span>
        </button>

        {/* Create folder/category button */}
        <button
          onClick={() => setIsNewFolderOpen(true)}
          className={`flex flex-col items-center gap-1 transition cursor-pointer active:scale-95 ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-[#0c4a6e] hover:text-[#072f47]'}`}
          title="Create New Category"
          id="bottom_btn_create_category"
        >
          <div className={`p-2.5 rounded-full transition-colors ${isDark ? 'bg-sky-400/10 hover:bg-sky-400/20 text-sky-400' : 'bg-[#0c4a6e]/10 hover:bg-[#0c4a6e]/20 text-[#0c4a6e]'}`}>
            <FolderPlus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest mt-0.5">Add Category</span>
        </button>

        {/* Settings gear */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`flex flex-col items-center gap-1 transition cursor-pointer active:scale-95 ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-[#0c4a6e] hover:text-[#072f47]'}`}
          title="Settings"
          id="bottom_btn_settings"
        >
          <div className={`p-2.5 rounded-full transition-colors ${isDark ? 'bg-sky-400/10 hover:bg-sky-400/20 text-sky-400' : 'bg-[#0c4a6e]/10 hover:bg-[#0c4a6e]/20 text-[#0c4a6e]'}`}>
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest mt-0.5">Settings</span>
        </button>
      </div>

      {/* 4. SYSTEM DIALOGS AND OVERLAYS SECTION */}
      
      {/* Settings / manual backups Dialog Modal */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 z-55 animate-fade-in" 
          id="settings_modal_backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSettingsOpen(false);
            }
          }}
        >
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'} rounded-none sm:rounded-2xl p-6 w-full h-full sm:h-auto sm:max-w-md border shadow-2xl relative flex flex-col justify-between overflow-y-auto animate-fade-in` } id="settings_modal">
            
            <div className="flex-1 flex flex-col">
              <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-slate-800 text-slate-100' : 'border-slate-200 text-slate-800'} mb-5`}>
                <h2 className="text-sm font-extrabold flex items-center gap-2 uppercase tracking-wide">
                  Config &amp; Backups Menu
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className={`p-1.5 rounded-full transition cursor-pointer ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-655 hover:bg-slate-50'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5 text-left text-xs flex-1">
                {/* JSON Chart Repository Backup */}
                <div className="space-y-2">
                  <span className={`font-bold uppercase tracking-widest text-[9.5px] block ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                    JSON Chart Repository Backup
                  </span>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} leading-relaxed font-semibold`}>
                    Export your full collection as a JSON file. This backup can be imported back into Virtuoso anytime to restore or synchronize your repertoire.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadFullBackup}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4.5 bg-[#0c4a6e] hover:bg-[#072f47] text-white rounded-xl text-xs font-extrabold uppercase tracking-wide transition cursor-pointer shadow-xs"
                  >
                    <FileDown className="w-4 h-4" /> Save Backup JSON File
                  </button>
                </div>

                {/* Reset Workspace Database Only */}
                {onFactoryReset && (
                  <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-4`}>
                    <button
                      type="button"
                      onClick={() => {
                        onFactoryReset();
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full py-3 px-4 rounded-xl border text-xs font-extrabold uppercase tracking-widest transition cursor-pointer ${isDark ? 'bg-rose-950/20 border-rose-900 text-rose-500 hover:bg-rose-900/40' : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'}`}
                    >
                      Reset Workspace Database
                    </button>
                  </div>
                )}

                {/* Theme Selection Widget near the bottom */}
                <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-4 space-y-3`}>
                  <span className={`font-bold uppercase tracking-widest text-[9.5px] block ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                    Visual Workspace Theme
                  </span>
                  <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl ${isDark ? 'bg-slate-950/40' : 'bg-slate-100'}`}>
                    <button
                      type="button"
                      onClick={() => onSetTheme('light')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        theme === 'light'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-extrabold'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      Light Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetTheme('dark')}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-slate-800 text-white shadow-xs border border-slate-700 font-extrabold'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      Dark Mode
                    </button>
                  </div>
                </div>

                {/* Accent Color Selection */}
                <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-4 space-y-3`}>
                  <span className={`font-bold uppercase tracking-widest text-[9.5px] block ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                    Workspace Accent Color
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {ACCENT_PALETTES.map((palette) => {
                      const isActive = accentColor === palette.id;
                      return (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => onSetAccentColor(palette.id)}
                          className={`h-11 rounded-xl border transition-all active:scale-95 cursor-pointer shadow-xs ${
                            isActive
                              ? isDark
                                ? 'border-sky-400 ring-2 ring-sky-400/25'
                                : 'border-[#0c4a6e] ring-2 ring-[#0c4a6e]/25'
                              : isDark
                                ? 'border-slate-800 hover:border-slate-700'
                                : 'border-slate-200 hover:border-slate-350'
                          }`}
                          style={{ backgroundColor: palette.primary }}
                          title={palette.name}
                        />
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-6 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className={`w-full py-3 font-extrabold uppercase tracking-wider text-xs rounded-xl cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                Close Settings
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW CATEGORY OVERLAY MODAL */}
      {isNewFolderOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsNewFolderOpen(false);
            }
          }}
        >
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'} w-full max-w-sm rounded-2xl p-5 border shadow-2xl relative`}>
            
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} mb-4 select-none`}>
              <h3 className={`font-extrabold uppercase text-xs tracking-wider ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                New Repertoire Category
              </h3>
              <button
                onClick={() => setIsNewFolderOpen(false)}
                className={`p-1 rounded-full cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-605'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategorySubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-extrabold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-505'}`}>
                  Category Name (e.g. Hymns, Bebop, Pop)
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:outline-hidden transition ${
                    isDark 
                      ? 'border-slate-800 bg-slate-950 text-slate-100 focus:border-sky-500' 
                      : 'border-slate-250 bg-white text-slate-800 focus:border-[#0c4a6e]'
                  }`}
                  maxLength={40}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition ${isDark ? 'text-slate-400 hover:bg-slate-805 hover:text-white' : 'text-slate-550 hover:bg-slate-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4.5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wide transition ${isDark ? 'bg-sky-500 hover:bg-sky-400 text-slate-950' : 'bg-[#0c4a6e] hover:bg-[#072f47] text-white'}`}
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME CATEGORY OVERLAY MODAL */}
      {renameFolderId && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRenameFolderId(null);
            }
          }}
        >
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'} w-full max-w-sm rounded-2xl p-5 border shadow-2xl relative`}>
            
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} mb-4 select-none`}>
              <h3 className={`font-extrabold uppercase text-xs tracking-wider ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                Rename Category
              </h3>
              <button
                onClick={() => setRenameFolderId(null)}
                className={`p-1 rounded-full cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-605'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className={`text-[10px] font-extrabold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-505'}`}>
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={renameFolderNameInput}
                  onChange={(e) => setRenameFolderNameInput(e.target.value)}
                  className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:outline-hidden transition ${
                    isDark 
                      ? 'border-slate-800 bg-slate-950 text-slate-100 focus:border-sky-500' 
                      : 'border-slate-250 bg-white text-slate-800 focus:border-[#0c4a6e]'
                  }`}
                  maxLength={40}
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Send playlist "${renameFolderNameInput}" and all of its tracks to the Trash?`)) {
                      onDeleteFolder(renameFolderId);
                      setRenameFolderId(null);
                      onShowToast?.(`"${renameFolderNameInput}" and its contents sent to Trash`, 'info');
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Playlist
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRenameFolderId(null)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition ${isDark ? 'text-slate-400 hover:bg-slate-805 hover:text-white' : 'text-slate-550 hover:bg-slate-50'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4.5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wide transition ${isDark ? 'bg-sky-500 hover:bg-sky-400 text-slate-950' : 'bg-[#0c4a6e] hover:bg-[#072f47] text-white'}`}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM EMPTY TRASH MODAL */}
      {isConfirmEmptyTrashOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsConfirmEmptyTrashOpen(false);
            }
          }}
        >
          <div className={`${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-250 text-slate-800'} w-full max-w-sm rounded-2xl p-5 border shadow-2xl relative`}>
            
            <div className={`flex items-center gap-2 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} mb-4 select-none`}>
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <h3 className="font-extrabold uppercase text-xs tracking-wider text-rose-500">
                Empty Trash Can?
              </h3>
            </div>

            <p className={`text-xs font-semibold leading-relaxed mb-5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Are you sure you want to permanently empty the trash can? This will permanently delete all trashed playlists and songs. This action cannot be undone.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsConfirmEmptyTrashOpen(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-550 hover:bg-slate-105'}`}
              >
                No, Keep Them
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onPermanentDeleteAll) {
                    onPermanentDeleteAll();
                    setIsConfirmEmptyTrashOpen(false);
                    onShowToast?.('Trash permanently emptied', 'success');
                  }
                }}
                className="px-4.5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wide transition text-white bg-rose-600 hover:bg-rose-500"
              >
                Yes, Empty Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW SONG OR IMPORT OVERLAY MODAL */}
      {isNewSongOpen && (
        <div className={`fixed inset-0 z-55 flex flex-col overflow-hidden animate-fade-in ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-800'}`} id="add_chart_fullpage_overlay">
          
          <div className={`flex flex-col select-none shrink-0 border-b font-sans transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between px-6 py-4">
              <span className={`text-xs font-black uppercase tracking-wider font-mono ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                Create or Import Chart
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsNewSongOpen(false);
                  setUploadError('');
                  setPastedJsonText('');
                }}
                className={`cursor-pointer p-1 transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-705'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Two Tactile Creation Buttons */}
          <div className={`grid grid-cols-2 gap-3 px-6 py-4 border-b shrink-0 select-none font-sans max-w-md mx-auto w-full transition-colors ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
            <button
              type="button"
              onClick={() => setActiveCreationMode('manual')}
              className={`py-3 px-2 rounded-xl border-2 text-center font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                activeCreationMode === 'manual'
                  ? (isDark ? 'border-sky-500 bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'border-[#0c4a6e] bg-[#0c4a6e] text-white shadow-md shadow-[#0c4a6e]/10')
                  : (isDark ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-sky-500/30 hover:bg-slate-850' : 'border-slate-200 bg-white text-slate-600 hover:border-[#0c4a6e]/30 hover:bg-slate-50')
              }`}
            >
              <Edit2 className="w-4 h-4 shrink-0" />
              <span>Scratch</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCreationMode('json')}
              className={`py-3 px-2 rounded-xl border-2 text-center font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                activeCreationMode === 'json'
                  ? (isDark ? 'border-sky-500 bg-sky-500 text-slate-950 shadow-md shadow-sky-500/10' : 'border-[#0c4a6e] bg-[#0c4a6e] text-white shadow-md shadow-[#0c4a6e]/10')
                  : (isDark ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-sky-500/30 hover:bg-slate-850' : 'border-slate-200 bg-white text-slate-600 hover:border-[#0c4a6e]/30 hover:bg-slate-50')
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>JSON Import</span>
            </button>
          </div>



          {/* Tab 1: Manual Blank Sheet (Scratch) */}
          {activeCreationMode === 'manual' && (
            <form onSubmit={handleCreateSongSubmit} className="flex-1 min-h-0 container max-w-xl mx-auto px-4 md:px-6 py-3.5 md:py-4.5 flex flex-col justify-between overflow-y-auto font-sans">
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-extrabold uppercase tracking-wider block font-mono ${isDark ? 'text-sky-450 text-sky-400' : 'text-[#0c4a6e]'}`}>
                      Chart Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder=""
                      value={songTitleInput}
                      onChange={(e) => {
                        if (e.target.value.length <= 45) {
                          setSongTitleInput(e.target.value);
                        }
                      }}
                      className={`w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border focus:outline-hidden transition ${
                        isDark 
                          ? 'bg-slate-905 bg-slate-900 text-slate-100 border-slate-800 focus:border-sky-500' 
                          : 'bg-white text-slate-800 border-slate-250 focus:border-[#0c4a6e]'
                      }`}
                      maxLength={45}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-extrabold uppercase tracking-wider block font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Arranger / Composer
                    </label>
                    <input
                      type="text"
                      placeholder=""
                      value={songSubheadingInput}
                      onChange={(e) => setSongSubheadingInput(e.target.value)}
                      className={`w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border focus:outline-hidden transition ${
                        isDark 
                          ? 'bg-slate-905 bg-slate-900 text-slate-100 border-slate-800 focus:border-sky-500' 
                          : 'bg-white text-slate-800 border-slate-250 focus:border-[#0c4a6e]'
                      }`}
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-extrabold uppercase tracking-wider block font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Base Key Signature
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={songKeyInput}
                        onChange={(e) => setSongKeyInput(e.target.value as KeySignature)}
                        className={`flex-1 text-xs font-semibold px-3 py-2.5 rounded-xl border focus:outline-hidden transition ${
                          isDark 
                            ? 'bg-slate-905 bg-slate-900 text-slate-100 border-slate-800 focus:border-sky-500' 
                            : 'bg-white text-slate-800 border-slate-200 focus:border-[#0c4a6e]'
                        }`}
                      >
                        {KEYS.map(key => (
                          <option key={`key_sel_${key}`} value={key} className={isDark ? 'bg-slate-900 text-slate-100' : ''}>
                            {key}
                          </option>
                        ))}
                      </select>
                      <select
                        value={songKeyQualityInput}
                        onChange={(e) => setSongKeyQualityInput(e.target.value as 'Maj' | 'Min')}
                        className={`w-20 text-xs font-semibold px-3 py-2.5 rounded-xl border focus:outline-hidden transition ${
                          isDark 
                            ? 'bg-slate-905 bg-slate-900 text-slate-100 border-slate-800 focus:border-sky-500' 
                            : 'bg-white text-slate-800 border-slate-200 focus:border-[#0c4a6e]'
                        }`}
                      >
                        <option value="Maj" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Maj</option>
                        <option value="Min" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Min</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-extrabold uppercase tracking-wider block font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Time Signature
                    </label>
                    <select
                      value={songTimeSignatureInput}
                      onChange={(e) => setSongTimeSignatureInput(e.target.value as '4/4' | '3/4')}
                      className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:outline-hidden transition ${
                        isDark 
                          ? 'bg-slate-905 bg-slate-900 text-slate-100 border-slate-800 focus:border-sky-500' 
                          : 'bg-white text-slate-800 border-slate-200 focus:border-[#0c4a6e]'
                      }`}
                    >
                      <option value="4/4" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>4/4 Common Time</option>
                      <option value="3/4" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>3/4 Waltz Meter</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-extrabold uppercase tracking-wider block font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Default Category
                    </label>
                    <select
                      value={songFolderInput}
                      onChange={(e) => setSongFolderInput(e.target.value)}
                      className={`w-full text-xs font-semibold px-3 py-2.5 rounded-xl border focus:outline-hidden transition ${
                        isDark 
                          ? 'bg-slate-905 bg-slate-900 text-slate-100 border-slate-800 focus:border-sky-500' 
                          : 'bg-white text-slate-800 border-slate-200 focus:border-[#0c4a6e]'
                      }`}
                    >
                      <option value="none" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Uncategorized</option>
                      {[...folders].filter(f => !f.isDeleted).sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                        <option key={`song_sel_f_${f.id}`} value={f.id} className={isDark ? 'bg-slate-900 text-slate-100' : ''}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* standard manual footer */}
              <div className={`flex gap-2.5 justify-end pt-4 mt-6 border-t shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsNewSongOpen(false)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold cursor-pointer transition ${isDark ? 'bg-slate-805 bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-650'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest transition active:scale-95 cursor-pointer shadow-sm ${isDark ? 'bg-sky-505 bg-sky-500 hover:bg-sky-400 text-slate-950' : 'bg-[#0c4a6e] hover:bg-[#072f47] text-white'}`}
                >
                  Create Blank Sheet
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: JSON Import Text & File Upload (Extremely compact single-screen height edition) */}
          {activeCreationMode === 'json' && (
            <div className={`flex-1 flex flex-col justify-between overflow-hidden font-sans max-w-xl mx-auto w-full px-5 py-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              <div className="flex-1 flex flex-col justify-start space-y-3">
                {/* Method A: Compact Paste JSON Text */}
                <form onSubmit={handleJsonTextSubmit} className="space-y-2 shrink-0">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block font-mono ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                      Paste Chord Chart JSON String (Single Song or Array)
                    </label>
                    <textarea
                      placeholder=""
                      value={pastedJsonText}
                      onChange={(e) => setPastedJsonText(e.target.value)}
                      className={`w-full text-xs font-semibold p-2.5 rounded-xl border focus:outline-hidden transition font-mono resize-none focus:shadow-xs h-[105px] ${
                        isDark 
                          ? 'border-slate-800 bg-slate-900 text-slate-100 focus:border-sky-500' 
                          : 'border-slate-250 bg-white text-slate-800 focus:border-[#0c4a6e]'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`You are an expert music transcriber. Your task is to output a single, complete, syntactically perfect JSON file containing the exact chord chart of the provided sheet music, mapping every measure 1:1 to the visual content.

RECOMMENDED LLM SELECTION:
- For best results, use a premium reasoning model (e.g., Gemini 1.5 Pro or Gemini 2.5 Pro).
- Ensure "Thinking Mode" / "Reasoning Budget" is enabled and set to High so that you can correctly plan the beat placement for every bar before generating the JSON.

SCHEMA DEFINITION:
{
  "title": string,          // The title of the song/chart
  "subheading": string,     // Optional composer, arranger, or hymnal number (e.g., "Baptist Hymnal #54")
  "key": string,            // Base key signature (e.g., "C", "Eb", "F#", "G", etc.)
  "timeSignature": string,  // Time signature meter ("4/4" or "3/4")
  "measures": string[][]    // Grid array representing the sequence of measures/bars
}

CRITICAL VISUAL PARSING: You must first identify and mentally draw bounding boxes around every vertical bar line to isolate each individual measure, then determine the rhythmic grid within *only* that specific box before extracting the chord symbols above it. By forcing the vision model to process the image as a sequence of isolated, measure-bound visual cells rather than a single fluid page, you anchor the floating text directly to the structural beats. This constraints-based approach drastically reduces rhythmic drift, ensuring the resulting JSON array feeds seamlessly into your TypeScript parser.

CRITICAL RHYTHMIC & GRID RULES (1:1 CORRESPONDENCE):
1. ONE SUB-ARRAY = ONE MEASURE (BAR):
   The "measures" property must be an array of sub-arrays. Every sub-array in the outer list represents EXACTLY ONE measure (bar) from the sheet music. DO NOT skip empty bars or cluster multiple bars together.

2. SUB-ARRAY LENGTH = TIME SIGNATURE NUMERATOR (BEATS):
   - For 3/4 time signature: Every measure sub-array MUST have EXACTLY 3 string elements: [beat1, beat2, beat3].
   - For 4/4 time signature: Every measure sub-array MUST have EXACTLY 4 string elements: [beat1, beat2, beat3, beat4].

3. RHYTHMIC SPACING & SUSTAIN DOT (".") SYMBOLS:
   To communicate rhythm and durational spelling, use a dot "." string to represent beats where the previous chord is sustained or held.
   - One chord lasting the entire measure (changes only on the downbeat):
     * In 4/4: ["C", ".", ".", "."]
     * In 3/4: ["C", ".", "."]
   - Two chords sharing a measure:
     * In 4/4 (changes on beat 1 and 3): ["C", ".", "G", "."]
     * In 4/4 (changes on beat 1 and 4): ["C", ".", ".", "G"]
     * In 3/4 (changes on beat 1 and 3): ["C", ".", "G"]
   - Three chords sharing a measure:
     * In 4/4 (holds first chord for 2 beats, then changes on 3 and 4): ["C", ".", "F", "G"]
     * In 3/4 (one chord on each of the three beats): ["C", "F", "G"]
   - Four chords sharing a measure:
     * In 4/4 (one chord on each of the four beats): ["C", "Am", "Dm", "G"]

4. DOWNBEATS ONLY DISCIPLINE:
   If a chord is played once on the downbeat of a bar and lasts for that entire bar, do NOT pack consecutive chords into a single measure sub-array (e.g., ["C", "Am", "F", "G"] is FOUR beats inside ONE single 4/4 bar). Instead, split them into four distinct measures:
   [["C", ".", ".", "."], ["Am", ".", ".", "."], ["F", ".", ".", "."], ["G", ".", ".", "."]]

5. 1:1 SPECIFIC TUTORIAL INDEX ("Great Is Thy Faithfulness" example):
   Observe this exact 1:1 mapping of the first 8 bars of "Great Is Thy Faithfulness" (3/4 time signature, with a chord change on the downbeat of most measures, and splits like "G/B to C" or "Csus4 to C" occurring inside single measures containing multiple chords):
   - Measure 1 (C on downbeat): ["C", ".", "."]
   - Measure 2 (F on downbeat): ["F", ".", "."]
   - Measure 3 (G on downbeat): ["G", ".", "."]
   - Measure 4 (G/B on downbeat, changes to C on beat 3): ["G/B", ".", "C"]
   - Measure 5 (F on downbeat): ["F", ".", "."]
   - Measure 6 (C/E on downbeat): ["C/E", ".", "."]
   - Measure 7 (D on downbeat): ["D", ".", "."]
   - Measure 8 (G on downbeat): ["G", ".", "."]
   - Measure 18 (Csus4 on downbeat, resolving to C on beat 3): ["Csus4", ".", "C"]

6. NO OPTIONAL/PARENTHETICAL CHORDS:
   On some tunes, there are main chords, and then smaller optional/alternative chords written in parentheses (e.g., "(Bb7)", "(G7)", "(Am7)") above or higher up on the music sheet. You must IGNORE those smaller higher parenthetical chords completely. They are unnecessary. Only chart out the main, larger chords. Never include parenthetical chords or alternative options in the JSON representation.

Your output must consist ONLY of the compliant, validated, and complete JSON string.`);
                        onShowToast?.("Prompt template copied to clipboard! Ready for your LLM.", "success");
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition active:scale-95 cursor-pointer font-extrabold text-[11px] uppercase tracking-wider ${
                        isDark 
                          ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-sky-400' 
                          : 'border-slate-250 bg-slate-50 hover:bg-slate-100 text-[#0c4a6e]'
                      }`}
                      title="Copy AI Prompt"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy AI Prompt</span>
                    </button>
                    <button
                      type="submit"
                      disabled={!pastedJsonText.trim()}
                      className={`py-2 rounded-xl font-extrabold text-[11px] uppercase tracking-widest transition flex items-center justify-center gap-1.5 shadow-xs ${
                        pastedJsonText.trim()
                          ? (isDark ? 'bg-sky-505 bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer active:scale-95' : 'bg-[#0c4a6e] hover:bg-[#072f47] text-white cursor-pointer active:scale-95')
                          : (isDark ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-60')
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Import JSON</span>
                    </button>
                  </div>
                </form>

                {/* Minimalist Divider */}
                <div className="relative flex py-0.5 items-center select-none shrink-0">
                  <div className={`flex-grow border-t ${isDark ? 'border-slate-850' : 'border-slate-200'}`}></div>
                  <span className="flex-shrink mx-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">OR</span>
                  <div className={`flex-grow border-t ${isDark ? 'border-slate-850' : 'border-slate-200'}`}></div>
                </div>

                {/* Compact Method B Layout: Multi-column File Upload + Dest Category select */}
                <div className="grid grid-cols-2 gap-3 shrink-0">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block font-mono ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`}>
                      Upload .JSON Reference File(s)
                    </label>
                    <div className={`p-2 rounded-xl border border-dashed relative flex items-center justify-center text-center gap-2 cursor-pointer transition h-9 group ${
                      isDark 
                        ? 'border-sky-500/30 bg-slate-900/60 hover:bg-slate-850 text-sky-400' 
                        : 'border-[#0c4a6e]/40 bg-slate-50/70 hover:bg-slate-100 text-[#0c4a6e]'
                    }`}>
                      <Upload className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${isDark ? 'text-sky-400' : 'text-[#0c4a6e]'}`} />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">
                        Upload File
                      </span>
                      <input
                        type="file"
                        accept=".json"
                        multiple
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase tracking-wider block font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Import Into Category
                    </label>
                    <select
                      value={songFolderInput}
                      onChange={(e) => setSongFolderInput(e.target.value)}
                      className={`w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border focus:outline-hidden transition h-9 ${
                        isDark 
                          ? 'bg-slate-905 bg-slate-900 text-slate-100 border-slate-800' 
                          : 'bg-white text-slate-800 border-slate-200 focus:border-[#0c4a6e]'
                      }`}
                    >
                      <option value="none" className={isDark ? 'bg-slate-900 text-slate-100' : ''}>Uncategorized</option>
                      {[...folders].filter(f => !f.isDeleted).sort((a, b) => a.name.localeCompare(b.name)).map(f => (
                        <option key={`json_song_sel_f_${f.id}`} value={f.id} className={isDark ? 'bg-slate-900 text-slate-100' : ''}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {uploadError && (
                  <div className={`p-2 rounded-xl flex items-center gap-1.5 text-[10px] font-semibold select-none leading-none mt-1 ${isDark ? 'bg-rose-950/40 border border-rose-905/30 text-rose-300' : 'bg-rose-50 border border-rose-100 text-rose-800'}`}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                    <span className="truncate">{uploadError}</span>
                  </div>
                )}
              </div>

              {/* standard manual footer */}
              <div className={`flex gap-2 justify-end pt-3 border-t shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewSongOpen(false);
                    setUploadError('');
                    setPastedJsonText('');
                    setChartDescription('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition ${isDark ? 'bg-slate-850 bg-slate-800 hover:bg-slate-700 text-slate-305 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-655'}`}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
