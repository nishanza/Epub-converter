import JSZip from 'jszip';

interface SampleBookDef {
  id: string;
  title: string;
  creator: string;
  description: string;
  language: string;
  accentColor: string;
  badge: string;
  chapters: { title: string; html: string }[];
}

export const SAMPLE_BOOKS: SampleBookDef[] = [
  {
    id: 'art-of-war',
    title: 'The Art of War',
    creator: 'Sun Tzu',
    description: 'Ancient Chinese military treatise attributed to Sun Tzu, composed of 13 chapters devoted to aspects of warfare.',
    language: 'en',
    accentColor: '#991b1b', // Red-800
    badge: 'Classic Philosophy',
    chapters: [
      {
        title: 'Chapter I: Laying Plans',
        html: `
          <h1>Chapter I: Laying Plans</h1>
          <p>Sun Tzu said: The art of war is of vital importance to the State.</p>
          <p>It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.</p>
          <p>The moral law causes the people to be in complete accord with their ruler, so that they will follow him regardless of their lives, undismayed by any danger.</p>
          <p>Heaven signifies night and day, cold and heat, times and the seasons. Earth comprises distances, great and small; danger and security; open ground and narrow passes; the chances of life and death.</p>
          <p>The Commander stands for the virtues of wisdom, sincerely, benevolence, strictness and courage.</p>
        `,
      },
      {
        title: 'Chapter II: Waging War',
        html: `
          <h1>Chapter II: Waging War</h1>
          <p>Sun Tzu said: In the operations of war, where there are in the field a thousand swift chariots, as many heavy chariots, and a hundred thousand mail-clad soldiers, with provisions enough to carry them a thousand li, the expenditure at home and at the front will reach the total of a thousand ounces of silver per day.</p>
          <p>When you engage in actual fighting, if victory is long in coming, then men's weapons will grow dull and their ardor will be damped. If you lay siege to a town, you will exhaust your strength.</p>
          <p>Now, when your weapons are dulled, your ardor damped, your strength exhausted and your treasure spent, other chieftains will spring up to take advantage of your extremity.</p>
        `,
      },
      {
        title: 'Chapter III: Attack by Stratagem',
        html: `
          <h1>Chapter III: Attack by Stratagem</h1>
          <p>Sun Tzu said: In the practical art of war, the best thing of all is to take the enemy's country whole and intact; to shatter and destroy it is not so good. So, too, it is better to recapture an army entire than to destroy it.</p>
          <p>Hence to fight and conquer in all your battles is not supreme excellence; supreme excellence consists in breaking the enemy's resistance without fighting.</p>
          <p>Thus the highest form of generalship is to balk the enemy's plans; the next best is to prevent the junction of the enemy's forces; the next in order is to attack the enemy's army in the field; and the worst policy of all is to besiege walled cities.</p>
        `,
      },
    ],
  },
  {
    id: 'alice-wonderland',
    title: "Alice's Adventures in Wonderland",
    creator: 'Lewis Carroll',
    description: 'The story of a young girl named Alice who falls through a rabbit hole into a subterranean fantasy world.',
    language: 'en',
    accentColor: '#1e40af', // Blue-800
    badge: 'Literary Classic',
    chapters: [
      {
        title: 'Chapter 1: Down the Rabbit-Hole',
        html: `
          <h1>Chapter I: Down the Rabbit-Hole</h1>
          <p>Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice 'without pictures or conversations?'</p>
          <p>So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.</p>
          <p>There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, 'Oh dear! Oh dear! I shall be late!'</p>
        `,
      },
      {
        title: 'Chapter 2: The Pool of Tears',
        html: `
          <h1>Chapter II: The Pool of Tears</h1>
          <p>'Curiouser and curiouser!' cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); 'now I\\'m opening out like the largest telescope that ever was! Good-bye, feet!'</p>
          <p>Just at this moment her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.</p>
        `,
      },
    ],
  },
  {
    id: 'time-machine',
    title: 'The Time Machine',
    creator: 'H. G. Wells',
    description: 'A science fiction novella generally credited with popularizing the concept of time travel using a vehicle.',
    language: 'en',
    accentColor: '#065f46', // Emerald-800
    badge: 'Sci-Fi Classic',
    chapters: [
      {
        title: 'Chapter I: The Inventor and the Time Dimension',
        html: `
          <h1>Chapter I: The Inventor and the Time Dimension</h1>
          <p>The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.</p>
          <p>The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.</p>
          <p>'You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception.'</p>
        `,
      },
      {
        title: 'Chapter II: The Machine',
        html: `
          <h1>Chapter II: The Machine</h1>
          <p>The thing the Time Traveller held in his hand was a glittering metallic framework, scarcely larger than a small clock, and very delicately made. There was ivory in it, and some transparent crystalline substance.</p>
          <p>And now I must be plain, for this that follows is the thing that nobody believed.</p>
        `,
      },
    ],
  },
];

