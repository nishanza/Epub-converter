import JSZip from 'jszip';
import { EpubChapter, EpubImage, EpubMetadata, EpubTocItem, ParsedEpub } from '../types';

/**
 * Normalizes relative file paths inside zip archives.
 */
export function resolvePath(basePath: string, relativePath: string): string {
  if (relativePath.startsWith('/')) {
    return relativePath.slice(1);
  }
  
  const baseDir = basePath.includes('/') ? basePath.substring(0, basePath.lastIndexOf('/') + 1) : '';
  const fullPath = baseDir + relativePath;
  const parts = fullPath.split('/');
  const resolvedParts: string[] = [];

  for (const part of parts) {
    if (part === '.' || part === '') {
      continue;
    }
    if (part === '..') {
      resolvedParts.pop();
    } else {
      resolvedParts.push(part);
    }
  }

  return resolvedParts.join('/');
}

export async function parseEpub(
  fileOrBuffer: File | ArrayBuffer | Blob,
  onProgress?: (step: string, percent: number) => void
): Promise<ParsedEpub> {
  onProgress?.('Opening EPUB archive...', 10);
  const zip = new JSZip();
  const zipData = await zip.loadAsync(fileOrBuffer);

  // 1. Read container.xml
  onProgress?.('Locating book package descriptor...', 20);
  const containerXmlFile = zipData.file('META-INF/container.xml');
  if (!containerXmlFile) {
    throw new Error('Invalid EPUB: Missing META-INF/container.xml');
  }
  const containerXmlText = await containerXmlFile.async('text');
  const domParser = new DOMParser();
  const containerDoc = domParser.parseFromString(containerXmlText, 'application/xml');
  
  const rootfileEl = containerDoc.querySelector('rootfile');
  const opfPath = rootfileEl?.getAttribute('full-path');
  if (!opfPath) {
    throw new Error('Invalid EPUB: No rootfile full-path found in container.xml');
  }

  const opfFile = zipData.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: OPF file not found at ${opfPath}`);
  }

  // 2. Parse OPF file
  onProgress?.('Extracting metadata and manifest...', 30);
  const opfText = await opfFile.async('text');
  const opfDoc = domParser.parseFromString(opfText, 'application/xml');

  // Extract Metadata
  const getMetaText = (tagName: string): string => {
    const el = opfDoc.getElementsByTagNameNS('*', tagName)[0] || opfDoc.querySelector(tagName);
    return el?.textContent?.trim() || '';
  };

  const metadata: EpubMetadata = {
    title: getMetaText('title') || 'Untitled Book',
    creator: getMetaText('creator') || 'Unknown Author',
    publisher: getMetaText('publisher') || undefined,
    language: getMetaText('language') || 'en',
    description: getMetaText('description') || undefined,
    pubDate: getMetaText('date') || undefined,
    identifier: getMetaText('identifier') || undefined,
  };

  // Extract Manifest
  const manifestItems = new Map<string, { id: string; href: string; mediaType: string; properties?: string }>();
  const itemEls = opfDoc.querySelectorAll('manifest > item');
  itemEls.forEach((item) => {
    const id = item.getAttribute('id') || '';
    const href = item.getAttribute('href') || '';
    const mediaType = item.getAttribute('media-type') || '';
    const properties = item.getAttribute('properties') || '';
    if (id && href) {
      const resolvedHref = resolvePath(opfPath, href);
      manifestItems.set(id, { id, href: resolvedHref, mediaType, properties });
    }
  });

  // Identify Cover Image
  let coverId: string | null = null;
  // Check meta tag: <meta name="cover" content="cover-id"/>
  const metaCover = opfDoc.querySelector('meta[name="cover"]');
  if (metaCover) {
    coverId = metaCover.getAttribute('content');
  }
  // Check item with property="cover-image"
  if (!coverId) {
    for (const [id, item] of manifestItems.entries()) {
      if (item.properties?.includes('cover-image') || id.toLowerCase().includes('cover-image')) {
        coverId = id;
        break;
      }
    }
  }
  // Check fallback by name
  if (!coverId) {
    for (const [id, item] of manifestItems.entries()) {
      if (item.mediaType.startsWith('image/') && id.toLowerCase().includes('cover')) {
        coverId = id;
        break;
      }
    }
  }

  // 3. Extract Images
  onProgress?.('Extracting illustrations and images...', 45);
  const images = new Map<string, EpubImage>();
  let coverImage: EpubImage | undefined;

  for (const [id, item] of manifestItems.entries()) {
    if (item.mediaType.startsWith('image/')) {
      const imgZipFile = zipData.file(item.href);
      if (imgZipFile) {
        const uint8Data = await imgZipFile.async('uint8array');
        const blob = new Blob([uint8Data], { type: item.mediaType });
        const blobUrl = URL.createObjectURL(blob);
        const epubImg: EpubImage = {
          id,
          href: item.href,
          mediaType: item.mediaType,
          data: uint8Data,
          blobUrl,
        };
        images.set(item.href, epubImg);

        if (id === coverId || (!coverImage && item.href.toLowerCase().includes('cover'))) {
          coverImage = epubImg;
          metadata.coverImageHref = item.href;
        }
      }
    }
  }

  // Fallback: If no cover explicitly found, pick first image if available
  if (!coverImage && images.size > 0) {
    coverImage = images.values().next().value;
  }

  // 4. Extract TOC
  onProgress?.('Parsing Table of Contents...', 60);
  const toc: EpubTocItem[] = [];
  
  // Try NCX file first
  let ncxHref: string | null = null;
  const spineEl = opfDoc.querySelector('spine');
  const spineTocId = spineEl?.getAttribute('toc');
  if (spineTocId && manifestItems.has(spineTocId)) {
    ncxHref = manifestItems.get(spineTocId)!.href;
  } else {
    // Search manifest for ncx
    for (const item of manifestItems.values()) {
      if (item.mediaType === 'application/x-dtbncx+xml' || item.href.endsWith('.ncx')) {
        ncxHref = item.href;
        break;
      }
    }
  }

  if (ncxHref && zipData.file(ncxHref)) {
    const ncxText = await zipData.file(ncxHref)!.async('text');
    const ncxDoc = domParser.parseFromString(ncxText, 'application/xml');
    const navPoints = ncxDoc.querySelectorAll('navMap > navPoint');
    navPoints.forEach((np, idx) => {
      const navLabel = np.querySelector('navLabel > text')?.textContent?.trim() || `Chapter ${idx + 1}`;
      const src = np.querySelector('content')?.getAttribute('src') || '';
      const resolvedSrc = resolvePath(ncxHref!, src.split('#')[0]);
      toc.push({
        id: np.getAttribute('id') || `toc-${idx}`,
        title: navLabel,
        href: resolvedSrc,
        order: idx + 1,
      });
    });
  }

  // 5. Read Chapters from Spine in Order
  onProgress?.('Extracting and cleaning book chapters...', 75);
  const spineItemrefs = opfDoc.querySelectorAll('spine > itemref');
  const chapters: EpubChapter[] = [];
  let totalRawText = 0;

  for (let i = 0; i < spineItemrefs.length; i++) {
    const idref = spineItemrefs[i].getAttribute('idref');
    if (!idref || !manifestItems.has(idref)) continue;

    const manifestItem = manifestItems.get(idref)!;
    const chapterFile = zipData.file(manifestItem.href);
    if (!chapterFile) continue;

    const rawHtml = await chapterFile.async('text');
    const chapterDoc = domParser.parseFromString(rawHtml, 'text/html');

    // Extract chapter title
    let chapterTitle = '';
    const h1 = chapterDoc.querySelector('h1, h2, h3, title');
    if (h1 && h1.textContent?.trim()) {
      chapterTitle = h1.textContent.trim();
    } else {
      // Check TOC for matching href
      const matchingToc = toc.find((t) => t.href === manifestItem.href);
      chapterTitle = matchingToc ? matchingToc.title : `Section ${i + 1}`;
    }

    // Process body content
    const body = chapterDoc.querySelector('body') || chapterDoc.documentElement;
    
    // Rewrite image src attributes to normalized paths so mobiBuilder can map them
    const imgElements = body.querySelectorAll('img, image');
    imgElements.forEach((img) => {
      const rawSrc = img.getAttribute('src') || img.getAttribute('xlink:href') || '';
      if (rawSrc) {
        const resolvedImgPath = resolvePath(manifestItem.href, rawSrc);
        img.setAttribute('data-epub-href', resolvedImgPath);
      }
    });

    const cleanedHtml = body.innerHTML;
    const textOnly = body.textContent || '';
    totalRawText += textOnly.length;

    chapters.push({
      id: idref,
      href: manifestItem.href,
      title: chapterTitle,
      htmlContent: cleanedHtml,
      textContent: textOnly,
      order: i + 1,
    });
  }

  onProgress?.('EPUB parsed successfully', 90);

  return {
    metadata,
    chapters,
    images,
    coverImage,
    toc,
    rawTextLength: totalRawText,
  };
}
