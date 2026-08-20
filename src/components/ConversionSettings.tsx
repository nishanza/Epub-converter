import { Sliders, CheckCircle2 } from 'lucide-react';
import { ConversionOptions } from '../types';

interface ConversionSettingsProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
}

export function ConversionSettings({ options, onChange }: ConversionSettingsProps) {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 text-stone-800">
      <div className="flex items-center gap-2 mb-3">
        <Sliders className="w-4 h-4 text-stone-700" />
        <h3 className="text-sm font-semibold text-stone-900 tracking-tight">Conversion Preferences</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Compression */}
        <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="font-medium text-stone-900 block mb-1">Compression Engine</span>
            <p className="text-stone-500 text-[11px] leading-relaxed mb-2">
              PalmDOC LZ77 creates smaller files optimized for Kindle storage.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => onChange({ ...options, compression: 'lz77' })}
              className={`flex-1 py-1.5 px-2 rounded font-medium text-center transition-all ${
                options.compression === 'lz77'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              PalmDOC LZ77
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...options, compression: 'uncompressed' })}
              className={`flex-1 py-1.5 px-2 rounded font-medium text-center transition-all ${
                options.compression === 'uncompressed'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Raw UTF-8
            </button>
          </div>
        </div>

        {/* Table of Contents */}
        <label className="bg-white p-3 rounded-lg border border-stone-200 shadow-xs flex items-start gap-3 cursor-pointer hover:border-stone-300 transition-colors">
          <input
            type="checkbox"
            checked={options.generateToc}
            onChange={(e) => onChange({ ...options, generateToc: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
          />
          <div>
            <span className="font-medium text-stone-900 block">Generate Navigation TOC</span>
            <p className="text-stone-500 text-[11px] leading-relaxed mt-0.5">
              Builds a clickable Table of Contents page with hyperlinks to all chapters.
            </p>
          </div>
        </label>

        {/* Page Breaks */}
        <label className="bg-white p-3 rounded-lg border border-stone-200 shadow-xs flex items-start gap-3 cursor-pointer hover:border-stone-300 transition-colors">
          <input
            type="checkbox"
            checked={options.insertPageBreaks}
            onChange={(e) => onChange({ ...options, insertPageBreaks: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
          />
          <div>
            <span className="font-medium text-stone-900 block">Kindle Chapter Page Breaks</span>
            <p className="text-stone-500 text-[11px] leading-relaxed mt-0.5">
              Inserts standard &lt;mbp:pagebreak/&gt; markers between ebook chapters.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
