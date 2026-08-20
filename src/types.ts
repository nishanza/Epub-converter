export interface EpubMetadata {
  title: string;
  creator: string;
  publisher?: string;
  language?: string;
  description?: string;
  pubDate?: string;
  identifier?: string;
  coverImageHref?: string;
}

export interface EpubTocItem {
  id: string;
  title: string;
  href: string;
  order: number;
}

export interface EpubChapter {
  id: string;
  href: string;
  title: string;
  htmlContent: string;
  textContent: string;
  order: number;
}

export interface EpubImage {
  id: string;
  href: string;
  mediaType: string;
  data: Uint8Array;
  blobUrl?: string;
  recIndex?: number; // assigned during MOBI compilation
}

export interface ParsedEpub {
  metadata: EpubMetadata;
  chapters: EpubChapter[];
  images: Map<string, EpubImage>; // keyed by normalized href
  coverImage?: EpubImage;
  toc: EpubTocItem[];
  rawTextLength: number;
}

export type ConversionStatus = 'idle' | 'parsing' | 'converting' | 'completed' | 'error';

export interface ConversionOptions {
  compression: 'lz77' | 'uncompressed';
  insertPageBreaks: boolean;
  generateToc: boolean;
  addKindleNav: boolean;
}

export interface ConvertedBookItem {
  id: string;
  file: File;
  originalSize: number;
  originalName: string;
  status: ConversionStatus;
  statusMessage?: string;
  progress: number;
  parsedEpub?: ParsedEpub;
  mobiBlob?: Blob;
  mobiSize?: number;
  mobiUrl?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}
