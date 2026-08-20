import React from 'react';
import {
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  FileText,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ConvertedBookItem } from '../types';

export interface ConversionItemProps {
  key?: React.Key;
  item: ConvertedBookItem;
  onDownload: (item: ConvertedBookItem) => void;
  onPreview: (item: ConvertedBookItem) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const ConversionItem: React.FC<ConversionItemProps> = ({
  item,
  onDownload,
  onPreview,
  onRemove,
  onRetry,
}) => {
  const epub = item.parsedEpub;
  const title = epub?.metadata.title || item.originalName.replace(/\.epub$/i, '');
  const author = epub?.metadata.creator || 'Unknown Author';
  const coverUrl = epub?.coverImage?.blobUrl;
  const chaptersCount = epub?.chapters.length || 0;

  // Calculate size change percentage if MOBI exists
  let sizeDiffBadge = null;
  if (item.mobiSize && item.originalSize) {
    const diff = item.mobiSize - item.originalSize;
    const pct = Math.round((diff / item.originalSize) * 100);
    const isSmaller = diff <= 0;
    sizeDiffBadge = (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
          isSmaller
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-stone-100 text-stone-700 border border-stone-200'
        }`}
      >
        {isSmaller ? `${Math.abs(pct)}% smaller` : `+${pct}% size`}
      </span>
    );
  }

  return (
    <div
      id={`conversion-item-${item.id}`}
      className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-stone-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      {/* Left: Book Cover & Metadata */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Cover thumbnail */}
        <div className="w-14 h-20 rounded-md bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-2xs">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-950 p-1 flex flex-col justify-between text-center">
              <span className="text-[7px] text-amber-300 font-bold uppercase tracking-wider line-clamp-1">
                EBOOK
              </span>
              <BookOpen className="w-4 h-4 text-stone-300 mx-auto" />
              <span className="text-[6px] text-stone-400 font-serif line-clamp-1">
                {author}
              </span>
            </div>
          )}
        </div>

        {/* Book Information */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate font-serif" title={title}>
              {title}
            </h3>
            {item.status === 'completed' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Ready</span>
              </span>
            )}
            {(item.status === 'parsing' || item.status === 'converting') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Converting...</span>
              </span>
            )}
            {item.status === 'error' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3 h-3" />
                <span>Failed</span>
              </span>
            )}
          </div>

          <p className="text-xs text-stone-600 truncate mb-2">
            By <span className="font-medium text-stone-800">{author}</span>
            {epub?.metadata.language && (
              <span className="text-stone-400 uppercase ml-2 text-[10px] font-mono">
                [{epub.metadata.language}]
              </span>
            )}
          </p>

          {/* Size & Chapter Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              <span>{formatBytes(item.originalSize)} (.epub)</span>
            </span>

            {item.mobiSize && (
              <>
                <ArrowRight className="w-3 h-3 text-stone-400" />
                <span className="font-medium text-stone-800">
                  {formatBytes(item.mobiSize)} (.mobi)
                </span>
                {sizeDiffBadge}
              </>
            )}

            {chaptersCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 ml-2 pl-2 border-l border-stone-200 text-[11px]">
                <Layers className="w-3 h-3 text-stone-400" />
                <span>{chaptersCount} chapters</span>
              </span>
            )}
          </div>

          {/* Progress bar and status indicator */}
          {(item.status === 'parsing' || item.status === 'converting') && (
            <div className="mt-2.5 space-y-1">
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-amber-800 font-mono flex items-center justify-between">
                <span>{item.statusMessage || 'Processing...'}</span>
                <span>{item.progress}%</span>
              </p>
            </div>
          )}

          {/* Error Message */}
          {item.status === 'error' && (
            <div className="mt-2 p-2 bg-rose-50 text-rose-700 text-xs rounded-md border border-rose-200 flex items-center justify-between">
              <span className="truncate">{item.error || 'Failed to parse or convert EPUB'}</span>
              <button
                onClick={() => onRetry(item.id)}
                className="ml-2 font-semibold underline hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
        {item.status === 'completed' && (
          <>
            <button
              onClick={() => onPreview(item)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="Preview book contents and MOBI structure"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <button
              onClick={() => onDownload(item)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs transition-colors"
              title="Download MOBI file"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Download .MOBI</span>
            </button>
          </>
        )}

        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove from list"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