/**
 * Creates a clean cover SVG rendered onto a 600x900 canvas as JPEG Uint8Array
 */
function createCoverImageData(title: string, author: string, bgColor: string): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 600, 900);

  // Subtle border frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, 540, 840);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 45, 510, 810);

  // Decorative header line
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPECIAL EDITION EBOOK', 300, 160);

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px serif';
  
  // Wrap title
  const words = title.split(' ');
  let line = '';
  let y = 380;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 440 && n > 0) {
      ctx.fillText(line.trim(), 300, y);
      line = words[n] + ' ';
      y += 48;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), 300, y);

  // Author
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'italic 24px serif';
  ctx.fillText(author, 300, y + 90);

  // Bottom emblem
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '16px sans-serif';
  ctx.fillText('• MOBI FORMAT READY •', 300, 780);

  // Convert canvas to binary Uint8Array
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  const base64 = dataUrl.split(',')[1];
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Builds a real valid .epub file in memory.
 */
export async function generateSampleEpubFile(sample: SampleBookDef): Promise<File> {
  const zip = new JSZip();

  // 1. mimetype (MUST be uncompressed and first in standard epub)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. Cover image
  const coverBytes = createCoverImageData(sample.title, sample.creator, sample.accentColor);
  zip.file('OEBPS/cover.jpg', coverBytes);

  // 4. Stylesheet
  const css = `
body { font-family: serif; margin: 5%; line-height: 1.6; color: #222; }
h1 { font-size: 1.8em; text-align: center; margin: 1.5em 0 1em; color: #111; }
p { text-indent: 1.5em; margin: 0.5em 0; }
`;
  zip.file('OEBPS/style.css', css);

  // 5. Chapters
  sample.chapters.forEach((chap, idx) => {
    const xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXml(chap.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  ${chap.html}
</body>
</html>`;
    zip.file(`OEBPS/chapter${idx + 1}.xhtml`, xhtml);
  });

  // 6. NCX Table of contents
  let ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${sample.id}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(sample.title)}</text></docTitle>
  <docAuthor><text>${escapeXml(sample.creator)}</text></docAuthor>
  <navMap>
`;
  sample.chapters.forEach((chap, idx) => {
    ncx += `    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>${escapeXml(chap.title)}</text></navLabel>
      <content src="chapter${idx + 1}.xhtml"/>
    </navPoint>\n`;
  });
  ncx += `  </navMap>\n</ncx>`;
  zip.file('OEBPS/toc.ncx', ncx);

  // 7. content.opf
  let opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeXml(sample.title)}</dc:title>
    <dc:creator opf:role="aut">${escapeXml(sample.creator)}</dc:creator>
    <dc:language>${sample.language}</dc:language>
    <dc:description>${escapeXml(sample.description)}</dc:description>
    <dc:identifier id="BookID">urn:uuid:${sample.id}</dc:identifier>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="cover-image" href="cover.jpg" media-type="image/jpeg"/>
`;
  sample.chapters.forEach((_, idx) => {
    opf += `    <item id="chap-${idx + 1}" href="chapter${idx + 1}.xhtml" media-type="application/xhtml+xml"/>\n`;
  });
  opf += `  </manifest>\n  <spine toc="ncx">\n`;
  sample.chapters.forEach((_, idx) => {
    opf += `    <itemref idref="chap-${idx + 1}"/>\n`;
  });
  opf += `  </spine>\n</package>`;
  zip.file('OEBPS/content.opf', opf);

  const zipBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  const fileName = `${sample.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.epub`;
  return new File([zipBlob], fileName, { type: 'application/epub+zip' });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
