// Rasterises branding/icon.svg into every PNG the manifest and the stores
// need. Chrome rejects SVG manifest icons, so the PNGs are committed and the
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

const root = join(import.meta.dirname, '..');
const svg = readFileSync(join(root, 'branding/icon.svg'), 'utf8');

/** `artwork` smaller than `size` centres the icon in transparent padding. */
const outputs = [
  ...[16, 24, 32, 48, 64, 128].map((size) => ({
    file: `public/icon/${size}.png`,
    size,
    artwork: size,
  })),
  // The Chrome Web Store wants 96px of artwork inside 16px of padding.
  { file: 'branding/store/chrome-web-store-icon.png', size: 128, artwork: 96 },
];

const page = `<!doctype html><body><script>
  const outputs = ${JSON.stringify(outputs)};
  const img = new Image();
  img.onload = () => {
    const pre = document.createElement('pre');
    pre.id = 'out';
    pre.textContent = JSON.stringify(outputs.map(({ file, size, artwork }) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const offset = (size - artwork) / 2;
      canvas.getContext('2d').drawImage(img, offset, offset, artwork, artwork);
      return { file, png: canvas.toDataURL('image/png') };
    }));
    document.body.append(pre);
  };
  img.src = 'data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}';
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
  for (const { file, png } of JSON.parse(json)) {
    const path = join(root, file);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, Buffer.from(png.split(',')[1], 'base64'));
    console.log(file);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
