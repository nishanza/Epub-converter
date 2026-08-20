import { ConversionOptions, ParsedEpub } from '../types';

/**
 * Binary helper class to write big-endian primitives into Uint8Array.
 */
class BinaryWriter {
  private buffer: Uint8Array;
  private view: DataView;
  private offset: number = 0;

  constructor(initialSize: number = 65536) {
    this.buffer = new Uint8Array(initialSize);
    this.view = new DataView(this.buffer.buffer);
  }

  private ensureCapacity(needed: number) {
    if (this.offset + needed > this.buffer.length) {
      let newSize = this.buffer.length * 2;
      while (newSize < this.offset + needed) {
        newSize *= 2;
      }
      const newBuffer = new Uint8Array(newSize);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer.buffer);
    }
  }

  public writeUint8(value: number) {
    this.ensureCapacity(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  public writeUint16(value: number) {
    this.ensureCapacity(2);
    this.view.setUint16(this.offset, value, false); // big-endian
    this.offset += 2;
  }

  public writeUint24(value: number) {
    this.ensureCapacity(3);
    this.view.setUint8(this.offset, (value >> 16) & 0xff);
    this.view.setUint8(this.offset + 1, (value >> 8) & 0xff);
    this.view.setUint8(this.offset + 2, value & 0xff);
    this.offset += 3;
  }

  public writeUint32(value: number) {
    this.ensureCapacity(4);
    this.view.setUint32(this.offset, value, false); // big-endian
    this.offset += 4;
  }

  public writeBytes(bytes: Uint8Array | number[]) {
    this.ensureCapacity(bytes.length);
    if (bytes instanceof Uint8Array) {
      this.buffer.set(bytes, this.offset);
    } else {
      for (let i = 0; i < bytes.length; i++) {
        this.buffer[this.offset + i] = bytes[i];
      }
    }
    this.offset += bytes.length;
  }

  public writeString(str: string, length?: number) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    if (length !== undefined) {
      this.ensureCapacity(length);
      const toWrite = Math.min(encoded.length, length);
      this.buffer.set(encoded.subarray(0, toWrite), this.offset);
      for (let i = toWrite; i < length; i++) {
        this.buffer[this.offset + i] = 0;
      }
      this.offset += length;
    } else {
      this.writeBytes(encoded);
    }
  }

  public getOffset(): number {
    return this.offset;
  }

  public getBytes(): Uint8Array {
    return this.buffer.subarray(0, this.offset);
  }
}

/**
 * Compresses data using standard PalmDOC LZ77 compression algorithm.
 */
function compressPalmDoc(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  const len = data.length;

  while (i < len) {
    let matchLen = 0;
    let matchDist = 0;

    // Search backwards up to 2047 bytes for match of length 3..10
    const startSearch = Math.max(0, i - 2047);
    const maxMatchLen = Math.min(10, len - i);

    for (let j = i - 1; j >= startSearch; j--) {
      let l = 0;
      while (l < maxMatchLen && data[j + l] === data[i + l]) {
        l++;
      }
      if (l >= 3 && l > matchLen) {
        matchLen = l;
        matchDist = i - j;
        if (matchLen === 10) break; // Maximum match reached
      }
    }

    if (matchLen >= 3 && matchDist > 0 && matchDist <= 2047) {
      // Encode two-byte LZ77 match:
      // High byte: 0x80 | (matchDist >> 3)
      // Low byte: ((matchDist & 0x07) << 5) | (matchLen - 3)
      const b1 = 0x80 | ((matchDist >> 3) & 0x3f);
      const b2 = ((matchDist & 0x07) << 5) | ((matchLen - 3) & 0x1f);
      out.push(b1, b2);
      i += matchLen;
    } else {
      const byte = data[i];
      if (byte === 0x00) {
        out.push(0x00);
        i++;
      } else if (byte >= 0x09 && byte <= 0x7f) {
        out.push(byte);
        i++;
      } else if (byte === 0x20 && i + 1 < len && data[i + 1] >= 0x40 && data[i + 1] <= 0x7f) {
        // Space followed by char: can encode as 0x80 | char
        out.push(0x80 | (data[i + 1] ^ 0x80));
        i += 2;
      } else {
        // Literal run of 1 to 8 bytes
        let runLen = 1;
        while (
          runLen < 8 &&
          i + runLen < len &&
          (data[i + runLen] === 0x00 || data[i + runLen] < 0x09 || data[i + runLen] > 0x7f)
        ) {
          runLen++;
        }
        out.push(runLen);
        for (let k = 0; k < runLen; k++) {
          out.push(data[i + k]);
        }
        i += runLen;
      }
    }
  }

  return new Uint8Array(out);
}

