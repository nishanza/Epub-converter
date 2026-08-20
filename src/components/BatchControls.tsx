import React, { useState } from 'react';
import { DownloadCloud, Play, Trash2, CheckCircle2, Loader2, Archive } from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { ConvertedBookItem } from '../types';

interface BatchControlsProps {
  items: ConvertedBookItem[];
  onConvertAll: () => void;
  onClearAll: () => void;
  isProcessing: boolean;
}

export function BatchControls({
  items,
  onConvertAll,
  onClearAll,
  isProcessing,
}: BatchControlsProps) {
  const [zipping, setZipping] = useState(false);

  const completedItems = items.filter((i) => i.status === 'completed' && i.mobiBlob);
  const pendingItems = items.filter((i) => i.status === 'idle' || i.status === 'error');
  const allCompleted = completedItems.length === items.length && items.length > 0;

  const handleDownloadZip = async () => {
    if (completedItems.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      
      completedItems.forEach((item) => {
        const title = item.parsedEpub?.metadata.title || item.originalName.replace(/\.epub$/i, '');
        const cleanName = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'ebook';
        const fileName = `${cleanName}.mobi`;
        if (item.mobiBlob) {
          zip.file(fileName, item.mobiBlob);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted-mobi-ebooks-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Failed to create ZIP package', err);
    } finally {
      setZipping(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Left: Summary statistics */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-amber-400">
          <Archive className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white font-serif">
              Batch Queue ({items.length} {items.length === 1 ? 'Book' : 'Books'})
            </span>
            {allCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>All Converted</span>
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400">
            {completedItems.length} of {items.length} converted to MOBI format
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
        {pendingItems.length > 0 && (
          <button
            type="button"
            onClick={onConvertAll}
            disabled={isProcessing}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow-xs disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Convert All ({pendingItems.length})</span>
          </button>
        )}

        {completedItems.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={zipping}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-stone-100 text-stone-900 transition-colors shadow-xs disabled:opacity-50"
          >
            {zipping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <DownloadCloud className="w-4 h-4 text-amber-600" />
            )}
            <span>Download All ({completedItems.length} MOBI in .ZIP)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClearAll}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          title="Clear all books from list"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </div>
  );
}
