import React, { useRef, useState } from 'react';
import { UploadCloud, FileUp, BookPlus, Sparkles, Check, Loader2 } from 'lucide-react';
import { SAMPLE_BOOKS, generateSampleEpubFile } from '../lib/sampleBooks';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function DropZone({ onFilesSelected, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      const droppedFiles = fileList.filter((file) =>
        file.name.toLowerCase().endsWith('.epub')
      );
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files) as File[];
      const selectedFiles = fileList.filter((file) =>
        file.name.toLowerCase().endsWith('.epub')
      );
      if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
      }
      // Reset input value to allow selecting same file again
      e.target.value = '';
    }
  };

  const handleLoadSample = async (sampleId: string) => {
    const sample = SAMPLE_BOOKS.find((s) => s.id === sampleId);
    if (!sample) return;
    setLoadingSample(sampleId);
    try {
      const sampleFile = await generateSampleEpubFile(sample);
      onFilesSelected([sampleFile]);
    } catch (err) {
      console.error('Failed to generate sample epub', err);
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Drag & Drop Zone */}
      <div
        id="drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-amber-500 bg-amber-50/70 scale-[1.005] shadow-md ring-4 ring-amber-100'
            : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50/50 shadow-xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub,application/epub+zip"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 ${
              isDragging ? 'bg-amber-500 text-white scale-110' : 'bg-stone-100 text-stone-700'
            }`}
          >
            {isDragging ? <UploadCloud className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
            {isDragging ? 'Drop EPUB files here' : 'Select or Drag & Drop EPUB files'}
          </h2>
          <p className="text-sm text-stone-500 mt-1 mb-5">
            Select single or multiple <span className="font-semibold text-stone-700">.epub</span> files to convert into Kindle MOBI format.
          </p>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <BookPlus className="w-4 h-4" />
            <span>Browse Files</span>
          </button>
        </div>
      </div>

      {/* Quick Sample Books row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-stone-100/70 rounded-xl border border-stone-200/80 text-xs">
        <div className="flex items-center gap-1.5 text-stone-600 font-medium">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Don't have an EPUB handy? Test with a classic sample:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_BOOKS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSample(sample.id);
              }}
              disabled={loadingSample !== null || disabled}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-800 rounded-lg border border-stone-200 shadow-2xs font-medium transition-colors disabled:opacity-50"
            >
              {loadingSample === sample.id ? (
                <Loader2 className="w-3 h-3 animate-spin text-stone-500" />
              ) : (
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sample.accentColor }} />
              )}
              <span>{sample.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
