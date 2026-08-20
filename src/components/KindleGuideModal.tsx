import React from 'react';
import { X, Tablet, Send, Cable, Mail, CheckCircle2, ExternalLink } from 'lucide-react';

interface KindleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KindleGuideModal({ isOpen, onClose }: KindleGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Tablet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 font-serif">
                How to Transfer MOBI to Kindle
              </h2>
              <p className="text-xs text-stone-500">
                Easy methods to read your converted ebooks on Kindle e-readers and apps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
          {/* Method 1: USB Transfer */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
              <Cable className="w-4 h-4 text-amber-600" />
              <span>Method 1: USB Cable (Direct & Instant)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-stone-600 pl-1">
              <li>Connect your Kindle device to your computer via USB cable.</li>
              <li>Open the Kindle drive in File Explorer (Windows) or Finder (Mac).</li>
              <li>
                Drag &amp; drop the downloaded <span className="font-semibold text-stone-800">.mobi</span> file into the{' '}
                <code className="bg-stone-200/70 px-1 py-0.5 rounded text-stone-800 font-mono">documents</code> folder.
              </li>
              <li>Safely eject the Kindle — your new book will appear in your Library immediately!</li>
            </ol>
          </div>

          {/* Method 2: Send to Kindle Web */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
              <Send className="w-4 h-4 text-amber-600" />
              <span>Method 2: Amazon Send to Kindle Web</span>
            </div>
            <p className="text-stone-600">
              Upload files directly through Amazon's official web tool to sync across all your registered Kindle devices and apps.
            </p>
            <a
              href="https://www.amazon.com/sendtokindle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-700 font-semibold hover:underline"
            >
              <span>Go to Amazon Send to Kindle</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Method 3: E-Reader Apps */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
              <Tablet className="w-4 h-4 text-amber-600" />
              <span>Method 3: Third-Party E-Reader Apps</span>
            </div>
            <p className="text-stone-600">
              MOBI files are universally compatible with reading applications on iOS, Android, macOS, and Windows:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2 bg-white rounded-lg border border-stone-200 text-center font-medium text-stone-800">
                Calibre Ebook Reader
              </div>
              <div className="p-2 bg-white rounded-lg border border-stone-200 text-center font-medium text-stone-800">
                Moon+ Reader (Android)
              </div>
              <div className="p-2 bg-white rounded-lg border border-stone-200 text-center font-medium text-stone-800">
                FBReader (iOS/Android)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