/**
 * Builds standard MOBI (Kindle-compatible Palm database) from parsed EPUB data.
 */
export async function buildMobi(
  epub: ParsedEpub,
  options: ConversionOptions = {
    compression: 'lz77',
    insertPageBreaks: true,
    generateToc: true,
    addKindleNav: true,
  },
  onProgress?: (step: string, percent: number) => void
): Promise<Blob> {
  onProgress?.('Generating MOBI HTML document...', 20);

  // 1. Assign image recindex numbers (1-based index from firstImageIndex)
  const imageList: { href: string; data: Uint8Array; recIndex: number }[] = [];
  let currentRecIndex = 1;

  for (const [href, img] of epub.images.entries()) {
    img.recIndex = currentRecIndex;
    imageList.push({ href, data: img.data, recIndex: currentRecIndex });
    currentRecIndex++;
  }

  // Cover image recindex (0-based offset into image list)
  let coverImageOffset = 0;
  if (epub.coverImage && epub.coverImage.recIndex) {
    coverImageOffset = epub.coverImage.recIndex - 1;
  }

  // 2. Build MOBI HTML Content
  let mobiHtml = '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>';
  mobiHtml += `<title>${escapeXml(epub.metadata.title)}</title>`;
  mobiHtml += '<style type="text/css">';
  mobiHtml += 'body { margin: 5%; font-family: sans-serif; line-height: 1.5; }';
  mobiHtml += 'h1 { font-size: 1.6em; text-align: center; margin: 1em 0; }';
  mobiHtml += 'h2 { font-size: 1.3em; margin: 0.8em 0; }';
  mobiHtml += 'p { margin: 0.6em 0; text-indent: 1.2em; }';
  mobiHtml += '.cover { text-align: center; margin-bottom: 2em; }';
  mobiHtml += '.toc { margin: 1.5em 0; }';
  mobiHtml += '.toc-item { margin: 0.5em 0; text-indent: 0; }';
  mobiHtml += '</style></head><body>';

  // Cover Page
  if (epub.coverImage && epub.coverImage.recIndex) {
    mobiHtml += `<div class="cover"><img recindex="${epub.coverImage.recIndex}" src="kindle:embed:${String(
      epub.coverImage.recIndex
    ).padStart(4, '0')}" alt="Cover" /></div>`;
    mobiHtml += '<mbp:pagebreak/>';
  }

  // Title & Metadata Section
  mobiHtml += `<div style="text-align: center; margin: 2em 0;">`;
  mobiHtml += `<h1>${escapeXml(epub.metadata.title)}</h1>`;
  if (epub.metadata.creator) {
    mobiHtml += `<h2 style="font-style: italic; font-weight: normal; color: #555;">by ${escapeXml(
      epub.metadata.creator
    )}</h2>`;
  }
  if (epub.metadata.publisher) {
    mobiHtml += `<p style="font-size: 0.9em; text-indent: 0; color: #777;">Publisher: ${escapeXml(
      epub.metadata.publisher
    )}</p>`;
  }
  mobiHtml += `</div>`;
  mobiHtml += '<mbp:pagebreak/>';

  // Table of Contents
  if (options.generateToc && epub.toc.length > 0) {
    mobiHtml += '<div class="toc"><h2 style="text-align: center;">Table of Contents</h2>';
    epub.toc.forEach((item, idx) => {
      mobiHtml += `<div class="toc-item"><a href="#chapter-${idx + 1}">${escapeXml(item.title)}</a></div>`;
    });
    mobiHtml += '</div><mbp:pagebreak/>';
  }

  // Chapters Content
  epub.chapters.forEach((chap, idx) => {
    mobiHtml += `<a name="chapter-${idx + 1}"></a>`;
    if (chap.title && !chap.htmlContent.includes(chap.title)) {
      mobiHtml += `<h2>${escapeXml(chap.title)}</h2>`;
    }

    // Replace data-epub-href images with MOBI recindex tags
    let chapHtml = chap.htmlContent;
    chapHtml = chapHtml.replace(/<img\b([^>]*?)data-epub-href=["']([^"']+)["']([^>]*?)>/gi, (_match, p1, href, p2) => {
      const img = epub.images.get(href);
      if (img && img.recIndex) {
        return `<img ${p1} recindex="${img.recIndex}" src="kindle:embed:${String(img.recIndex).padStart(4, '0')}" ${p2} />`;
      }
      return '';
    });

    // Fallback: replace regular src with recindex if matched
    chapHtml = chapHtml.replace(/<img\b([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, p1, src, p2) => {
      if (src.startsWith('kindle:embed:') || src.includes('recindex=')) return match;
      for (const [href, img] of epub.images.entries()) {
        if (src.endsWith(href) || href.endsWith(src)) {
          return `<img ${p1} recindex="${img.recIndex}" src="kindle:embed:${String(img.recIndex).padStart(4, '0')}" ${p2} />`;
        }
      }
      return match;
    });

    mobiHtml += chapHtml;
    if (options.insertPageBreaks && idx < epub.chapters.length - 1) {
      mobiHtml += '<mbp:pagebreak/>';
    }
  });

  mobiHtml += '</body></html>';

  // 3. Split HTML text into 4096-byte records and compress
  onProgress?.('Chunking and compressing text records...', 40);
  const textEncoder = new TextEncoder();
  const rawHtmlBytes = textEncoder.encode(mobiHtml);
  const rawTextLength = rawHtmlBytes.length;

  const chunkSize = 4096;
  const textRecords: Uint8Array[] = [];

  for (let i = 0; i < rawHtmlBytes.length; i += chunkSize) {
    const chunk = rawHtmlBytes.subarray(i, Math.min(i + chunkSize, rawHtmlBytes.length));
    if (options.compression === 'lz77') {
      textRecords.push(compressPalmDoc(chunk));
    } else {
      textRecords.push(chunk);
    }
  }

  const textRecordCount = textRecords.length;
  const firstImageIndex = 1 + textRecordCount;

  // 4. Build EXTH Header block
  onProgress?.('Generating EXTH metadata block...', 60);
  const exthRecords: { tag: number; data: Uint8Array }[] = [];

  const addExthString = (tag: number, val?: string) => {
    if (val && val.trim()) {
      exthRecords.push({ tag, data: textEncoder.encode(val.trim()) });
    }
  };

  const addExthUint32 = (tag: number, val: number) => {
    const buf = new Uint8Array(4);
    new DataView(buf.buffer).setUint32(0, val, false);
    exthRecords.push({ tag, data: buf });
  };

  addExthString(100, epub.metadata.creator); // Author
  addExthString(101, epub.metadata.publisher); // Publisher
  addExthString(103, epub.metadata.description); // Description
  addExthString(104, epub.metadata.identifier); // ISBN/UUID
  addExthString(106, epub.metadata.pubDate); // Pub date
  addExthString(503, epub.metadata.title); // Updated title

  if (epub.coverImage) {
    addExthUint32(201, coverImageOffset); // Cover offset
    addExthUint32(129, coverImageOffset); // Masthead / cover
  }

  // Calculate EXTH size: 4 (EXTH) + 4 (length) + 4 (count) + sum(8 + data.length)
  let exthBodySize = 12;
  exthRecords.forEach((r) => {
    exthBodySize += 8 + r.data.length;
  });
  // Pad EXTH to 4-byte boundary
  const exthPadding = (4 - (exthBodySize % 4)) % 4;
  const exthTotalSize = exthBodySize + exthPadding;

  const exthWriter = new BinaryWriter(exthTotalSize);
  exthWriter.writeString('EXTH');
  exthWriter.writeUint32(exthTotalSize);
  exthWriter.writeUint32(exthRecords.length);

  exthRecords.forEach((r) => {
    exthWriter.writeUint32(r.tag);
    exthWriter.writeUint32(8 + r.data.length);
    exthWriter.writeBytes(r.data);
  });

  for (let p = 0; p < exthPadding; p++) {
    exthWriter.writeUint8(0x00);
  }
  const exthBytes = exthWriter.getBytes();

  // 5. Build Record 0 (PalmDOC + MOBI Header + EXTH + Title)
  onProgress?.('Assembling MOBI Record 0...', 70);
  const titleBytes = textEncoder.encode(epub.metadata.title || 'Untitled');
  const mobiHeaderLength = 232;
  const record0Writer = new BinaryWriter(1024);

  // PalmDOC Header (16 bytes)
  record0Writer.writeUint16(options.compression === 'lz77' ? 2 : 1); // Compression (2=PalmDOC, 1=None)
  record0Writer.writeUint16(0); // Unused
  record0Writer.writeUint32(rawTextLength); // Uncompressed text length
  record0Writer.writeUint16(textRecordCount); // Number of text records
  record0Writer.writeUint16(4096); // Record size
  record0Writer.writeUint16(0); // Encryption (0=None)
  record0Writer.writeUint16(0); // Unknown

  // MOBI Header (232 bytes)
  const mobiStartOffset = record0Writer.getOffset();
  record0Writer.writeString('MOBI'); // 0x00
  record0Writer.writeUint32(mobiHeaderLength); // 0x04: header length
  record0Writer.writeUint32(2); // 0x08: MOBI type (2 = Book)
  record0Writer.writeUint32(65001); // 0x0C: UTF-8 encoding
  record0Writer.writeUint32(Math.floor(Math.random() * 0xffffffff)); // 0x10: unique ID
  record0Writer.writeUint32(6); // 0x14: MOBI version (6)

  // 0x18 - 0x4B: 10 * uint32 indexes (-1)
  for (let i = 0; i < 10; i++) {
    record0Writer.writeUint32(0xffffffff);
  }
  record0Writer.writeUint32(0xffffffff); // non-book index

  // Calculate full name offset (from start of Record 0)
  const fullNameOffset = 16 + mobiHeaderLength + exthTotalSize;
  record0Writer.writeUint32(fullNameOffset); // 0x54: Full name offset
  record0Writer.writeUint32(titleBytes.length); // 0x58: Full name length
  record0Writer.writeUint32(1033); // 0x5C: Locale (English US)
  record0Writer.writeUint32(0); // 0x60: Input language
  record0Writer.writeUint32(0); // 0x64: Output language
  record0Writer.writeUint32(6); // 0x68: Min format version (6)
  record0Writer.writeUint32(firstImageIndex); // 0x6C: First image record index
  record0Writer.writeUint32(0); // 0x70: Huffman record offset
  record0Writer.writeUint32(0); // 0x74: Huffman record count
  record0Writer.writeUint32(0); // 0x78: Huffman table offset
  record0Writer.writeUint32(0); // 0x7C: Huffman table length
  record0Writer.writeUint32(0x50); // 0x80: EXTH flags (bit 6 set = EXTH exists)

  // Pad remainder of MOBI header up to 232 bytes
  const writtenMobiLength = record0Writer.getOffset() - mobiStartOffset;
  for (let p = writtenMobiLength; p < mobiHeaderLength; p++) {
    record0Writer.writeUint8(0x00);
  }

  // Append EXTH block
  record0Writer.writeBytes(exthBytes);

  // Append Full Title string
  record0Writer.writeBytes(titleBytes);

  // Pad Record 0 to 4-byte boundary
  const rec0Pad = (4 - (record0Writer.getOffset() % 4)) % 4;
  for (let p = 0; p < rec0Pad; p++) {
    record0Writer.writeUint8(0x00);
  }

  const record0Bytes = record0Writer.getBytes();

  // 6. Build Special Records (FLIS, FCIS, EOF)
  // FLIS Record (36 bytes)
  const flisWriter = new BinaryWriter(36);
  flisWriter.writeString('FLIS');
  flisWriter.writeUint32(8);
  flisWriter.writeUint16(0x41);
  flisWriter.writeUint16(0);
  flisWriter.writeUint32(0);
  flisWriter.writeUint32(0xffffffff);
  flisWriter.writeUint16(1);
  flisWriter.writeUint16(3);
  flisWriter.writeUint32(0);
  flisWriter.writeUint32(0);
  flisWriter.writeUint32(0xffffffff);
  const flisBytes = flisWriter.getBytes();

  // FCIS Record (44 bytes)
  const fcisWriter = new BinaryWriter(44);
  fcisWriter.writeString('FCIS');
  fcisWriter.writeUint32(20);
  fcisWriter.writeUint32(16);
  fcisWriter.writeUint32(1);
  fcisWriter.writeUint32(0);
  fcisWriter.writeUint32(rawTextLength);
  fcisWriter.writeUint32(0);
  fcisWriter.writeUint32(32);
  fcisWriter.writeUint32(8);
  fcisWriter.writeUint16(1);
  fcisWriter.writeUint16(1);
  fcisWriter.writeUint32(0);
  const fcisBytes = fcisWriter.getBytes();

  // EOF Record (4 bytes)
  const eofBytes = new Uint8Array([0xe9, 0x8e, 0x0d, 0x0a]);

  // 7. Collect All Records
  onProgress?.('Compiling Palm Database container...', 85);
  const allRecords: Uint8Array[] = [
    record0Bytes,
    ...textRecords,
    ...imageList.map((img) => img.data),
    flisBytes,
    fcisBytes,
    eofBytes,
  ];

  const totalRecordCount = allRecords.length;

  // 8. Build PDB Header (78 bytes) + Record Table (8 * N + 2 bytes)
  // PDB Header
  const pdbWriter = new BinaryWriter();
  const sanitizedTitle = (epub.metadata.title || 'MOBI_EBOOK')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .substring(0, 31);
  pdbWriter.writeString(sanitizedTitle, 32); // 32 bytes name
  pdbWriter.writeUint16(0); // Attributes
  pdbWriter.writeUint16(0); // Version
  
  const nowSince1904 = Math.floor(Date.now() / 1000) + 2082844800; // Seconds between 1904 and 1970
  pdbWriter.writeUint32(nowSince1904); // Creation date
  pdbWriter.writeUint32(nowSince1904); // Mod date
  pdbWriter.writeUint32(0); // Backup date
  pdbWriter.writeUint32(0); // Mod number
  pdbWriter.writeUint32(0); // App info ID
  pdbWriter.writeUint32(0); // Sort info ID
  pdbWriter.writeString('BOOK'); // Database type
  pdbWriter.writeString('MOBI'); // Creator ID
  pdbWriter.writeUint32(totalRecordCount * 2); // Unique ID seed
  pdbWriter.writeUint32(0); // Next record list ID
  pdbWriter.writeUint16(totalRecordCount); // Number of records

  // Calculate record offsets
  // PDB header size (78) + Record table size (8 * N) + 2 gap bytes
  const headerAndTableSize = 78 + totalRecordCount * 8 + 2;
  let currentOffset = headerAndTableSize;
  const recordOffsets: number[] = [];

  for (let i = 0; i < totalRecordCount; i++) {
    recordOffsets.push(currentOffset);
    currentOffset += allRecords[i].length;
  }

  // Write Record Table entries
  for (let i = 0; i < totalRecordCount; i++) {
    pdbWriter.writeUint32(recordOffsets[i]); // Offset
    pdbWriter.writeUint8(0); // Attributes
    pdbWriter.writeUint24(i * 2); // Unique ID
  }

  // 2 bytes gap/padding
  pdbWriter.writeUint16(0);

  // Write All Records Body
  for (let i = 0; i < totalRecordCount; i++) {
    pdbWriter.writeBytes(allRecords[i]);
  }

  onProgress?.('MOBI packaging complete', 100);

  const mobiFinalBytes = pdbWriter.getBytes();
  return new Blob([mobiFinalBytes], { type: 'application/x-mobipocket-ebook' });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
