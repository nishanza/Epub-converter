import { BookOpen, Sparkles, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
}

export function Header({ onOpenGuide }: HeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900 font-serif">
                EPUB to MOBI
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                Kindle Ready
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Convert ebooks to Kindle MOBI format • 100% private, instant client-side conversion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200"
            title="Kindle transfer instructions"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How to transfer to Kindle</span>
          </button>
          
          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>LZ77 PalmDOC Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
}
