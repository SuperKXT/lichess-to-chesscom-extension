// Rasterises branding/icon.svg and branding/promo-tile.svg into every PNG the
// manifest and the stores need. Chrome rejects SVG manifest icons, so the PNGs are committed and the
// build never runs this. Headless Chrome draws with Skia, the same renderer
// that paints the toolbar. Override the binary with CHROME=<path>.
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { crc32, deflateSync } from 'node:zlib';

const root = join(import.meta.dirname, '..');
const dataUri = (svg) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const icon = dataUri(readFileSync(join(root, 'branding/icon.svg'), 'utf8'));
// An SVG drawn as an image loads nothing external, so the tile's reference to
// the icon is inlined.
const tile = dataUri(
  readFileSync(join(root, 'branding/promo-tile.svg'), 'utf8').replace(
    'href="icon.svg"',
    `href="${icon}"`,
  ),
);

/**
 * `artwork` smaller than `width` centres the source in transparent padding.
 * `opaque` writes a 24-bit PNG: the Chrome Web Store rejects promo tiles and
 * screenshots that carry an alpha channel, even a fully opaque one.
 */
const outputs = [
  ...[16, 24, 32, 48, 64, 128].map((size) => ({
    file: `public/icon/${size}.png`,
    src: icon,
    width: size,
    height: size,
    artwork: size,
  })),
  // The Chrome Web Store wants 96px of artwork inside 16px of padding.
  {
    file: 'branding/store/chrome-web-store-icon.png',
    src: icon,
    width: 128,
    height: 128,
    artwork: 96,
  },
  {
    file: 'branding/store/promo-tile-440x280.png',
    src: tile,
    width: 440,
    height: 280,
    artwork: 440,
    opaque: true,
  },
];

/** Canvas can only write RGBA PNGs, so opaque outputs are encoded here. */
const rgbPng = (width, height, rgba) => {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit, truecolour, no interlace
  // Each scanline is a filter byte (0, none) then its RGB triples.
  const rows = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const from = (y * width + x) * 4;
      rows.set(rgba.subarray(from, from + 3), y * (1 + width * 3) + 1 + x * 3);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const page = `<!doctype html><body><script>
  const outputs = ${JSON.stringify(outputs)};
  Promise.all(outputs.map(async ({ file, src, width, height, artwork, opaque }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const scale = artwork / width;
    const [x, y] = [(width - artwork) / 2, (height - height * scale) / 2];
    const context = canvas.getContext('2d');
    context.drawImage(img, x, y, artwork, height * scale);
    if (!opaque) return { file, png: canvas.toDataURL('image/png') };
    const { data } = context.getImageData(0, 0, width, height);
    let binary = '';
    for (const byte of data) binary += String.fromCharCode(byte);
    return { file, width, height, rgba: btoa(binary) };
  })).then((pngs) => {
    const pre = document.createElement('pre');
    pre.id = 'out';
    pre.textContent = JSON.stringify(pngs);
    document.body.append(pre);
  });
</script></body>`;

const dir = mkdtempSync(join(tmpdir(), 'export-icons-'));
try {
  const html = join(dir, 'export.html');
  writeFileSync(html, page);
  const dom = execFileSync(
    process.env.CHROME ?? 'google-chrome',
    [
      '--headless=new',
      '--disable-gpu',
      '--virtual-time-budget=5000',
      '--dump-dom',
      `file://${html}`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  const json = /<pre id="out">(.*?)<\/pre>/s.exec(dom)?.[1];
  if (json === undefined) throw new Error('Chrome produced no icons');
  for (const { file, png, width, height, rgba } of JSON.parse(json)) {
    const path = join(root, file);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(
      path,
      png === undefined
        ? rgbPng(width, height, Buffer.from(rgba, 'base64'))
        : Buffer.from(png.split(',')[1], 'base64'),
    );
    console.log(file);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
