import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { ConversionSettings } from './components/ConversionSettings';
import { ConversionItem } from './components/ConversionItem';
import { BatchControls } from './components/BatchControls';
import { BookPreviewModal } from './components/BookPreviewModal';
import { KindleGuideModal } from './components/KindleGuideModal';
import { ConvertedBookItem, ConversionOptions } from './types';
import { parseEpub } from './lib/epubParser';
import { buildMobi } from './lib/mobiBuilder';
import { Sparkles, Layers, ShieldCheck, Zap, BookOpen } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ConvertedBookItem[]>([]);
  const [options, setOptions] = useState<ConversionOptions>({
    compression: 'lz77',
    insertPageBreaks: true,
    generateToc: true,
    addKindleNav: true,
  });
  const [previewItem, setPreviewItem] = useState<ConvertedBookItem | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Keep a ref to latest options so async workers use current settings
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const convertBookItem = async (
    item: ConvertedBookItem,
    currentOpts: ConversionOptions
  ): Promise<ConvertedBookItem> => {
    try {
      // 1. Update status: Parsing
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'parsing', progress: 10, statusMessage: 'Parsing EPUB package...' }
            : i
        )
      );

      const parsed = await parseEpub(item.file, (step, pct) => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, progress: Math.min(50, pct), statusMessage: step } : i
          )
        );
      });

      // 2. Update status: Converting to MOBI
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                parsedEpub: parsed,
                status: 'converting',
                progress: 55,
                statusMessage: 'Generating MOBI binary...',
              }
            : i
        )
      );

      const mobiBlob = await buildMobi(parsed, currentOpts, (step, pct) => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, progress: Math.min(99, 50 + Math.round(pct / 2)), statusMessage: step }
              : i
          )
        );
      });

      const mobiUrl = URL.createObjectURL(mobiBlob);

      const updatedItem: ConvertedBookItem = {
        ...item,
        parsedEpub: parsed,
        mobiBlob,
        mobiSize: mobiBlob.size,
        mobiUrl,
        status: 'completed',
        progress: 100,
        statusMessage: 'Ready for download',
        completedAt: Date.now(),
      };

      setItems((prev) => prev.map((i) => (i.id === item.id ? updatedItem : i)));
      return updatedItem;
    } catch (err: any) {
      console.error('Conversion failed for', item.originalName, err);
      const failedItem: ConvertedBookItem = {
        ...item,
        status: 'error',
        error: err.message || 'Failed to convert EPUB to MOBI',
        statusMessage: 'Conversion failed',
      };
      setItems((prev) => prev.map((i) => (i.id === item.id ? failedItem : i)));
      return failedItem;
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    const newItems: ConvertedBookItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      originalSize: file.size,
      originalName: file.name,
      status: 'idle',
      progress: 0,
      startedAt: Date.now(),
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Process new items concurrently
    setIsProcessingBatch(true);
    try {
      await Promise.all(
        newItems.map((item) => convertBookItem(item, optionsRef.current))
      );
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleDownload = (item: ConvertedBookItem) => {
    if (!item.mobiBlob) return;
    const title =
      item.parsedEpub?.metadata.title || item.originalName.replace(/\.epub$/i, '');
    const cleanTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'ebook';
    const fileName = `${cleanTitle}.mobi`;

    const url = URL.createObjectURL(item.mobiBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleConvertAll = async () => {
    const pending = items.filter((i) => i.status === 'idle' || i.status === 'error');
    if (pending.length === 0) return;

    setIsProcessingBatch(true);
    try {
      await Promise.all(pending.map((item) => convertBookItem(item, optionsRef.current)));
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleClearAll = () => {
    // Revoke any created URLs to avoid memory leaks
    items.forEach((item) => {
      if (item.mobiUrl) URL.revokeObjectURL(item.mobiUrl);
      if (item.parsedEpub?.coverImage?.blobUrl) {
        URL.revokeObjectURL(item.parsedEpub.coverImage.blobUrl);
      }
      item.parsedEpub?.images.forEach((img) => {
        if (img.blobUrl) URL.revokeObjectURL(img.blobUrl);
      });
    });
    setItems([]);
  };

  const handleRemove = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target?.mobiUrl) URL.revokeObjectURL(target.mobiUrl);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRetry = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) {
      convertBookItem(target, optionsRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans antialiased selection:bg-amber-200 selection:text-stone-900">
      <Header onOpenGuide={() => setIsGuideOpen(true)} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Upload Drop Zone */}
        <DropZone
          onFilesSelected={handleFilesSelected}
          disabled={isProcessingBatch && items.length > 20}
        />

        {/* Conversion Settings Accordion/Bar */}
        <ConversionSettings options={options} onChange={setOptions} />

        {/* Batch Queue & Converted Items */}
        {items.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-stone-700" />
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
                  Book Conversion Queue ({items.length})
                </h2>
              </div>
              <span className="text-xs text-stone-500">
                {items.filter((i) => i.status === 'completed').length} completed
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <ConversionItem
                  key={item.id}
                  item={item}
                  onDownload={handleDownload}
                  onPreview={(book) => setPreviewItem(book)}
                  onRemove={handleRemove}
                  onRetry={handleRetry}
                />
              ))}
            </div>

            {/* Batch Controls Bar (ZIP download, Convert all) */}
            <BatchControls
              items={items}
              onConvertAll={handleConvertAll}
              onClearAll={handleClearAll}
              isProcessing={isProcessingBatch}
            />
          </section>
        )}

        {/* Feature Highlights / Info Strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-200 text-xs">
          <div className="p-4 bg-white rounded-xl border border-stone-200 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 mb-0.5">100% Private & In-Browser</h3>
              <p className="text-stone-500 leading-relaxed">
                Your ebooks are parsed and converted entirely inside your browser. No files are uploaded to any external server.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 mb-0.5">MOBI 6 / PalmDOC Format</h3>
              <p className="text-stone-500 leading-relaxed">
                Generates compliant Mobipocket records, EXTH metadata tags, cover offsets, and page breaks tailored for Kindle.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 mb-0.5">Multi-File Batch & ZIP</h3>
              <p className="text-stone-500 leading-relaxed">
                Convert as many EPUB books as you need simultaneously, and download them individually or bundled in a single ZIP archive.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>EPUB to MOBI Converter</span>
          </div>
          <p>Compatible with Amazon Kindle Paperwhite, Oasis, Scribe, Basic &amp; Calibre</p>
        </div>
      </footer>

      {/* Book Reader / Inspector Modal */}
      {previewItem && (
        <BookPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Kindle Transfer Guide Modal */}
      <KindleGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
