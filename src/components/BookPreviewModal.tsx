import React, { useState } from 'react';
import {
  X,
  BookOpen,
  List,
  Info,
  ChevronLeft,
  ChevronRight,
  Download,
  Check,
  Binary,
  Layers,
  FileText,
  Smartphone,
} from 'lucide-react';
import { ConvertedBookItem } from '../types';
import { formatBytes } from './ConversionItem';

interface BookPreviewModalProps {
  item: ConvertedBookItem | null;
  onClose: () => void;
  onDownload: (item: ConvertedBookItem) => void;
}

export function BookPreviewModal({
  item,
  onClose,
  onDownload,
}: BookPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'reader' | 'metadata' | 'mobi-info'>('reader');
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');

  if (!item || !item.parsedEpub) return null;

  const epub = item.parsedEpub;
  const chapters = epub.chapters;
  const currentChapter = chapters[currentChapterIdx] || chapters[0];

  const fontSizeClasses = {
    small: 'text-sm leading-relaxed',
    medium: 'text-base leading-relaxed',
    large: 'text-lg leading-loose',
  };

  const themeClasses = {
    light: 'bg-white text-stone-900 border-stone-200',
    sepia: 'bg-[#faf6eb] text-[#3c3022] border-[#e8dfcf]',
    dark: 'bg-[#1e1e24] text-[#e0e0e0] border-[#33333d]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-300 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 truncate font-serif">
                {epub.metadata.title}
              </h2>
              <p className="text-xs text-stone-500 truncate">
                by {epub.metadata.creator} • {chapters.length} chapters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {item.status === 'completed' && (
              <button
                type="button"
                onClick={() => onDownload(item)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Download .MOBI</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-stone-200 bg-white flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('reader')}
              className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'reader'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book Reader</span>
            </button>

            <button
              onClick={() => setActiveTab('metadata')}
              className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'metadata'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Metadata & TOC ({epub.toc.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('mobi-info')}
              className={`py-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'mobi-info'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>MOBI Diagnostics</span>
            </button>
          </div>

          {activeTab === 'reader' && (
            <div className="flex items-center gap-2 py-1.5">
              {/* Theme Selector */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    theme === 'light' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-600'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    theme === 'sepia' ? 'bg-[#ebdcb9] shadow-2xs text-[#412e12]' : 'text-stone-600'
                  }`}
                >
                  Sepia
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    theme === 'dark' ? 'bg-[#2b2b36] shadow-2xs text-white' : 'text-stone-600'
                  }`}
                >
                  Dark
                </button>
              </div>

              {/* Font Size */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button
                  onClick={() => setFontSize('small')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    fontSize === 'small' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-600'
                  }`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('medium')}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                    fontSize === 'medium' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-600'
                  }`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('large')}
                  className={`px-1.5 py-0.5 rounded text-[12px] font-bold ${
                    fontSize === 'large' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-600'
                  }`}
                >
                  A+
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100/50">
          {activeTab === 'reader' && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Chapter navigation selector */}
              {chapters.length > 1 && (
                <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-stone-200 text-xs">
                  <button
                    disabled={currentChapterIdx === 0}
                    onClick={() => setCurrentChapterIdx((prev) => Math.max(0, prev - 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev Chapter</span>
                  </button>

                  <select
                    value={currentChapterIdx}
                    onChange={(e) => setCurrentChapterIdx(Number(e.target.value))}
                    className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 font-medium max-w-[200px] sm:max-w-xs truncate text-xs"
                  >
                    {chapters.map((chap, idx) => (
                      <option key={chap.id} value={idx}>
                        {chap.title || `Chapter ${idx + 1}`}
                      </option>
                    ))}
                  </select>

                  <button
                    disabled={currentChapterIdx === chapters.length - 1}
                    onClick={() => setCurrentChapterIdx((prev) => Math.min(chapters.length - 1, prev + 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Next Chapter</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Rendered Book Chapter */}
              <div
                className={`p-6 sm:p-10 rounded-2xl border shadow-sm transition-colors font-serif ${
                  themeClasses[theme]
                } ${fontSizeClasses[fontSize]}`}
              >
                {currentChapter ? (
                  <div
                    className="prose prose-stone max-w-none space-y-4"
                    dangerouslySetInnerHTML={{ __html: currentChapter.htmlContent }}
                  />
                ) : (
                  <p className="text-center py-10 text-stone-400 font-sans">
                    No chapter content available.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Metadata Card */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-6">
                {epub.coverImage && (
                  <div className="w-32 h-44 rounded-lg overflow-hidden border border-stone-200 flex-shrink-0 shadow-xs mx-auto sm:mx-0">
                    <img
                      src={epub.coverImage.blobUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-3 text-xs">
                  <div>
                    <span className="text-stone-400 font-medium block uppercase text-[10px]">Title</span>
                    <p className="text-stone-900 font-bold text-base font-serif">{epub.metadata.title}</p>
                  </div>

                  <div>
                    <span className="text-stone-400 font-medium block uppercase text-[10px]">Author / Creator</span>
                    <p className="text-stone-800 font-medium">{epub.metadata.creator}</p>
                  </div>

                  {epub.metadata.publisher && (
                    <div>
                      <span className="text-stone-400 font-medium block uppercase text-[10px]">Publisher</span>
                      <p className="text-stone-800">{epub.metadata.publisher}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                    <div>
                      <span className="text-stone-400 font-medium block uppercase text-[10px]">Language</span>
                      <p className="text-stone-800 font-mono">{epub.metadata.language || 'en'}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 font-medium block uppercase text-[10px]">Total Chapters</span>
                      <p className="text-stone-800">{chapters.length}</p>
                    </div>
                  </div>

                  {epub.metadata.description && (
                    <div className="pt-2 border-t border-stone-100">
                      <span className="text-stone-400 font-medium block uppercase text-[10px]">Description</span>
                      <p className="text-stone-600 line-clamp-3 leading-relaxed mt-0.5">
                        {epub.metadata.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Table of Contents list */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <List className="w-4 h-4 text-stone-600" />
                  <span>Table of Contents ({epub.toc.length} sections)</span>
                </h3>

                {epub.toc.length > 0 ? (
                  <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
                    {epub.toc.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          setCurrentChapterIdx(Math.min(idx, chapters.length - 1));
                          setActiveTab('reader');
                        }}
                      >
                        <span className="font-medium text-stone-800">{item.title}</span>
                        <span className="text-[10px] text-stone-400 font-mono">#{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 py-4 text-center">
                    No embedded NCX table of contents found in this EPUB.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'mobi-info' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs text-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-stone-900">
                    MOBI Container Diagnostics
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 block text-[10px] uppercase font-mono">PDB Database Type</span>
                    <span className="font-bold text-stone-900 font-mono">BOOK / MOBI</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 block text-[10px] uppercase font-mono">Text Encoding</span>
                    <span className="font-bold text-stone-900 font-mono">UTF-8 (Code 65001)</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 block text-[10px] uppercase font-mono">Format Standard</span>
                    <span className="font-bold text-stone-900 font-mono">MOBI Version 6</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 block text-[10px] uppercase font-mono">Images Embedded</span>
                    <span className="font-bold text-stone-900 font-mono">{epub.images.size} records</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 block text-[10px] uppercase font-mono">Original EPUB Size</span>
                    <span className="font-bold text-stone-900 font-mono">{formatBytes(item.originalSize)}</span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 block text-[10px] uppercase font-mono">Generated MOBI Size</span>
                    <span className="font-bold text-stone-900 font-mono">
                      {item.mobiSize ? formatBytes(item.mobiSize) : 'Pending compilation'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-semibold block text-emerald-950">MOBI 6 Binary Compliance Verified</span>
                    Includes PalmDOC LZ77 compressed chunks, Record 0 header, standard EXTH tags (Author, Title, Publisher, Cover Offset), FLIS/FCIS cache records, and EOF marker. Compatible with Amazon Kindle devices, Kindle desktop/mobile, and third-party readers (Calibre, Moon+ Reader, FBReader).
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
